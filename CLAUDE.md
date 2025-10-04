# CLAUDE.md

> **AI Assistant Context File** - Automatically loaded by Claude Code, Cursor, and other AI coding assistants
> Last Updated: January 2025

This file provides guidance to AI assistants when working with code in this repository. It follows the 2025 standard for AI context files.

## Project Overview

**Name**: Dave Shapiro Educational Content Site
**URL**: https://daveshap.com
**Tech Stack**: Astro (Static Site Generator) + Tailwind CSS
**Purpose**: Publishing high-quality educational content that makes readers smarter
**Content Philosophy**: Research-driven, fact-based, educational content that informs and teaches

## Core Mission

Create content that **teaches and informs**. Every article should:
- Make readers smarter than they were before
- Be grounded in real research and data
- Present multiple perspectives and sources
- Cite all claims with proper attribution
- Explain complex concepts clearly
- Leave readers with actionable knowledge

## Code Style & Conventions

### Astro/HTML
- Use `.astro` files for all pages and components
- Prefer static generation over client-side rendering for SEO
- Components go in `src/components/`
- Pages go in `src/pages/` and auto-generate routes

### CSS/Styling
- Use Tailwind CSS utility classes
- Custom styles in `src/styles/` only when necessary
- Mobile-first responsive design
- Clean, readable layouts that prioritize content

### SEO Requirements
- Every page needs unique title/description meta tags
- Use semantic HTML (h1, h2, h3 hierarchy)
- Image alt text must be descriptive
- Internal linking between related content
- Generate sitemap.xml automatically

## Build Commands

```bash
# Development
npm run dev          # Start dev server on localhost:4321

# Production
npm run build        # Build static site to dist/
npm run preview      # Preview production build locally

# Content Generation
npm run research "topic" --depth comprehensive  # Research new topics
npm run enhance                                 # Enhance existing content

# Deployment (automatic via GitHub Actions)
git push origin main # Triggers deploy to GitHub Pages
```

## Project Structure

```
/
├── src/
│   ├── pages/                    # Routes (auto-generated)
│   ├── components/               # Reusable components
│   ├── layouts/                  # Page templates
│   ├── lib/
│   │   └── content-pipeline/    # Research & generation system
│   │       ├── research-agent.ts      # Main orchestrator
│   │       ├── data-collector.ts      # Multi-source data gathering
│   │       ├── content-processor.ts   # Chunking & embeddings
│   │       ├── synthesizer.ts         # AI synthesis with fact-checking
│   │       ├── vector-store.ts        # Document storage & retrieval
│   │       └── formatter.ts           # Output generation
│   └── styles/                  # Global styles
├── scripts/
│   ├── research-content.ts      # CLI for content research
│   └── enhance-existing-content.ts  # Update existing pages
├── generated/                   # Generated content output
├── public/                      # Static assets
└── content-generator/          # Legacy system (to be deprecated)
```

## Educational Content Generation System

### Philosophy: Research → Synthesis → Education

Our content generation follows a rigorous research-driven approach:

1. **Multi-Source Research**: Gather data from authoritative sources
2. **Fact Verification**: Cross-reference claims across sources
3. **Contextual Synthesis**: Use RAG with sufficient context
4. **Educational Structuring**: Present information for learning
5. **Proper Attribution**: Cite all sources transparently

### The 4-Layer Architecture

#### 1. Research Layer (Truth Gathering)
**Purpose**: Collect verified, authoritative information

**Data Sources**:
- **DataForSEO API**: SERP data, keyword research, content analysis
- **Academic Sources**: CORE API (open access papers), Crossref
- **Reddit API**: Real user questions, discussions, pain points
- **News APIs**: Recent developments, expert commentary
- **Google Scholar**: Citation data, research trends

**Quality Criteria**:
- Prioritize academic and authoritative sources
- Include publication dates and author credentials
- Cross-reference facts across multiple sources
- Flag any claims that can't be verified

#### 2. Processing Layer (RAG with Sufficient Context)
**Purpose**: Chunk and embed content for intelligent retrieval

**Key Techniques**:
- **Semantic Chunking**: Preserve meaning, not arbitrary splits
- **Embeddings**: Vector representations via OpenAI/Vertex AI
- **Vector Storage**: In-memory or Pinecone for similarity search
- **Context Sufficiency**: Ensure retrieved chunks actually answer questions
- **Relevance Scoring**: Rank sources by credibility and relevance

**2025 Best Practices** (based on recent research):
- Use "sufficient context" not just "relevant context"
- Implement Corrective RAG (CRAG) to verify retrieved data
- Apply agentic RAG for adaptive retrieval strategies
- Ensure context provides enough information for complete answers

#### 3. Synthesis Layer (Educational Content Creation)
**Purpose**: Transform research into clear, educational content

**Process**:
1. **Research Synthesis**: Combine findings from multiple sources
2. **Claim Verification**: Flag unverified statements
3. **Citation Management**: Proper attribution for all facts
4. **Clarity Optimization**: Explain complex concepts simply
5. **Learning Progression**: Structure from basics to advanced
6. **Multiple Perspectives**: Present different viewpoints fairly

**Educational Standards**:
- Clear learning objectives for each section
- Progressive disclosure (simple → complex)
- Concrete examples for abstract concepts
- Visual aids (charts, diagrams, comparisons)
- Key takeaways and summaries
- Further reading recommendations

#### 4. Quality Layer (Fact-Checking & Verification)
**Purpose**: Ensure accuracy and educational value

**Quality Checks**:
- **Source Credibility**: Score and rank source authority
- **Hallucination Detection**: Verify all AI claims against sources
- **Fact Cross-Reference**: Multiple sources for key claims
- **Currency Check**: Flag outdated information
- **Bias Detection**: Identify potential bias in sources
- **Completeness**: Ensure topic coverage is comprehensive

**Before Publishing Checklist**:
- [ ] All facts cited with sources
- [ ] No unverified AI hallucinations
- [ ] Multiple authoritative sources confirm key claims
- [ ] Complex concepts explained clearly
- [ ] Examples provided for abstract ideas
- [ ] Visual aids enhance understanding
- [ ] Clear learning objectives stated
- [ ] Accessible to target audience level
- [ ] Proper attribution for all data/quotes
- [ ] Links to primary sources work

## Content Generation Workflow

### 1. Research New Topics

```bash
# Basic research
npm run research "synthetic data for LLM training"

# Comprehensive research with options
npm run research "AI safety measures 2025" \
  --depth comprehensive \
  --sources 25 \
  --include-academic true
```

**What This Does**:
- Searches multiple data sources (web, Reddit, academic papers, news)
- Scrapes and processes content into chunks
- Creates vector embeddings for semantic search
- Synthesizes findings with AI (with fact-checking)
- Generates Astro page with citations and sources
- Creates metadata file with all research data

**Output Files**:
- `generated/topic.astro` - Ready-to-publish page
- `generated/topic.md` - Markdown version
- `generated/topic.html` - HTML preview
- `generated/topic.meta.json` - Raw research data

### 2. Enhance Existing Content

```bash
npm run enhance
```

Updates existing pages with:
- Fresh research and recent data
- New citations and sources
- Updated statistics and examples
- Enhanced fact-checking
- Improved clarity and structure

### 3. Review and Customize

Before publishing:
1. Review `generated/topic.html` in browser
2. Verify all citations are accurate
3. Check that sources are authoritative
4. Ensure explanations are clear
5. Customize for your audience if needed
6. Copy to `src/pages/` when ready

## Content Structure Standards

Every generated page includes:

### Required Sections

1. **Hero/Introduction**
   - Clear headline explaining what reader will learn
   - Brief overview of topic importance
   - Learning objectives stated upfront

2. **Executive Summary** (optional for long posts)
   - Key findings at a glance
   - Main takeaways in 3-5 bullets
   - Who should read this and why

3. **Core Educational Content**
   - Logical progression from simple to complex
   - Clear section headers (H2, H3 hierarchy)
   - Concrete examples for each major concept
   - Visual aids (tables, charts, diagrams)
   - Code snippets or templates where applicable

4. **Evidence & Citations**
   - Inline citations for all claims
   - "Evidence boxes" highlighting key research
   - Data visualizations with sources
   - Quotes from experts (properly attributed)

5. **Key Takeaways**
   - Summary of main points
   - Actionable insights
   - Further reading/resources

6. **Sources & References**
   - Complete bibliography
   - Links to primary sources
   - Publication dates and authors
   - DOI or URLs for academic papers

## Writing Guidelines for Educational Content

### Clarity Above All

- **Explain jargon**: Define technical terms on first use
- **Use analogies**: Relate complex ideas to familiar concepts
- **Be specific**: "26% improvement" not "significant improvement"
- **Show, don't just tell**: Include examples, screenshots, code
- **Progressive complexity**: Start simple, add nuance gradually

### Objectivity and Balance

- **Present multiple viewpoints**: Especially on controversial topics
- **Acknowledge limitations**: What the research doesn't tell us
- **Avoid absolute claims**: "Research suggests" not "This proves"
- **Cite dissenting opinions**: Include counterarguments fairly
- **Distinguish fact from opinion**: Be clear when interpreting data

### Educational Best Practices

- **State learning objectives**: What will readers know after reading?
- **Use the ADEPT method**: Analogy, Diagram, Example, Plain English, Technical
- **Include "Why it matters"**: Connect concepts to real applications
- **Provide practice opportunities**: Questions, exercises, challenges
- **Offer multiple entry points**: Beginners and experts both get value

### Pedagogical Structure

```markdown
# [Clear, Descriptive Title]

## What You'll Learn
- Objective 1
- Objective 2
- Objective 3

## Why This Matters
[Real-world context and applications]

## The Basics
[Foundational concepts, defined clearly]

## Deeper Dive
[More complex aspects, building on basics]

## Practical Examples
[Concrete use cases with code/data]

## Common Misconceptions
[Address frequent misunderstandings]

## Key Takeaways
- Takeaway 1
- Takeaway 2
- Takeaway 3

## Further Reading
- [Source 1 with annotation]
- [Source 2 with annotation]

## References
[Complete bibliography]
```

## Research Quality Standards

### Source Hierarchy (Highest to Lowest Priority)

1. **Peer-reviewed academic papers** - Published in reputable journals
2. **Official documentation** - From creators of technology/methodology
3. **Industry research reports** - From established organizations
4. **Expert commentary** - From recognized authorities (with credentials)
5. **News from reputable outlets** - Major publications with editorial standards
6. **Community discussions** - Reddit, forums (for pain points, not facts)
7. **Blog posts** - Use cautiously, verify claims independently

### Citation Requirements

- **Direct quotes**: Must include quotation marks and exact source
- **Statistics/data**: Must cite original research, not secondary reporting
- **Claims of fact**: Need at least 2 independent authoritative sources
- **Controversial topics**: Present multiple perspectives with sources
- **Code examples**: Attribute to original author/documentation
- **Images/diagrams**: Credit creator, include license information

### Red Flags to Avoid

❌ Claims without sources
❌ Statistics without methodology
❌ "Experts say" without naming experts
❌ Outdated information presented as current
❌ Cherry-picked data that supports only one viewpoint
❌ Correlation presented as causation
❌ Anecdotes presented as evidence
❌ AI hallucinations not verified against sources

## API Configuration

### Required API Keys

Create `.env` file with:

```env
# Research APIs
DATAFORSEO_API_KEY=your_key          # Web/SERP data
REDDIT_CLIENT_ID=your_id              # Reddit discussions
REDDIT_CLIENT_SECRET=your_secret      # Reddit API access

# Processing APIs
OPENAI_API_KEY=your_key              # Embeddings & synthesis
# OR
ANTHROPIC_API_KEY=your_key           # Alternative for synthesis

# Optional APIs
CORE_API_KEY=your_key                # Academic papers
CROSSREF_API_KEY=your_key            # Citation data
```

### Data Sources & APIs

| Source | Purpose | Priority | API |
|--------|---------|----------|-----|
| DataForSEO | SERP, content analysis | High | Required |
| CORE | Academic papers | High | Optional |
| Reddit | User pain points | Medium | Recommended |
| News APIs | Current events | Medium | Optional |
| Crossref | Citations | Low | Optional |

## Testing & Quality Assurance

### Before Publishing

```bash
# 1. Build and test locally
npm run build
npm run preview

# 2. Verify all citations
grep -r "http" generated/your-topic.astro  # Check links work

# 3. Fact-check key claims
# Manually verify 3-5 major claims against primary sources

# 4. Test reading level
# Use Hemingway Editor or similar for accessibility

# 5. Check SEO
# Lighthouse score should be 95+
```

### Quality Checklist

- [ ] All facts have citations
- [ ] Citations link to primary sources
- [ ] Sources are authoritative and current
- [ ] Complex concepts explained clearly
- [ ] Examples illustrate key points
- [ ] No AI hallucinations detected
- [ ] Multiple perspectives presented
- [ ] Learning objectives achieved
- [ ] Accessible to target audience
- [ ] Visual aids enhance understanding
- [ ] Code examples tested and work
- [ ] Internal links enhance learning
- [ ] SEO optimized (but education-first)
- [ ] Mobile-friendly and readable

## Performance Standards

- Page load < 3 seconds
- Mobile-first responsive design
- Accessibility: WCAG 2.1 AA compliant
- SEO: Pages score 95+ on Lighthouse
- No JavaScript required for core content
- Properly structured for screen readers

## Important URLs

- **Production**: https://daveshap.com
- **GitHub Repo**: https://github.com/shaphero/shaphero.github.io
- **Email**: dave@daveshap.com

## AI Assistant Workflow

### When Generating Content

1. **Research First**: Use the content pipeline to gather real data
2. **Verify Facts**: Cross-reference all claims
3. **Cite Sources**: Attribute everything properly
4. **Explain Clearly**: Optimize for understanding
5. **Review Quality**: Use the checklist above

### Working with This Codebase

When asked to make changes:
1. Read relevant existing files first
2. Follow established patterns
3. Test with `npm run build`
4. Verify citations and sources work

## Remember

- **Education First**: Make readers smarter
- **Facts Over Opinions**: Research-driven content only
- **Cite Everything**: Proper attribution always
- **Clarity Matters**: Explain complex ideas simply
- **Quality > Quantity**: One great article beats ten mediocre ones
- **Truth Over Engagement**: Accuracy before virality
- **Teach, Don't Sell**: Focus on knowledge, not conversion
