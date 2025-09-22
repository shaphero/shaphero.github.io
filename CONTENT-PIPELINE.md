# 🚀 Content Research & Enhancement Pipeline

## Overview

This pipeline automates the process of researching topics and generating high-quality, data-driven content for your website. It combines multiple data sources (web search, Reddit, news) with AI synthesis to create comprehensive, audience-focused articles.

## Features

- **Multi-source Research**: Pulls from DataForSEO, Reddit API, and news outlets
- **Vector-based RAG**: Chunks and embeds content for intelligent retrieval
- **AI Synthesis**: Builds structured narratives with insights and evidence
- **Multiple Formats**: Generates Astro pages, Markdown, and HTML
- **Content Enhancement**: Upgrades existing pages with fresh research

## Quick Start

### 1. Research New Topics

```bash
# Basic research
npm run research "synthetic data 2025"

# With options
npm run research "AI adoption strategies" --depth comprehensive --audience executive

# Full options
npm run research "SEO trends" --depth comprehensive --audience technical --format report --sources 20
```

### 2. Enhance Existing Content

```bash
# Enhance all configured pages
npm run enhance

# This will create:
# - Enhanced versions (-enhanced.astro)
# - Insights reports (-insights.md)
```

## Configuration

### Environment Variables

Create a `.env` file with your API keys:

```env
# DataForSEO (optional but recommended)
DATAFORSEO_API_KEY=your_key_here

# Reddit API (optional)
REDDIT_CLIENT_ID=your_client_id
REDDIT_CLIENT_SECRET=your_secret

# OpenAI (optional, for embeddings)
OPENAI_API_KEY=your_key

# Anthropic (optional, for synthesis)
ANTHROPIC_API_KEY=your_key
```

## Pipeline Architecture

```
Input (keyword/topic)
    ↓
Data Collection
  ├── Web Search (DataForSEO)
  ├── Reddit Search
  └── News Search
    ↓
Content Processing
  ├── Scraping
  ├── Chunking
  └── Embedding
    ↓
Vector Storage
  └── In-memory DB
    ↓
Synthesis
  ├── Summarization
  ├── Insight Extraction
  └── Narrative Building
    ↓
Formatting
  ├── Astro Component
  ├── Markdown
  └── HTML
```

## Generated Files

The pipeline creates:

1. **Astro Page** (`keyword.astro`) - Ready to copy to `src/pages/`
2. **Markdown** (`keyword.md`) - Documentation format
3. **HTML** (`keyword.html`) - Standalone preview
4. **Metadata** (`keyword.meta.json`) - Raw research data

## Content Structure

Each generated page includes:

- **Hero Section** - Compelling headline and introduction
- **Executive Summary** - Key findings at a glance
- **Insights Grid** - Visual presentation of discoveries
- **Main Sections** - Deep dive into research
- **Evidence Boxes** - Supporting data and sources
- **Data Visualizations** - Charts and comparisons
- **Citations** - All sources properly attributed
- **CTA Section** - Clear next actions

## Best Practices

### Research Keywords

- Be specific: "AI coding benchmarks 2025" > "AI coding"
- Include context: "synthetic data for LLM training" > "synthetic data"
- Add intent: "how to measure AI ROI" > "AI ROI"

### Depth Settings

- **Quick**: 5-10 sources, basic synthesis (5 min)
- **Standard**: 10-15 sources, balanced depth (10 min)
- **Comprehensive**: 15-25 sources, full analysis (20 min)

### Audience Types

- **Executive**: Business impact, ROI, strategic implications
- **Technical**: Implementation details, benchmarks, code examples
- **General**: Balanced overview, practical applications

## Integration Workflow

1. **Research Phase**
   ```bash
   npm run research "your topic" --depth comprehensive
   ```

2. **Review Generated Content**
   - Check `generated/your-topic.html` in browser
   - Review insights in `generated/your-topic.meta.json`

3. **Customize & Integrate**
   - Copy Astro file to `src/pages/`
   - Customize CTAs for your services
   - Adjust styling to match brand

4. **Enhance Existing Pages**
   ```bash
   npm run enhance
   ```

5. **Deploy**
   ```bash
   npm run build
   git add .
   git commit -m "Add researched content on [topic]"
   git push
   ```

## Advanced Usage

### Custom Research Requests

Edit `scripts/research-content.ts` to customize:

```typescript
const request: ResearchRequest = {
  keyword: 'your keyword',
  depth: 'comprehensive',
  audience: 'technical',
  format: 'report',
  maxSources: 25,
  includeReddit: true,
  includeNews: true
};
```

### Batch Processing

Create multiple articles:

```bash
for topic in "AI security" "prompt engineering" "LLM benchmarks"; do
  npm run research "$topic" --depth standard
done
```

### Scheduled Updates

Add to cron for weekly updates:

```bash
0 0 * * MON cd /path/to/project && npm run enhance
```

## Module Structure

```
src/lib/content-pipeline/
├── config.ts           # Types and interfaces
├── research-agent.ts   # Main orchestrator
├── data-collector.ts   # Source gathering
├── content-processor.ts # Chunking & embedding
├── synthesizer.ts      # AI synthesis
├── vector-store.ts     # Document storage
├── formatter.ts        # Output generation
└── index.ts           # Public exports
```

## Extending the Pipeline

### Add New Data Sources

Edit `data-collector.ts`:

```typescript
async searchCustomSource(keyword: string): Promise<Source[]> {
  // Your implementation
}
```

### Custom Synthesis Rules

Edit `synthesizer.ts`:

```typescript
async customInsightExtractor(chunks: ChunkData[]): Promise<Insight[]> {
  // Your logic
}
```

### New Output Formats

Edit `formatter.ts`:

```typescript
toCustomFormat(synthesis: SynthesisResult): string {
  // Your format
}
```

## Troubleshooting

### No Results Found

- Check API keys in `.env`
- Verify internet connection
- Try broader keywords

### Poor Quality Output

- Increase `--sources` parameter
- Use `--depth comprehensive`
- Check if APIs are rate-limited

### TypeScript Errors

```bash
npm install --save-dev tsx @types/node
```

## Performance Tips

1. **Cache Results**: Reuse `meta.json` files
2. **Batch Requests**: Process multiple topics together
3. **Use Webhooks**: Trigger on content changes
4. **CDN Integration**: Cache generated pages

## Security Notes

- Never commit `.env` file
- Rotate API keys regularly
- Sanitize user inputs
- Review generated content before publishing

## Future Enhancements

- [ ] Real-time monitoring dashboard
- [ ] A/B testing for headlines
- [ ] Automated fact-checking
- [ ] Competitive analysis mode
- [ ] Multi-language support
- [ ] Video/podcast summaries
- [ ] Social media integration
- [ ] SEO optimization scoring

## Support

For issues or questions:
- Email: dave@daveshap.com
- GitHub: [Create an issue](https://github.com/shaphero/shaphero.github.io)

---

Built with ❤️ for data-driven content creation