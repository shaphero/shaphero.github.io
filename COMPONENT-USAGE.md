# Design System Component Usage Guide

## Quick Start

All design system components are in `src/components/design-system/`. Import and use them to maintain consistency across the site.

## Components

### 1. CleanHero

**Purpose**: Standardized hero section for all pages

**When to use**: Top of every page

**Example**:
```astro
---
import CleanHero from '../components/design-system/CleanHero.astro';
---

<CleanHero
  badge="📊 Based on MIT Research"
  badgeColor="blue"
  title='<span class="text-red-600">95%</span> of AI Projects Fail—Here\'s What the <span class="text-blue-600">5%</span> Do'
  subtitle="MIT study reveals the playbook that turns skeptical executives into believers. Microsoft saved $300M. Google cut resolution time 37%."
  stats={[
    { number: '$300M+', label: 'Annual Savings', color: 'green' },
    { number: '37%', label: 'Faster Resolution', color: 'blue' },
    { number: '67%', label: 'Success Rate', color: 'purple' }
  ]}
  ctas={[
    { text: 'Get the Playbook →', href: '#playbook', variant: 'primary' },
    { text: 'Learn More', href: '#about', variant: 'secondary' }
  ]}
  byline="<strong class='text-gray-900'>By Dave Shapiro</strong> • Former SVP at Neil Patel Digital"
  metadata="12-minute read • Last updated: October 2025"
/>
```

**Props**:
- `badge` (optional): Text for top badge
- `badgeColor` (optional): 'blue' | 'purple' | 'green' | 'orange' | 'red'
- `title` (required): Main headline (can include HTML)
- `subtitle` (required): Subheadline text
- `stats` (optional): Array of `{ number, label, color? }`
- `ctas` (optional): Array of `{ text, href, variant? }`
- `byline` (optional): Author/attribution text
- `metadata` (optional): Read time, date, etc.

---

### 2. ComparisonCards

**Purpose**: Side-by-side comparison of what works vs what doesn't

**When to use**: Showing do's and don'ts, winners vs losers, before vs after

**Example**:
```astro
---
import ComparisonCards from '../components/design-system/ComparisonCards.astro';
---

<ComparisonCards
  leftTitle="What the 95% Do"
  leftEmoji="❌"
  leftItems={[
    {
      icon: '🏗️',
      title: 'They build everything internally',
      description: '33% success rate. Companies focus on technical capabilities while ignoring organizational readiness.'
    },
    {
      icon: '🔬',
      title: 'They create central AI labs',
      description: 'Build tools that sit unused because people who do the work weren\'t involved.'
    },
    {
      icon: '✨',
      title: 'They focus on sexy use cases',
      description: '50%+ of budgets go to sales/marketing tools with the lowest ROI.'
    }
  ]}
  rightTitle="What the 5% Do"
  rightEmoji="✅"
  rightItems={[
    {
      icon: '🤝',
      title: 'They partner with vendors',
      description: '67% success rate. Buy infrastructure, focus on implementation.'
    },
    {
      icon: '👥',
      title: 'They empower line managers',
      description: 'Give AI to people who own business outcomes.'
    },
    {
      icon: '⚙️',
      title: 'They target back-office first',
      description: 'Cut operational costs 35% through process automation.'
    }
  ]}
  insightText="The divide isn't about technology—it's about approach. The 95% treat AI like an IT project. The 5% treat it like a business transformation."
/>
```

**Props**:
- `leftTitle` (required): Title for left card
- `leftEmoji` (optional): Emoji for left title (default: ❌)
- `leftItems` (required): Array of `{ icon?, title, description }`
- `rightTitle` (required): Title for right card
- `rightEmoji` (optional): Emoji for right title (default: ✅)
- `rightItems` (required): Array of `{ icon?, title, description }`
- `insightText` (optional): Key insight shown below cards

---

### 3. FeatureCard

**Purpose**: Display a single benefit, service, or feature

**When to use**: In 3-column grids for benefits, services, expertise areas

**Example**:
```astro
---
import FeatureCard from '../components/design-system/FeatureCard.astro';
---

<div class="grid md:grid-cols-3 gap-6">
  <FeatureCard
    icon="🤖"
    title="AI Implementation Expert"
    description="While 95% of Fortune 500 AI pilots fail to deliver ROI, I help teams beat the odds. Real workflows that deliver 333% ROI and save 20+ hours per week."
    link={{ text: 'Learn More', href: '/ai-training' }}
  />

  <FeatureCard
    icon="📈"
    title="Growth Marketing Expert"
    description="509% traffic growth at SoFi. 494% at Adobe. I build SEO engines that capture the 99.75% still on Google—plus prepare for AI search."
    link={{ text: 'View Results', href: '/seo' }}
  />

  <FeatureCard
    icon="🎯"
    title="Strategic Leadership"
    description="Former CMO in sports betting tech. SVP at Neil Patel Digital. I've navigated 3 Google algorithm shifts and the AI revolution."
  />
</div>
```

**Props**:
- `icon` (optional): Emoji or icon
- `title` (required): Card title
- `description` (required): Card description
- `link` (optional): `{ text, href }` for optional link

---

### 4. CTASection

**Purpose**: Call-to-action blocks throughout the page

**When to use**: Mid-page CTAs, end of page CTAs, service offers

**Example (Default style)**:
```astro
---
import CTASection from '../components/design-system/CTASection.astro';
---

<CTASection
  title="Ready to Join the 5%?"
  description="I've helped internal champions at Fortune 500 companies navigate the politics, build the business case, and get AI initiatives approved."
  primaryCTA={{ text: 'Book Free Strategy Session', href: 'mailto:dave@daveshap.com' }}
  secondaryCTA={{ text: 'View Case Studies', href: '/case-studies' }}
  benefits={[
    'Identify your best first use case',
    'Review your vendor short-list',
    'Build your executive pitch',
    'Plan your 90-day pilot'
  ]}
/>
```

**Example (Gradient style)**:
```astro
<CTASection
  variant="gradient"
  title="Work With Me"
  description="Get the playbook internal champions use to beat the 95% failure rate."
  primaryCTA={{ text: 'Let\'s Talk Growth →', href: 'mailto:dave@daveshap.com' }}
  benefits={[
    'A clear go/no-go decision on AI',
    'Vendor recommendations for your use case',
    'A one-page proposal for your sponsor'
  ]}
/>
```

**Props**:
- `title` (required): CTA headline
- `description` (required): CTA description
- `primaryCTA` (required): `{ text, href }`
- `secondaryCTA` (optional): `{ text, href }`
- `variant` (optional): 'default' | 'gradient'
- `benefits` (optional): Array of benefit strings

---

## Page Templates

### Article/Long-form Page

```astro
---
import PageLayout from '../layouts/PageLayout.astro';
import CleanHero from '../components/design-system/CleanHero.astro';
import Section from '../components/common/Section.astro';
import ComparisonCards from '../components/design-system/ComparisonCards.astro';
import CTASection from '../components/design-system/CTASection.astro';
---

<PageLayout title="Your Title" description="Your description">
  <!-- Hero -->
  <CleanHero
    badge="📊 Badge Text"
    title="Your Headline"
    subtitle="Your subtitle"
    stats={[/* ... */]}
  />

  <!-- Intro Section -->
  <Section>
    <div class="max-w-4xl mx-auto">
      <p class="text-xl text-gray-700 mb-6">Intro text...</p>
    </div>
  </Section>

  <!-- Main Content Sections -->
  <Section>
    <div class="max-w-4xl mx-auto">
      <h2 class="text-3xl md:text-4xl font-black text-gray-900 mb-6">Section Title</h2>
      <p class="text-xl text-gray-700 mb-8">Section intro...</p>

      <ComparisonCards
        leftTitle="Don't Do This"
        leftItems={[/* ... */]}
        rightTitle="Do This Instead"
        rightItems={[/* ... */]}
      />
    </div>
  </Section>

  <!-- Mid-page CTA -->
  <Section>
    <div class="max-w-4xl mx-auto">
      <CTASection
        title="Ready to Get Started?"
        description="Here's what happens next..."
        primaryCTA={{/* ... */}}
      />
    </div>
  </Section>

  <!-- More content sections... -->

  <!-- Final CTA -->
  <Section>
    <div class="max-w-4xl mx-auto">
      <CTASection
        variant="gradient"
        title="Work With Me"
        description="Final pitch..."
        primaryCTA={{/* ... */}}
      />
    </div>
  </Section>
</PageLayout>
```

### Landing Page

```astro
---
import PageLayout from '../layouts/PageLayout.astro';
import CleanHero from '../components/design-system/CleanHero.astro';
import FeatureCard from '../components/design-system/FeatureCard.astro';
import Section from '../components/common/Section.astro';
import CTASection from '../components/design-system/CTASection.astro';
---

<PageLayout title="Service Name" description="Service description">
  <!-- Hero with CTA -->
  <CleanHero
    badge="🎯 Service Category"
    title="Service Headline"
    subtitle="Value proposition"
    ctas={[
      { text: 'Get Started →', href: '/contact' }
    ]}
  />

  <!-- Benefits (3 columns) -->
  <Section>
    <div class="max-w-6xl mx-auto">
      <h2 class="text-3xl md:text-4xl font-black text-gray-900 mb-12 text-center">
        Why Choose This Service
      </h2>
      <div class="grid md:grid-cols-3 gap-6">
        <FeatureCard icon="✓" title="Benefit 1" description="..." />
        <FeatureCard icon="✓" title="Benefit 2" description="..." />
        <FeatureCard icon="✓" title="Benefit 3" description="..." />
      </div>
    </div>
  </Section>

  <!-- How It Works -->
  <Section>
    <div class="max-w-4xl mx-auto">
      <h2 class="text-3xl md:text-4xl font-black text-gray-900 mb-12 text-center">
        How It Works
      </h2>
      <!-- Step by step process... -->
    </div>
  </Section>

  <!-- Final CTA -->
  <Section>
    <div class="max-w-4xl mx-auto">
      <CTASection
        variant="gradient"
        title="Ready to Start?"
        description="Get in touch today"
        primaryCTA={{ text: 'Book a Call', href: 'mailto:dave@daveshap.com' }}
      />
    </div>
  </Section>
</PageLayout>
```

## Design Tokens Reference

### Common Class Combinations

**Section Container**:
```html
<div class="max-w-4xl mx-auto">
  <!-- Content -->
</div>
```

**Card Grid (3 columns)**:
```html
<div class="grid md:grid-cols-3 gap-6">
  <!-- Cards -->
</div>
```

**Card Grid (2 columns)**:
```html
<div class="grid lg:grid-cols-2 gap-8">
  <!-- Cards -->
</div>
```

**Section Header**:
```html
<h2 class="text-3xl md:text-4xl font-black text-gray-900 mb-6">Title</h2>
```

**Section Intro Text**:
```html
<p class="text-xl text-gray-700 mb-8">Intro paragraph...</p>
```

**Primary Button**:
```html
<a href="#" class="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-lg transition-colors">
  Button Text
</a>
```

**Secondary Button**:
```html
<a href="#" class="px-8 py-4 bg-white border-2 border-gray-200 hover:border-blue-600 hover:text-blue-600 text-gray-900 rounded-lg font-semibold text-lg transition-all">
  Button Text
</a>
```

## Tips

1. **Always use max-w-4xl for article content** - Optimal reading width
2. **Use max-w-6xl for landing pages** - Wider for feature grids
3. **Consistent spacing: py-16 md:py-24** - Between all major sections
4. **Card grids: gap-6 for 3 columns, gap-8 for 2 columns**
5. **One accent color per section** - Don't mix blue/purple/green in same section
6. **Stats always use large numbers** - text-3xl font-black
7. **CTAs at 50% and 100%** - Mid-page engagement and final conversion

## Quick Checklist

Before publishing a new page:

✅ Uses CleanHero at top
✅ Sections wrapped in `<Section>` component
✅ Content in max-w-4xl or max-w-6xl container
✅ Consistent heading hierarchy (H1 → H2 → H3)
✅ At least one CTA (mid-page or end)
✅ Uses design system components (not custom HTML)
✅ Follows color guidelines
✅ Proper spacing (py-16 md:py-24 between sections)
✅ Mobile-responsive (tested at 375px)
