import Head from 'next/head';
import Link from 'next/link';
import { getAllFragmentSlugs, getFragmentData } from '../../lib/posts';
import styles from '../../styles/Post.module.css';

export default function Post({ postData }) {
  return (
    <>
      <Head>
        <title>{`${postData.title} - LEXI ARCHIVE`}</title>
      </Head>

      <div className={styles.container}>
        <Link href="/fragments" className={styles.backButton}>
          ← BACK TO FRAGMENTS
        </Link>

        <article className={styles.article}>
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

        <div className={styles.backToIndex}>
          <Link href="/">← BACK TO FRAGMENTS</Link>
        </div>
      </div>
    </>
  );
}

export async function getStaticPaths() {
  const paths = getAllFragmentSlugs();
  return {
    paths,
    fallback: false,
  };
}

export async function getStaticProps({ params }) {
  const postData = await getFragmentData(params.slug);
  return {
    props: {
      postData,
    },
  };
}
