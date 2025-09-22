/**
 * Claude CLI Integration Module
 * Handles content generation through Claude Code CLI
 */

import { exec, execSync } from 'child_process';
import { promisify } from 'util';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

class ClaudeCLI {
  constructor() {
    this.claudePath = process.env.CLAUDE_CLI_PATH || 'claude';
    this.tempDir = path.join(os.tmpdir(), 'content-generator');
    fs.ensureDirSync(this.tempDir);
  }

  /**
   * Check if Claude CLI is available
   */
  isAvailable() {
    try {
      const result = execSync('which claude', { encoding: 'utf8' }).trim();
      return result.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Generate content using Claude CLI
   */
  async generateContent(prompt, options = {}) {
    const {
      model = 'sonnet',
      maxTokens = 4000,
      temperature = 0.7,
      systemPrompt = ''
    } = options;

    try {
      // Create a structured prompt with system instructions
      const fullPrompt = this.buildPrompt(prompt, systemPrompt);

      // Save prompt to temp file (for long prompts)
      const promptFile = path.join(this.tempDir, `prompt_${Date.now()}.txt`);
      await fs.writeFile(promptFile, fullPrompt);

      // Execute Claude CLI
      const command = `${this.claudePath} --model ${model} < "${promptFile}"`;
      const { stdout, stderr } = await execAsync(command, {
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      });

      // Clean up temp file
      await fs.unlink(promptFile);

      if (stderr) {
        console.warn('Claude CLI warning:', stderr);
      }

      return stdout.trim();
    } catch (error) {
      console.error('Claude CLI Error:', error.message);
      throw error;
    }
  }

  /**
   * Generate comprehensive outline
   */
  async generateOutline(topic, research) {
    const systemPrompt = `You are an expert content strategist specializing in comprehensive, in-depth content creation.
Your goal is to create content that:
1. Addresses every possible subtopic and question
2. Provides more value than any existing content
3. Optimizes for both human readers and AI systems (AIO/GEO)
4. Uses clear structure with proper headings
5. Includes data, statistics, and examples`;

    const prompt = `Create a comprehensive content outline for: "${topic}"

Based on this research data:

SERP COMPETITORS:
${JSON.stringify(research.competitors, null, 2)}

PEOPLE ALSO ASK:
${JSON.stringify(research.paa, null, 2)}

REDDIT INSIGHTS:
${JSON.stringify(research.reddit, null, 2)}

CONTENT GAPS:
${JSON.stringify(research.gaps, null, 2)}

Create an exhaustive outline that:
1. Covers all identified topics and questions
2. Goes deeper than competitors
3. Addresses user pain points from Reddit
4. Fills all content gaps
5. Structures content for featured snippets
6. Includes sections for statistics, examples, case studies

Format as a detailed hierarchical outline with:
- Main sections (H2)
- Subsections (H3)
- Key points to cover
- Data/statistics to include
- Examples needed

Make it comprehensive enough to create a 3000-5000 word article.`;

    return await this.generateContent(prompt, { systemPrompt, temperature: 0.3 });
  }

  /**
   * Generate section content
   */
  async generateSection(section, context, style = 'informative') {
    const systemPrompts = {
      informative: `Write clear, comprehensive, and factual content that thoroughly explains the topic. Include specific data, examples, and actionable insights.`,

      conversational: `Write in a friendly, engaging tone while maintaining authority. Use "you" and relatable examples while delivering comprehensive information.`,

      technical: `Write detailed, technical content with precise terminology. Include specifications, methodologies, and in-depth analysis.`,

      persuasive: `Write compelling content that addresses objections and builds a strong case. Use data and social proof while being comprehensive.`
    };

    const prompt = `Write a comprehensive section about: ${section.title}

Context:
${JSON.stringify(context, null, 2)}

Requirements:
1. Be exhaustively comprehensive - cover every aspect
2. Include specific statistics and data points
3. Provide concrete examples and case studies
4. Use clear subheadings for scannability
5. Optimize for featured snippets (lists, tables, definitions)
6. Include citations in [Source Name](URL) format
7. Address these specific points: ${section.points.join(', ')}
8. Minimum 500 words for this section

Style: ${style}

Write the complete section content:`;

    return await this.generateContent(prompt, {
      systemPrompt: systemPrompts[style],
      maxTokens: 8000,
      temperature: 0.5
    });
  }

  /**
   * Enhance content with AIO/GEO optimization
   */
  async optimizeForAIOGEO(content, keywords) {
    const prompt = `Optimize this content for AIO (AI Optimization) and GEO (Generative Engine Optimization):

CONTENT:
${content}

TARGET KEYWORDS:
${keywords.join(', ')}

Apply these optimization techniques:

1. CITE SOURCES: Add credible citations (increases visibility by 115%)
2. ADD STATISTICS: Include specific numbers and data points
3. USE QUOTATIONS: Add expert quotes where relevant
4. STRUCTURE FOR AI: Use clear headers, lists, and definitions
5. ADD SCHEMA HINTS: Structure content for schema markup
6. OPTIMIZE FOR PAA: Format sections to answer questions directly
7. ENTITY OPTIMIZATION: Clearly define and explain entities
8. INFORMATION GAIN: Add unique insights not found elsewhere

Return the optimized content with:
- All original information preserved
- New statistics and citations added
- Better structure for AI extraction
- Clear answers to potential questions
- Formatted for featured snippets

Optimized content:`;

    return await this.generateContent(prompt, {
      temperature: 0.3,
      maxTokens: 10000
    });
  }

  /**
   * Generate meta description
   */
  async generateMetaDescription(title, content) {
    const prompt = `Create an SEO-optimized meta description for this content:

Title: ${title}

Content Summary: ${content.substring(0, 1000)}

Requirements:
- 150-160 characters
- Include primary keyword
- Compelling and click-worthy
- Accurately describes content
- Includes a benefit or value proposition

Meta description:`;

    return await this.generateContent(prompt, {
      temperature: 0.5,
      maxTokens: 100
    });
  }

  /**
   * Generate FAQ section
   */
  async generateFAQ(topic, questions) {
    const prompt = `Create a comprehensive FAQ section for: ${topic}

Answer these questions:
${questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

For each question:
1. Provide a clear, direct answer (2-3 sentences for featured snippet)
2. Follow with detailed explanation (100-200 words)
3. Include examples or data where relevant
4. Use schema-friendly formatting

Format as:
## Frequently Asked Questions

### [Question]
**Quick Answer:** [2-3 sentence direct answer]

[Detailed explanation with examples and data]

Generate the complete FAQ section:`;

    return await this.generateContent(prompt, {
      temperature: 0.4,
      maxTokens: 6000
    });
  }

  /**
   * Build structured prompt
   */
  buildPrompt(userPrompt, systemPrompt) {
    const timestamp = new Date().toISOString();

    return `[System Instructions]
${systemPrompt}

[Context]
Generated at: ${timestamp}
Purpose: Comprehensive content generation optimized for SEO, AIO, and GEO

[User Request]
${userPrompt}

[Output Requirements]
- Be comprehensive and thorough
- Include specific data and examples
- Use proper markdown formatting
- Optimize for search engines and AI systems
- Provide actionable insights
- Maintain high quality and accuracy`;
  }

  /**
   * Clean and format generated content
   */
  cleanContent(content) {
    // Remove any potential artifacts
    content = content.replace(/\[System Instructions\][\s\S]*?\[User Request\]/g, '');
    content = content.replace(/\[Output Requirements\][\s\S]*?---/g, '');

    // Ensure proper markdown formatting
    content = content.replace(/\n{3,}/g, '\n\n'); // Remove excessive line breaks
    content = content.replace(/^- /gm, '• '); // Consistent bullet points

    // Fix heading hierarchy
    content = content.replace(/^#{1}(?!#)/gm, '##'); // Ensure H2 is highest

    return content.trim();
  }

  /**
   * Generate content in batches for very long articles
   */
  async generateLongFormContent(outline, research, options = {}) {
    const sections = [];

    for (const section of outline.sections) {
      console.log(`Generating section: ${section.title}`);

      const content = await this.generateSection(section, {
        research,
        previousSections: sections.map(s => s.title),
        upcomingSection: outline.sections[outline.sections.indexOf(section) + 1]?.title
      }, options.style);

      sections.push({
        title: section.title,
        content: this.cleanContent(content)
      });

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return sections;
  }
}

export default ClaudeCLI;