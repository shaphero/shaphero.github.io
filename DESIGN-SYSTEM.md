# Dave Shapiro Design System

## Design Philosophy

**Clean. Professional. Data-Driven.**

This site follows modern minimalist principles with a focus on:
- **Clarity over cleverness** - Information is easy to find and understand
- **Performance** - Fast load times, optimized assets
- **Authenticity** - Professional without being corporate
- **Trust** - Data-driven content, credible sources

## Color Palette

### Primary Colors
```
Blue Primary:   #2563eb (blue-600)  - CTAs, links, primary actions
Blue Dark:      #1e40af (blue-700)  - Hover states
Blue Light:     #dbeafe (blue-50)   - Backgrounds, subtle highlights
```

### Neutral Colors
```
Gray 900:       #111827 - Headings, primary text
Gray 700:       #374151 - Body text
Gray 500:       #6b7280 - Secondary text
Gray 200:       #e5e7eb - Borders, dividers
Gray 50:        #f9fafb - Section backgrounds
White:          #ffffff - Main background
```

### Accent Colors (Use Sparingly)
```
Green:          #10b981 (green-500)  - Success states, positive metrics
Red:            #ef4444 (red-500)    - Warnings, negative metrics
Orange:         #f59e0b (orange-500) - Highlights, important info
Purple:         #8b5cf6 (purple-500) - Special features, premium
```

## Typography

### Font Stack
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
             'Helvetica Neue', Arial, sans-serif;
```

### Hierarchy
```
H1: 3.5rem (56px) - font-black - Only one per page
H2: 2.25rem (36px) - font-bold - Section headers
H3: 1.5rem (24px) - font-semibold - Subsections
H4: 1.25rem (20px) - font-semibold - Minor headers
Body: 1rem (16px) - font-normal - Regular text
Large: 1.125rem (18px) - font-normal - Emphasized body text
Small: 0.875rem (14px) - font-normal - Captions, metadata
```

### Line Height
```
Headings: 1.2 (tight)
Body: 1.6 (relaxed)
```

## Spacing System

Use Tailwind's spacing scale (4px base unit):
```
xs: 0.5rem (8px)   - Tight spacing
sm: 1rem (16px)     - Standard gap
md: 1.5rem (24px)   - Section spacing
lg: 2rem (32px)     - Major sections
xl: 3rem (48px)     - Page sections
2xl: 4rem (64px)    - Hero sections
```

## Components

### Hero Section
```
- Clean, focused headline
- One clear CTA
- NO busy gradients or animations
- Optional: Simple background color or subtle image
- Height: min-h-[60vh] to min-h-[80vh]
```

### Buttons
```
Primary:
- bg-blue-600 hover:bg-blue-700
- text-white font-semibold
- px-6 py-3 rounded-lg
- transition-colors duration-200

Secondary:
- bg-white border-2 border-gray-200
- text-gray-900 font-semibold
- hover:border-blue-600 hover:text-blue-600
```

### Cards
```
- bg-white
- border border-gray-200
- rounded-xl
- p-6
- Optional: subtle shadow on hover
- NO gradients unless absolutely necessary
```

### Sections
```
- py-16 md:py-24 (vertical padding)
- max-w-4xl mx-auto (content width)
- px-6 (horizontal padding for mobile)
```

## Layout Principles

### Content Width
```
Reading width: max-w-4xl (896px) - For article content
Wide width: max-w-6xl (1152px) - For landing pages
Full width: max-w-7xl (1280px) - For hero sections
```

### Grid Systems
```
2 columns: md:grid-cols-2
3 columns: md:grid-cols-3
Gap: gap-6 md:gap-8
```

## Visual Elements

### What to AVOID
❌ Busy animated gradients in backgrounds
❌ Excessive animations
❌ Multiple competing CTAs
❌ Cluttered layouts
❌ Too many colors

### What to USE
✅ Generous white space
✅ Clear visual hierarchy
✅ Subtle hover states
✅ Clean borders and dividers
✅ One accent color per section
✅ Data visualization when appropriate

## Interaction Patterns

### Hover States
```
Links: text-blue-600 hover:text-blue-700 underline
Buttons: Scale or brightness change, NO morphing
Cards: Subtle shadow lift
```

### Transitions
```
All transitions: transition-all duration-200
Keep subtle and fast
```

### Focus States
```
Always visible for accessibility
ring-2 ring-blue-500 ring-offset-2
```

## Content Guidelines

### Headlines
- Clear, benefit-driven
- Use numbers when possible (95%, $300M, 5 steps)
- Avoid jargon in H1

### Body Copy
- Short paragraphs (3-4 lines max)
- Use bullet points for lists
- Bold key phrases sparingly
- One idea per paragraph

### Data Presentation
- Use charts/graphs for complex data
- Highlight key metrics with large numbers
- Always include sources
- Context over raw numbers

## Page Templates

### Article/Long-form
```
1. Hero with title + subtitle
2. TL;DR section (optional)
3. Sections with clear H2 headers
4. CTA at 50% and 100% scroll
5. References/sources at bottom
```

### Landing Page
```
1. Hero with value prop + CTA
2. Social proof (logos, testimonials)
3. 3-column benefits
4. How it works (3-5 steps)
5. Final CTA
```

### Homepage
```
1. Hero: Who you are + what you do
2. Expertise areas (3 cards)
3. Recent work/results
4. Social proof
5. Contact CTA
```

## Accessibility

- Color contrast ratio 4.5:1 minimum
- Focus indicators on all interactive elements
- Semantic HTML (header, nav, main, article, footer)
- Alt text on all images
- ARIA labels where needed

## Performance

- Images: WebP format, lazy load
- CSS: Inline critical CSS
- JS: Minimal, load async
- Fonts: System fonts preferred (faster)
- Target: 95+ Lighthouse score

## Mobile-First

- Design for mobile (375px) first
- Scale up to tablet (768px)
- Then desktop (1024px+)
- Touch targets: minimum 44x44px
- Readable without zooming

## Brand Voice

- **Confident but not arrogant**
- **Data-driven, not opinion-based**
- **Clear, not clever**
- **Professional, not corporate**
- **Results-focused, not feature-focused**

Use this design system as the foundation for all pages. When in doubt, simplify.
