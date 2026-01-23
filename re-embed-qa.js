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

// 检查环境变量
if (!OPENAI_API_KEY) {
  console.error('❌ 错误：未找到 OPENAI_API_KEY');
  process.exit(1);
}
// =================================

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 读取问答数据
const qaData = JSON.parse(fs.readFileSync('./qa_data.json', 'utf-8'));

console.log(`\n${'='.repeat(60)}`);
console.log(`🔄 重新向量化问答数据（改进版）`);
console.log(`${'='.repeat(60)}`);
console.log(`策略: 只向量化问题（更精准匹配）`);
console.log(`总数: ${qaData.length} 条\n`);

async function reimportWithQuestionOnly() {
  let success = 0;
  let failed = 0;
  let updated = 0;

  for (let i = 0; i < qaData.length; i++) {
    const qa = qaData[i];
    const progress = `[${i + 1}/${qaData.length}]`;
    
    try {
      // 显示进度
      const preview = qa.question.substring(0, 40);
      process.stdout.write(`${progress} ${preview}...`);
      
      // 🔥 改进：只向量化问题（不包含答案）
      // 这样搜索时更容易匹配到正确的问题
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: qa.question,  // ← 只用问题！
      });
      
      const embedding = response.data[0].embedding;
      
      // 先检查是否已存在
      const { data: existing } = await supabase
        .from('qa_embeddings')
        .select('id')
        .eq('question', qa.question)
        .single();
      
      if (existing) {
        // 更新现有记录
        const { error } = await supabase
          .from('qa_embeddings')
          .update({ embedding: embedding })
          .eq('id', existing.id);
        
        if (error) {
          console.log(` ❌`);
          failed++;
        } else {
          console.log(` ↻ 更新`);
          updated++;
        }
      } else {
        // 插入新记录
        const { error } = await supabase
          .from('qa_embeddings')
          .insert({
            question: qa.question,
            answer: qa.answer,
            category: qa.category,
            embedding: embedding
          });
        
        if (error) {
          console.log(` ❌`);
          failed++;
        } else {
          console.log(` ✓`);
          success++;
        }
      }
      
      // 避免速率限制
      await new Promise(resolve => setTimeout(resolve, 150));
      
    } catch (error) {
      console.log(` ❌ ${error.message}`);
      failed++;
    }
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`✅ 新增: ${success} 条`);
  console.log(`↻  更新: ${updated} 条`);
  console.log(`❌ 失败: ${failed} 条`);
  console.log(`🎉 重新向量化完成！`);
  console.log(`${'='.repeat(60)}\n`);
}

reimportWithQuestionOnly().catch(console.error);
