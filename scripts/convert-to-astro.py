#!/usr/bin/env python3
"""
Convert AI ROI markdown draft to Astro page with premium styling
"""

import re
import sys

def markdown_to_astro_html(markdown_text):
    """Convert markdown to Astro-compatible HTML with premium styling"""

    # Split into sections
    lines = markdown_text.split('\n')
    html_parts = []
    in_section = False
    section_content = []

    i = 0
    while i < len(lines):
        line = lines[i]

        # Skip metadata at top
        if i < 10 and (line.startswith('**By') or line.startswith('*Former') or line.startswith('Reading time')):
            i += 1
            continue

        # H2 Headers - Section titles
        if line.startswith('## '):
            # Close previous section if exists
            if section_content:
                html_parts.append(process_section('\n'.join(section_content)))
                section_content = []

            title = line.replace('## ', '').strip()
            section_content.append(f'<h2>{title}</h2>')
            in_section = True

        # H3 Headers - Subsections
        elif line.startswith('### '):
            title = line.replace('### ', '').strip()
            section_content.append(f'<h3>{title}</h3>')

        # H4 Headers
        elif line.startswith('#### '):
            title = line.replace('#### ', '').strip()
            section_content.append(f'<h4>{title}</h4>')

        # Bullet points
        elif line.strip().startswith('- ') or line.strip().startswith('* '):
            # Collect all bullets
            bullets = []
            while i < len(lines) and (lines[i].strip().startswith('- ') or lines[i].strip().startswith('* ')):
                bullet = lines[i].strip()[2:]  # Remove '- ' or '* '
                bullets.append(f'<li>{process_inline_markdown(bullet)}</li>')
                i += 1
            section_content.append(f'<ul class="space-y-2 ml-4 text-white/90">{" ".join(bullets)}</ul>')
            continue

        # Paragraphs
        elif line.strip() and not line.startswith('#') and not line.startswith('---'):
            section_content.append(f'<p>{process_inline_markdown(line)}</p>')

        # Empty lines
        elif not line.strip():
            pass  # Skip empty lines

        i += 1

    # Add final section
    if section_content:
        html_parts.append(process_section('\n'.join(section_content)))

    return '\n\n'.join(html_parts)

def process_inline_markdown(text):
    """Process inline markdown (bold, italic, links)"""
    # Bold
    text = re.sub(r'\*\*(.+?)\*\*', r'<strong class="text-accent">\1</strong>', text)
    text = re.sub(r'__(.+?)__', r'<strong class="text-accent">\1</strong>', text)

    # Italic
    text = re.sub(r'\*(.+?)\*', r'<em>\1</em>', text)
    text = re.sub(r'_(.+?)_', r'<em>\1</em>', text)

    # Links
    text = re.sub(r'\[(.+?)\]\((.+?)\)', r'<a href="\2" class="text-accent hover:text-primary-glow underline">\1</a>', text)

    return text

def process_section(content):
    """Wrap section content in styled container"""
    # Detect section type by header
    if '<h2>The Hook</h2>' in content or '<h2>## The Hook</h2>' in content:
        return f'''
<div class="prose prose-lg prose-invert max-w-none mb-16">
  <div class="glass-morphism p-8 rounded-2xl border border-white/10 shadow-xl mb-8">
    {content.replace('<h2>The Hook</h2>', '').replace('<h2>## The Hook</h2>', '')}
  </div>
</div>'''

    elif 'The Stakes' in content or 'The 95/5 Divide' in content or 'The Proof' in content or 'The Playbook' in content or 'The Ammunition' in content or 'Take Action' in content:
        # Extract title
        title_match = re.search(r'<h2>(.+?)</h2>', content)
        title = title_match.group(1) if title_match else 'Section'

        # Add gradient to title
        if 'Stakes' in title:
            title_html = '<span class="bg-gradient-to-r from-accent to-primary-glow bg-clip-text text-transparent">The Stakes:</span> Why Internal Champions Must Act Now'
        elif '95/5' in title:
            title_html = 'The 95/5 Divide: What Separates Winners from Losers'
        elif 'Proof' in title:
            title_html = 'The Proof: Real Companies, Real Numbers'
        elif 'Playbook' in title:
            title_html = 'The Playbook: 5 Things the Winners Do'
        elif 'Ammunition' in title:
            title_html = 'The Ammunition: What to Tell Your Boss'
        elif 'Take Action' in title:
            title_html = 'Take Action: Your Next 30 Days'
        else:
            title_html = title

        # Remove the h2 from content
        content_without_h2 = re.sub(r'<h2>.+?</h2>', '', content, count=1)

        return f'''
<section class="mb-16">
  <h2 class="text-3xl md:text-4xl font-black text-white mb-6">
    {title_html}
  </h2>
  <div class="prose prose-lg prose-invert max-w-none">
    {content_without_h2}
  </div>
</section>'''

    else:
        # Generic section
        return f'''
<section class="mb-16">
  <div class="prose prose-lg prose-invert max-w-none">
    {content}
  </div>
</section>'''

def create_astro_page(markdown_content):
    """Create complete Astro page"""

    # Convert markdown body
    html_body = markdown_to_astro_html(markdown_content)

    astro_template = '''---
import PageLayout from '../layouts/PageLayout.astro';

const title = "95% of Enterprise AI Projects Fail—Here's What the 5% Do Differently | Dave Shapiro";
const description = "MIT study reveals 95% of AI pilots fail, but the 5% that succeed save $300M+ annually. Get the playbook internal champions use to beat the odds. Real data, zero fluff.";

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Why do 95% of enterprise AI projects fail?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "According to MIT research, 95% fail because they're treated as technology projects instead of business transformations. They build internally (33% success), create central AI labs, focus on flashy use cases, and pilot forever without graduating to production."
      }
    },
    {
      "@type": "Question",
      "name": "What do the 5% of successful AI implementations do differently?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Winners partner with specialized vendors (67% success rate), give ownership to line managers, target back-office automation, solve data access problems, and execute completely on one pain point before scaling."
      }
    },
    {
      "@type": "Question",
      "name": "What ROI can enterprises expect from successful AI implementation?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Microsoft achieved $300M in annual savings with 20% developer efficiency gains. Google reduced support resolution time by 37%. Successful implementations typically show 200-300% ROI in year one, growing to 400-600% in subsequent years."
      }
    }
  ]
};
---

<PageLayout
  title={title}
  description={description}
  showHeader={true}
  showCTA={false}
  schema={faqSchema}
>
  <div class="min-h-screen relative overflow-hidden">
    <!-- Hero Section -->
    <div class="relative bg-gradient-hero noise-bg">
      <div class="absolute inset-0">
        <div class="absolute top-20 left-10 w-96 h-96 bg-gradient-to-r from-primary/8 to-accent/8 rounded-full blur-3xl animate-float"></div>
        <div class="absolute bottom-40 right-20 w-80 h-80 bg-gradient-to-r from-accent/5 to-primary-glow/5 rounded-full blur-3xl animate-float" style="animation-delay: 2s"></div>
        <div class="absolute inset-0 grid-pattern opacity-5"></div>
      </div>

      <div class="pt-32 pb-20 relative z-10">
        <div class="max-w-4xl mx-auto px-6">
          <!-- Badge -->
          <div class="mb-8 text-center">
            <span class="inline-flex items-center gap-2 px-6 py-3 rounded-full backdrop-blur-lg bg-white/10 border border-white/20 text-white font-semibold text-sm shadow-glow">
              <span class="w-2 h-2 bg-accent rounded-full animate-pulse"></span>
              📊 Based on MIT Research & Fortune 500 Data
            </span>
          </div>

          <!-- Headline -->
          <h1 class="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 leading-tight text-center">
            <span class="bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">95%</span> of Enterprise AI Projects Fail—<br />
            Here's What the <span class="bg-gradient-to-r from-accent to-primary-glow bg-clip-text text-transparent">5%</span> Do Differently
          </h1>

          <p class="text-xl md:text-2xl text-white/90 mb-8 text-center max-w-3xl mx-auto">
            MIT study reveals the playbook that turns skeptical executives into believers. Microsoft saved $300M. Google cut resolution time 37%. Are you in the 95% or the 5%?
          </p>

          <div class="text-center">
            <p class="text-white/70 mb-4">
              <strong>By Dave Shapiro</strong><br />
              Former SVP of Earned Media at Neil Patel Digital | Former CMO of Sports Betting SaaS Startup<br />
              12-minute read | Last updated: September 2025
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="relative bg-gradient-to-b from-secondary to-secondary/95 py-16">
      <div class="max-w-4xl mx-auto px-6">
        <!-- GENERATED CONTENT WILL BE INSERTED HERE -->
      </div>
    </div>
  </div>
</PageLayout>'''

    # Insert the body
    final_astro = astro_template.replace('<!-- GENERATED CONTENT WILL BE INSERTED HERE -->', html_body)

    return final_astro

def main():
    # Read the markdown draft
    with open('workshop-output/AI-ROI-COMPLETE-DRAFT.md', 'r') as f:
        markdown = f.read()

    # Generate Astro page
    astro_content = create_astro_page(markdown)

    # Write to the page file
    with open('src/pages/ai-roi-analysis.astro', 'w') as f:
        f.write(astro_content)

    print("✅ Successfully converted to Astro!")
    print("📄 Updated: src/pages/ai-roi-analysis.astro")
    print("\nNext steps:")
    print("1. npm run dev")
    print("2. Visit http://localhost:4321/ai-roi-analysis")
    print("3. If it looks good: git add . && git commit -m 'publish: new AI ROI analysis'")

if __name__ == '__main__':
    main()