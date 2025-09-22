# CLAUDE.md

> **AI Assistant Context File** - Automatically loaded by Claude Code, Cursor, and other AI coding assistants
> Last Updated: December 2025

This file provides guidance to AI assistants (Claude Code, Cursor, Windsurf, etc.) when working with code in this repository. It follows the 2025 standard for AI context files.

## Project Overview

**Name**: Dave Shapiro SEO & AI Consulting Website  
**URL**: https://daveshap.com  
**Tech Stack**: Astro (Static Site Generator) + Tailwind CSS  
**Purpose**: Lead generation for SEO/AI consulting services  
**Target Audience**: Enterprise & mid-market companies + Internal AI champions

## Key Business Context

### Success Metrics
- 500% growth for Fortune 500s (generalized from specific cases)
- Former CMO, SVP at Neil Patel Digital
- 16+ years working with Fortune 500 companies
- Helping internal champions get AI adopted at their companies

### Current Focus
1. **SEO Consulting**: Data-driven strategies for measurable revenue growth
2. **AI Implementation**: Helping companies and internal champions adopt AI tools
3. **Content Authority**: Publishing audience-first content that solves real problems
4. **Champion Support**: Giving internal innovators the playbook to drive change

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
- **Headlines**: Start with reader's pain or desired outcome
- **Copy**: Mirror their language, address their objections
- **CTAs**: Email-based (dave@daveshap.com) with clear subject lines
- **Tone**: Guide/ally, not guru. Help them be the hero.

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
1. **Audience pain upfront** - Start with their frustration
2. **Practical solutions** - Scripts, templates, playbooks
3. **Social proof** - Who else is doing this successfully
4. **Objection handling** - Address fears and blockers
5. **Clear next action** - One specific thing to do now

### Homepage Requirements
- Hero: Lead with transformation (500% growth for Fortune 500s)
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

## 📢 Audience-First Content Principles

Before anything else, understand WHO you're writing for and WHAT they need:

### 1. Start with Their Pain, Not Your Solution
- **Their morning frustration**: What made them search for this?
- **Their failed attempts**: What have they already tried that didn't work?
- **Their emotional state**: Frustrated? Desperate? Skeptical? Excited?
- **Write the headline they'd click**: Not what you want to say

### 2. Mirror Their Language
- **Use their words**: Pull exact phrases from forums, reviews, support tickets
- **Match their sophistication**: Don't talk down or over their heads
- **Reflect their identity**: "People like us do things like this"
- **Avoid your jargon**: Use their terminology, not yours

### 3. Address the Unspoken Objections
- **The excuse they'll use**: "We don't have time/budget/expertise"
- **The fear they won't admit**: "What if I look stupid/fail/get fired"
- **The political reality**: "My boss will never approve this"
- **The hidden agenda**: What are they REALLY trying to achieve?

### 4. Make Them the Hero
- **They get the credit**: Position them as the innovative leader
- **You're the guide**: Gandalf to their Frodo
- **Success is theirs**: "You'll achieve..." not "I achieved..."
- **Failure protection**: Give them cover if things go wrong

### 5. Solve for Their Context
- **Their constraints**: Time, money, politics, technical debt
- **Their environment**: Startup chaos? Enterprise bureaucracy?
- **Their timeline**: Do they need results today or next quarter?
- **Their success metrics**: What numbers matter to THEM?

### 6. Give Them Ammunition
- **Scripts to convince bosses**: Exact words to use
- **Data to justify decisions**: ROI calculations, case studies
- **Responses to pushback**: "When they say X, you say Y"
- **Political cover**: "Amazon/Google/Microsoft does this"

### 7. Make it Skimmable AND Deep
- **30-second version**: They can get value from just headlines
- **5-minute version**: Key sections give complete picture
- **30-minute version**: Full depth for those who need it
- **Multiple entry points**: Different readers, different needs

### 8. Remove Friction to Action
- **Tiny first step**: Make it so easy they'd feel silly NOT doing it
- **Clear sequence**: Step 1, then 2, then 3 (not 15 options)
- **Templates included**: Copy-paste solutions
- **Success guaranteed**: Or at least failure made safe

### 9. Build Trust Through Specificity
- **Exact numbers**: "26% faster" not "much faster"
- **Real names**: "John from Spotify" not "a client"
- **Precise timeframes**: "Tuesday at 2pm" not "later"
- **Actual screenshots**: Show, don't just tell

### 10. Create Urgency Without Manipulation
- **Cost of inaction**: What happens if they don't act?
- **Competitive pressure**: Who's already doing this?
- **Window closing**: Why now matters
- **But stay honest**: No fake scarcity or false deadlines

## 🎯 Data Storytelling Principles

When presenting data and building narrative:

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
  - `/` - Homepage (500% growth for Fortune 500s)
  - `/seo-success` - Main case study
  - `/best-ai-coding` - AI adoption champion's playbook
  - `/ai-training` - Service page
  - `/marketing-strategy` - Service page

## AI Assistant Workflow (2025 Best Practices)

### Recommended Approach

1. **Research First**: Before implementing, search and understand existing patterns
2. **Plan Changes**: Outline the approach before coding
3. **Test Incrementally**: Build and test frequently
4. **Preserve Performance**: Always maintain 100/100 PageSpeed scores

### Working with This Codebase

When asked to make changes:
1. Read relevant existing files first
2. Follow established patterns
3. Test with `npm run build`
4. Verify no performance regression

### Common Tasks

#### Adding a New Page
```bash
# Create page file
src/pages/new-page.astro

# Follow existing page structure
# Include SEO meta tags
# Test internal links
```

#### Modifying Components
```bash
# Components are in src/components/
# Follow PascalCase naming
# Use Tailwind utilities
# Keep JavaScript minimal
```

#### Content Updates
- Use data from Reddit/user research
- Start with pain points
- Include evidence and examples
- Add internal links

### Flags and Modes

For Claude Code specifically:
- Use `--verbose` for debugging
- Consider `--enable-architect` for large refactors
- `--dangerously-skip-permissions` to avoid interruptions (use cautiously)

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