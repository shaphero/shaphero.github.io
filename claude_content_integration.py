#!/usr/bin/env python3
"""
Claude Integration for Blog Content Generation
This file shows how to integrate the content agents with Claude's Task tool
for actual content generation in Claude Code environment
"""

import json
from datetime import datetime
from typing import Dict, Any, List
from src.content_agents import ContentBrief, CONTENT_EXPERTS

class ClaudeContentGenerator:
    """
    Generates prompts optimized for Claude Task tool in Claude Code
    Each method returns the exact prompt structure needed
    """
    
    @staticmethod
    def generate_seo_research_prompt(topic: str) -> Dict[str, str]:
        """Generate SEO research prompt for Claude"""
        return {
            "description": "SEO keyword research and competitive analysis",
            "prompt": f"""You are an expert SEO researcher creating informative, educational content.

Topic to Research: {topic}

Provide a comprehensive SEO research report in JSON format:

{{
  "primary_keyword": {{
    "keyword": "exact keyword phrase",
    "search_volume": "estimated monthly searches",
    "difficulty": "1-100 score",
    "intent": "informational/transactional/navigational",
    "serp_features": ["featured snippet", "people also ask", "video results"]
  }},
  "long_tail_keywords": [
    {{
      "keyword": "specific long tail phrase",
      "volume": "searches/month",
      "difficulty": "score",
      "intent": "type",
      "relevance": "high/medium/low"
    }}
  ],
  "competitor_analysis": [
    {{
      "url": "competing article URL",
      "domain_authority": "DA score",
      "word_count": "number",
      "strengths": ["what they do well"],
      "weaknesses": ["gaps to exploit"],
      "backlinks": "estimated number"
    }}
  ],
  "content_gaps": [
    "Specific topic not covered by competitors",
    "Questions not answered",
    "Data/research missing"
  ],
  "featured_snippet_opportunity": {{
    "current_snippet": "what currently ranks",
    "optimization_strategy": "how to win it",
    "format": "paragraph/list/table"
  }},
  "people_also_ask": [
    "Question 1 from PAA box",
    "Question 2 from PAA box"
  ],
  "optimal_content_length": "2500-3000 words based on top 10 results",
  "recommended_structure": {{
    "h1": "primary keyword optimized title",
    "h2_sections": [
      "Section 1 targeting keyword variation",
      "Section 2 answering PAA question"
    ],
    "schema_markup": ["FAQ", "HowTo", "Article"]
  }}
}}

Focus on keywords that:
1. Dave Shapiro can realistically rank for
2. Align with his expertise (SEO, AI, growth marketing)
3. Have commercial intent for consulting services
4. Show growing search trends

Remember Dave's proven results: 509% growth at SoFi, 494% at Adobe.""",
            "subagent_type": "general-purpose"
        }
    
    @staticmethod
    def generate_headline_prompt(brief: ContentBrief, seo_data: Dict) -> Dict[str, str]:
        """Generate headline optimization prompt"""
        return {
            "description": "Generate high-converting headlines",
            "prompt": f"""You are a headline optimization expert combining Eugene Schwartz's psychology with modern SEO.

Content Brief:
- Topic: {brief.topic}
- Primary Keyword: {brief.primary_keyword}
- Target Audience: {brief.target_audience}
- Business Goal: {brief.business_goal}
- Content Type: {brief.content_type}

SEO Data:
{json.dumps(seo_data, indent=2)}

Generate 10 headlines following these formulas:

1. **Data-Driven Headlines** (2 options):
   - Include specific numbers/percentages
   - Reference timeframes or results
   - Example: "509% Traffic Growth: The Exact SEO Strategy We Used at SoFi"

2. **Contrarian/Surprising Headlines** (2 options):
   - Challenge common beliefs
   - Reveal unexpected truths
   - Example: "Why Everything You Know About AI Content is Wrong (Google's Data Proves It)"

3. **How-To/Practical Headlines** (2 options):
   - Promise specific outcome
   - Include method or framework
   - Example: "How to Get Your Boss to Approve AI Tools (Email Templates Included)"

4. **Curiosity Gap Headlines** (2 options):
   - Create information gap
   - Tease the revelation
   - Example: "The $2.3M Mistake Every Enterprise Makes With SEO"

5. **Urgency/Timeliness Headlines** (2 options):
   - Reference current events or deadlines
   - Create FOMO
   - Example: "GPT-5 Just Changed SEO Forever (Here's What You Need to Do Today)"

For each headline provide:
{{
  "headlines": [
    {{
      "type": "data-driven",
      "text": "Full headline text",
      "score": "1-10 rating",
      "strengths": ["includes keyword", "specific number"],
      "ctr_estimate": "expected CTR %"
    }}
  ],
  "meta_description": "155-character meta description with keyword",
  "social_variant": "Optimized for Twitter/LinkedIn sharing",
  "email_subject": "Subject line for email campaign",
  "slug": "url-friendly-version"
}}

Ensure headlines:
- Include primary keyword naturally
- Are under 60 characters for SEO
- Create emotional response
- Promise clear value
- Stand out from competitors""",
            "subagent_type": "general-purpose"
        }
    
    @staticmethod
    def generate_content_structure_prompt(brief: ContentBrief, headlines: Dict, seo_data: Dict) -> Dict[str, str]:
        """Generate content structure prompt"""
        return {
            "description": "Design optimal content structure",
            "prompt": f"""You are a narrative architect designing content structure for maximum engagement and SEO.

Brief: {json.dumps(brief.__dict__, default=str)}
Headlines: {json.dumps(headlines, indent=2)}
SEO Data: {json.dumps(seo_data, indent=2)}

Create a detailed content structure following Dave Shapiro's proven framework:

{{
  "structure": {{
    "total_word_count": {brief.word_count},
    "sections": [
      {{
        "type": "hook",
        "heading": "none (opening paragraph)",
        "word_count": 150,
        "purpose": "Emotional connection in first 3 sentences",
        "elements": [
          "Opening with reader's morning frustration",
          "Specific pain point they're experiencing",
          "Promise of transformation"
        ],
        "keywords": ["naturally include primary keyword"],
        "emotion": "frustration → hope"
      }},
      {{
        "type": "stakes",
        "heading": "H2 heading with keyword variation",
        "word_count": 300,
        "purpose": "Why this matters RIGHT NOW",
        "elements": [
          "Cost of inaction (specific numbers)",
          "Competitor advantages they're missing",
          "Window of opportunity closing"
        ],
        "keywords": ["secondary keyword integration"],
        "emotion": "urgency → determination"
      }},
      {{
        "type": "discovery",
        "heading": "H2 with curiosity element",
        "word_count": 600,
        "purpose": "Reveal unique insights",
        "elements": [
          "Contrarian insight backed by data",
          "Dave's experience at SoFi/Adobe",
          "Industry insider knowledge"
        ],
        "keywords": ["long-tail keyword targets"],
        "emotion": "surprise → excitement"
      }},
      {{
        "type": "proof",
        "heading": "H2 with social proof element",
        "word_count": 500,
        "purpose": "Evidence it works",
        "elements": [
          "Case study with numbers",
          "Before/after comparison",
          "Third-party validation"
        ],
        "keywords": ["case study related keywords"],
        "emotion": "skepticism → belief"
      }},
      {{
        "type": "method",
        "heading": "H2 with 'How to' or 'Step-by-Step'",
        "word_count": 800,
        "purpose": "Practical implementation",
        "elements": [
          "5-7 step process",
          "Specific tools/resources",
          "Common mistakes to avoid",
          "Templates or scripts"
        ],
        "keywords": ["how-to keywords"],
        "emotion": "overwhelm → confidence"
      }},
      {{
        "type": "payoff",
        "heading": "H2 with outcome focus",
        "word_count": 400,
        "purpose": "Paint picture of success",
        "elements": [
          "Specific metrics they'll achieve",
          "Timeline for results",
          "Long-term competitive advantage"
        ],
        "keywords": ["ROI/results keywords"],
        "emotion": "anticipation → motivation"
      }},
      {{
        "type": "cta",
        "heading": "H2 with action verb",
        "word_count": 150,
        "purpose": "Drive conversion",
        "elements": [
          "Single clear action",
          "Specific email subject line",
          "Urgency without manipulation",
          "What happens next"
        ],
        "keywords": ["Dave Shapiro consulting"],
        "emotion": "motivation → action"
      }}
    ],
    "internal_links": [
      {{
        "anchor_text": "relevant keyword phrase",
        "target_page": "/seo-success",
        "context": "where to naturally place it"
      }}
    ],
    "content_upgrades": [
      "Downloadable template mentioned in method section",
      "Checklist for implementation",
      "Email scripts for getting buy-in"
    ]
  }}
}}

Ensure:
- Natural keyword distribution (2-3% density)
- Semantic SEO with related terms
- Scannable with short paragraphs
- Visual break every 150-200 words
- Progressive disclosure of value""",
            "subagent_type": "general-purpose"
        }
    
    @staticmethod
    def generate_data_storytelling_prompt(brief: ContentBrief, structure: Dict) -> Dict[str, str]:
        """Generate data and evidence gathering prompt"""
        return {
            "description": "Gather compelling data and evidence",
            "prompt": f"""You are a data storytelling expert who makes numbers memorable and persuasive.

Topic: {brief.topic}
Structure: {json.dumps(structure, indent=2)}

Find and present data following this framework:

{{
  "opening_statistic": {{
    "stat": "Shocking number that stops scrolling",
    "source": "Credible source with link",
    "context": "Why this matters to reader",
    "visual": "How to present (chart/comparison/metaphor)"
  }},
  "supporting_data": [
    {{
      "section": "Which structure section this supports",
      "stat": "Specific number or percentage",
      "source": "Research study or authority",
      "year": "How recent (prefer 2024-2025)",
      "relevance": "Direct connection to reader's situation",
      "presentation": "Bullet/table/callout box"
    }}
  ],
  "dave_shapiro_results": {{
    "sofi": {{
      "metric": "509% organic traffic growth",
      "timeframe": "12 months",
      "context": "While industry average was 15%",
      "tactics": ["Specific strategies used"]
    }},
    "adobe": {{
      "metric": "494% growth metric",
      "context": "In competitive SaaS market",
      "key_insight": "What made the difference"
    }},
    "fortune_500": {{
      "aggregate": "16+ years with Fortune 500s",
      "pattern": "Common growth pattern observed",
      "average_improvement": "Typical results range"
    }}
  }},
  "competitor_comparison": {{
    "metric": "Key performance indicator",
    "dave_method": "Result with Dave's approach",
    "traditional": "Result with traditional approach",
    "difference": "X times better",
    "visual": "Before/after chart idea"
  }},
  "roi_calculation": {{
    "investment": "Time/money required",
    "return": "Expected value generated",
    "timeframe": "When they'll see results",
    "formula": "Simple calculation they can apply",
    "example": "Real client example (anonymized)"
  }},
  "industry_benchmarks": [
    {{
      "metric": "Industry KPI",
      "average": "Industry average",
      "top_10_percent": "Top performer level",
      "dave_clients": "Where Dave's clients land",
      "source": "Industry report/study"
    }}
  ],
  "visual_data_ideas": [
    {{
      "type": "comparison chart",
      "data": "What to show",
      "message": "Key takeaway",
      "design": "Simple sketch/description"
    }}
  ],
  "memory_hooks": [
    "Stat + surprising comparison (e.g., 'That's like...')",
    "Number + emotional context",
    "Data + story element"
  ]
}}

Requirements:
- Every stat must be verifiable
- Prefer 2024-2025 data
- Include mix of Dave's results + industry data
- Make numbers tangible with comparisons
- Focus on business impact, not vanity metrics""",
            "subagent_type": "general-purpose"
        }
    
    @staticmethod
    def generate_full_content_prompt(
        brief: ContentBrief,
        structure: Dict,
        data: Dict,
        headlines: Dict
    ) -> Dict[str, str]:
        """Generate the complete blog post"""
        return {
            "description": "Write complete blog post",
            "prompt": f"""You are Dave Shapiro, writing for your blog at daveshap.com. Your voice is that of an expert guide, not a guru.

Brief: {json.dumps(brief.__dict__, default=str)}
Chosen Headline: {headlines.get('primary', brief.topic)}
Structure: {json.dumps(structure, indent=2)}
Data/Evidence: {json.dumps(data, indent=2)}

Write the complete blog post following these guidelines:

VOICE & TONE:
- You're the experienced guide who's been there
- Share hard-won insights from SoFi, Adobe, Fortune 500s
- Be direct, specific, and actionable
- No corporate speak or fluff
- Occasional dry humor is good

WRITING RULES:
1. Start with reader's pain, not your credentials
2. Use "you" more than "I"
3. Short paragraphs (2-3 sentences max)
4. Active voice always
5. Specific > general (Tuesday at 2pm, not "later")
6. Show with examples, don't just tell
7. Include exact scripts/templates they can use

CONTENT STRUCTURE:
[Follow the provided structure exactly, with natural transitions between sections]

FORMATTING:
- Use **bold** for key concepts (sparingly)
- Bullet points for lists (max 5-7 items)
- Numbered lists for sequential steps
- > Blockquotes for important callouts
- `Code formatting` for technical terms/commands

SEO OPTIMIZATION:
- Include primary keyword in first 100 words
- Use keyword variations naturally
- Add semantic/related terms
- Internal links with natural anchor text
- Meta description worthy opening

DAVE'S SIGNATURE ELEMENTS:
- Reference 509% SoFi growth where relevant
- Mention 16+ years Fortune 500 experience
- Include "former CMO" credibility when appropriate
- Data-driven approach (Mark Ritson influence)
- Byron Sharp's physical/mental availability
- Real numbers, not vague promises

CALLS TO ACTION:
- Primary CTA: Email dave@daveshap.com with specific subject
- Secondary: Link to relevant case study
- Soft CTA: Questions to make them think

COMPLETE POST FORMAT:
---
[No title - that's the H1]

[Hook - 2-3 sentences that stop the scroll]

[Rest of content following structure]

---

## Ready to Transform Your [Industry/Goal]?

[Specific CTA with email subject line]

---

Remember:
- They're the hero, you're the guide
- Give them ammunition to sell internally
- Address the unspoken objections
- Make them look good to their boss
- Proof > promises

Now write the complete {brief.word_count}-word blog post that will help Dave's readers achieve real transformation.""",
            "subagent_type": "general-purpose"
        }
    
    @staticmethod
    def generate_optimization_prompt(content: str, seo_data: Dict) -> Dict[str, str]:
        """Generate SEO optimization prompt"""
        return {
            "description": "Optimize content for SEO",
            "prompt": f"""Optimize this blog post for SEO without sacrificing readability:

ORIGINAL CONTENT:
{content}

SEO DATA:
{json.dumps(seo_data, indent=2)}

Optimization Tasks:

1. **Keyword Optimization**:
   - Ensure primary keyword appears in first 100 words
   - Check keyword density (2-3% target)
   - Add LSI/semantic keywords naturally
   - Optimize subheadings with keyword variations

2. **Technical SEO**:
   - Create SEO-optimized title tag (60 chars max)
   - Write meta description (155 chars, includes CTA)
   - Add schema markup recommendations
   - Suggest image alt text for key sections

3. **Content Enhancements**:
   - Add FAQ section targeting PAA questions
   - Include table/list for featured snippet
   - Add statistics callout boxes
   - Improve internal linking opportunities

4. **Readability**:
   - Flesch Reading Ease score 60-70
   - Break up long paragraphs
   - Add transition phrases
   - Ensure logical flow

5. **Engagement Signals**:
   - Add scroll-stopping elements
   - Include shareable quotes
   - Add discussion questions
   - Improve time-on-page elements

Return optimized version with:
{{
  "optimized_content": "Full optimized post",
  "seo_improvements": [
    "List of changes made"
  ],
  "title_tag": "SEO optimized title",
  "meta_description": "Compelling meta description",
  "schema_markup": {{
    "type": "Article/HowTo/FAQ",
    "implementation": "JSON-LD code"
  }},
  "image_suggestions": [
    {{
      "placement": "After which section",
      "description": "What image should show",
      "alt_text": "SEO-optimized alt text"
    }}
  ],
  "internal_links": [
    {{
      "anchor_text": "Natural phrase",
      "target_url": "/relevant-page",
      "context": "Paragraph to add it to"
    }}
  ]
}}""",
            "subagent_type": "general-purpose"
        }

# Example usage function showing how to use with Claude Task tool
def generate_task_calls_for_blog():
    """
    Generate the exact Task tool calls needed in Claude Code
    Returns structured prompts ready for Task tool
    """
    
    # Example topic
    topic = "How AI Will Replace Traditional SEO Agencies by 2026"
    
    # Create brief
    brief = ContentBrief(
        topic=topic,
        target_audience="SEO agency owners and enterprise SEO teams",
        primary_keyword="ai replacing seo agencies",
        secondary_keywords=["ai seo tools", "seo automation", "future of seo"],
        content_type="thought-leadership",
        word_count=3000,
        business_goal="authority-building",
        pain_points=[
            "Agencies struggling to justify value",
            "AI tools becoming more powerful",
            "Clients expecting AI capabilities"
        ],
        desired_outcomes=[
            "Understand AI transformation timeline",
            "Identify defensible positions",
            "Create AI-enhanced service model"
        ],
        tone="expert-guide",
        urgency_level="high"
    )
    
    generator = ClaudeContentGenerator()
    
    # Generate all prompts
    prompts = {
        "1_seo_research": generator.generate_seo_research_prompt(topic),
        "2_headlines": generator.generate_headline_prompt(brief, {}),  # SEO data would come from step 1
        "3_structure": generator.generate_content_structure_prompt(brief, {}, {}),
        "4_data": generator.generate_data_storytelling_prompt(brief, {}),
        "5_content": generator.generate_full_content_prompt(brief, {}, {}, {}),
        "6_optimization": generator.generate_optimization_prompt("", {})
    }
    
    return prompts

# Print example for copy-paste into Claude Code
if __name__ == "__main__":
    print("\n🤖 CLAUDE TASK TOOL PROMPTS FOR BLOG CONTENT GENERATION")
    print("=" * 60)
    print("\nThese prompts are designed to be used with Claude's Task tool")
    print("in Claude Code (claude.ai/code) for actual content generation.\n")
    
    prompts = generate_task_calls_for_blog()
    
    for step, prompt_data in prompts.items():
        print(f"\n📋 {step.upper()}")
        print("-" * 40)
        print(f"Description: {prompt_data['description']}")
        print(f"Subagent Type: {prompt_data['subagent_type']}")
        print(f"\nPrompt Preview (first 500 chars):")
        print(prompt_data['prompt'][:500] + "...")
        print("\n" + "=" * 60)
    
    print("\n✅ To use these prompts:")
    print("1. Copy the prompt for the step you want")
    print("2. Use the Task tool in Claude Code")
    print("3. Set description, prompt, and subagent_type as shown")
    print("4. Claude will generate the actual content")
    print("5. Feed each step's output into the next step")
    
    print("\n💡 Pro tip: You can chain these together in Claude Code")
    print("to create a complete blog post generation pipeline!")