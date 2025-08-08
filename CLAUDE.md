# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Name**: Dave Shapiro SEO & AI Consulting Website  
**URL**: https://daveshap.com  
**Tech Stack**: Astro (Static Site Generator) + Tailwind CSS  
**Purpose**: Lead generation for SEO/AI consulting services  
**Target Audience**: Enterprise & mid-market companies needing SEO/AI expertise

## Key Business Context

### Success Metrics
- 509% traffic growth achieved for SoFi (22,000+ new customers)
- 494% traffic growth for Adobe (25,000+ downloads)
- Former CMO, SVP at Neil Patel Digital
- 16+ years working with Fortune 500 companies

### Current Focus
1. **SEO Consulting**: Data-driven strategies for measurable revenue growth
2. **AI Implementation**: Teaching teams practical AI workflows (10-20 hours/week savings)
3. **Content Authority**: Publishing data-driven analysis posts to establish thought leadership

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
- Premium glass morphism effects for modern look

### Content Writing
- **Headlines**: Lead with specific results (509%, 22,000 customers, etc.)
- **Copy**: Direct, punchy, no fluff. Results > Features
- **CTAs**: Email-based (dave@daveshap.com) with clear subject lines
- **Tone**: Confident expert, not salesy. Evidence-based claims only.

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

# Deployment (automatic via GitHub Actions)
git push origin main # Triggers deploy to GitHub Pages
```

## Project Structure

```
/
├── src/
│   ├── pages/           # Routes (auto-generated)
│   │   ├── index.astro       # Homepage
│   │   ├── seo-success.astro # Case study
│   │   ├── best-ai-coding.astro # AI analysis post
│   │   └── ...
│   ├── components/      # Reusable components
│   │   ├── Header.astro
│   │   ├── Hero.astro
│   │   └── common/
│   ├── layouts/         # Page templates
│   └── styles/          # Global styles
├── public/              # Static assets
│   ├── images/
│   ├── CNAME           # Custom domain config
│   └── robots.txt
├── dist/               # Build output (git ignored)
└── astro.config.mjs    # Astro configuration
```

## Content Strategy Rules

### Blog Posts Must Have
1. **Data-driven insights** - Real benchmarks, pricing, statistics
2. **Visual elements** - Charts, comparisons, tables
3. **Clear takeaways** - Numbered lists, key points
4. **Internal links** - Connect to service pages
5. **CTA sections** - Drive email consultations

### Homepage Requirements
- Hero: Lead with biggest win (509% SoFi growth)
- Social proof: Fortune 500 logos
- Problem/solution focus
- Clear service offerings
- Multiple CTAs throughout

## Testing Checklist

Before committing:
- [ ] Run `npm run build` - must succeed
- [ ] Check all internal links work
- [ ] Verify meta tags are unique per page
- [ ] Test on mobile viewport
- [ ] Lighthouse score > 90 for Performance & SEO
- [ ] No console errors in browser

## GitHub Workflow

1. Make changes locally
2. Test with `npm run dev`
3. Build with `npm run build`
4. Commit with descriptive message
5. Push to main (auto-deploys via GitHub Actions)
6. Verify at https://daveshap.com after ~2 minutes

## Key Business Goals

### Immediate (Current Sprint)
- Establish thought leadership through data-driven content
- Generate qualified leads via email CTAs
- Showcase concrete results (SoFi, Adobe case studies)

### Next Quarter
- Build email list of 500+ qualified prospects
- Publish 2 authority posts per month
- Generate 10+ enterprise consultations monthly

## Writing New Content

When creating new pages or posts:

1. **Research First**: Use WebSearch for current data/trends
2. **Structure**: Hero → Problem → Solution → Proof → CTA
3. **Headlines**: Specific numbers beat vague promises
4. **Evidence**: Link to sources, show real data
5. **Visuals**: Use tables, charts, comparisons
6. **Length**: Comprehensive but scannable (2000-3000 words for authority posts)
7. **SEO**: Target specific long-tail keywords
8. **Internal Links**: Connect to service pages and related content

## 🎯 Killer Blog Post Principles

Every blog post MUST follow these data storytelling principles:

### 1. Start with Purpose
- **Define the decision/action**: What specific action do you want the reader to take?
- **Single focus**: Every element must serve this goal - delete everything else
- **Clear outcome**: Reader should know exactly what to do after reading

### 2. Know Your Audience Deeply
- **Knowledge level**: Are they beginners, practitioners, or experts?
- **Pain points**: What keeps them up at night?
- **Emotional triggers**: What motivates them? Fear of falling behind? Desire for competitive advantage?
- **Language**: Use their terminology, not yours

### 3. Find the Narrative Thread
- **Data without story is noise**: Don't just present facts - weave them into a compelling narrative
- **Hero's journey**: Position reader as hero, their problem as villain, your solution as the weapon
- **Progression**: Build from problem → discovery → transformation → triumph

### 4. Simplify Ruthlessly
- **One idea per paragraph**: Don't mix concepts
- **Cut 50%, then cut 25% more**: If it doesn't directly support your message, delete it
- **Tufte principle**: "Above all else, show the data" - let numbers speak

### 5. Design for Cognitive Ease
- **Visual hierarchy**: Headlines → Key points → Supporting details
- **White space**: Give ideas room to breathe
- **Consistent patterns**: Same structure for similar content
- **Progressive disclosure**: Start simple, add complexity gradually

### 6. Create Moments of Insight
- **Build toward "aha!" moments**: Set up the problem, then reveal the surprising solution
- **Before/after contrasts**: Show transformation clearly
- **Unexpected connections**: Link seemingly unrelated concepts
- **The reveal**: Save your best insight for maximum impact

### 7. Test and Iterate
- **Get feedback early**: Show drafts to target audience members
- **Track engagement**: Which sections do people skip? Where do they stop reading?
- **A/B test headlines**: Try different angles, measure clicks
- **Refine based on data**: Let metrics guide revisions

### 8. Balance Emotion and Logic
- **Lead with emotion**: Hook them with a feeling
- **Support with logic**: Back it up with hard data
- **Humanize numbers**: "22,000 new customers" not just "509% growth"
- **Stories + statistics**: Personal anecdotes make data memorable

### 9. Make it Actionable
- **Clear next steps**: End with 3-5 specific actions
- **Templates/tools**: Give them something to use immediately
- **Quick wins**: Start with easy victories to build momentum
- **Success metrics**: How will they know it's working?

### 10. Respect the Data
- **Never distort**: Accurate representation > better story
- **Show sources**: Link to primary data
- **Acknowledge limitations**: Be honest about what data doesn't show
- **Update when wrong**: Correct errors prominently

## Blog Post Template Structure

```markdown
# [Number/Outcome] + [Surprising Angle] + [Timestamp]
Example: "GPT-5 Just Crushed Every Coding Benchmark (August 2025 Data)"

## Hook (Opening 2-3 sentences)
- Start with surprising fact or contrarian take
- Make them need to know more
- Reference breaking news or recent event

## The Stakes (Why This Matters Now)
- What happens if they ignore this?
- What opportunity are they missing?
- Why is timing critical?

## The Discovery (Your Unique Insight)
- Present your data/findings
- Use visuals to make complex simple
- Build toward the "aha!" moment

## The Proof (Evidence It Works)
- Real examples with numbers
- Before/after comparisons
- Third-party validation

## The Method (How To Apply This)
- Step-by-step process
- Common mistakes to avoid
- Tools/resources needed

## The Payoff (What Success Looks Like)
- Specific outcomes they'll achieve
- Timeline for results
- Success metrics

## The Call to Action
- One primary action
- Make it easy and specific
- Create urgency without being pushy
```

## Content Quality Checklist

Before publishing any post:

- [ ] **Purpose Clear**: Can you state the reader's next action in one sentence?
- [ ] **Audience Focused**: Is this solving their actual problem (not what you think their problem is)?
- [ ] **Narrative Flow**: Does each section naturally lead to the next?
- [ ] **Simplified**: Can you cut 25% more without losing meaning?
- [ ] **Visual Relief**: Is there visual interest every 150-200 words?
- [ ] **Insight Moment**: Is there at least one "I never thought of it that way" moment?
- [ ] **Tested**: Did at least 2 target readers review it?
- [ ] **Emotional Hook**: Do the first 3 sentences create urgency/curiosity?
- [ ] **Actionable**: Can reader implement something within 24 hours?
- [ ] **Data Integrity**: Are all statistics accurate and sourced?

## Important URLs

- **Production**: https://daveshap.com
- **GitHub Repo**: https://github.com/shaphero/shaphero.github.io
- **Email**: dave@daveshap.com
- **Key Pages**:
  - `/` - Homepage (509% growth hero)
  - `/seo-success` - Main case study
  - `/best-ai-coding` - AI coding analysis (new)
  - `/ai-training` - Service page
  - `/marketing-strategy` - Service page

## Performance Standards

- Page load < 3 seconds
- Mobile-first responsive design
- Accessibility: WCAG 2.1 AA compliant
- SEO: All pages score 95+ on Lighthouse
- No JavaScript required for core content

## Error Handling

If deployment fails:
1. Check GitHub Actions logs
2. Verify `npm run build` works locally
3. Ensure no syntax errors in .astro files
4. Check for missing dependencies
5. Verify CNAME file exists in public/

## Remember

- **Quality > Quantity**: One great post beats ten mediocre ones
- **Results Focus**: Always lead with concrete outcomes
- **Expert Positioning**: We're consultants, not vendors
- **Direct Communication**: Clear, confident, no corporate speak
- **Evidence-Based**: Every claim needs proof