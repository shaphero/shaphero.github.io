#!/usr/bin/env python3
"""
Multi-Agent Content Creation System for Dave Shapiro Blog
Adapted from marketing_agent framework for SEO/AI content generation
"""

import json
import asyncio
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
import hashlib
import pickle
from pathlib import Path

# Content Agent Roles
class ContentAgentRole(Enum):
    EDITOR_IN_CHIEF = "Editor in Chief"
    # Research & Analysis Agents
    SEO_RESEARCHER = "SEO Research Specialist"
    AI_TREND_ANALYST = "AI Trend Analyst"
    COMPETITOR_ANALYST = "Competitor Content Analyst"
    AUDIENCE_RESEARCHER = "Audience Psychology Researcher"
    # Content Creation Agents
    HEADLINE_OPTIMIZER = "Headline & Hook Specialist"
    NARRATIVE_ARCHITECT = "Narrative Structure Designer"
    DATA_STORYTELLER = "Data Storytelling Expert"
    CASE_STUDY_WRITER = "Case Study Developer"
    TECHNICAL_WRITER = "Technical Content Expert"
    # Optimization & Polish Agents
    SEO_OPTIMIZER = "SEO Content Optimizer"
    READABILITY_EDITOR = "Readability & Flow Editor"
    FACT_CHECKER = "Fact Checker & Source Validator"
    CTA_SPECIALIST = "Call-to-Action Optimizer"
    # Quality Control
    QUALITY_AUDITOR = "Content Quality Auditor"
    AUDIENCE_ADVOCATE = "Audience Experience Advocate"

@dataclass
class ContentBrief:
    """Content brief for blog post generation"""
    topic: str
    target_audience: str
    primary_keyword: str
    secondary_keywords: List[str]
    content_type: str  # "case-study", "how-to", "thought-leadership", "data-analysis"
    word_count: int
    business_goal: str  # "lead-generation", "authority-building", "education"
    pain_points: List[str]
    desired_outcomes: List[str]
    competitors_to_beat: List[str] = None
    data_sources: List[str] = None
    internal_links: List[str] = None
    tone: str = "expert-guide"  # "expert-guide", "contrarian", "analytical", "conversational"
    urgency_level: str = "medium"  # "low", "medium", "high", "breaking-news"

# Content Creation Experts Knowledge Base
CONTENT_EXPERTS = {
    "Ann Handley": {
        "framework": "Everybody Writes",
        "principle": "Make the reader the hero of your story"
    },
    "Brian Dean": {
        "framework": "Skyscraper Technique",
        "principle": "Find great content and make it 10x better"
    },
    "Andy Crestodina": {
        "framework": "Content Chemistry",
        "principle": "Answer questions with data and evidence"
    },
    "Joe Pulizzi": {
        "framework": "Content Inc.",
        "principle": "Build an audience first, then create products"
    },
    "Rand Fishkin": {
        "framework": "10x Content",
        "principle": "Create content that's 10 times better than the competition"
    },
    "Neil Patel": {
        "framework": "Content Scaling",
        "principle": "Volume with quality through systematic processes"
    },
    "Seth Godin": {
        "framework": "Purple Cow Content",
        "principle": "Be remarkable or be invisible"
    },
    "Jonah Berger": {
        "framework": "STEPPS",
        "principle": "Social currency, Triggers, Emotion, Public, Practical value, Stories"
    },
    "Eugene Schwartz": {
        "framework": "Stages of Awareness",
        "principle": "Match content to reader's awareness level"
    },
    "Robert Cialdini": {
        "framework": "Influence Principles",
        "principle": "Reciprocity, Commitment, Social Proof, Authority, Liking, Scarcity"
    },
    "Byron Sharp": {
        "framework": "Mental Availability",
        "principle": "Be easy to think of and easy to find"
    },
    "Les Binet & Peter Field": {
        "framework": "Long and Short",
        "principle": "Balance brand building with activation"
    },
    "Mark Ritson": {
        "framework": "Diagnosis Before Prescription",
        "principle": "Research thoroughly before creating"
    },
    "Amanda Natividad": {
        "framework": "Zero-Click Content",
        "principle": "Give value without requiring clicks"
    },
    "Dave Gerhardt": {
        "framework": "Category Creation",
        "principle": "Create the category you want to lead"
    }
}

class ContentKnowledgeGraph:
    """Central knowledge management for content creation"""
    def __init__(self):
        self.topics_covered = {}
        self.keyword_map = {}
        self.competitor_content = {}
        self.audience_insights = []
        self.performance_data = {}
        self.content_calendar = []
        
    def register_topic(self, topic: str, keywords: List[str], performance: Dict):
        self.topics_covered[topic] = {
            'keywords': keywords,
            'performance': performance,
            'created': datetime.now().isoformat()
        }
        for keyword in keywords:
            if keyword not in self.keyword_map:
                self.keyword_map[keyword] = []
            self.keyword_map[keyword].append(topic)
    
    def get_content_gaps(self) -> List[str]:
        """Identify content gaps based on competitor analysis and keyword research"""
        gaps = []
        # This would integrate with real competitor analysis
        return gaps
    
    def get_related_content(self, topic: str) -> List[Dict]:
        """Get related content for internal linking"""
        related = []
        # Find content with overlapping keywords
        if topic in self.topics_covered:
            topic_keywords = set(self.topics_covered[topic]['keywords'])
            for other_topic, data in self.topics_covered.items():
                if other_topic != topic:
                    other_keywords = set(data['keywords'])
                    overlap = topic_keywords & other_keywords
                    if overlap:
                        related.append({
                            'topic': other_topic,
                            'overlap': list(overlap),
                            'relevance': len(overlap) / len(topic_keywords)
                        })
        return sorted(related, key=lambda x: x['relevance'], reverse=True)[:5]

class ContentAgent:
    """Base content agent with specialized expertise"""
    def __init__(self, role: ContentAgentRole, knowledge_graph: ContentKnowledgeGraph):
        self.role = role
        self.knowledge_graph = knowledge_graph
        self.experts = self._get_role_experts()
        
    def _get_role_experts(self) -> List[str]:
        """Map experts to agent roles"""
        role_map = {
            ContentAgentRole.SEO_RESEARCHER: ['Brian Dean', 'Rand Fishkin', 'Neil Patel'],
            ContentAgentRole.HEADLINE_OPTIMIZER: ['Eugene Schwartz', 'Robert Cialdini'],
            ContentAgentRole.NARRATIVE_ARCHITECT: ['Ann Handley', 'Seth Godin', 'Jonah Berger'],
            ContentAgentRole.DATA_STORYTELLER: ['Andy Crestodina', 'Mark Ritson'],
            ContentAgentRole.AUDIENCE_RESEARCHER: ['Byron Sharp', 'Eugene Schwartz'],
            ContentAgentRole.CTA_SPECIALIST: ['Robert Cialdini', 'Dave Gerhardt'],
            ContentAgentRole.SEO_OPTIMIZER: ['Brian Dean', 'Rand Fishkin'],
            ContentAgentRole.READABILITY_EDITOR: ['Ann Handley', 'Seth Godin']
        }
        return role_map.get(self.role, [])
    
    async def generate(self, task: str, brief: ContentBrief, context: Dict = None) -> Dict[str, Any]:
        """Generate content component based on role"""
        prompt = self._build_prompt(task, brief, context)
        output = await self._call_claude(prompt)
        return output
    
    def _build_prompt(self, task: str, brief: ContentBrief, context: Dict) -> str:
        """Build role-specific prompt"""
        expert_knowledge = self._build_expert_context()
        
        prompt = f"""You are an expert {self.role.value} creating informative, educational content.

Content Brief:
- Topic: {brief.topic}
- Target Audience: {brief.target_audience}
- Primary Keyword: {brief.primary_keyword}
- Secondary Keywords: {', '.join(brief.secondary_keywords)}
- Content Type: {brief.content_type}
- Business Goal: {brief.business_goal}
- Pain Points: {', '.join(brief.pain_points)}
- Desired Outcomes: {', '.join(brief.desired_outcomes)}
- Tone: {brief.tone}
- Word Count Target: {brief.word_count}

Expert Frameworks to Apply:
{expert_knowledge}

Task: {task}

Context from Other Agents:
{json.dumps(context or {}, indent=2)}

IMPORTANT: Create purely informative, educational content. Focus on:
- Industry data and research
- Best practices and frameworks
- Objective analysis and insights
- Practical how-to guidance
- General case studies from the industry

Do NOT include:
- Personal experiences or results
- First-person narratives
- Self-referential content
- Personal branding elements

Return a JSON object with your specialized output based on your role.
"""
        return prompt
    
    def _build_expert_context(self) -> str:
        """Build expert knowledge context"""
        context = ""
        for expert in self.experts[:2]:
            if expert in CONTENT_EXPERTS:
                info = CONTENT_EXPERTS[expert]
                context += f"\n{expert}:"
                context += f"\n- Framework: {info['framework']}"
                context += f"\n- Principle: {info['principle']}\n"
        return context
    
    async def _call_claude(self, prompt: str) -> Dict[str, Any]:
        """Placeholder for Claude integration"""
        print(f"\n🤖 {self.role.value} working...")
        print(f"Prompt preview: {prompt[:200]}...")
        
        # This will be replaced with actual Claude Task tool call
        return {
            "role": self.role.value,
            "output": f"[Requires Claude Task tool for {self.role.value}]",
            "timestamp": datetime.now().isoformat()
        }

class SEOResearchAgent(ContentAgent):
    """Specialized SEO research agent"""
    async def research_keywords(self, topic: str) -> Dict[str, Any]:
        task = f"""Research SEO keywords and competitive landscape for topic: {topic}
        
        Provide:
        1. Primary keyword with search volume and difficulty
        2. 10-15 long-tail keywords with intent mapping
        3. Top 5 competitor articles ranking for primary keyword
        4. Content gaps in competitor coverage
        5. Featured snippet opportunities
        6. People Also Ask questions
        7. Related searches
        8. Optimal content length based on competition
        
        Format as structured JSON with actionable insights."""
        
        return await self.generate(task, ContentBrief(
            topic=topic,
            target_audience="SEO/AI consultants and enterprise teams",
            primary_keyword=topic,
            secondary_keywords=[],
            content_type="research",
            word_count=0,
            business_goal="keyword-research",
            pain_points=[],
            desired_outcomes=[]
        ))

class HeadlineOptimizerAgent(ContentAgent):
    """Specialized headline optimization agent"""
    async def generate_headlines(self, brief: ContentBrief, seo_data: Dict) -> Dict[str, Any]:
        task = f"""Generate 10 high-converting headlines that:
        
        1. Include the primary keyword naturally
        2. Promise specific value/transformation
        3. Create urgency or curiosity
        4. Match search intent
        5. Stand out from competitor headlines
        6. Work for both SEO and social sharing
        
        Variety needed:
        - 2 data-driven headlines (with numbers)
        - 2 contrarian/surprising angle headlines
        - 2 how-to/practical headlines
        - 2 curiosity gap headlines
        - 2 urgency/timeliness headlines
        
        Also provide:
        - Meta description (155 chars)
        - Social media headline variant
        - Email subject line variant"""
        
        return await self.generate(task, brief, seo_data)

class NarrativeArchitectAgent(ContentAgent):
    """Specialized narrative structure agent"""
    async def design_structure(self, brief: ContentBrief, headlines: Dict, seo_data: Dict) -> Dict[str, Any]:
        task = f"""Design the optimal narrative structure for maximum engagement:
        
        Create detailed outline with:
        1. Hook (first 3 sentences) - emotional connection
        2. Stakes section - why this matters now
        3. Discovery section - unique insights/data
        4. Proof section - evidence and examples
        5. Method section - step-by-step implementation
        6. Payoff section - specific outcomes
        7. CTA section - clear next action
        
        For each section provide:
        - Key message
        - Emotional tone
        - Data points to include
        - Transition to next section
        - Word count allocation
        - Keywords to naturally include
        
        Ensure natural keyword distribution and semantic SEO."""
        
        return await self.generate(task, brief, {
            'headlines': headlines,
            'seo_data': seo_data
        })

class DataStorytellerAgent(ContentAgent):
    """Specialized data and evidence agent"""
    async def gather_evidence(self, brief: ContentBrief, structure: Dict) -> Dict[str, Any]:
        task = f"""Find and present compelling data to support the narrative:
        
        Required:
        1. Opening statistic that grabs attention
        2. 3-5 supporting statistics with sources
        3. Before/after comparison data
        4. Competitor or industry benchmarks
        5. Case study with specific numbers
        6. Visual data representation ideas
        7. ROI calculations or projections
        
        For each data point:
        - Source and date
        - How to present it memorably
        - What emotion it should evoke
        - How it advances the narrative
        
        Focus on Dave Shapiro's results:
        - 509% traffic growth at SoFi
        - 494% at Adobe
        - Fortune 500 transformations"""
        
        return await self.generate(task, brief, {'structure': structure})

class ContentCreatorAgent(ContentAgent):
    """Main content writing agent"""
    async def write_content(self, brief: ContentBrief, structure: Dict, data: Dict, headlines: Dict) -> Dict[str, Any]:
        task = f"""Write the complete blog post following the structure and incorporating all elements:
        
        Requirements:
        1. Start with the strongest headline option
        2. Follow the exact narrative structure provided
        3. Incorporate all data points naturally
        4. Maintain consistent tone throughout
        5. Include all keywords organically
        6. Create smooth transitions
        7. Make it scannable with formatting
        8. Hit the target word count
        
        Style guidelines:
        - Short paragraphs (2-3 sentences)
        - Active voice
        - Specific over general
        - Show don't tell
        - Include personal insights
        - Add strategic boldface
        - Use bullet points for lists
        - Include relevant subheadings
        
        Remember: Dave Shapiro's voice is expert guide, not guru."""
        
        return await self.generate(task, brief, {
            'structure': structure,
            'data': data,
            'headlines': headlines
        })

class ContentEditorInChief:
    """Chief editor orchestrating all content agents"""
    def __init__(self):
        self.knowledge_graph = ContentKnowledgeGraph()
        self.agents = self._initialize_agents()
        
    def _initialize_agents(self) -> Dict[str, ContentAgent]:
        """Initialize all specialized agents"""
        return {
            'seo_researcher': SEOResearchAgent(ContentAgentRole.SEO_RESEARCHER, self.knowledge_graph),
            'headline_optimizer': HeadlineOptimizerAgent(ContentAgentRole.HEADLINE_OPTIMIZER, self.knowledge_graph),
            'narrative_architect': NarrativeArchitectAgent(ContentAgentRole.NARRATIVE_ARCHITECT, self.knowledge_graph),
            'data_storyteller': DataStorytellerAgent(ContentAgentRole.DATA_STORYTELLER, self.knowledge_graph),
            'content_creator': ContentCreatorAgent(ContentAgentRole.TECHNICAL_WRITER, self.knowledge_graph),
            'seo_optimizer': ContentAgent(ContentAgentRole.SEO_OPTIMIZER, self.knowledge_graph),
            'readability_editor': ContentAgent(ContentAgentRole.READABILITY_EDITOR, self.knowledge_graph),
            'fact_checker': ContentAgent(ContentAgentRole.FACT_CHECKER, self.knowledge_graph),
            'cta_specialist': ContentAgent(ContentAgentRole.CTA_SPECIALIST, self.knowledge_graph),
            'quality_auditor': ContentAgent(ContentAgentRole.QUALITY_AUDITOR, self.knowledge_graph)
        }
    
    async def create_blog_post(self, brief: ContentBrief) -> Dict[str, Any]:
        """Orchestrate full blog post creation"""
        print(f"\n📝 Creating blog post: {brief.topic}")
        print(f"   Target: {brief.target_audience}")
        print(f"   Goal: {brief.business_goal}")
        print("=" * 50)
        
        # Phase 1: Research
        print("\n🔍 Phase 1: Research & Analysis")
        seo_data = await self.agents['seo_researcher'].research_keywords(brief.topic)
        
        # Phase 2: Planning
        print("\n📋 Phase 2: Strategic Planning")
        headlines = await self.agents['headline_optimizer'].generate_headlines(brief, seo_data)
        structure = await self.agents['narrative_architect'].design_structure(brief, headlines, seo_data)
        
        # Phase 3: Evidence Gathering
        print("\n📊 Phase 3: Data & Evidence Collection")
        data = await self.agents['data_storyteller'].gather_evidence(brief, structure)
        
        # Phase 4: Content Creation
        print("\n✍️ Phase 4: Content Writing")
        content = await self.agents['content_creator'].write_content(brief, structure, data, headlines)
        
        # Phase 5: Optimization
        print("\n🎯 Phase 5: SEO Optimization")
        optimized = await self.agents['seo_optimizer'].generate(
            "Optimize content for SEO without losing readability",
            brief,
            {'content': content}
        )
        
        # Phase 6: Polish
        print("\n✨ Phase 6: Editorial Polish")
        edited = await self.agents['readability_editor'].generate(
            "Edit for flow, clarity, and engagement",
            brief,
            {'content': optimized}
        )
        
        # Phase 7: CTAs
        print("\n🎯 Phase 7: Call-to-Action Optimization")
        with_ctas = await self.agents['cta_specialist'].generate(
            "Add compelling CTAs throughout the content",
            brief,
            {'content': edited}
        )
        
        # Phase 8: Quality Check
        print("\n✅ Phase 8: Final Quality Audit")
        final = await self.agents['quality_auditor'].generate(
            "Perform final quality check and scoring",
            brief,
            {'content': with_ctas}
        )
        
        # Register in knowledge graph
        self.knowledge_graph.register_topic(
            brief.topic,
            [brief.primary_keyword] + brief.secondary_keywords,
            {'status': 'completed', 'score': 0}
        )
        
        print("\n🎉 Blog post creation complete!")
        
        return {
            'brief': asdict(brief),
            'seo_research': seo_data,
            'headlines': headlines,
            'structure': structure,
            'data': data,
            'final_content': final,
            'metadata': {
                'created': datetime.now().isoformat(),
                'agents_used': list(self.agents.keys()),
                'word_count': brief.word_count
            }
        }
    
    async def create_content_series(self, topic_cluster: str, subtopics: List[str]) -> List[Dict]:
        """Create a series of related blog posts"""
        print(f"\n📚 Creating content series: {topic_cluster}")
        print(f"   Subtopics: {len(subtopics)}")
        
        posts = []
        for subtopic in subtopics:
            brief = ContentBrief(
                topic=subtopic,
                target_audience="Enterprise SEO/AI decision makers",
                primary_keyword=subtopic.lower().replace(' ', '-'),
                secondary_keywords=[],
                content_type="thought-leadership",
                word_count=2500,
                business_goal="authority-building",
                pain_points=["Falling behind on AI", "Inefficient processes", "Competitive pressure"],
                desired_outcomes=["AI adoption", "Process improvement", "Competitive advantage"],
                tone="expert-guide"
            )
            
            post = await self.create_blog_post(brief)
            posts.append(post)
            
            # Add internal links to previous posts
            if len(posts) > 1:
                related = self.knowledge_graph.get_related_content(subtopic)
                post['internal_links'] = related
        
        return posts

# Helper Functions
def create_content_brief(
    topic: str,
    audience: str = "Enterprise SEO/AI teams",
    content_type: str = "how-to",
    word_count: int = 2000
) -> ContentBrief:
    """Quick brief creator"""
    return ContentBrief(
        topic=topic,
        target_audience=audience,
        primary_keyword=topic.lower().replace(' ', '-'),
        secondary_keywords=[],
        content_type=content_type,
        word_count=word_count,
        business_goal="lead-generation",
        pain_points=[
            "Not leveraging AI effectively",
            "Losing to AI-powered competitors",
            "Struggling with content scale"
        ],
        desired_outcomes=[
            "Implement AI tools successfully",
            "Increase content production 10x",
            "Generate measurable ROI"
        ],
        tone="expert-guide"
    )

async def generate_blog_post(topic: str, **kwargs) -> Dict[str, Any]:
    """Simple interface to generate a blog post"""
    brief = create_content_brief(topic, **kwargs)
    editor = ContentEditorInChief()
    return await editor.create_blog_post(brief)

# Specialized content generators
async def generate_case_study(
    client: str,
    results: str,
    challenge: str,
    solution: str
) -> Dict[str, Any]:
    """Generate a case study blog post"""
    brief = ContentBrief(
        topic=f"How {client} Achieved {results}",
        target_audience="Enterprise marketing leaders",
        primary_keyword=f"{client.lower()}-case-study",
        secondary_keywords=[client.lower(), "case study", "success story"],
        content_type="case-study",
        word_count=3000,
        business_goal="lead-generation",
        pain_points=[challenge],
        desired_outcomes=[results],
        tone="analytical"
    )
    
    editor = ContentEditorInChief()
    return await editor.create_blog_post(brief)

async def generate_breaking_news(
    news: str,
    angle: str,
    implications: List[str]
) -> Dict[str, Any]:
    """Generate breaking news/trending topic post"""
    brief = ContentBrief(
        topic=news,
        target_audience="Tech-savvy marketers and AI enthusiasts",
        primary_keyword=news.lower().replace(' ', '-'),
        secondary_keywords=["breaking", "news", "update"],
        content_type="thought-leadership",
        word_count=1500,
        business_goal="authority-building",
        pain_points=["Missing important updates", "Not understanding implications"],
        desired_outcomes=implications,
        tone="conversational",
        urgency_level="high"
    )
    
    editor = ContentEditorInChief()
    return await editor.create_blog_post(brief)

# Export main components
__all__ = [
    'ContentBrief',
    'ContentEditorInChief',
    'generate_blog_post',
    'generate_case_study',
    'generate_breaking_news',
    'ContentAgentRole',
    'CONTENT_EXPERTS'
]