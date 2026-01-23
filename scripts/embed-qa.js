import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载 .env.local 文件
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

// ============ 配置区 ============
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
// ================================

// 初始化
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 读取问答数据
const qaData = JSON.parse(fs.readFileSync('./qa_data.json', 'utf-8'));

console.log(`\n🚀 开始向量化 ${qaData.length} 条问答...\n`);

async function embedAndStore() {
  let success = 0;
  let failed = 0;

  for (let i = 0; i < qaData.length; i++) {
    const qa = qaData[i];
    const progress = `[${i + 1}/${qaData.length}]`;
    
    try {
      // 显示进度
      console.log(`${progress} 处理: ${qa.question.substring(0, 40)}...`);
      
      // 生成embedding（问题+答案一起向量化）
      const text = `问题：${qa.question}\n回答：${qa.answer}`;
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
      });
      
      const embedding = response.data[0].embedding;
      
      // 存入Supabase
      const { error } = await supabase
        .from('qa_embeddings')
        .insert({
          question: qa.question,
          answer: qa.answer,
          category: qa.category,
          embedding: embedding
        });
      
      if (error) {
        console.error(`  ❌ 错误:`, error.message);
        failed++;
      } else {
        console.log(`  ✓ 完成`);
        success++;
      }
      
      // 避免速率限制（每秒最多10次）
      await new Promise(resolve => setTimeout(resolve, 150));
      
    } catch (error) {
      console.error(`  ❌ 异常:`, error.message);
      failed++;
    }
  }
  
  console.log(`\n${'='.repeat(50)}`);
  console.log(`✅ 成功: ${success} 条`);
  console.log(`❌ 失败: ${failed} 条`);
  console.log(`🎉 向量化完成！你的赛博替身数据已准备就绪！`);
  console.log(`${'='.repeat(50)}\n`);
}

// 运行
embedAndStore().catch(console.error);
