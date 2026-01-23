import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import styles from '../styles/Guestbook.module.css';

export default function Guestbook() {
  const [messages, setMessages] = useState([]);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState('');

  // 获取留言
  useEffect(() => {
    fetchMessages();
  }, []);

  async function fetchMessages() {
    const { data, error } = await supabase
      .from('guestbook')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching messages:', error);
    } else {
      setMessages(data || []);
    }
  }

  // 提交留言
  async function handleSubmit(e) {
    e.preventDefault();
    
    if (!name.trim() || !message.trim()) {
      setSubmitStatus('请填写所有字段');
      return;
    }

    setLoading(true);
    setSubmitStatus('');

    const { data, error } = await supabase
      .from('guestbook')
      .insert([
        { name: name.trim(), message: message.trim() }
      ])
      .select();

    if (error) {
      console.error('Error inserting message:', error);
      setSubmitStatus('提交失败，请重试');
    } else {
      setSubmitStatus('留言成功！');
      setName('');
      setMessage('');
      // 刷新留言列表
      fetchMessages();
      // 3秒后清除成功提示
      setTimeout(() => setSubmitStatus(''), 3000);
    }

    setLoading(false);
  }

  // 格式化时间
  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  return (
    <>
      <Head>
        <title>Guestbook - LEXI ARCHIVE</title>
      </Head>

      <div className={styles.container}>
        <Link href="/" className={styles.backButton}>
          ← BACK TO HOME
        </Link>

        <h1 className={styles.title}>GUESTBOOK</h1>
        <p className={styles.subtitle}>Leave your mark in the archive</p>

        {/* 留言表单 */}
        <div className={styles.formCard}>
          <h2 className={styles.formTitle}>SIGN THE GUESTBOOK</h2>
          
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label className={styles.label}>NAME *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={styles.input}
                placeholder="Your name"
                maxLength={50}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>MESSAGE *</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className={styles.textarea}
                placeholder="Your message..."
                rows={4}
                maxLength={500}
                required
              />
            </div>

            <button 
              type="submit" 
              className={styles.submitButton}
              disabled={loading}
            >
              {loading ? 'SUBMITTING...' : 'SUBMIT MESSAGE'}
            </button>

            {submitStatus && (
              <div className={submitStatus.includes('成功') ? styles.successMessage : styles.errorMessage}>
                {submitStatus}
              </div>
            )}
          </form>
        </div>

        {/* 留言列表 */}
        <div className={styles.messagesSection}>
          <h2 className={styles.messagesTitle}>
            MESSAGES ({messages.length})
          </h2>

          {messages.length === 0 ? (
            <div className={styles.emptyState}>
              <p>还没有留言。成为第一个留言的人吧！</p>
            </div>
          ) : (
            <div className={styles.messagesList}>
              {messages.map((msg) => (
                <div key={msg.id} className={styles.messageCard}>
                  <div className={styles.messageHeader}>
                    <span className={styles.messageName}>{msg.name}</span>
                    <span className={styles.messageDate}>
                      {formatDate(msg.created_at)}
                    </span>
                  </div>
                  <div className={styles.messageContent}>
                    {msg.message}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
