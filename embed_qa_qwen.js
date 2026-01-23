import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// ============ 配置 ============
const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

// 使用新表还是旧表？
const USE_NEW_TABLE = true;  // true = qa_embeddings_qwen, false = qa_embeddings
const TABLE_NAME = USE_NEW_TABLE ? 'qa_embeddings_qwen' : 'qa_embeddings';
// =============================

if (!DASHSCOPE_API_KEY) {
  console.error('❌ 错误：未找到 QWEN_API_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 通义千问 Embedding API
async function getQwenEmbedding(text) {
  const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/embeddings/text-embedding/text-embedding', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-v3',  // 最新模型，1024维
      input: {
        texts: [text]
      }
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Qwen API error: ${error}`);
  }

  const data = await response.json();
  return data.output.embeddings[0].embedding;
}

console.log('\n' + '='.repeat(60));
console.log('🔄 使用通义千问重新向量化问答数据');
console.log('='.repeat(60) + '\n');

console.log(`目标表: ${TABLE_NAME}`);
console.log(`模型: text-embedding-v3 (1024维)`);
console.log();

async function reEmbedQA() {
  // 1. 读取问答数据
  const qaData = JSON.parse(fs.readFileSync('./qa_data.json', 'utf-8'));
  console.log(`📂 读取数据: ${qaData.length} 条问答\n`);

  let success = 0;
  let failed = 0;

  for (let i = 0; i < qaData.length; i++) {
    const qa = qaData[i];
    const progress = `[${i + 1}/${qaData.length}]`;

    try {
      const preview = qa.question.substring(0, 40);
      process.stdout.write(`${progress} ${preview}...`);

      // 2. 使用通义千问向量化（只向量化问题）
      const embedding = await getQwenEmbedding(qa.question);

      // 3. 插入或更新数据库
      const { error } = await supabase
        .from(TABLE_NAME)
        .upsert({
          question: qa.question,
          answer: qa.answer,
          category: qa.category,
          embedding: embedding
        }, {
          onConflict: 'question'
        });

      if (error) {
        console.log(` ❌ ${error.message}`);
        failed++;
      } else {
        console.log(` ✓`);
        success++;
      }

      // 4. 避免速率限制（通义千问限制：500次/分钟）
      await new Promise(resolve => setTimeout(resolve, 150));

    } catch (error) {
      console.log(` ❌ ${error.message}`);
      failed++;
    }
  }

  // 5. 总结
  console.log('\n' + '='.repeat(60));
  console.log(`✅ 成功: ${success} 条`);
  console.log(`❌ 失败: ${failed} 条`);
  console.log('='.repeat(60) + '\n');

  // 6. 测试搜索
  console.log('🧪 测试搜索功能...\n');
  
  const testQuery = '你最喜欢什么电影';
  console.log(`测试问题: "${testQuery}"`);
  
  const testEmbedding = await getQwenEmbedding(testQuery);
  
  const functionName = USE_NEW_TABLE ? 'match_qa_qwen' : 'match_qa';
  const { data: results, error } = await supabase.rpc(functionName, {
    query_embedding: testEmbedding,
    match_count: 3
  });

  if (error) {
    console.error('❌ 搜索失败:', error);
  } else {
    console.log('\n搜索结果:');
    results.forEach((r, i) => {
      console.log(`\n${i + 1}. 相似度: ${r.similarity.toFixed(3)}`);
      console.log(`   问题: ${r.question}`);
      console.log(`   答案: ${r.answer.substring(0, 50)}...`);
    });
  }

  console.log('\n✅ 完成！\n');
}

reEmbedQA().catch(console.error);