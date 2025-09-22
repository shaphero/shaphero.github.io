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
  };
  anthropic?: {
    apiKey: string;
    model?: string;
  };
  vectorDb?: {
    type: 'memory' | 'faiss' | 'lancedb';
    path?: string;
  };
}

export interface ResearchRequest {
  keyword: string;
  depth?: 'quick' | 'standard' | 'comprehensive';
  audience?: 'executive' | 'technical' | 'general';
  format?: 'article' | 'report' | 'analysis';
  maxSources?: number;
  includeReddit?: boolean;
  includeNews?: boolean;
}

export interface ContentMeta {
  title: string;
  description: string;
  keywords: string[];
  audience: string;
  readingTime: number;
  publishDate: string;
  sources: Source[];
}

export interface Source {
  url: string;
  title: string;
  type: 'article' | 'reddit' | 'news' | 'research';
  date?: string;
  score?: number;
  metadata?: Record<string, any>;
}

export interface ChunkData {
  id: string;
  content: string;
  source: Source;
  embedding?: number[];
  metadata?: {
    position: number;
    totalChunks: number;
    tokens: number;
  };
}

export interface SynthesisResult {
  meta: ContentMeta;
  summary: string;
  sections: ContentSection[];
  citations: Citation[];
  insights: Insight[];
}

export interface ContentSection {
  heading: string;
  content: string;
  level: number;
  evidence?: Evidence[];
}

export interface Evidence {
  claim: string;
  sources: string[];
  confidence: number;
}

export interface Citation {
  id: string;
  text: string;
  url: string;
  source: string;
}

export interface Insight {
  type: 'trend' | 'controversy' | 'opportunity' | 'risk';
  title: string;
  description: string;
  supporting: string[];
  conflicting?: string[];
}