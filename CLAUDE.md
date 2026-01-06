# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A personal blog/portfolio site built with Vue 3 and Vite SSG (Static Site Generation). Based on [antfu.me](https://github.com/antfu/antfu.me).

## Common Commands

```bash
pnpm dev          # Start dev server on port 3000
pnpm build        # Production build (SSG)
pnpm preview      # Preview production build
pnpm lint         # Run ESLint
pnpm lint:fix     # Run ESLint with auto-fix
```

## Architecture

### Tech Stack
- **Framework**: Vue 3 with TypeScript
- **Build**: Vite + vite-ssg for static site generation
- **Styling**: UnoCSS (Tailwind-like utility classes)
- **Routing**: vite-plugin-pages (file-based routing)
- **Content**: Markdown files with gray-matter frontmatter

### Key Directories
- `pages/` - File-based routing (`.vue` and `.md` files become routes)
  - `pages/posts/` - Blog posts as Markdown files
- `src/components/` - Vue components (auto-imported)
- `src/styles/` - Global CSS (`main.css`, `prose.css`, `markdown.css`)
- `public/` - Static assets

### Content System
- Markdown files in `pages/` are auto-converted to routes
- Posts use frontmatter for metadata (title, date, etc.)
- Markdown is processed with Prism syntax highlighting and anchor links
- Posts are wrapped in the `Post.vue` component automatically

### Auto-imports
- Vue Composition API (`ref`, `computed`, `watch`, etc.)
- Vue Router (`useRouter`, `useRoute`)
- VueUse composables
- Components from `src/components/` (no import needed)
- Icons via `unplugin-icons` (use `<IconName />` syntax)

## Deployment

Configured for Netlify (`netlify.toml`). Production builds use `vite-ssg build`.
