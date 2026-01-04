import Head from 'next/head';
import Link from 'next/link';
import { getSortedRecords } from '../../lib/posts';
import styles from '../../styles/Records.module.css';

export default function Records({ allPostsData }) {
  return (
    <>
      <Head>
        <title>Records - LEXI ARCHIVE</title>
      </Head>

      <div className={styles.container}>
        <Link href="/" className={styles.backButton}>
          ← BACK TO HOME
        </Link>

        <h1 className={styles.title}>RECORDS</h1>
        <p className={styles.subtitle}>Formal documentation and comprehensive logs</p>

        <div className={styles.postsList}>
          {allPostsData.map(({ slug, date, title, excerpt }) => (
            <Link href={`/records/${slug}`} key={slug} className={styles.postCard}>
              <div className={styles.postHeader}>
                <div className={styles.postDate}>{date}</div>
                <div className={styles.recordBadge}>RECORD</div>
              </div>
              <h2 className={styles.postTitle}>{title}</h2>
              {excerpt && <p className={styles.postExcerpt}>{excerpt}</p>}
              <div className={styles.readMore}>VIEW RECORD →</div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}

export async function getStaticProps() {
  const allPostsData = getSortedRecords();
  return {
    props: {
      allPostsData,
    },
  };
}
