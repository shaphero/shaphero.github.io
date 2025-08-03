# Scalable Component System Guide

This guide explains how to use the reusable component system to quickly build new pages without redefining common elements.

## Quick Start

For any new page, use the `PageLayout` wrapper which automatically includes:
- Header (can be disabled)
- Main content area with proper spacing
- CTA section (can be disabled)

```astro
---
import PageLayout from '../layouts/PageLayout.astro';
---

<PageLayout 
  title="Page Title"
  description="Page description for SEO"
  showHeader={true}    // optional, defaults to true
  showCTA={true}       // optional, defaults to true
  headerOffset={true}  // optional, adds top padding for fixed header
>
  <!-- Your page content here -->
</PageLayout>
```

## Core Components

### 1. Hero Section (`Hero.astro`)
Full-width hero with customizable background, CTAs, and animations.

```astro
<Hero 
  title="Your <span class='text-accent'>Main</span> Headline"
  subtitle="Supporting text that explains your value proposition"
  badge="Optional badge text"
  ctaPrimary={{
    text: "Primary Action",
    subject: "Email subject for mailto"
  }}
  ctaSecondary={{
    text: "Secondary Action", 
    href: "#section-id"
  }}
  features={["Feature 1", "Feature 2", "Feature 3"]}
  background="gradient" // or "white" or "cream"
/>
```

### 2. Section Wrapper (`Section.astro`)
Consistent spacing and styling for page sections.

```astro
<Section 
  id="section-id"
  background="white"     // "white", "cream", "gradient", "transparent"
  padding="xl"           // "sm", "md", "lg", "xl"
  maxWidth="6xl"         // "sm" to "7xl"
  center={true}          // centers content
>
  <!-- Section content -->
</Section>
```

### 3. Content Grid (`ContentGrid.astro`)
Flexible grid for displaying cards, problems, testimonials, etc.

```astro
<ContentGrid 
  items={[
    {
      icon: "🎯",
      title: "Card Title",
      description: "Card description",
      stat: "Optional stat",
      statLabel: "Stat label"
    }
  ]}
  columns={3}                    // 2, 3, or 4
  cardStyle="glass"              // "default", "glass", "problems", "testimonials"
  animate={true}
/>
```

### 4. About Section (`AboutSection.astro`)
Professional bio/about section with image, stats, and highlights.

```astro
<AboutSection 
  name="Person Name"
  title="Professional Title"
  bio="Bio paragraph describing experience and expertise"
  image="/path/to/image.jpg"
  stats={[
    { number: "500+", label: "Clients Helped" },
    { number: "99%", label: "Success Rate" }
  ]}
  highlights={[
    "Achievement 1",
    "Achievement 2"
  ]}
  layout="side-by-side"          // "side-by-side", "centered", "image-left"
  background="white"
/>
```

### 5. Testimonials (`Testimonials.astro`)
Customer testimonials with ratings and company info.

```astro
<Testimonials 
  title="What Clients Say"
  subtitle="Real results from real businesses"
  testimonials={[
    {
      name: "Client Name",
      role: "Job Title", 
      company: "Company Name",
      content: "Testimonial text",
      rating: 5,
      image: "/path/to/headshot.jpg"
    }
  ]}
  columns={3}
  style="cards"                  // "default", "cards", "minimal"
/>
```

### 6. Call to Action (`CallToAction.astro`)
Configurable CTA section with benefits and multiple styles.

```astro
<CallToAction 
  title="CTA Title"
  subtitle="CTA <span class='text-accent'>Subtitle</span>"
  benefits={[
    "Benefit 1 explanation",
    "Benefit 2 explanation", 
    "Benefit 3 explanation"
  ]}
  buttonText="Get Started"
  buttonSubject="Email subject"
  buttonHref="optional-custom-href"
  features={["Feature 1", "Feature 2"]}
  style="gradient"               // "default", "gradient", "minimal"
/>
```

## Page Templates

### Basic Service Page
```astro
<PageLayout title="Service Name" description="Service description">
  <Hero 
    title="Service <span class='text-accent'>Name</span>"
    subtitle="What this service does for clients"
    ctaPrimary={{ text: "Get Started", subject: "Interested in [service]" }}
    background="gradient"
  />
  
  <Section background="white" padding="xl">
    <ContentGrid items={serviceFeatures} columns={3} cardStyle="glass" />
  </Section>
  
  <Section background="cream" padding="xl">
    <Testimonials testimonials={serviceTestimonials} />
  </Section>
</PageLayout>
```

### About Page
```astro
<PageLayout title="About" description="About description">
  <Hero 
    title="About <span class='text-accent'>Me</span>"
    subtitle="Professional background and expertise"
    background="gradient"
  />
  
  <Section background="white" padding="xl">
    <AboutSection 
      name="Your Name"
      title="Your Title"
      bio="Your bio"
      stats={yourStats}
      highlights={yourHighlights}
    />
  </Section>
</PageLayout>
```

### Landing Page
```astro
<PageLayout title="Landing Page" description="Landing description" showCTA={false}>
  <Hero {...heroData} />
  <Section><ContentGrid {...servicesData} /></Section>
  <Section><AboutSection {...aboutData} /></Section>
  <Section><Testimonials {...testimonialsData} /></Section>
  <CallToAction {...ctaData} />
</PageLayout>
```

## Best Practices

1. **Data Separation**: Keep content data in variables at the top of your page for easy editing
2. **Consistent Styling**: Use the provided components instead of custom styling
3. **Section Backgrounds**: Alternate between "white" and "cream" for visual hierarchy
4. **CTA Placement**: Use the automatic CTA from PageLayout OR a custom CallToAction, not both
5. **Responsive Design**: All components are mobile-first and responsive by default

## Customization

All components accept standard HTML attributes and can be styled with Tailwind classes:

```astro
<Section class="custom-class" id="custom-id">
  <Hero class="additional-styling" />
</Section>
```

## Adding New Components

When creating new reusable components:
1. Place them in `/src/components/common/`
2. Use TypeScript interfaces for props
3. Provide sensible defaults
4. Follow the existing naming and styling patterns
5. Make them responsive and accessible