import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// ============ 配置 ============
const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const qwen = new OpenAI({
  apiKey: DASHSCOPE_API_KEY,
  baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
});

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 测试问题列表
const testQuestions = [
  '你喜欢什么电影？',
  '你最喜欢的导演是谁？',
  '你喜欢听什么音乐？',
  '你在哪里上学？',
  '你的爱好是什么？',
  '你怎么看待爱情？',
];

async function getQwenEmbedding(text) {
  const response = await qwen.embeddings.create({
    model: 'text-embedding-v3',
    input: text,
    dimensions: 1024,  // 通义支持的最大维度
  });
  return response.data[0].embedding;
}

async function searchWithEmbedding(embedding, question) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`问题: ${question}`);
  console.log('='.repeat(60));

  // 搜索 QA（使用 qwen embedding）
  const qaResults = await supabase.rpc('match_qa_qwen', {
    query_embedding: embedding,
    match_count: 3
  });

  console.log('\n📚 QA 匹配结果:');
  if (qaResults.data && qaResults.data.length > 0) {
    qaResults.data.forEach((m, i) => {
      console.log(`  [${i + 1}] 相似度: ${m.similarity?.toFixed(4)}`);
      console.log(`      问: ${m.question}`);
      console.log(`      答: ${m.answer?.substring(0, 100)}${m.answer?.length > 100 ? '...' : ''}`);
    });
  } else {
    console.log('  无匹配');
  }

  // 搜索微博（使用 qwen embedding）
  const weiboResults = await supabase.rpc('match_weibos_qwen', {
    query_embedding: embedding,
    match_count: 3,
    min_similarity: 0.01
  });

  console.log('\n📱 微博匹配结果:');
  if (weiboResults.data && weiboResults.data.length > 0) {
    weiboResults.data.forEach((w, i) => {
      console.log(`  [${i + 1}] 相似度: ${w.similarity?.toFixed(4)}`);
      console.log(`      内容: ${w.content?.substring(0, 100)}${w.content?.length > 100 ? '...' : ''}`);
    });
  } else {
    console.log('  无匹配');
  }
}

async function main() {
  console.log('🚀 开始测试通义千问 Embedding...\n');
  console.log(`使用模型: text-embedding-v3`);
  console.log(`API Key: ${DASHSCOPE_API_KEY ? '已配置' : '❌ 未配置'}`);

  for (const question of testQuestions) {
    try {
      const embedding = await getQwenEmbedding(question);
      await searchWithEmbedding(embedding, question);
    } catch (error) {
      console.error(`❌ 测试 "${question}" 失败:`, error.message);
    }
  }

  console.log('\n\n✅ 测试完成');
}

main();
