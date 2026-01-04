import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';

const fragmentsDirectory = path.join(process.cwd(), 'content/fragments');
const recordsDirectory = path.join(process.cwd(), 'content/records');

// Generic function to get posts from any directory
function getSortedPostsData(directory) {
  // Check if directory exists, if not return empty array
  if (!fs.existsSync(directory)) {
    return [];
  }

  const fileNames = fs.readdirSync(directory);
  const allPostsData = fileNames
    .filter(fileName => fileName.endsWith('.md'))
    .map((fileName) => {
      const slug = fileName.replace(/\.md$/, '');
      const fullPath = path.join(directory, fileName);
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      const matterResult = matter(fileContents);

      return {
        slug,
        ...matterResult.data,
      };
    });

  // Sort posts by date
  return allPostsData.sort((a, b) => {
    if (a.date < b.date) {
      return 1;
    } else {
      return -1;
    }
  });
}

// Get all slugs from a directory
function getAllSlugs(directory) {
  if (!fs.existsSync(directory)) {
    return [];
  }

  const fileNames = fs.readdirSync(directory);
  return fileNames
    .filter(fileName => fileName.endsWith('.md'))
    .map((fileName) => {
      return {
        params: {
          slug: fileName.replace(/\.md$/, ''),
        },
      };
    });
}

// Get single post data
async function getPostData(directory, slug) {
  const fullPath = path.join(directory, `${slug}.md`);
  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const matterResult = matter(fileContents);

  const processedContent = await remark()
    .use(html)
    .process(matterResult.content);
  const contentHtml = processedContent.toString();

  return {
    slug,
    contentHtml,
    ...matterResult.data,
  };
}

// FRAGMENTS functions
export function getSortedFragments() {
  return getSortedPostsData(fragmentsDirectory);
}

export function getAllFragmentSlugs() {
  return getAllSlugs(fragmentsDirectory);
}

export async function getFragmentData(slug) {
  return await getPostData(fragmentsDirectory, slug);
}

// RECORDS functions
export function getSortedRecords() {
  return getSortedPostsData(recordsDirectory);
}

export function getAllRecordSlugs() {
  return getAllSlugs(recordsDirectory);
}

export async function getRecordData(slug) {
  return await getPostData(recordsDirectory, slug);
}

