/**
 * Educational Content Generation System - Type Definitions
 * Research-driven, fact-based content with proper attribution
 */

// ============================================================================
// Configuration Types
// ============================================================================

export interface PipelineConfig {
  dataForSeo?: {
    apiKey: string;
    baseUrl?: string;
  };
  reddit?: {
    clientId: string;
    clientSecret: string;
    userAgent: string;
  };
  openai?: {
    apiKey: string;
    model?: string;
    embeddingModel?: string;
  };
  anthropic?: {
    apiKey: string;
    model?: string;
  };
  core?: {
    apiKey: string;
    baseUrl?: string;
  };
  crossref?: {
    apiKey?: string;
    baseUrl?: string;
  };
  vectorDb?: {
    type: 'memory' | 'faiss' | 'lancedb';
    path?: string;
  };
  cache?: {
    baseDir?: string;
    serpTtlMs?: number;
    scrapeTtlMs?: number;
  };
}

export interface ResearchRequest {
  keyword: string;
  depth?: 'quick' | 'standard' | 'comprehensive';
  audience?: 'beginner' | 'intermediate' | 'advanced' | 'mixed';
  format?: 'article' | 'report' | 'tutorial' | 'analysis';
  maxSources?: number;
  minCredibilityScore?: number;
  includeReddit?: boolean;
  includeNews?: boolean;
  includeAcademic?: boolean;
  requireMultiplePerspectives?: boolean;
}

// ============================================================================
// Source & Credibility Types
// ============================================================================

export type SourceType =
  | 'academic'           // Peer-reviewed papers (highest credibility)
  | 'official-docs'      // Official documentation
  | 'industry-research'  // Gartner, Forrester, etc.
  | 'expert-commentary'  // Named experts with credentials
  | 'news'              // Reputable news outlets
  | 'community'         // Reddit, forums (for pain points, not facts)
  | 'blog';            // Blog posts (lowest credibility)

export interface Source {
  id: string;
  url: string;
  title: string;
  type: SourceType;
  date?: Date;
  authors?: string[];
  publication?: string;
  doi?: string;

  // Credibility scoring
  credibilityScore: number;  // 0-100
  credibilityBreakdown: {
    authority: number;       // 0-30 points
    recency: number;         // 0-20 points
    citations: number;       // 0-20 points
    methodology: number;     // 0-15 points
    bias: number;           // 0-15 points
  };

  // Quality flags
  hasConflictOfInterest?: boolean;
  isOutdated?: boolean;
  hasMethodology?: boolean;
  citationCount?: number;

  metadata?: Record<string, any>;
}

// ============================================================================
// Content Processing Types
// ============================================================================

export interface ChunkData {
  id: string;
  content: string;
  source: Source;
  embedding?: number[];

  // Semantic chunking metadata
  metadata: {
    conceptType?: 'definition' | 'explanation' | 'example' | 'procedure' | 'comparison' | 'general';
    position: number;
    totalChunks: number;
    tokens: number;
    startChar: number;
    endChar: number;

    // Context sufficiency
    isSelfContained: boolean;
    contextDependencies?: string[];  // IDs of chunks needed for context

    // Extracted entities
    entities?: string[];
    topics?: string[];
    keywords?: string[];
  };
}

export interface ContextSufficiency {
  isRelevant: boolean;      // Does it relate to the query?
  isSufficient: boolean;    // Can LLM answer from this alone?
  completeness: number;     // 0-100 score
  missingInfo?: string[];   // What's still needed
  recommendedAction: 'use' | 'refine_query' | 'search_more' | 'combine_chunks';
}

// ============================================================================
// RAG & Retrieval Types
// ============================================================================

export interface QueryIntent {
  type: 'factual' | 'howto' | 'comparison' | 'definition' | 'opinion' | 'troubleshooting';
  complexity: 'basic' | 'intermediate' | 'advanced';
  sourcesNeeded: 'single' | 'multiple' | 'comprehensive';
  requiresAcademic: boolean;
  requiresMultiplePerspectives: boolean;
}

export interface RetrievalStrategy {
  queryIntent: QueryIntent;
  minSources: number;
  minCredibilityScore: number;
  diversityRequired: boolean;
  maxAge?: number;  // milliseconds
}

export interface RetrievalResult {
  chunks: ChunkData[];
  sufficiency: ContextSufficiency;
  sourceDiversity: {
    types: Record<SourceType, number>;
    perspectives: number;
    dateRange: { oldest: Date; newest: Date };
  };
  needsRefinement: boolean;
  refinedQuery?: string;
}

// ============================================================================
// Claim Verification Types
// ============================================================================

export interface Claim {
  id: string;
  statement: string;
  type: 'fact' | 'statistic' | 'quote' | 'opinion' | 'interpretation';
  sources: Source[];
  verified: boolean;
  confidence: number;  // 0-100

  // Verification details
  verification: {
    supportingSources: Source[];
    conflictingSources: Source[];
    agreement: boolean;
    needsReview: boolean;
    verificationMethod: 'direct_quote' | 'paraphrase' | 'synthesis' | 'inference';
  };

  // For flagging issues
  issues?: ClaimIssue[];
}

export interface ClaimIssue {
  type: 'unsourced' | 'hallucination' | 'outdated' | 'conflicting' | 'unverified' | 'biased';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  recommendation: string;
}

// ============================================================================
// Citation Types
// ============================================================================

export interface Citation {
  id: string;
  inlineMarker: string;  // [1], [2], etc.
  source: Source;
  quotedText?: string;
  pageNumber?: string;
  accessDate: Date;

  // For different citation styles
  apa?: string;
  mla?: string;
  chicago?: string;
}

export interface CitationManager {
  citations: Map<string, Citation>;
  nextNumber: number;

  addCitation(source: Source, quotedText?: string): Citation;
  getCitation(id: string): Citation | undefined;
  formatBibliography(style?: 'apa' | 'mla' | 'chicago'): string;
  generateInlineCitation(citationId: string): string;
}

// ============================================================================
// Educational Content Types
// ============================================================================

export interface ConceptExplanation {
  concept: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';

  // ADEPT method
  analogy: string;
  diagram?: string;        // URL or SVG
  example: string;
  plainExplanation: string;
  technicalDefinition: string;

  // Additional educational elements
  prerequisites?: string[];
  relatedConcepts?: string[];
  commonMisconceptions?: string[];
  furtherReading?: Citation[];
}

export interface LearningObjective {
  id: string;
  description: string;
  level: 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';  // Bloom's taxonomy
  achieved: boolean;
  assessmentQuestion?: string;
}

export interface ContentSection {
  id: string;
  heading: string;
  content: string;
  level: number;  // 1-5, where 1 = basics, 5 = advanced

  // Educational structure
  learningObjectives?: LearningObjective[];
  concepts?: ConceptExplanation[];
  examples?: Example[];
  exercises?: Exercise[];

  // Evidence and citations
  claims: Claim[];
  citations: Citation[];
  evidence?: Evidence[];

  // Quality metadata
  readabilityScore?: number;
  technicalDensity?: number;  // 0-100
  conceptsIntroduced?: string[];

  metadata?: {
    wordCount: number;
    readingTimeMinutes: number;
    keyTakeaways?: string[];
  };
}

export interface Example {
  id: string;
  description: string;
  code?: string;
  language?: string;
  output?: string;
  explanation: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface Exercise {
  id: string;
  question: string;
  type: 'multiple_choice' | 'short_answer' | 'code' | 'discussion';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  hints?: string[];
  solution?: string;
}

export interface Evidence {
  claim: string;
  sources: Source[];
  confidence: number;
  citationIds: string[];
  visualizations?: DataVisualization[];
}

export interface DataVisualization {
  type: 'table' | 'chart' | 'graph' | 'diagram';
  data: any;
  caption: string;
  sources: Citation[];
}

// ============================================================================
// Perspective & Bias Types
// ============================================================================

export interface Perspective {
  id: string;
  viewpoint: string;
  proponents: string[];    // Names/credentials of who holds this view
  evidence: Citation[];
  strengths: string[];
  weaknesses: string[];
  counterArguments?: string[];
}

export interface BiasCheck {
  type: 'source' | 'presentation' | 'selection' | 'confirmation';
  severity: 'low' | 'medium' | 'high';
  description: string;
  affectedSources?: Source[];
  mitigation: string;
}

export interface PerspectiveAnalysis {
  topic: string;
  isControversial: boolean;
  perspectives: Perspective[];
  consensus?: string;
  areasOfDisagreement?: string[];
  biases: BiasCheck[];
}

// ============================================================================
// Quality & Verification Types
// ============================================================================

export interface HallucinationCheck {
  claim: Claim;
  isPotentialHallucination: boolean;
  reason: string;
  foundInSources: boolean;
  sourceExcerpts?: string[];
  recommendation: 'keep' | 'revise' | 'remove' | 'add_citation';
}

export interface FactCheck {
  claim: string;
  sources: Source[];
  agreement: boolean;
  conflictingData?: {
    source1: { claim: string; citation: Citation };
    source2: { claim: string; citation: Citation };
  };
  confidence: number;
  status: 'verified' | 'partially_verified' | 'unverified' | 'conflicting';
}

export interface CurrencyCheck {
  topic: string;
  maxAgeMs: number;
  outdatedSources: Source[];
  hasOutdatedInfo: boolean;
  recommendation: string;
}

export interface QualityScore {
  overall: number;  // 0-100
  breakdown: {
    sourceCredibility: number;      // Avg credibility of sources
    citationCoverage: number;       // % of claims cited
    factVerification: number;       // % of claims verified
    conceptClarity: number;         // Readability + examples
    perspectiveDiversity: number;   // Multiple viewpoints?
    currency: number;               // How recent are sources?
    educationalValue: number;       // Learning objectives met?
  };
  issues: QualityIssue[];
  readyToPublish: boolean;
  recommendations: string[];
}

export interface QualityIssue {
  type: 'citation' | 'verification' | 'clarity' | 'bias' | 'currency' | 'structure';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  location?: string;  // Section ID or line number
  recommendation: string;
}

// ============================================================================
// Synthesis Result Types
// ============================================================================

export interface SynthesisResult {
  // Metadata
  meta: ContentMeta;

  // Main content
  title: string;
  summary: string;
  sections: ContentSection[];

  // Learning structure
  learningObjectives: LearningObjective[];
  prerequisites?: string[];
  targetAudience: 'beginner' | 'intermediate' | 'advanced' | 'mixed';

  // Citations and sources
  citations: Citation[];
  bibliography: string;
  sources: Source[];

  // Insights and perspectives
  insights: Insight[];
  perspectives?: PerspectiveAnalysis;

  // Quality assessment
  qualityScore: QualityScore;
  claims: Claim[];
  hallucinationChecks: HallucinationCheck[];
  factChecks: FactCheck[];
  biasChecks: BiasCheck[];

  // Educational elements
  keyTakeaways: string[];
  furtherReading: Citation[];
  glossary?: Record<string, string>;
}

export interface ContentMeta {
  title: string;
  description: string;
  keywords: string[];
  audience: string;
  readingTime: number;
  publishDate: string;
  lastUpdated?: string;
  format: 'article' | 'tutorial' | 'report' | 'analysis';

  // Educational metadata
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'mixed';
  topics: string[];
  learningPath?: string;  // Part of a series?

  // Quality indicators
  sourceCount: number;
  academicSourceCount: number;
  averageSourceCredibility: number;
  citationCount: number;
  qualityScore: number;
}

export interface Insight {
  id: string;
  type: 'trend' | 'controversy' | 'opportunity' | 'gap' | 'misconception';
  title: string;
  description: string;

  supporting: Citation[];
  conflicting?: Citation[];
  confidence: number;

  implications?: string[];
  relatedConcepts?: string[];
}

// ============================================================================
// Pipeline State Types
// ============================================================================

export interface PipelineState {
  stage: 'research' | 'processing' | 'synthesis' | 'quality' | 'complete' | 'error';
  progress: number;  // 0-100
  currentTask: string;

  // Results from each stage
  researchResults?: {
    sources: Source[];
    sourceDiversity: Record<SourceType, number>;
  };

  processingResults?: {
    chunks: ChunkData[];
    embeddings: boolean;
  };

  synthesisResults?: SynthesisResult;

  // Timing
  startTime: Date;
  endTime?: Date;
  duration?: number;

  // Errors and warnings
  errors: Error[];
  warnings: string[];
}

// ============================================================================
// API Response Types
// ============================================================================

export interface CoreApiResponse {
  status: string;
  totalHits: number;
  data: CorePaper[];
}

export interface CorePaper {
  id: string;
  title: string;
  authors: string[];
  abstract: string;
  publishedDate: string;
  downloadUrl?: string;
  doi?: string;
  citationCount: number;
  subjects?: string[];
  publisher?: string;
  yearPublished: number;
}

export interface CrossrefResponse {
  status: string;
  message: {
    items: CrossrefWork[];
  };
}

export interface CrossrefWork {
  DOI: string;
  title: string[];
  author: Array<{ given: string; family: string }>;
  published: { 'date-parts': number[][] };
  'is-referenced-by-count': number;
  publisher: string;
  type: string;
  abstract?: string;
}
