#!/usr/bin/env python3
"""
Content Generation Script for Dave Shapiro Blog
Uses multi-agent system to create high-quality SEO/AI content
"""

import asyncio
import json
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Any
from src.content_agents import (
    ContentBrief,
    ContentEditorInChief,
    generate_blog_post,
    generate_case_study,
    generate_breaking_news
)

# Content Ideas Queue
CONTENT_QUEUE = [
    {
        "type": "breaking-news",
        "topic": "OpenAI's GPT-5 Crushes Every Coding Benchmark",
        "angle": "What this means for developers and why AI coding tools just became mandatory",
        "implications": [
            "Traditional coding becoming obsolete",
            "10x productivity gains now possible",
            "Companies without AI falling behind"
        ]
    },
    {
        "type": "case-study", 
        "client": "Fortune 500 SaaS Company",
        "results": "509% Organic Traffic Growth in 6 Months",
        "challenge": "Stagnant organic growth despite massive content investment",
        "solution": "AI-powered content optimization and strategic keyword targeting"
    },
    {
        "type": "how-to",
        "topic": "How to Get Your Company to Actually Adopt AI (Internal Champion's Playbook)",
        "audience": "Internal AI champions at enterprises",
        "pain_points": [
            "Leadership doesn't understand AI value",
            "Team resistance to change",
            "No budget for AI tools"
        ]
    },
    {
        "type": "thought-leadership",
        "topic": "Why 90% of AI Implementations Fail (And How to Be in the 10%)",
        "contrarian_angle": "It's not about the technology, it's about the change management",
        "data_points": [
            "MIT study on AI adoption",
            "McKinsey transformation data",
            "Personal client examples"
        ]
    },
    {
        "type": "data-analysis",
        "topic": "The Real Cost of Not Using AI in 2025: $2.3M Per Year",
        "methodology": "Analysis of 50 companies using vs not using AI",
        "key_findings": [
            "40% productivity difference",
            "3x faster time to market",
            "67% reduction in content costs"
        ]
    }
]

# High-Performance Content Topics
PILLAR_CONTENT = [
    "The Complete Guide to AI-Powered SEO in 2025",
    "Enterprise AI Adoption: The Internal Champion's Handbook",
    "From 0 to 500% Growth: The Data-Driven SEO Playbook",
    "Why Your Competitors Are Beating You (And It's Not What You Think)",
    "The $10M SEO Mistake Every Enterprise Makes"
]

# Content Series Ideas
CONTENT_SERIES = {
    "AI Transformation Series": [
        "Part 1: Assessing Your AI Readiness",
        "Part 2: Building Your AI Business Case", 
        "Part 3: Choosing the Right AI Tools",
        "Part 4: Training Your Team on AI",
        "Part 5: Measuring AI ROI"
    ],
    "SEO Myths Debunked": [
        "Myth 1: More Content = Better Rankings",
        "Myth 2: Technical SEO Doesn't Matter Anymore",
        "Myth 3: AI Content Gets Penalized",
        "Myth 4: Link Building is Dead",
        "Myth 5: Google Hates Affiliate Sites"
    ],
    "Fortune 500 Growth Hacks": [
        "How Adobe Grew Traffic 494% in One Year",
        "SoFi's 509% Growth Playbook Revealed",
        "The Microsoft SEO Strategy Nobody Talks About",
        "Why Toyota Dominates Every SERP",
        "Bank of America's Content Moat Strategy"
    ]
}

async def generate_breaking_news_post():
    """Generate a breaking news post about AI developments"""
    news_item = CONTENT_QUEUE[0]  # First breaking news item
    
    print("\n🚨 GENERATING BREAKING NEWS POST")
    print("=" * 60)
    
    post = await generate_breaking_news(
        news=news_item["topic"],
        angle=news_item["angle"],
        implications=news_item["implications"]
    )
    
    return post

async def generate_pillar_post(topic: str):
    """Generate a comprehensive pillar content piece"""
    print(f"\n📚 GENERATING PILLAR CONTENT: {topic}")
    print("=" * 60)
    
    brief = ContentBrief(
        topic=topic,
        target_audience="Enterprise SEO/AI decision makers",
        primary_keyword=topic.lower().replace(' ', '-'),
        secondary_keywords=[
            "enterprise seo",
            "ai implementation", 
            "growth strategy",
            "dave shapiro"
        ],
        content_type="thought-leadership",
        word_count=4000,  # Long-form pillar content
        business_goal="authority-building",
        pain_points=[
            "Falling behind competitors",
            "Wasting money on ineffective tactics",
            "No clear growth strategy"
        ],
        desired_outcomes=[
            "Clear implementation roadmap",
            "Measurable growth metrics",
            "Competitive advantage"
        ],
        tone="expert-guide",
        urgency_level="high"
    )
    
    editor = ContentEditorInChief()
    return await editor.create_blog_post(brief)

async def generate_series(series_name: str):
    """Generate a complete content series"""
    if series_name not in CONTENT_SERIES:
        print(f"Series '{series_name}' not found")
        return None
    
    print(f"\n📖 GENERATING CONTENT SERIES: {series_name}")
    print("=" * 60)
    
    posts = []
    subtopics = CONTENT_SERIES[series_name]
    
    editor = ContentEditorInChief()
    series_posts = await editor.create_content_series(series_name, subtopics)
    
    return series_posts

async def generate_weekly_content():
    """Generate a week's worth of content"""
    print("\n🗓️ GENERATING WEEKLY CONTENT CALENDAR")
    print("=" * 60)
    
    weekly_posts = []
    
    # Monday: Breaking News
    print("\n📅 Monday: Breaking News Post")
    breaking = await generate_breaking_news_post()
    weekly_posts.append({"day": "Monday", "type": "breaking-news", "content": breaking})
    
    # Wednesday: How-To Guide
    print("\n📅 Wednesday: Practical How-To")
    howto = await generate_blog_post(
        "How to Implement AI in Your Marketing Team (30-Day Playbook)",
        content_type="how-to",
        word_count=2500
    )
    weekly_posts.append({"day": "Wednesday", "type": "how-to", "content": howto})
    
    # Friday: Case Study
    print("\n📅 Friday: Case Study")
    case_item = CONTENT_QUEUE[1]  # Case study from queue
    case = await generate_case_study(
        client=case_item["client"],
        results=case_item["results"],
        challenge=case_item["challenge"],
        solution=case_item["solution"]
    )
    weekly_posts.append({"day": "Friday", "type": "case-study", "content": case})
    
    return weekly_posts

def save_content(content: Dict, filename: str):
    """Save generated content to file"""
    output_dir = Path("generated_content")
    output_dir.mkdir(exist_ok=True)
    
    filepath = output_dir / f"{filename}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    
    with open(filepath, 'w') as f:
        json.dump(content, f, indent=2, default=str)
    
    print(f"\n💾 Content saved to: {filepath}")
    return filepath

def create_astro_page(content: Dict, slug: str):
    """Convert content to Astro page format"""
    astro_template = f"""---
import PageLayout from '../layouts/PageLayout.astro';
import Section from '../components/common/Section.astro';

const content = {json.dumps(content, indent=2)};
---

<PageLayout 
  title="{{content.headlines.primary}}"
  description="{{content.headlines.meta_description}}"
>
  <article class="prose prose-lg max-w-4xl mx-auto px-4 py-12">
    <h1 class="text-4xl md:text-5xl font-bold mb-8">
      {{content.headlines.primary}}
    </h1>
    
    <div class="text-gray-600 mb-8">
      By Dave Shapiro | {{new Date().toLocaleDateString()}}
    </div>
    
    <div set:html={{content.final_content.html}} />
    
    <Section class="mt-12 p-8 bg-blue-50 rounded-lg">
      <h2 class="text-2xl font-bold mb-4">Ready to Transform Your Growth?</h2>
      <p class="mb-6">
        Let's discuss how these strategies can drive 500% growth for your business.
      </p>
      <a 
        href="mailto:dave@daveshap.com?subject=Growth Strategy Discussion"
        class="inline-block px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
      >
        Schedule a Strategy Call
      </a>
    </Section>
  </article>
</PageLayout>
"""
    
    output_dir = Path("src/pages/blog")
    output_dir.mkdir(parents=True, exist_ok=True)
    
    filepath = output_dir / f"{slug}.astro"
    with open(filepath, 'w') as f:
        f.write(astro_template)
    
    print(f"\n📄 Astro page created: {filepath}")
    return filepath

async def main():
    """Main execution function"""
    print("\n🚀 DAVE SHAPIRO BLOG CONTENT GENERATOR")
    print("Multi-Agent Content Creation System v1.0")
    print("=" * 60)
    
    while True:
        print("\n📝 What would you like to generate?")
        print("1. Breaking News Post")
        print("2. Pillar Content")
        print("3. Content Series")
        print("4. Weekly Content Calendar")
        print("5. Custom Topic")
        print("6. Exit")
        
        choice = input("\nEnter choice (1-6): ")
        
        if choice == "1":
            content = await generate_breaking_news_post()
            save_content(content, "breaking_news")
            
        elif choice == "2":
            print("\nAvailable Pillar Topics:")
            for i, topic in enumerate(PILLAR_CONTENT, 1):
                print(f"{i}. {topic}")
            
            topic_choice = int(input("\nSelect topic number: ")) - 1
            if 0 <= topic_choice < len(PILLAR_CONTENT):
                content = await generate_pillar_post(PILLAR_CONTENT[topic_choice])
                save_content(content, "pillar_content")
            
        elif choice == "3":
            print("\nAvailable Series:")
            series_list = list(CONTENT_SERIES.keys())
            for i, series in enumerate(series_list, 1):
                print(f"{i}. {series}")
            
            series_choice = int(input("\nSelect series number: ")) - 1
            if 0 <= series_choice < len(series_list):
                content = await generate_series(series_list[series_choice])
                save_content(content, f"series_{series_list[series_choice]}")
            
        elif choice == "4":
            weekly = await generate_weekly_content()
            save_content(weekly, "weekly_calendar")
            
        elif choice == "5":
            topic = input("\nEnter your topic: ")
            audience = input("Target audience (default: Enterprise teams): ") or "Enterprise SEO/AI teams"
            word_count = int(input("Word count (default: 2000): ") or "2000")
            
            content = await generate_blog_post(
                topic=topic,
                audience=audience,
                word_count=word_count
            )
            save_content(content, "custom_post")
            
            # Optionally create Astro page
            if input("\nCreate Astro page? (y/n): ").lower() == 'y':
                slug = input("Enter URL slug: ")
                create_astro_page(content, slug)
            
        elif choice == "6":
            print("\n👋 Goodbye!")
            break
        
        else:
            print("\n❌ Invalid choice. Please try again.")

if __name__ == "__main__":
    asyncio.run(main())