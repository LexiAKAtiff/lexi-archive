# LEXI ARCHIVE

A personal website with Soviet-inspired design aesthetics for publishing articles and notes.

## Tech Stack

- **Framework**: Next.js (Pages Router)
- **Styling**: CSS Modules
- **Content**: Markdown files
- **Deployment**: Vercel

## Project Structure

```
lexi-archive/
├── content/
│   ├── fragments/       # Short thoughts, daily observations
│   └── records/         # Formal docs, annual reviews
├── lib/
│   └── posts.js         # Functions to read markdown files
├── pages/
│   ├── index.js         # Homepage
│   ├── fragments/
│   │   ├── index.js     # Fragments list
│   │   └── [slug].js    # Individual fragment
│   ├── records/
│   │   ├── index.js     # Records list
│   │   └── [slug].js    # Individual record
│   └── _app.js          # Global app wrapper
├── styles/
│   ├── globals.css      # Global styles
│   ├── Home.module.css  # Homepage styles
│   ├── Fragments.module.css
│   ├── Post.module.css
│   ├── Records.module.css
│   └── Record.module.css
└── public/              # Static assets (images, etc.)
```

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Create New Content

**For Fragments** (casual thoughts, daily observations):

Create a new `.md` file in `content/fragments/`:

```markdown
---
title: "Quick Thought on X"
date: "2024-12-18"
tags: ["tech", "ideas"]
excerpt: "A brief observation about..."
---

Your content here...
```

**For Records** (formal documentation, reviews):

Create a new `.md` file in `content/records/`:

```markdown
---
title: "2024 Q4 Review"
date: "2024-12-31"
tags: ["review", "reflection"]
excerpt: "Comprehensive quarterly analysis..."
---

Your formal content here...
```

The filename will become the URL slug (e.g., `my-article.md` → `/fragments/my-article` or `/records/my-article`)

## Writing Articles

### Frontmatter Fields

- `title` (required): Article title
- `date` (required): Publication date in YYYY-MM-DD format
- `tags` (optional): Array of tags
- `excerpt` (optional): Short description for the list page

### Markdown Support

- Headers (H1, H2, H3)
- Bold, italic, links
- Lists (ordered and unordered)
- Code blocks with syntax highlighting
- Blockquotes
- Images

## Deployment to Vercel

### First Time Setup

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Click "Deploy"

### Subsequent Updates

Just push to GitHub:

```bash
git add .
git commit -m "New article"
git push
```

Vercel will automatically rebuild and deploy your site!

## Navigation Structure

- `/` - Homepage
- `/fragments` - Casual thoughts and observations list
- `/fragments/[slug]` - Individual fragments
- `/records` - Formal documentation list
- `/records/[slug]` - Individual records
- `/guestbook` - (Coming soon)
- `/dialogues` - (Coming soon)

## Content Strategy

### Fragments
- **Purpose**: Quick thoughts, daily observations, experimental ideas
- **Style**: Casual, conversational, exploratory
- **Frequency**: High (daily/weekly)
- **Length**: Short to medium (100-1000 words)

### Records
- **Purpose**: Formal documentation, annual reviews, comprehensive guides
- **Style**: Structured, authoritative, permanent reference
- **Frequency**: Low (monthly/quarterly)
- **Length**: Medium to long (1000+ words)

## Design Philosophy

Inspired by Soviet constructivism and information architecture:
- Bold typography (Bebas Neue)
- Red, black, and off-white color scheme
- Geometric shapes and angular designs
- Strong emphasis on content hierarchy

## Customization

### Change Colors

Edit the color values in CSS files:
- Red: `#CC0000`
- Black: `#1A1A1A`
- Off-white: `#E8E4D8`

### Modify Layout

Edit the corresponding `.module.css` file for each page.

### Add New Sections

Create new pages in the `pages/` directory following the same pattern.

## License

Personal project - use as inspiration for your own!
