import Head from 'next/head';
import Link from 'next/link';
import { getSortedFragments } from '../../lib/posts';
import styles from '../../styles/Fragments.module.css';

export default function Fragments({ allPostsData }) {
  return (
    <>
      <Head>
        <title>Fragments - LEXI ARCHIVE</title>
      </Head>

      <div className={styles.container}>
        <Link href="/" className={styles.backButton}>
          ← BACK TO HOME
        </Link>

        <h1 className={styles.title}>FRAGMENTS</h1>
        <p className={styles.subtitle}>Scattered thoughts and observations</p>

        <div className={styles.postsList}>
          {allPostsData.map(({ slug, date, title, excerpt }) => (
            <Link href={`/fragments/${slug}`} key={slug} className={styles.postCard}>
              <div className={styles.postDate}>{date}</div>
              <h2 className={styles.postTitle}>{title}</h2>
              {excerpt && <p className={styles.postExcerpt}>{excerpt}</p>}
              <div className={styles.readMore}>READ MORE →</div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}

export async function getStaticProps() {
  const allPostsData = getSortedFragments();
  return {
    props: {
      allPostsData,
    },
  };
}
