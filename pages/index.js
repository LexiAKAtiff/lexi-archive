import Head from 'next/head';
import Link from 'next/link';
import styles from '../styles/Home.module.css';

export default function Home() {
  return (
    <>
      <Head>
        <title>LEXI ARCHIVE</title>
        <meta name="description" content="Digital Collective Archive" />
      </Head>

      <div className={styles.redFlag}></div>
      
      <div className={styles.cornerSquare + ' ' + styles.squareTL}></div>
      <div className={styles.cornerSquare + ' ' + styles.squareBR}></div>

      <div className={styles.titleSection}>
        <div className={styles.star}>★</div>
        <h1 className={styles.title}>
          LEXI<br />ARCHIVE
        </h1>
        <div className={styles.subtitle}>DIGITAL COLLECTIVE</div>
      </div>

      <div className={styles.contentSection}>
        <div className={styles.slogan}>
          Preserving Memory<br />Building Future
        </div>

        <div className={styles.navGrid}>
          <Link href="/fragments" className={styles.navButton}>
            FRAGMENTS
          </Link>
          <Link href="/records" className={styles.navButton}>
            RECORDS
          </Link>
          <Link href="/guestbook" className={styles.navButton}>
            GUESTBOOK
          </Link>
          <Link href="/dialogues" className={styles.navButton}>
            DIALOGUES
          </Link>
        </div>
      </div>
    </>
  );
}
