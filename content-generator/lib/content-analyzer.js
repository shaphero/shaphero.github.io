/**
 * Content Analysis and Gap Identification Module
 * Analyzes competitor content and identifies gaps
 */

import natural from 'natural';
import stopword from 'stopword';

class ContentAnalyzer {
  constructor() {
    this.tfidf = new natural.TfIdf();
    this.tokenizer = new natural.WordTokenizer();
  }

  /**
   * Analyze content comprehensiveness
   */
  analyzeComprehensiveness(competitorData, paaQuestions, redditInsights) {
    const analysis = {
      topicsCovered: [],
      topicsMissing: [],
      questionsCovered: [],
      questionsUnanswered: [],
      depthScore: 0,
      breadthScore: 0,
      gaps: [],
      opportunities: []
    };

    // Extract all topics from competitors
    const allTopics = this.extractTopicsFromCompetitors(competitorData);

    // Analyze PAA coverage
    const paaAnalysis = this.analyzePAACoverage(paaQuestions, competitorData);

    // Analyze Reddit pain points coverage
    const redditAnalysis = this.analyzeRedditCoverage(redditInsights, competitorData);

    // Calculate scores
    analysis.topicsCovered = allTopics.covered;
    analysis.topicsMissing = allTopics.missing;
    analysis.questionsCovered = paaAnalysis.covered;
    analysis.questionsUnanswered = paaAnalysis.unanswered;

    // Identify gaps
    analysis.gaps = this.identifyContentGaps(
      allTopics,
      paaAnalysis,
      redditAnalysis
    );

    // Find opportunities
    analysis.opportunities = this.identifyOpportunities(
      competitorData,
      paaQuestions,
      redditInsights
    );

    // Calculate scores
    analysis.depthScore = this.calculateDepthScore(competitorData);
    analysis.breadthScore = this.calculateBreadthScore(allTopics);

    return analysis;
  }

  /**
   * Extract topics from competitor content
   */
  extractTopicsFromCompetitors(competitors) {
    const topics = {
      covered: [],
      missing: [],
      frequency: {}
    };

    // Extract topics from titles and descriptions
    competitors.forEach(comp => {
      const text = `${comp.title} ${comp.description}`.toLowerCase();
      const tokens = this.tokenizer.tokenize(text);
      const cleaned = stopword.removeStopwords(tokens);

      // Extract noun phrases as topics
      const nounPhrases = this.extractNounPhrases(text);
      nounPhrases.forEach(phrase => {
        topics.frequency[phrase] = (topics.frequency[phrase] || 0) + 1;
      });

      // Extract key terms using TF-IDF
      this.tfidf.addDocument(cleaned.join(' '));
    });

    // Identify commonly covered topics
    topics.covered = Object.entries(topics.frequency)
      .filter(([_, count]) => count >= 2)
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count);

    return topics;
  }

  /**
   * Analyze PAA question coverage
   */
  analyzePAACoverage(paaQuestions, competitors) {
    const analysis = {
      covered: [],
      unanswered: [],
      partiallyAnswered: []
    };

    paaQuestions.forEach(question => {
      let coverage = 'unanswered';
      let matchingCompetitor = null;

      // Check if any competitor addresses this question
      competitors.forEach(comp => {
        const compText = `${comp.title} ${comp.description}`.toLowerCase();
        const questionKeywords = this.extractKeywords(question.question);

        const matchCount = questionKeywords.filter(keyword =>
          compText.includes(keyword.toLowerCase())
        ).length;

        const matchPercentage = matchCount / questionKeywords.length;

        if (matchPercentage > 0.7) {
          coverage = 'covered';
          matchingCompetitor = comp.url;
        } else if (matchPercentage > 0.4 && coverage === 'unanswered') {
          coverage = 'partial';
          matchingCompetitor = comp.url;
        }
      });

      if (coverage === 'covered') {
        analysis.covered.push({ question: question.question, answeredBy: matchingCompetitor });
      } else if (coverage === 'partial') {
        analysis.partiallyAnswered.push({ question: question.question, partialBy: matchingCompetitor });
      } else {
        analysis.unanswered.push(question.question);
      }
    });

    return analysis;
  }

  /**
   * Analyze Reddit insights coverage
   */
  analyzeRedditCoverage(redditInsights, competitors) {
    const analysis = {
      painPointsAddressed: [],
      painPointsMissing: [],
      solutionsProvided: [],
      solutionsMissing: []
    };

    // Check pain points coverage
    redditInsights.painPoints?.forEach(painPoint => {
      const addressed = competitors.some(comp => {
        const compText = `${comp.title} ${comp.description}`.toLowerCase();
        return compText.includes(painPoint.text.toLowerCase()) ||
               compText.includes(painPoint.trigger.toLowerCase());
      });

      if (addressed) {
        analysis.painPointsAddressed.push(painPoint);
      } else {
        analysis.painPointsMissing.push(painPoint);
      }
    });

    // Check solutions coverage
    redditInsights.solutions?.forEach(solution => {
      const keywords = this.extractKeywords(solution.solution);
      const covered = competitors.some(comp => {
        const compText = `${comp.title} ${comp.description}`.toLowerCase();
        return keywords.some(keyword => compText.includes(keyword.toLowerCase()));
      });

      if (covered) {
        analysis.solutionsProvided.push(solution);
      } else {
        analysis.solutionsMissing.push(solution);
      }
    });

    return analysis;
  }

  /**
   * Identify content gaps
   */
  identifyContentGaps(topics, paaAnalysis, redditAnalysis) {
    const gaps = [];

    // Questions not answered
    if (paaAnalysis.unanswered.length > 0) {
      gaps.push({
        type: 'unanswered_questions',
        priority: 'high',
        items: paaAnalysis.unanswered,
        recommendation: 'Create dedicated sections answering these questions directly'
      });
    }

    // Partially answered questions
    if (paaAnalysis.partiallyAnswered.length > 0) {
      gaps.push({
        type: 'incomplete_answers',
        priority: 'medium',
        items: paaAnalysis.partiallyAnswered,
        recommendation: 'Expand coverage of these topics with more detail'
      });
    }

    // Missing pain points
    if (redditAnalysis.painPointsMissing.length > 0) {
      gaps.push({
        type: 'unaddressed_pain_points',
        priority: 'high',
        items: redditAnalysis.painPointsMissing,
        recommendation: 'Address these user pain points with solutions'
      });
    }

    // Missing solutions
    if (redditAnalysis.solutionsMissing.length > 0) {
      gaps.push({
        type: 'missing_solutions',
        priority: 'medium',
        items: redditAnalysis.solutionsMissing,
        recommendation: 'Include these proven solutions from community'
      });
    }

    return gaps;
  }

  /**
   * Identify content opportunities
   */
  identifyOpportunities(competitors, paaQuestions, redditInsights) {
    const opportunities = [];

    // Featured snippet opportunities
    const snippetOps = this.identifySnippetOpportunities(competitors, paaQuestions);
    if (snippetOps.length > 0) {
      opportunities.push({
        type: 'featured_snippets',
        items: snippetOps,
        potential: 'high',
        strategy: 'Format content with clear definitions, lists, and tables'
      });
    }

    // Depth opportunities
    const avgWordCount = this.estimateAverageWordCount(competitors);
    if (avgWordCount < 2000) {
      opportunities.push({
        type: 'content_depth',
        currentAverage: avgWordCount,
        recommended: 3000,
        potential: 'high',
        strategy: 'Create comprehensive guide exceeding competitor depth'
      });
    }

    // User language opportunities
    const userLanguage = redditInsights.userLanguage?.slice(0, 10) || [];
    if (userLanguage.length > 0) {
      opportunities.push({
        type: 'user_language',
        phrases: userLanguage,
        potential: 'medium',
        strategy: 'Use these exact phrases to match user search intent'
      });
    }

    // Freshness opportunity
    opportunities.push({
      type: 'content_freshness',
      potential: 'high',
      strategy: 'Include latest 2025 data, trends, and examples'
    });

    return opportunities;
  }

  /**
   * Identify featured snippet opportunities
   */
  identifySnippetOpportunities(competitors, paaQuestions) {
    const opportunities = [];

    // Check for missing structured content
    const hasLists = competitors.some(c =>
      c.description?.includes('•') ||
      c.description?.includes('1.')
    );

    const hasTables = competitors.some(c =>
      c.description?.includes('|') ||
      c.description?.includes('table')
    );

    if (!hasLists) {
      opportunities.push({
        format: 'list',
        questions: paaQuestions.filter(q =>
          q.question.toLowerCase().includes('how to') ||
          q.question.toLowerCase().includes('steps')
        ).map(q => q.question)
      });
    }

    if (!hasTables) {
      opportunities.push({
        format: 'table',
        questions: paaQuestions.filter(q =>
          q.question.toLowerCase().includes('compare') ||
          q.question.toLowerCase().includes('vs') ||
          q.question.toLowerCase().includes('difference')
        ).map(q => q.question)
      });
    }

    return opportunities;
  }

  /**
   * Calculate content depth score
   */
  calculateDepthScore(competitors) {
    // Estimate based on description length and detail
    const avgLength = competitors.reduce((sum, c) =>
      sum + (c.description?.length || 0), 0
    ) / competitors.length;

    // Score based on average description length
    if (avgLength > 300) return 90;
    if (avgLength > 200) return 70;
    if (avgLength > 150) return 50;
    return 30;
  }

  /**
   * Calculate content breadth score
   */
  calculateBreadthScore(topics) {
    const topicCount = topics.covered?.length || 0;

    // Score based on topic coverage
    if (topicCount > 20) return 90;
    if (topicCount > 15) return 70;
    if (topicCount > 10) return 50;
    return 30;
  }

  /**
   * Extract noun phrases from text
   */
  extractNounPhrases(text) {
    const phrases = [];

    // Simple noun phrase patterns
    const patterns = [
      /\b(\w+\s+\w+)\b/g, // Two-word phrases
      /\b(\w+\s+\w+\s+\w+)\b/g // Three-word phrases
    ];

    patterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        phrases.push(...matches.filter(m =>
          m.length > 5 &&
          !stopword.removeStopwords(m.split(' ')).length === 0
        ));
      }
    });

    return [...new Set(phrases)];
  }

  /**
   * Extract keywords from text
   */
  extractKeywords(text) {
    const tokens = this.tokenizer.tokenize(text.toLowerCase());
    const cleaned = stopword.removeStopwords(tokens);
    return cleaned.filter(word => word.length > 3);
  }

  /**
   * Estimate word count from meta description
   */
  estimateAverageWordCount(competitors) {
    // Rough estimate based on description length
    // Typical ratio: 1 meta char ≈ 10 content words
    const avgDescLength = competitors.reduce((sum, c) =>
      sum + (c.description?.length || 0), 0
    ) / competitors.length;

    return Math.round(avgDescLength * 10);
  }
}

export default ContentAnalyzer;