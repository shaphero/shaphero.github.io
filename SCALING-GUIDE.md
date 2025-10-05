# Design System Scaling Guide

## 🎯 Making Your Site Scalable

This guide ensures every page you add maintains design consistency and follows best practices.

## Core Principle

**"Use templates, not custom code. If you're writing the same HTML twice, use a component."**

## 📋 Quick Decision Tree

### Building a New Page?

```
START
  ↓
Is this content EDUCATIONAL? (article, case study, analysis)
  ↓ YES → Use ArticlePageTemplate.astro
  ↓ NO
  ↓
Is this SELLING something? (service, product, conversion)
  ↓ YES → Use LandingPageTemplate.astro
  ↓ NO
  ↓
Is this the HOMEPAGE?
  ↓ YES → Use custom layout with CleanHero + FeatureCards
  ↓ NO
  ↓
Use ArticlePageTemplate.astro (safest default)
```

## 🏗️ Page Templates

### 1. ArticlePageTemplate.astro

**Use for**: Blog posts, case studies, educational content, analysis

**Example**:

```astro
---
import ArticlePageTemplate from '../layouts/ArticlePageTemplate.astro';
import Section from '../components/common/Section.astro';
---

<ArticlePageTemplate
  title="Your SEO Meta Title"
  description="Your SEO meta description"
  badge="📊 Category Badge"
  badgeColor="blue"
  heroTitle={'Your <span class="text-blue-600">Attention-Grabbing</span> Headline'}
  heroSubtitle="Your compelling subtitle that explains value"
  stats={[
    { number: '500%', label: 'ROI Increase', color: 'green' },
    { number: '95%', label: 'Success Rate', color: 'blue' }
  ]}
  byline="<strong>By Dave Shapiro</strong> • 10 min read"
>
  <!-- Your Content Sections -->
  <Section>
    <div class="max-w-4xl mx-auto">
      <h2 class="text-3xl md:text-4xl font-black text-gray-900 mb-6">
        Section Title
      </h2>
      <p class="text-xl text-gray-700 mb-8">
        Your content here...
      </p>
    </div>
  </Section>

  <!-- More sections... -->

  <!-- Optional: Override default CTA -->
  <Section slot="cta" background="white" padding="xl">
    <div class="max-w-4xl mx-auto">
      <CTASection
        variant="gradient"
        title="Custom CTA Title"
        description="Custom description"
        primaryCTA={{ text: 'Custom Button', href: '/custom-link' }}
      />
    </div>
  </Section>
</ArticlePageTemplate>
```

### 2. LandingPageTemplate.astro

**Use for**: Services, products, conversion pages

**Example**:

```astro
---
import LandingPageTemplate from '../layouts/LandingPageTemplate.astro';
import Section from '../components/common/Section.astro';
---

<LandingPageTemplate
  title="SEO Meta Title"
  description="SEO meta description"
  badge="🎯 Service Category"
  heroTitle={'Transform Your <span class="text-blue-600">Business</span>'}
  heroSubtitle="Value proposition in one clear sentence"
  stats={[
    { number: '333%', label: 'Average ROI', color: 'green' },
    { number: '90 Days', label: 'To Results', color: 'blue' }
  ]}
  heroCtas={[
    { text: 'Get Started →', href: '/contact', variant: 'primary' },
    { text: 'Learn More', href: '#features', variant: 'secondary' }
  ]}
  features={[
    {
      icon: '🎯',
      title: 'Benefit 1',
      description: 'Clear explanation of benefit',
      link: { text: 'Learn More', href: '/link' }
    },
    // ... more features
  ]}
  featuresTitle="Why Choose Us"
  featuresSubtitle="Compelling reason to believe"
  ctaTitle="Ready to Start?"
  ctaDescription="Final compelling pitch"
  ctaPrimary={{ text: 'Book a Call', href: 'mailto:dave@daveshap.com' }}
  ctaBenefits={[
    'Benefit 1',
    'Benefit 2',
    'Benefit 3'
  ]}
>
  <!-- Custom content sections go here -->
  <Section>
    <div class="max-w-6xl mx-auto">
      <!-- Your custom content -->
    </div>
  </Section>
</LandingPageTemplate>
```

## 🧩 Design System Components

### Core Components (Use These)

#### 1. CleanHero.astro
**When**: Every page starts with this
**Props**:
- `badge` - Top badge text (optional)
- `badgeColor` - 'blue' | 'purple' | 'green' | 'orange' | 'red'
- `title` - Main headline (can include HTML spans for color)
- `subtitle` - Subheadline
- `stats` - Array of { number, label, color }
- `ctas` - Array of { text, href, variant }
- `byline` - Author/attribution (optional)
- `metadata` - Read time, date, etc. (optional)

#### 2. FeatureCard.astro
**When**: Displaying benefits, services, or features
**Props**:
- `icon` - Emoji or icon (optional)
- `title` - Card title
- `description` - Card description
- `link` - { text, href } (optional)

**Pattern**: Always use in 3-column grids:
```astro
<div class="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
  <FeatureCard ... />
  <FeatureCard ... />
  <FeatureCard ... />
</div>
```

#### 3. CTASection.astro
**When**: Mid-page or end-of-page calls to action
**Props**:
- `title` - CTA headline
- `description` - CTA description
- `primaryCTA` - { text, href }
- `secondaryCTA` - { text, href } (optional)
- `variant` - 'default' | 'gradient'
- `benefits` - Array of benefit strings (optional)

**Pattern**: Place at 50% and 100% of page
```astro
<!-- Mid-page CTA (engagement) -->
<CTASection variant="default" ... />

<!-- End-of-page CTA (conversion) -->
<CTASection variant="gradient" ... />
```

#### 4. ComparisonCards.astro
**When**: Showing "do this vs don't do this"
**Props**:
- `leftTitle`, `leftEmoji`, `leftItems`
- `rightTitle`, `rightEmoji`, `rightItems`
- `insightText` - Key takeaway (optional)

### Common Patterns

#### Section Structure
```astro
<Section background="white" padding="xl">
  <div class="max-w-4xl mx-auto">
    <h2 class="text-3xl md:text-4xl font-black text-gray-900 mb-6">
      Section Title
    </h2>
    <p class="text-xl text-gray-700 mb-8">
      Section intro...
    </p>
    <!-- Section content -->
  </div>
</Section>
```

#### Stats Display
```astro
stats={[
  { number: '$300M+', label: 'Annual Savings', color: 'green' },
  { number: '37%', label: 'Faster Resolution', color: 'blue' },
  { number: '67%', label: 'Success Rate', color: 'purple' }
]}
```

#### CTA Buttons
```astro
ctas={[
  { text: 'Primary Action →', href: '/link', variant: 'primary' },
  { text: 'Secondary Action', href: '/link', variant: 'secondary' }
]}
```

## 🎨 Design Tokens

### Colors (When to Use)
- **Blue (#2563eb)**: Primary actions, links, trust
- **Green**: Success, positive metrics, ROI
- **Red**: Warnings, problems, failures
- **Purple**: Special features, premium
- **Orange**: Alerts, important info
- **Gray**: Text, borders, backgrounds

### Spacing Scale
```css
py-16 md:py-24  /* Between sections (64-96px) */
gap-6           /* Between cards (24px) */
p-6 or p-8      /* Card padding (24-32px) */
mb-6            /* Text block margin (24px) */
```

### Typography
```css
/* H1 - Page title */
text-4xl md:text-6xl font-black

/* H2 - Section header */
text-3xl md:text-4xl font-black

/* H3 - Subsection */
text-2xl font-bold

/* Body large - Hero subtitle */
text-xl md:text-2xl

/* Body - Standard */
text-base

/* Small - Captions */
text-sm
```

## 📦 File Organization

```
src/
├── layouts/
│   ├── PageLayout.astro          # Base layout (DO NOT EDIT)
│   ├── ArticlePageTemplate.astro # Article pages ✅
│   └── LandingPageTemplate.astro # Landing pages ✅
│
├── components/
│   ├── design-system/            # Design system components ✅
│   │   ├── CleanHero.astro
│   │   ├── FeatureCard.astro
│   │   ├── CTASection.astro
│   │   └── ComparisonCards.astro
│   │
│   └── common/                   # Utility components
│       ├── Section.astro
│       └── ...
│
└── pages/                        # Your content pages
    ├── index.astro               # Homepage
    ├── ai-roi-analysis.astro     # Article example
    └── ai-training.astro         # Landing example
```

## ✅ Quality Checklist (Before Publishing)

### Every New Page Must Have:

- [ ] Uses ArticlePageTemplate or LandingPageTemplate
- [ ] CleanHero at top with clear value prop
- [ ] Stats display key metrics (3-5 stats)
- [ ] Content wrapped in max-w-4xl (article) or max-w-6xl (landing)
- [ ] Sections use py-16 md:py-24 spacing
- [ ] Consistent heading hierarchy (H1 → H2 → H3)
- [ ] At least one CTA (mid-page or end)
- [ ] Uses design system components (not custom HTML)
- [ ] Colors follow brand guidelines
- [ ] Mobile tested (375px width)

### Design System Compliance:

- [ ] No custom hero sections (use CleanHero)
- [ ] No custom cards (use FeatureCard or ComparisonCards)
- [ ] No custom CTAs (use CTASection)
- [ ] No inline styles
- [ ] No arbitrary spacing (use design tokens)
- [ ] No gradients except in CTASection variant="gradient"

## 🚀 Adding New Pages (Step-by-Step)

### Step 1: Choose Template
```bash
# Article/Educational → ArticlePageTemplate.astro
# Service/Product → LandingPageTemplate.astro
```

### Step 2: Copy Starter Code
```astro
---
import ArticlePageTemplate from '../layouts/ArticlePageTemplate.astro';
import Section from '../components/common/Section.astro';
import ComparisonCards from '../components/design-system/ComparisonCards.astro';
import CTASection from '../components/design-system/CTASection.astro';
---

<ArticlePageTemplate
  title="Your Title"
  description="Your description"
  heroTitle="Your Headline"
  heroSubtitle="Your subtitle"
  stats={[/* your stats */]}
>
  <!-- Your content here -->
</ArticlePageTemplate>
```

### Step 3: Fill in Content
- Write headline (with colored spans for emphasis)
- Add 3-5 stats that prove value
- Structure content in sections
- Add CTAs at 50% and 100%

### Step 4: Test
```bash
npm run build
npm run preview
```

### Step 5: Visual Check
- Open page in browser
- Compare to ai-roi-analysis.astro (reference)
- Check mobile view (DevTools → 375px)
- Verify all links work

## 🔧 Maintenance

### Updating Design System
**When you need to change styling:**

1. **DO**: Edit the component in `src/components/design-system/`
2. **DON'T**: Edit individual pages

Example: To change button colors globally
```astro
// Edit src/components/design-system/CTASection.astro
// Changes apply to ALL pages automatically
```

### Adding New Components
**When you need a new pattern:**

1. Create in `src/components/design-system/`
2. Follow existing naming conventions
3. Document in COMPONENT-USAGE.md
4. Add to this guide

## 🎯 Success Metrics

Your design system is working when:

✅ New pages take <30 minutes to create
✅ All pages look like the same brand
✅ You're reusing components, not copying HTML
✅ Design changes update across entire site
✅ Mobile views work without extra effort
✅ Page speed stays 95+ on Lighthouse

## 📞 Quick Reference

- **Design rules**: DESIGN-SYSTEM.md
- **Component code**: COMPONENT-USAGE.md
- **Page templates**: DESIGN-CONSISTENCY-GUIDE.md
- **This guide**: SCALING-GUIDE.md

## 🚨 Anti-Patterns (Don't Do This)

❌ Custom hero sections
❌ Inline styles or arbitrary spacing
❌ Copying HTML from other pages
❌ Mixing color systems (use tokens only)
❌ Custom buttons (use CTASection)
❌ Inconsistent section spacing
❌ Building without templates

## ✅ Best Practices (Do This)

✓ Use templates for every page
✓ Import and configure components
✓ Follow spacing scale exactly
✓ Reuse, don't recreate
✓ Mobile-first thinking
✓ Consistent CTA placement
✓ Update components, not pages

---

**Remember**: The goal is to build once, use everywhere. Templates and components ensure every page is professional, consistent, and maintainable as your site scales.
