# Dave Shapiro SEO & AI Consulting

> **Ultra-fast marketing site delivering 100/100 PageSpeed scores** 🚀
> Live at [daveshap.com](https://daveshap.com)

[![Astro](https://img.shields.io/badge/Built%20with-Astro-FF5D01?style=for-the-badge&logo=astro)](https://astro.build)
[![PageSpeed](https://img.shields.io/badge/PageSpeed-100%2F100-brightgreen?style=for-the-badge)](https://pagespeed.web.dev)
[![GitHub Pages](https://img.shields.io/badge/Deployed%20on-GitHub%20Pages-222?style=for-the-badge&logo=github)](https://pages.github.com)

## 📋 Table of Contents

- [Overview](#overview)
- [Performance](#-performance)
- [Tech Stack](#️-tech-stack)
- [Quick Start](#-quick-start)
- [Project Structure](#-project-structure)
- [Development](#-development)
- [Deployment](#-deployment)
- [Documentation](#-documentation)
- [Contributing](#-contributing)
- [License](#-license)

## Overview

A blazing-fast marketing site for Dave Shapiro's SEO & AI consulting services, built with Astro for optimal performance and SEO. Features data-driven content from Reddit insights, comprehensive service pages, and AI adoption resources.

### 🎯 Key Features

- **Instant loading** - Critical CSS inlined, async JS
- **SEO optimized** - Meta tags, structured data, sitemap
- **Mobile first** - Responsive design, touch optimized
- **Accessibility** - WCAG 2.1 AA compliant
- **AI-ready** - CLAUDE.md configuration for Claude Code
- **Content automation** - Reddit-driven content generation pipeline

## 🚀 Performance

| Metric | Score | Target |
|--------|-------|--------|
| PageSpeed Score | **100/100** | 95+ |
| First Contentful Paint | **< 0.5s** | < 1s |
| Time to Interactive | **< 1s** | < 2s |
| JavaScript Size | **~5KB** | < 10KB |
| Total Bundle Size | **< 50KB** | < 100KB |
| Load Time (3G) | **< 0.5s** | < 3s |

## 🛠️ Tech Stack

- **[Astro](https://astro.build)** (v4.x) - Static site generator with partial hydration
- **[Tailwind CSS](https://tailwindcss.com)** (v3.x) - Utility-first CSS framework
- **Vanilla JS** - Minimal JavaScript for essential interactions
- **[GitHub Pages](https://pages.github.com)** - Free, fast hosting with Actions deployment
- **Content Pipeline** - Reddit API + DataForSEO integration

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm 9+
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/shaphero/shaphero.github.io.git
cd shaphero.github.io

# Install dependencies
npm install

# Copy environment variables (for content generation)
cp .env.example .env
# Edit .env with your API credentials

# Start development server
npm run dev
# Open http://localhost:4321
```

## 📁 Project Structure

```
.
├── src/
│   ├── components/         # Reusable Astro components
│   │   ├── common/        # Shared components
│   │   ├── homepage/     # Homepage sections
│   │   └── training/      # Training page components
│   ├── layouts/           # Page layouts
│   ├── pages/            # Route pages (file-based routing)
│   │   ├── blog/         # Blog posts
│   │   └── ai-training/  # Location-based pages
│   └── styles/           # Global styles
├── public/               # Static assets
│   ├── images/          # Optimized images
│   ├── robots.txt       # SEO directives
│   └── CNAME           # Custom domain
├── content-generator/    # Reddit content pipeline
│   ├── lib/            # API integrations
│   └── analysis-reports/ # Generated insights
├── .github/
│   └── workflows/       # GitHub Actions
├── CLAUDE.md           # Claude Code instructions
├── astro.config.mjs    # Astro configuration
└── package.json        # Dependencies
```

## 🔧 Development

### Available Scripts

```bash
# Development server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Research pipelines
npm run research "AI adoption strategies"      # Standard research → ./generated/
npm run enhance -- --page ai-roi-analysis      # Enhance existing page(s)
npm run complete "AI ROI 2025"                 # Full pipeline (Claude Code + fallbacks)
npm run diagnose                               # Env + CLI diagnostics (see below)
npm run test:phase-one                         # Cache/vector/processor smoke tests
```

### Diagnostics & Smoke Tests

```bash
# Check env vars, Claude Code CLI, and optional smoke test
npm run diagnose            # summary only
npm run diagnose -- --smoke # quick end-to-end smoke (fast mode, no paid APIs)
```

### Environment Variables

Create a `.env` file in the root:

```env
# Reddit API (for content generation)
REDDIT_CLIENT_ID=your_client_id
REDDIT_CLIENT_SECRET=your_secret
REDDIT_USERNAME=your_username
REDDIT_PASSWORD=your_password
REDDIT_USER_AGENT=ContentPipeline/1.0 (daveshap.com)

# DataForSEO (optional, preferred names)
DATAFORSEO_API_LOGIN=your_login
DATAFORSEO_API_PASSWORD=your_password
# Legacy fallback also supported:
DATAFORSEO_USERNAME=your_login
DATAFORSEO_PASSWORD=your_password
# To force fallback search (DuckDuckGo):
# DATAFORSEO_DISABLE=1

# OpenAI for embeddings (optional)
OPENAI_API_KEY=your_openai_api_key
```

### Code Style

- Components: PascalCase (e.g., `HeroSection.astro`)
- Files: kebab-case (e.g., `seo-success.astro`)
- CSS: Tailwind utilities preferred
- JS: Minimal, async where possible

## 📦 Deployment

### Automatic Deployment

The site automatically deploys via GitHub Actions when you:

1. Push to the `main` branch
2. Merge a pull request

Deployment takes ~2 minutes and is available at [daveshap.com](https://daveshap.com).

### Manual Deployment

```bash
# Build the site
npm run build

# The built files are in dist/
# Deploy these to any static host
```

## 📚 Documentation

- **[CLAUDE.md](./CLAUDE.md)** - Instructions for Claude Code AI assistant
- **[COMPONENT_GUIDE.md](./COMPONENT_GUIDE.md)** - Component development guide
- **[ROADMAP.md](./ROADMAP.md)** - Project roadmap and future plans
- **[CONTENT_AGENTS_README.md](./CONTENT_AGENTS_README.md)** - Content generation pipeline docs

### For AI Assistants

This repository includes a `CLAUDE.md` file that provides context and instructions for AI coding assistants. When using Claude Code, Cursor, or similar tools, they will automatically read this file for project-specific guidance.

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Maintain 100/100 PageSpeed scores
- Follow existing code patterns
- Test on mobile devices
- Update documentation as needed
- Include descriptive commit messages

## 🐛 Issues

Found a bug or have a suggestion? Please [open an issue](https://github.com/shaphero/shaphero.github.io/issues) with:

- Clear description
- Steps to reproduce (for bugs)
- Expected behavior
- Screenshots if applicable

## 📄 License

© 2025 Dave Shapiro. All rights reserved.

This is a proprietary project. The code is not open source and may not be copied, modified, or distributed without explicit permission.

## 📞 Contact

**Dave Shapiro**
SEO & AI Consultant
Email: dave@daveshap.com
Website: [daveshap.com](https://daveshap.com)

---

<div align="center">
  Built with ❤️ using Astro | Achieving 509% growth for Fortune 500s
</div>
