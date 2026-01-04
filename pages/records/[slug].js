import Head from 'next/head';
import Link from 'next/link';
import { getAllRecordSlugs, getRecordData } from '../../lib/posts';
import styles from '../../styles/Record.module.css';

export default function Record({ postData }) {
  return (
    <>
      <Head>
        <title>{postData.title} - LEXI ARCHIVE</title>
      </Head>

      <div className={styles.container}>
        <Link href="/records" className={styles.backButton}>
          ← BACK TO RECORDS
        </Link>

        <article className={styles.article}>
          <div className={styles.recordBadge}>OFFICIAL RECORD</div>
          
          <div className={styles.postMeta}>
            <time className={styles.date}>{postData.date}</time>
            {postData.tags && (
              <div className={styles.tags}>
                {postData.tags.map(tag => (
                  <span key={tag} className={styles.tag}>{tag}</span>
                ))}
              </div>
            )}
          </div>

          <h1 className={styles.title}>{postData.title}</h1>

          <div 
            className={styles.content}
            dangerouslySetInnerHTML={{ __html: postData.contentHtml }} 
          />
        </article>
      </div>
    </>
  );
}

export async function getStaticPaths() {
  const paths = getAllRecordSlugs();
  return {
    paths,
    fallback: false,
  };
}

export async function getStaticProps({ params }) {
  const postData = await getRecordData(params.slug);
  return {
    props: {
      postData,
    },
  };
}
