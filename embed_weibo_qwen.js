import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// ============ 配置 ============
const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const USE_NEW_TABLE = true;  // true = weibo_embeddings_qwen, false = weibo_embeddings
const TABLE_NAME = USE_NEW_TABLE ? 'weibo_embeddings_qwen' : 'weibo_embeddings';

const BATCH_SIZE = 10;  // 通义千问支持批量，但我们用小批次更稳定
// =============================

if (!DASHSCOPE_API_KEY) {
  console.error('❌ 错误：未找到 QWEN_API_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 批量获取embeddings
async function getQwenEmbeddings(texts) {
  const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/embeddings/text-embedding/text-embedding', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-v3',
      input: {
        texts: texts
      }
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Qwen API error: ${error}`);
  }

  const data = await response.json();
  return data.output.embeddings.map(e => e.embedding);
}

console.log('\n' + '='.repeat(60));
console.log('🔄 使用通义千问重新向量化微博数据');
console.log('='.repeat(60) + '\n');

console.log(`目标表: ${TABLE_NAME}`);
console.log(`模型: text-embedding-v3 (1024维)`);
console.log(`批次大小: ${BATCH_SIZE}\n`);

async function reEmbedWeibos() {
  // 1. 读取微博数据
  const weiboData = JSON.parse(fs.readFileSync('./cleaned_weibo_data.json', 'utf-8'));
  console.log(`📂 读取数据: ${weiboData.length} 条微博\n`);

  const totalBatches = Math.ceil(weiboData.length / BATCH_SIZE);
  let totalSuccess = 0;
  let totalFailed = 0;

  for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
    const start = batchIndex * BATCH_SIZE;
    const end = Math.min(start + BATCH_SIZE, weiboData.length);
    const batch = weiboData.slice(start, end);

    console.log(`\n批次 ${batchIndex + 1}/${totalBatches} (${start + 1}-${end}/${weiboData.length})`);
    console.log('─'.repeat(60));

    try {
      // 2. 批量向量化
      process.stdout.write('⏳ 向量化中...');
      const texts = batch.map(w => w.content);
      const embeddings = await getQwenEmbeddings(texts);
      console.log(' ✓');

      // 3. 批量插入
      process.stdout.write('💾 插入数据库...');
      const records = batch.map((weibo, i) => ({
        content: weibo.content,
        created_at: weibo.created_at,
        embedding: embeddings[i]
      }));

      const { error } = await supabase
        .from(TABLE_NAME)
        .insert(records);

      if (error) {
        console.log(` ❌ ${error.message}`);
        totalFailed += batch.length;
      } else {
        console.log(` ✓`);
        totalSuccess += batch.length;
      }

    } catch (error) {
      console.log(`\n❌ 批次失败: ${error.message}`);
      totalFailed += batch.length;
    }

    // 4. 避免速率限制
    if (batchIndex < totalBatches - 1) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  // 5. 总结
  console.log('\n' + '='.repeat(60));
  console.log(`✅ 成功: ${totalSuccess} 条`);
  console.log(`❌ 失败: ${totalFailed} 条`);
  console.log('='.repeat(60) + '\n');

  // 6. 测试搜索
  console.log('🧪 测试搜索功能...\n');
  
  const testQuery = '最近在看什么书';
  console.log(`测试问题: "${testQuery}"`);
  
  const testEmbedding = (await getQwenEmbeddings([testQuery]))[0];
  
  const functionName = USE_NEW_TABLE ? 'match_weibos_qwen' : 'match_weibos';
  const { data: results, error } = await supabase.rpc(functionName, {
    query_embedding: testEmbedding,
    match_count: 3,
    min_similarity: 0.1
  });

  if (error) {
    console.error('❌ 搜索失败:', error);
  } else {
    console.log('\n搜索结果:');
    results.forEach((r, i) => {
      console.log(`\n${i + 1}. 相似度: ${r.similarity.toFixed(3)}`);
      console.log(`   内容: ${r.content.substring(0, 80)}...`);
      console.log(`   日期: ${new Date(r.created_at).toLocaleDateString('zh-CN')}`);
    });
  }

  console.log('\n✅ 完成！\n');
}

reEmbedWeibos().catch(console.error);