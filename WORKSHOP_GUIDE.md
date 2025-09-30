# Content Workshop System - User Guide

## 🎯 What This Is

The Content Workshop is a **hybrid AI-human content creation system** that gives you the best of both worlds:

- **AI does the research** → Collects & organizes 15-20 sources automatically
- **You craft the content** → Use the organized data to write authority-level content
- **Result** → Publication-ready content in 60-90 minutes (not 5+ hours of manual research)

## 📊 Workshop Output Quality

Your first run on "enterprise AI ROI 2025" collected:

**✅ 25 High-Quality Statistics:**
- 95% of enterprise AI pilots fail (MIT Report)
- 75% of orgs using AI in at least one function (McKinsey)
- $15.7 trillion global economic impact by 2030
- 96% have AI integrated in core processes
- Only 9% have all data accessible for AI

**✅ 4 Case Studies with Numbers:**
- Microsoft: 20% developer efficiency gain, $300M annual savings
- Google: 37% reduction in support ticket time
- Startups: $0 to $20M revenue in one year
- IgniteTech: Replaced 80% of staff for AI focus

**✅ 11 Key Insight Themes:**
- Data Access Requirements
- Implementation Challenges
- ROI Patterns
- Workforce Transformation
- Governance Models

**✅ 6 Executive Quotes:**
- Leo Brunnick (Cloudera CPO)
- Fortune 500 CTO
- MIT NANDA Report
- McKinsey Survey

## 🚀 How to Use the Workshop

### Step 1: Run Data Collection

```bash
# Collect data (takes 3-5 minutes)
npm run workshop "your topic here" --audience executive --sources 15

# Or use cached data from previous run
# It will prompt you to reuse cache if available
```

The system will:
1. Search 6 query variations across multiple sources
2. Scrape and cache content locally
3. Use Claude to extract statistics, case studies, insights, quotes
4. Cache everything in `.cache/workshop/`

### Step 2: Review the Data

Check what was collected:
```bash
# View organized data
cat .cache/workshop/your-topic-organized.json | jq .
```

Or use the interactive commands (if running in terminal):
- `stats` - See all statistics
- `cases` - Review case studies
- `insights` - View key themes
- `quotes` - See executive quotes

### Step 3: Craft Your Content

Now you have two options:

#### Option A: Use Claude Code Interactively

```bash
claude code

# Then ask:
"Help me write an enterprise AI ROI analysis.
I have 25 statistics, 4 case studies, and 11 insights cached.
Let's start with a compelling hook."
```

Work section-by-section:
1. Draft hook (2-3 sentences with surprising stat)
2. Write "The Stakes" (why this matters NOW)
3. Create "The Discovery" (your unique insight)
4. Build "The Proof" (case studies with metrics)
5. Explain "The Method" (how-to playbook)
6. Describe "The Payoff" (outcomes they'll achieve)
7. Add CTA

#### Option B: Use Workshop's Draft Commands

The workshop has built-in section drafters:
- `draft hook` - Generate compelling opening
- `draft stakes` - Why this matters now
- `draft discovery` - Unique insight section
- `draft proof` - Case study section
- `draft method` - How-to guide
- `draft payoff` - Outcomes section
- `scaffold` - Generate complete outline

### Step 4: Polish & Publish

Once you have your sections:
1. Copy into your preferred editor
2. Add your voice and expertise
3. Check against CLAUDE.md quality checklist
4. Format as Astro page
5. Publish!

## 📝 Content Quality Checklist

Before publishing, verify:

- [ ] **Hook** - Opens with surprising stat or contrarian take
- [ ] **Specific Numbers** - "95%" not "most", "$300M" not "significant"
- [ ] **Company Names** - "Microsoft saved $300M" not "a company reduced costs"
- [ ] **Before/After** - Clear transformation metrics
- [ ] **Exact Timeframes** - "Within 90 days" not "quickly"
- [ ] **Your Voice** - Sounds like you, not generic AI
- [ ] **Actionable** - Reader can do something TODAY
- [ ] **Skimmable** - Headlines tell the story
- [ ] **2,500-4,000 words** - Authority length, not 509 words
- [ ] **CTAs** - Clear next action (email dave@daveshap.com)

## 🎯 Example Workflow (60-90 minutes)

**Minutes 0-5:** Run workshop data collection
```bash
npm run workshop "enterprise AI ROI 2025" --sources 15
```

**Minutes 5-10:** Review collected data
- Scan statistics for surprising numbers
- Identify top 3-5 case studies
- Note key insight themes

**Minutes 10-70:** Draft sections with Claude
```bash
claude code --interactive
```
- Hook: 10 min
- Stakes: 10 min
- Discovery: 15 min
- Proof: 15 min
- Method: 15 min
- Payoff: 5 min

**Minutes 70-90:** Polish & format
- Add your expertise/experience
- Insert CTAs
- Format for Astro
- Final quality check

## 💡 Pro Tips

### Get Better Data
- Use specific queries: "enterprise AI ROI 2025 case studies" beats "AI ROI"
- Increase sources for comprehensive topics: `--sources 20`
- Run multiple times for different angles

### Craft Better Content
- **Start with data, not writing** - Review all stats/cases first
- **Find the "aha!" moment** - What's the surprising insight?
- **Be specific** - "Microsoft saved $300M" beats "companies save money"
- **Show transformation** - Before/after with exact numbers
- **Make it actionable** - Give them something to do TODAY

### Speed Up Future Content
- Cache is your friend - rerun same topic to use cached data
- Build a data library - keep organized.json files
- Template your structure - reuse what works

## 🔧 Troubleshooting

**"Some sources failed to scrape"**
- Normal! Many sites block scrapers
- Workshop continues with successful sources
- 5-8 good sources is enough for great content

**"Claude analysis is slow"**
- Each source takes ~5 seconds to analyze
- 15 sources = ~75 seconds total
- This is normal, grab coffee ☕

**"Interactive mode crashed"**
- Run in foreground, not background
- Or just use the cached data with `claude code`
- Data is saved in `.cache/workshop/`

**"I want to add more sources"**
- Delete cache file: `rm .cache/workshop/your-topic-*`
- Run again with `--sources 20`

## 📂 File Locations

```
.cache/workshop/
  ├── your-topic-sources.json        # Raw scraped content
  └── your-topic-organized.json      # Organized by theme

workshop-output/
  └── your-topic-wip.json            # Your work in progress
```

## 🎓 Next Steps

1. **Try it now** - Run workshop on a topic you need content for
2. **Review the data** - See what Claude extracted
3. **Draft one section** - Start with the hook
4. **Iterate** - Keep refining until it's great
5. **Publish** - Ship it!

Remember: **AI collects, you create.** The workshop gives you research superpowers, but your expertise and voice make it great content.

---

**Need help?** The data is there, now let's turn it into something amazing. Ready to draft your first section?