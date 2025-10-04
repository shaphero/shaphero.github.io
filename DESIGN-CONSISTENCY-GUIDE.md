# Design Consistency Guide for Dave Shapiro Site

## Philosophy: The 3 C's

**Consistent. Clean. Credible.**

Every page should feel like it belongs to the same professional brand, while allowing content to breathe and data to shine.

## Page Template System

### 1. Reusable Layouts (Already in place)

Your site uses `PageLayout.astro` as the base. This is GOOD - it ensures:
- Same header/nav across all pages
- Same footer across all pages
- Consistent meta tags and SEO
- Unified schema markup

**Action**: Always use `<PageLayout>` for every page. Never create standalone HTML.

### 2. Three Core Page Types

Every page should fit into one of these templates:

#### A. **Article/Long-form** (AI ROI Analysis, Best AI Coding)
```
Structure:
1. Hero (Clean white, stats/badges, clear headline)
2. TL;DR or intro box (optional)
3. Content sections with H2 headers
4. Visual breaks (cards, stats, comparisons)
5. CTA midway through
6. References/sources at bottom
7. Final CTA

Key Components:
- Section component for spacing
- Prose wrapper for body text
- Stat cards for data
- Comparison cards (red vs green)
```

#### B. **Landing Page** (Services, AI Training)
```
Structure:
1. Hero (Value prop + primary CTA)
2. Social proof (3-4 logos or testimonials)
3. Benefits (3-column grid)
4. How it works (numbered steps)
5. Pricing or packages
6. FAQ (optional)
7. Final CTA

Key Components:
- Hero with CTA
- 3-column grid for benefits
- Step-by-step process cards
- Testimonial cards
```

#### C. **Homepage** (index.astro)
```
Structure:
1. Hero (Who you are + what you do)
2. Expertise areas (3 cards)
3. Recent results/work
4. Client logos
5. Services overview
6. Contact CTA

Key Components:
- Split hero (text + image)
- 3-column expertise cards
- Results showcase
- Logo grid
```

## Component Library (What to Create)

### Priority 1: Core Components (Create These Now)

#### 1. **CleanHero.astro** - Standardized Hero Section
```astro
---
interface Props {
  badge?: string;
  badgeColor?: 'blue' | 'purple' | 'green';
  title: string;
  subtitle: string;
  stats?: Array<{number: string, label: string, color?: string}>;
  cta?: {text: string, href: string};
}
---

<section class="bg-white border-b border-gray-200">
  <div class="container mx-auto px-6 py-16 md:py-24">
    <div class="max-w-4xl mx-auto">
      {badge && <Badge text={badge} color={badgeColor} />}
      <h1 class="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 mb-6">
        {title}
      </h1>
      <p class="text-xl md:text-2xl text-gray-700 mb-8">{subtitle}</p>
      {stats && <Stats items={stats} />}
      {cta && <PrimaryButton {...cta} />}
    </div>
  </div>
</section>
```

**Why**: Every page starts with a hero. One component = consistent look everywhere.

#### 2. **StatCard.astro** - Display Key Metrics
```astro
---
interface Props {
  number: string;
  label: string;
  color?: 'blue' | 'green' | 'red' | 'purple';
}

const colorClasses = {
  blue: 'text-blue-600',
  green: 'text-green-600',
  red: 'text-red-600',
  purple: 'text-purple-600'
};
---

<div class="flex items-center gap-2">
  <div class={`text-3xl font-black ${colorClasses[color || 'blue']}`}>
    {number}
  </div>
  <div class="text-sm text-gray-600">{label}</div>
</div>
```

**Why**: Stats appear on many pages. Standardize the format.

#### 3. **ComparisonCards.astro** - Side-by-side Comparison
```astro
---
interface Props {
  leftTitle: string;
  leftItems: string[];
  rightTitle: string;
  rightItems: string[];
}
---

<div class="grid lg:grid-cols-2 gap-8">
  <!-- Failure/Bad Card -->
  <div class="p-6 bg-red-50 rounded-2xl border-2 border-red-200">
    <h3 class="text-2xl font-bold text-red-900 mb-6 flex items-center gap-2">
      <span class="text-3xl">❌</span> {leftTitle}
    </h3>
    <div class="space-y-4">
      {leftItems.map(item => (
        <div class="flex items-start gap-3">
          <span class="text-2xl mt-1">🏗️</span>
          <p class="text-gray-700">{item}</p>
        </div>
      ))}
    </div>
  </div>

  <!-- Success/Good Card -->
  <div class="p-6 bg-green-50 rounded-2xl border-2 border-green-200">
    <h3 class="text-2xl font-bold text-green-900 mb-6 flex items-center gap-2">
      <span class="text-3xl">✅</span> {rightTitle}
    </h3>
    <div class="space-y-4">
      {rightItems.map(item => (
        <div class="flex items-start gap-3">
          <span class="text-2xl mt-1">🤝</span>
          <p class="text-gray-700">{item}</p>
        </div>
      ))}
    </div>
  </div>
</div>
```

**Why**: You use this pattern for "What works vs what doesn't" - make it reusable.

#### 4. **CTASection.astro** - Call to Action
```astro
---
interface Props {
  title: string;
  description: string;
  primaryCTA: {text: string, href: string};
  secondaryCTA?: {text: string, href: string};
  variant?: 'default' | 'gradient';
}
---

<div class={variant === 'gradient'
  ? "p-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-2xl"
  : "p-8 bg-white border-2 border-gray-200 rounded-2xl"}>
  <h2 class={variant === 'gradient' ? "text-white" : "text-gray-900"}>{title}</h2>
  <p class={variant === 'gradient' ? "text-white/90" : "text-gray-700"}>{description}</p>
  <!-- CTAs -->
</div>
```

**Why**: CTAs appear multiple times per page and across pages. Standardize them.

### Priority 2: Supporting Components

#### 5. **Badge.astro** - Small Labels/Tags
```astro
<span class="inline-flex items-center gap-2 px-4 py-2 rounded-full
  bg-blue-50 border border-blue-200 text-blue-700 font-semibold text-sm">
  {text}
</span>
```

#### 6. **FeatureCard.astro** - 3-Column Benefits
```astro
<div class="p-6 bg-white border border-gray-200 rounded-xl hover:border-blue-600 transition-colors">
  <div class="text-4xl mb-4">{icon}</div>
  <h3 class="text-xl font-bold text-gray-900 mb-2">{title}</h3>
  <p class="text-gray-600">{description}</p>
</div>
```

#### 7. **TestimonialCard.astro** - Social Proof
```astro
<div class="p-6 bg-gray-50 border border-gray-200 rounded-xl">
  <p class="text-gray-700 mb-4">"{quote}"</p>
  <div class="flex items-center gap-3">
    <img class="w-12 h-12 rounded-full" src={avatar} alt={name} />
    <div>
      <p class="font-semibold text-gray-900">{name}</p>
      <p class="text-sm text-gray-600">{title}</p>
    </div>
  </div>
</div>
```

## Design Tokens (Use These Everywhere)

### Spacing Scale
```
Component gaps: gap-6 (24px)
Section padding: py-16 md:py-24
Content width: max-w-4xl (articles) or max-w-6xl (landing)
Card padding: p-6 or p-8
```

### Color System
```
Primary Action: bg-blue-600 hover:bg-blue-700
Success/Positive: text-green-600
Warning/Negative: text-red-600
Accent/Special: text-purple-600

Backgrounds:
- Page: bg-gray-50 (slight off-white)
- Cards: bg-white with border-gray-200
- Sections: bg-white
```

### Typography
```
H1: text-4xl md:text-5xl lg:text-6xl font-black
H2: text-3xl md:text-4xl font-black (section headers)
H3: text-2xl font-bold (subsections)
Body Large: text-xl md:text-2xl (hero subtitle)
Body: text-base (16px)
Small: text-sm
```

### Buttons
```
Primary:
<a class="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white
   rounded-lg font-semibold text-lg transition-colors">

Secondary:
<a class="px-8 py-4 bg-white border-2 border-gray-200
   hover:border-blue-600 hover:text-blue-600 text-gray-900
   rounded-lg font-semibold text-lg transition-all">
```

## Page-by-Page Consistency Checklist

### Every Page Must Have:

✅ **Same Header/Nav** (via PageLayout)
✅ **Clean Hero Section** (white bg, no gradients)
✅ **Consistent spacing** (py-16 md:py-24 for sections)
✅ **Same button styles** (blue primary, white secondary)
✅ **Same card styling** (white bg, gray-200 border, rounded-xl)
✅ **Same footer** (via PageLayout)

### Visual Consistency Rules:

1. **One accent color per section**
   - Don't mix blue, purple, green in same section
   - Use blue for primary actions everywhere
   - Use red/green only for comparisons

2. **Consistent spacing rhythm**
   - Sections: 64-96px apart (py-16 md:py-24)
   - Cards: 24px gap (gap-6)
   - Text blocks: 24px bottom margin (mb-6)

3. **Same card patterns**
   - All cards: white bg, gray border, rounded corners
   - Hover state: border-blue-600
   - No shadows unless CTA cards

4. **Consistent data presentation**
   - Large numbers: text-3xl font-black
   - Stats: number + label format
   - Always show sources for data

## Implementation Strategy

### Phase 1: Create Component Library (1-2 hours)
```bash
src/components/design-system/
├── CleanHero.astro
├── StatCard.astro
├── ComparisonCards.astro
├── CTASection.astro
├── Badge.astro
├── FeatureCard.astro
└── TestimonialCard.astro
```

### Phase 2: Refactor Existing Pages (2-3 hours)
1. AI ROI Analysis - Replace custom sections with components
2. Homepage - Use CleanHero and FeatureCard
3. Best AI Coding - Use ComparisonCards
4. Service pages - Use consistent CTASection

### Phase 3: Documentation (30 min)
Create `COMPONENT-USAGE.md` with examples of how to use each component

### Phase 4: New Page Template (30 min)
Create starter templates:
- `src/templates/article-template.astro`
- `src/templates/landing-template.astro`
- `src/templates/service-template.astro`

## Quick Reference: Design Decisions

### When to use each color:
- **Blue**: Primary actions, links, main CTAs
- **Green**: Success metrics, positive outcomes
- **Red**: Warnings, failure statistics, problems
- **Purple**: Special features, premium offerings
- **Gray**: Body text, borders, backgrounds

### When to use each component:
- **CleanHero**: Every page starts with this
- **StatCard**: Show 3-5 key metrics
- **ComparisonCards**: Show "do this vs don't do this"
- **FeatureCard**: List benefits or services (3 columns)
- **CTASection**: End of page, midway through articles
- **Badge**: Small labels, category tags, status

### Spacing Guidelines:
- **Tight** (gap-4): Related items in a list
- **Normal** (gap-6): Cards in a grid
- **Loose** (gap-8): Unrelated sections
- **Section breaks** (py-16 md:py-24): Between major sections

## Testing Consistency

### Visual Checklist:
1. Open 3 random pages side-by-side
2. Check: Do heroes look the same?
3. Check: Are buttons the same style?
4. Check: Are cards the same format?
5. Check: Is spacing rhythm consistent?

### Code Checklist:
1. Search codebase for duplicate class combinations
2. If you see same pattern 3+ times, make it a component
3. Use design tokens (tailwind classes) consistently
4. No hardcoded colors - use semantic names

## Maintenance

### Adding New Pages:
1. Choose page type (Article, Landing, or Homepage)
2. Copy corresponding template
3. Use existing components
4. Follow spacing/color rules
5. Test against checklist

### Updating Design:
1. Update component files in `src/components/design-system/`
2. Changes propagate to all pages automatically
3. Update DESIGN-SYSTEM.md with new patterns
4. Document in COMPONENT-USAGE.md

## Key Principle

**"If you're writing the same HTML/classes twice, it should be a component."**

Build once, use everywhere. This is how you maintain consistency as the site grows.
