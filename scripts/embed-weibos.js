import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config({ path: '.env.local' });

// ============ 配置区 ============
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

// 每批处理数量（避免内存溢出）
const BATCH_SIZE = 100;
// =================================

// 检查环境变量
if (!OPENAI_API_KEY) {
  console.error('❌ 错误：未找到 OPENAI_API_KEY');
  console.error('请确保 .env.local 文件存在并包含 OPENAI_API_KEY');
  process.exit(1);
}

// 初始化
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 读取微博数据
const weiboData = JSON.parse(fs.readFileSync('./cleaned_weibo_data.json', 'utf-8'));

console.log(`\n${'='.repeat(60)}`);
console.log(`🚀 开始向量化微博数据`);
console.log(`${'='.repeat(60)}`);
console.log(`总数: ${weiboData.length} 条`);
console.log(`批次大小: ${BATCH_SIZE} 条/批`);
console.log(`预计批次: ${Math.ceil(weiboData.length / BATCH_SIZE)} 批\n`);

async function embedAndStore() {
  let success = 0;
  let failed = 0;
  const totalBatches = Math.ceil(weiboData.length / BATCH_SIZE);

  for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
    const start = batchIndex * BATCH_SIZE;
    const end = Math.min(start + BATCH_SIZE, weiboData.length);
    const batch = weiboData.slice(start, end);

    console.log(`\n📦 批次 ${batchIndex + 1}/${totalBatches} (${start + 1}-${end})`);
    console.log(`${'─'.repeat(60)}`);

    for (let i = 0; i < batch.length; i++) {
      const weibo = batch[i];
      const globalIndex = start + i;
      const progress = `[${globalIndex + 1}/${weiboData.length}]`;

      try {
        // 显示进度（截断长文本）
        const preview = weibo.content.length > 40 
          ? weibo.content.substring(0, 40) + '...'
          : weibo.content;
        process.stdout.write(`${progress} ${preview}`);

        // 生成embedding
        const response = await openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: weibo.content,
        });

        const embedding = response.data[0].embedding;

        // 存入Supabase
        const { error } = await supabase
          .from('weibo_embeddings')
          .insert({
            content: weibo.content,
            created_at: weibo.created_at,
            likes: weibo.likes || 0,
            comments: weibo.comments || 0,
            reposts: weibo.reposts || 0,
            word_count: weibo.word_count,
            embedding: embedding
          });

        if (error) {
          console.log(` ❌`);
          console.error(`  错误: ${error.message}`);
          failed++;
        } else {
          console.log(` ✓`);
          success++;
        }

        // 避免速率限制（每秒最多10次请求）
        await new Promise(resolve => setTimeout(resolve, 120));

      } catch (error) {
        console.log(` ❌`);
        console.error(`  异常: ${error.message}`);
        failed++;
        
        // 如果是速率限制错误，等待更久
        if (error.message.includes('rate limit')) {
          console.log('  ⏸️  遇到速率限制，等待30秒...');
          await new Promise(resolve => setTimeout(resolve, 30000));
        }
      }
    }

    // 批次间休息（避免过热）
    if (batchIndex < totalBatches - 1) {
      console.log(`\n⏸️  批次完成，休息5秒...`);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`✅ 成功: ${success} 条`);
  console.log(`❌ 失败: ${failed} 条`);
  console.log(`📊 成功率: ${((success / weiboData.length) * 100).toFixed(1)}%`);
  console.log(`🎉 微博向量化完成！`);
  console.log(`${'='.repeat(60)}\n`);
}

// 运行
embedAndStore().catch(console.error);
