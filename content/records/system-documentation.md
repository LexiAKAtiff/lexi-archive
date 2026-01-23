---
title: "LEXI ARCHIVE: System Documentation"
date: "0000-00-00"
tags: ["technical", "documentation"]
excerpt: "Technical documentation of the LEXI ARCHIVE system architecture and design."
---

# LEXI ARCHIVE: System Documentation

## System Overview

LEXI ARCHIVE is a personal knowledge management system designed for long-term content preservation with emphasis on ownership, simplicity, and aesthetic coherence.

## Technology Stack

```
Frontend: Next.js (Pages Router)
Content: Markdown with frontmatter
Styling: CSS Modules
Database: Supabase (for Guestbook & Dialogues)
Deployment: Vercel
Version Control: Git + GitHub
```

## Content Structure

**Fragments**: Casual observations, short thoughts, experimental ideas
**Records**: Formal documentation, comprehensive analyses, official logs
**Guestbook**: Community interaction
**Dialogues**: RAG-powered conversation with Lexi's cyber avatar

## Design Philosophy

Inspired by Soviet constructivism:
- **Typography**: Bebas Neue for headers
- **Color Palette**: Red (#CC0000), Black (#1A1A1A), Off-white (#E8E4D8)
- **Layout**: Angular, asymmetric, purposeful negative space

## Content Workflow

```
1. Write Markdown file in content/
2. Git commit & push to GitHub
3. Vercel auto-deploys
```

## File Organization

```
content/
├── fragments/    # Daily thoughts
└── records/      # Formal docs
```

## Frontmatter Schema

```yaml
---
title: string (required)
date: YYYY-MM-DD (required)
tags: array[string] (optional)
excerpt: string (optional)
---
```

---

**Last Updated**: 2025-01-23
