/**
 * Semantic Chunking - Preserves meaning, not arbitrary splits
 * Chunks at concept boundaries instead of fixed character counts
 */

import type { ChunkData, Source } from './types.js';

export class SemanticChunker {
  /**
   * Chunk content semantically (preserving meaning)
   */
  async chunkContent(
    content: string,
    source: Source,
    options: {
      maxChunkSize?: number;
      minChunkSize?: number;
      overlapSize?: number;
    } = {}
  ): Promise<ChunkData[]> {
    const {
      maxChunkSize = 1000,
      minChunkSize = 200,
      overlapSize = 100,
    } = options;

    // Parse into logical units
    const units = this.parseLogicalUnits(content);

    // Identify concept boundaries
    const concepts = this.identifyConceptBoundaries(units);

    // Chunk at concept boundaries
    const chunks: ChunkData[] = [];
    let currentChunk = '';
    let currentStartChar = 0;
    let chunkId = 0;
    let currentConceptType: ConceptType = 'general';

    for (let i = 0; i < concepts.length; i++) {
      const concept = concepts[i];
      const conceptText = concept.text;

      // Track the concept type (use first non-general type in chunk)
      if (concept.type !== 'general' && currentConceptType === 'general') {
        currentConceptType = concept.type;
      }

      // If adding this concept would exceed max size, finalize current chunk
      if (currentChunk.length + conceptText.length > maxChunkSize && currentChunk.length > 0) {
        chunks.push(this.createChunk(
          chunkId++,
          currentChunk,
          source,
          currentStartChar,
          currentStartChar + currentChunk.length,
          currentConceptType,
          concepts.length
        ));

        // Start new chunk with overlap
        const overlapText = currentChunk.slice(-overlapSize);
        currentChunk = overlapText + conceptText;
        currentStartChar = currentStartChar + currentChunk.length - overlapText.length - conceptText.length;
        currentConceptType = concept.type;
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + conceptText;
      }
    }

    // Add final chunk
    if (currentChunk.length >= minChunkSize) {
      chunks.push(this.createChunk(
        chunkId,
        currentChunk,
        source,
        currentStartChar,
        currentStartChar + currentChunk.length,
        currentConceptType,
        concepts.length
      ));
    }

    return chunks;
  }

  /**
   * Parse content into logical units (paragraphs, sections)
   */
  private parseLogicalUnits(content: string): LogicalUnit[] {
    const units: LogicalUnit[] = [];

    // Split by double newlines (paragraphs)
    const paragraphs = content.split(/\n\n+/);

    for (const para of paragraphs) {
      if (para.trim().length === 0) continue;

      // Check if this is a heading
      const isHeading = /^#{1,6}\s/.test(para) || /^[A-Z][A-Za-z\s]+:?\s*$/.test(para);

      // Check if this is a list
      const isList = /^[\-\*\d]+\.?\s/.test(para);

      // Check if this is code
      const isCode = /^```/.test(para) || para.startsWith('    ');

      units.push({
        text: para,
        type: isHeading ? 'heading' : isList ? 'list' : isCode ? 'code' : 'paragraph',
        length: para.length,
      });
    }

    return units;
  }

  /**
   * Identify concept boundaries in logical units
   */
  private identifyConceptBoundaries(units: LogicalUnit[]): Concept[] {
    const concepts: Concept[] = [];
    let currentConcept: string[] = [];
    let currentType: ConceptType = 'general';

    for (let i = 0; i < units.length; i++) {
      const unit = units[i];

      // Headings start new concepts
      if (unit.type === 'heading') {
        if (currentConcept.length > 0) {
          concepts.push({
            text: currentConcept.join('\n\n'),
            type: currentType,
          });
          currentConcept = [];
        }
        currentType = this.detectConceptType(unit.text);
        currentConcept.push(unit.text);
        continue;
      }

      // Code blocks are self-contained concepts
      if (unit.type === 'code') {
        if (currentConcept.length > 0) {
          concepts.push({
            text: currentConcept.join('\n\n'),
            type: currentType,
          });
          currentConcept = [];
        }
        concepts.push({
          text: unit.text,
          type: 'example',
        });
        currentType = 'general';
        continue;
      }

      // Check for transition markers (new concept starting)
      if (this.isConceptBoundary(unit.text)) {
        if (currentConcept.length > 0) {
          concepts.push({
            text: currentConcept.join('\n\n'),
            type: currentType,
          });
        }
        currentType = this.detectConceptType(unit.text);
        currentConcept = [unit.text];
      } else {
        currentConcept.push(unit.text);
      }
    }

    // Add final concept
    if (currentConcept.length > 0) {
      concepts.push({
        text: currentConcept.join('\n\n'),
        type: currentType,
      });
    }

    return concepts;
  }

  /**
   * Detect if text marks a concept boundary
   */
  private isConceptBoundary(text: string): boolean {
    const transitionMarkers = [
      /^however,?/i,
      /^in contrast,?/i,
      /^on the other hand,?/i,
      /^for example,?/i,
      /^for instance,?/i,
      /^specifically,?/i,
      /^to illustrate,?/i,
      /^in other words,?/i,
      /^that is,?/i,
      /^conversely,?/i,
      /^alternatively,?/i,
    ];

    return transitionMarkers.some(marker => marker.test(text));
  }

  /**
   * Detect the type of concept from text
   */
  private detectConceptType(text: string): ConceptType {
    const textLower = text.toLowerCase();

    // Definition markers
    if (
      textLower.includes('is defined as') ||
      textLower.includes('refers to') ||
      textLower.includes('means that') ||
      textLower.includes('definition')
    ) {
      return 'definition';
    }

    // Explanation markers
    if (
      textLower.includes('how it works') ||
      textLower.includes('the process') ||
      textLower.includes('this happens when') ||
      textLower.includes('explanation')
    ) {
      return 'explanation';
    }

    // Example markers
    if (
      textLower.includes('for example') ||
      textLower.includes('for instance') ||
      textLower.includes('such as') ||
      textLower.includes('example:')
    ) {
      return 'example';
    }

    // Procedure markers
    if (
      textLower.includes('step 1') ||
      textLower.includes('first,') ||
      textLower.includes('how to') ||
      textLower.includes('procedure')
    ) {
      return 'procedure';
    }

    // Comparison markers
    if (
      textLower.includes('compared to') ||
      textLower.includes('versus') ||
      textLower.includes('vs.') ||
      textLower.includes('difference between')
    ) {
      return 'comparison';
    }

    return 'general';
  }

  /**
   * Create a chunk object
   */
  private createChunk(
    id: number,
    content: string,
    source: Source,
    startChar: number,
    endChar: number,
    conceptType: ConceptType,
    totalConcepts: number
  ): ChunkData {
    return {
      id: `${source.id}-chunk-${id}`,
      content,
      source,

      metadata: {
        conceptType,
        position: id,
        totalChunks: totalConcepts,
        tokens: this.estimateTokens(content),
        startChar,
        endChar,
        isSelfContained: this.isSelfContained(content),
        entities: this.extractEntities(content),
        topics: this.extractTopics(content),
        keywords: this.extractKeywords(content),
      },
    };
  }

  /**
   * Check if chunk is self-contained (doesn't need context)
   */
  private isSelfContained(content: string): boolean {
    // Check for pronouns without antecedents
    const pronouns = ['this', 'that', 'these', 'those', 'it', 'they'];
    const firstSentence = content.split('.')[0].toLowerCase();

    // If first sentence starts with pronoun, likely needs context
    const startsWithPronoun = pronouns.some(p => firstSentence.startsWith(p));

    // Check for "as mentioned above" type references
    const hasBackReference = /as (mentioned|discussed|stated|shown) (above|earlier|previously)/i.test(content);

    return !startsWithPronoun && !hasBackReference;
  }

  /**
   * Extract named entities (people, places, technologies, etc.)
   */
  private extractEntities(content: string): string[] {
    const entities: string[] = [];

    // Capitalized phrases (potential proper nouns)
    const capitalizedMatches = content.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g);
    if (capitalizedMatches) {
      entities.push(...new Set(capitalizedMatches));
    }

    // Technical terms (acronyms)
    const acronyms = content.match(/\b[A-Z]{2,}\b/g);
    if (acronyms) {
      entities.push(...new Set(acronyms));
    }

    return Array.from(new Set(entities)).slice(0, 10); // Top 10 entities
  }

  /**
   * Extract main topics from content
   */
  private extractTopics(content: string): string[] {
    // Simple topic extraction based on heading-like phrases
    const topics: string[] = [];

    // Look for topic indicators
    const topicPatterns = [
      /(?:about|regarding|concerning)\s+([a-z\s]+?)(?:\.|,|\s{2,})/gi,
      /topic[:\s]+([a-z\s]+?)(?:\.|,|\s{2,})/gi,
      /focus(?:es|ing)?\s+on\s+([a-z\s]+?)(?:\.|,|\s{2,})/gi,
    ];

    for (const pattern of topicPatterns) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) {
          topics.push(match[1].trim());
        }
      }
    }

    return Array.from(new Set(topics)).slice(0, 5);
  }

  /**
   * Extract keywords from content
   */
  private extractKeywords(content: string): string[] {
    // Remove common words
    const commonWords = new Set([
      'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
      'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
      'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
      'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
    ]);

    const words = content
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && !commonWords.has(word));

    // Count word frequency
    const wordFreq = new Map<string, number>();
    words.forEach(word => {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    });

    // Return top keywords
    return Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  }

  /**
   * Estimate token count (rough approximation)
   */
  private estimateTokens(text: string): number {
    // Rough estimate: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }

  /**
   * Batch chunk multiple sources
   */
  async batchChunk(
    sources: Array<{ content: string; source: Source }>,
    options?: { maxChunkSize?: number; minChunkSize?: number; overlapSize?: number }
  ): Promise<ChunkData[]> {
    const allChunks: ChunkData[] = [];

    for (const { content, source } of sources) {
      const chunks = await this.chunkContent(content, source, options);
      allChunks.push(...chunks);
    }

    return allChunks;
  }
}

// Types
interface LogicalUnit {
  text: string;
  type: 'heading' | 'paragraph' | 'list' | 'code';
  length: number;
}

interface Concept {
  text: string;
  type: ConceptType;
}

type ConceptType =
  | 'definition'
  | 'explanation'
  | 'example'
  | 'procedure'
  | 'comparison'
  | 'general';

// Export singleton
export const semanticChunker = new SemanticChunker();
