import { useState, useRef, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import styles from '../styles/Dialogues.module.css';

export default function Dialogues() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: '你好！我是Lexi的赛博替身。你可以问我关于Lexi的任何问题——兴趣、想法、价值观等等。（目前只支持中文）'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // 自动滚动到最新消息
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 发送消息
  async function handleSend(e) {
    e.preventDefault();
    
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    
    // 添加用户消息
    const newMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setLoading(true);

    try {
      // 构建对话历史（不包括系统提示）
      const conversationHistory = newMessages
        .slice(1) // 跳过初始欢迎消息
        .map(m => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.content
        }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMessage,
          conversationHistory
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      // 添加AI回复
      setMessages([...newMessages, { 
        role: 'assistant', 
        content: data.reply,
        sources: data.sources 
      }]);

    } catch (error) {
      console.error('Chat error:', error);
      setMessages([...newMessages, { 
        role: 'assistant', 
        content: '抱歉，出了点问题。请稍后再试。' 
      }]);
    } finally {
      setLoading(false);
    }
  }

  // 快捷问题
  const quickQuestions = [
    "你最喜欢的电影是什么？",
    "你如何面对失败？",
    "你为什么做这个网站？",
    "你喜欢什么？",
  ];

  function handleQuickQuestion(question) {
    setInput(question);
  }

  return (
    <>
      <Head>
        <title>Dialogues - LEXI ARCHIVE</title>
      </Head>

      <div className={styles.container}>
        <Link href="/" className={styles.backButton}>
          ← BACK TO HOME
        </Link>

        <div className={styles.header}>
          <h1 className={styles.title}>DIALOGUES</h1>
          <p className={styles.subtitle}>Chat with Lexi&apos;s Cyber Avatar</p>
        </div>

        {/* 对话区域 */}
        <div className={styles.chatContainer}>
          <div className={styles.messagesArea}>
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`${styles.message} ${styles[msg.role]}`}
              >
                <div className={styles.messageContent}>
                  {msg.content}
                </div>
                {msg.sources && Array.isArray(msg.sources) && msg.sources.length > 0 && (
                  <div className={styles.sources}>
                    <small>相关度: {msg.sources.map(s => s.similarity).join(', ')}</small>
                  </div>
                )}
              </div>
            ))}
            
            {loading && (
              <div className={`${styles.message} ${styles.assistant}`}>
                <div className={styles.messageContent}>
                  <div className={styles.typing}>
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* 快捷问题 */}
          {messages.length === 1 && (
            <div className={styles.quickQuestions}>
              <p className={styles.quickTitle}>试试这些问题：</p>
              <div className={styles.quickButtons}>
                {quickQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    className={styles.quickButton}
                    onClick={() => handleQuickQuestion(q)}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 输入区域 */}
          <form onSubmit={handleSend} className={styles.inputArea}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="问我任何关于Lexi的问题..."
              className={styles.input}
              disabled={loading}
            />
            <button 
              type="submit" 
              className={styles.sendButton}
              disabled={loading || !input.trim()}
            >
              {loading ? '...' : '→'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
