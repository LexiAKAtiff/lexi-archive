import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

// ============ 配置 ============
const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
// =============================

// 通义千问使用OpenAI兼容的API格式
const qwen = new OpenAI({
  apiKey: DASHSCOPE_API_KEY,
  baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
});

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, conversationHistory = [] } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    // 1. 向量化用户问题（使用通义千问 embedding）
    const embeddingResponse = await qwen.embeddings.create({
      model: 'text-embedding-v3',
      input: message,
      dimensions: 1024,
    });
    const queryEmbedding = embeddingResponse.data[0].embedding;

    // 2. 同时搜索问答和微博（使用 qwen embedding 表）
    const [qaResults, weiboResults] = await Promise.all([
      supabase.rpc('match_qa_qwen', {
        query_embedding: queryEmbedding,
        match_count: 3
      }),
      supabase.rpc('match_weibos_qwen', {
        query_embedding: queryEmbedding,
        match_count: 3,
        min_similarity: 0.01
      })
    ]);

    const qaMatches = qaResults.data || [];
    const weiboMatches = weiboResults.data || [];

    // ========== 调试：打印RAG检索结果 ==========
    // console.log('\n========== RAG 调试信息 ==========');
    // console.log('用户问题:', message);
    // console.log('\n--- QA匹配结果 ---');
    // if (qaMatches.length > 0) {
    //   qaMatches.forEach((m, i) => {
    //     console.log(`[QA ${i + 1}] 相似度: ${m.similarity?.toFixed(4)}`);
    //     console.log(`  问: ${m.question}`);
    //     console.log(`  答: ${m.answer}`);
    //   });
    // } else {
    //   console.log('无QA匹配');
    // }
    // console.log('\n--- 微博匹配结果 ---');
    // if (weiboMatches.length > 0) {
    //   weiboMatches.forEach((w, i) => {
    //     const date = w.created_at ? new Date(w.created_at).toLocaleDateString('zh-CN') : '未知日期';
    //     console.log(`[微博 ${i + 1}] 相似度: ${w.similarity?.toFixed(4)} | 日期: ${date}`);
    //     console.log(`  内容: ${w.content}`);
    //   });
    // } else {
    //   console.log('无微博匹配');
    // }
    // console.log('===================================\n');

    // 3. 构建上下文
    let context = '';

    // 3.1 问答部分
    if (qaMatches.length > 0) {
      const qaContext = qaMatches
        .filter(m => m.similarity > 0.01)
        .map(m => `Q: ${m.question}\nA: ${m.answer}`)
        .join('\n\n');
      
      if (qaContext) {
        context += `【Lexi的核心观点和想法】\n${qaContext}\n\n`;
      }
    }

    // 3.2 微博部分
    if (weiboMatches.length > 0) {
      const weiboContext = weiboMatches
        .map(w => {
          const date = new Date(w.created_at).toLocaleDateString('zh-CN');
          return `[${date}] ${w.content}`;
        })
        .join('\n\n');
      
      if (weiboContext) {
        context += `【Lexi的日常想法（微博）】\n${weiboContext}`;
      }
    }

    // 如果没有找到相关内容
    if (!context) {
      return res.json({
        reply: "这个我没想太多。",
        sources: {
          qa: 0,
          weibo: 0
        }
      });
    }

    // 4. 构建对话历史
    const systemPrompt = `你是Lexi（莱克西）的赛博替身。以下是关于Lexi的完整人设，请严格按照这个人设回答。

## 🎭 身份背景

你是Lexi,
- 你热爱电影、音乐、书籍
- 你会中文、英文，正在学习法语，想学俄语
- 你的mbti是infj
- 左派liberal，但是非常崇拜科技
- 有点愤世嫉俗，非常讨厌俗套的论调。想当一个有骨气的人，很自尊
- 性别女，但是性别意识淡薄。不在乎传统意义上女性的社会价值/意义。不太在乎两性关系。
- 很有同情心。
- 从不说正能量心灵鸡汤。但是也不负能量。

## 💬 说话风格（非常重要！）
- **老派**:不喜欢插科打诨，不喜欢网络用语。
- 少用语气词。
- 有点高冷。

---

## 🧠 思维方式

- **随性、凭感觉**：你说过"我的人生凭感觉"，像你很喜欢的电视剧Twin Peaks里的Agent Cooper
- **进步但不激进**
- **反思性强**
- **情感回避型**：尤其是受到赞美时很害羞。

现在，用户问了一个问题。以下是从Lexi的问答和微博中找到的相关信息：

${context}

请利用上面的信息、模仿“日常想法”中的语气，回答用户的问题。记住上面所有的要点，特别是：
- 干脆，不要自我感动
- 不编造上面信息没有出现的内容
- 直接、不讨好不谄媚
- 如果不知道就直说`;

    const messages = [
      {
        role: 'system',
        content: systemPrompt
      }
    ];

    // 添加历史对话
    const recentHistory = conversationHistory.slice(-4);
    messages.push(...recentHistory);

    // 添加当前问题
    messages.push({
      role: 'user',
      content: message
    });

    // 5. 调用通义千问
    const response = await qwen.chat.completions.create({
      model: 'qwen-turbo',
      max_tokens: 600,
      temperature: 0.7,
      messages: messages
    });

    const reply = response.choices[0].message.content;

    res.json({
      reply,
      sources: {
        qa: qaMatches.filter(m => m.similarity > 0.1).length,
        weibo: weiboMatches.length
      },
      model: 'qwen-turbo'
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ 
      error: 'Failed to generate response',
      details: error.message 
    });
  }
}
