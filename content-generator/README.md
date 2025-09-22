# Comprehensive Content Generator

An AI-powered content generation system that creates exhaustive, SEO-optimized content using DataForSEO, Reddit API, and Claude CLI.

## Features

- **SERP Analysis**: Analyzes top 10 competitors using DataForSEO API
- **PAA Extraction**: Gets People Also Ask questions with 2-level expansion
- **Reddit Insights**: Extracts real user questions, pain points, and solutions
- **Content Gap Analysis**: Identifies missing topics and opportunities
- **AI Generation**: Uses Claude CLI for comprehensive content creation
- **AIO/GEO Optimization**: Optimizes for AI systems and generative engines
- **Multi-Stage Pipeline**: Research → Analysis → Generation → Optimization

## Architecture

```
Input Topic
    ↓
Research Phase
  ├── DataForSEO SERP Analysis
  ├── PAA Question Extraction
  └── Reddit Discussion Mining
    ↓
Analysis Phase
  ├── Competitor Content Analysis
  ├── Gap Identification
  └── Opportunity Detection
    ↓
Generation Phase
  ├── Comprehensive Outline
  ├── Section-by-Section Generation
  └── FAQ Creation
    ↓
Optimization Phase
  ├── AIO Enhancement (Citations, Stats)
  ├── GEO Optimization (Structure)
  └── Featured Snippet Formatting
    ↓
Final Output (3000-5000+ words)
```

## Installation

```bash
# Clone or navigate to content-generator directory
cd content-generator

# Install dependencies
npm install

# Copy .env.example to .env and add your credentials
cp .env.example .env

# Edit .env with your API credentials:
# - DataForSEO credentials
# - Reddit API credentials
# - Claude CLI path (if not in PATH)
```

## Usage

### Interactive Mode

```bash
npm start
# or
node index.js
```

Follow the prompts to:
1. Enter your topic
2. Select content style (informative, conversational, technical, persuasive)
3. Choose depth (standard, comprehensive, ultimate guide)

### Generated Output

Content is saved to `./generated-content/` with:
- Markdown file (`.md`)
- HTML preview (`.html`)
- Metadata including word count, keywords, reading time

## Content Generation Process

### 1. Research Phase
- Analyzes top 10 SERP competitors
- Extracts PAA questions with nested expansions
- Mines Reddit for user questions and pain points
- Identifies related searches and keywords

### 2. Analysis Phase
- Calculates content depth and breadth scores
- Identifies unanswered questions
- Finds content gaps and opportunities
- Detects featured snippet opportunities

### 3. Generation Phase
- Creates comprehensive outline addressing all gaps
- Generates section-by-section content
- Maintains consistency and flow
- Includes data, examples, and citations

### 4. Optimization Phase
- Adds statistics and citations (115% visibility boost)
- Structures for featured snippets
- Optimizes for AI extraction
- Formats for readability

## API Configuration

### DataForSEO
- Endpoint: `https://api.dataforseo.com/v3`
- Rate limit: 2000 requests/minute
- Cost: $0.0006 per 10 SERP results

### Reddit API
- Uses PRAW (Python Reddit API Wrapper)
- Rate limit: 100 QPM for free tier
- App-only authentication

### Claude CLI
- Requires Claude Code CLI installed
- Uses Sonnet model by default
- Supports streaming responses

## Content Quality Features

### Comprehensiveness Scoring
- Analyzes topic coverage breadth
- Measures content depth
- Compares against competitors
- Identifies missing elements

### AIO/GEO Optimization
- **Cite Sources**: Adds credible citations
- **Statistics**: Includes specific data points
- **Quotations**: Adds expert quotes
- **Structure**: Clear headers and lists
- **Entities**: Defines and explains clearly

### Output Metrics
- Word count tracking
- Reading time calculation
- Keyword extraction
- Content scoring

## Best Practices

1. **Topic Selection**: Choose specific, searchable topics
2. **Research Depth**: System analyzes 10+ competitors
3. **Content Length**: Targets 3000-5000+ words
4. **Optimization**: Applies 7+ AIO/GEO techniques
5. **Quality Check**: Reviews gaps and opportunities

## Troubleshooting

### DataForSEO Issues
- Verify credentials in `.env`
- Check API rate limits
- Ensure location is valid

### Reddit API Issues
- Verify client ID and secret
- Check user agent format
- Ensure subreddit exists

### Claude CLI Issues
- Verify Claude CLI is installed
- Check PATH or set CLAUDE_CLI_PATH
- Ensure model access

## Performance

- Research phase: 30-60 seconds
- Analysis phase: 5-10 seconds
- Generation phase: 2-5 minutes
- Total time: 3-7 minutes for 3000-5000 word article

## License

MIT

## Support

For issues or questions, contact dave@daveshap.com