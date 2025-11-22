import { Injectable } from '@nestjs/common';

export interface ChunkOptions {
  maxTokens?: number;
  minTokens?: number;
  overlapTokens?: number;
}

export interface Chunk {
  text: string;
  tokens: number;
  startOffset: number;
  endOffset: number;
}

@Injectable()
export class ChunkingService {
  private readonly defaultMaxTokens = 400;
  private readonly defaultMinTokens = 50;
  private readonly defaultOverlapTokens = 80;

  chunk(text: string, options: ChunkOptions = {}): Chunk[] {
    const maxTokens = options.maxTokens ?? this.defaultMaxTokens;
    const minTokens = options.minTokens ?? this.defaultMinTokens;
    const overlapTokens = options.overlapTokens ?? this.defaultOverlapTokens;

    const paragraphs = this.splitIntoParagraphs(text);
    const chunks: Chunk[] = [];
    let currentChunk = '';
    let currentTokens = 0;
    let currentStartOffset = 0;

    for (const paragraph of paragraphs) {
      const paraTokens = this.estimateTokens(paragraph);

      if (paraTokens > maxTokens) {
        if (currentChunk) {
          chunks.push({
            text: currentChunk.trim(),
            tokens: currentTokens,
            startOffset: currentStartOffset,
            endOffset: currentStartOffset + currentChunk.length,
          });
          currentChunk = '';
          currentTokens = 0;
        }

        const sentences = this.splitIntoSentences(paragraph);
        let sentenceBuffer = '';
        let sentenceTokens = 0;
        let sentenceStartOffset = text.indexOf(paragraph);

        for (const sentence of sentences) {
          const sentTokens = this.estimateTokens(sentence);

          if (sentenceTokens + sentTokens > maxTokens && sentenceBuffer) {
            chunks.push({
              text: sentenceBuffer.trim(),
              tokens: sentenceTokens,
              startOffset: sentenceStartOffset,
              endOffset: sentenceStartOffset + sentenceBuffer.length,
            });

            const overlap = this.getOverlapText(sentenceBuffer, overlapTokens);
            sentenceBuffer = overlap + ' ' + sentence;
            sentenceTokens = this.estimateTokens(sentenceBuffer);
            sentenceStartOffset =
              sentenceStartOffset + sentenceBuffer.length - overlap.length;
          } else {
            sentenceBuffer += (sentenceBuffer ? ' ' : '') + sentence;
            sentenceTokens += sentTokens;
          }
        }

        if (sentenceBuffer.trim()) {
          chunks.push({
            text: sentenceBuffer.trim(),
            tokens: sentenceTokens,
            startOffset: sentenceStartOffset,
            endOffset: sentenceStartOffset + sentenceBuffer.length,
          });
        }

        currentStartOffset = text.indexOf(paragraph) + paragraph.length;
        continue;
      }

      if (currentTokens + paraTokens > maxTokens && currentChunk) {
        chunks.push({
          text: currentChunk.trim(),
          tokens: currentTokens,
          startOffset: currentStartOffset,
          endOffset: currentStartOffset + currentChunk.length,
        });

        const overlap = this.getOverlapText(currentChunk, overlapTokens);
        currentChunk = overlap + '\n\n' + paragraph;
        currentTokens = this.estimateTokens(currentChunk);
        currentStartOffset =
          currentStartOffset +
          currentChunk.length -
          overlap.length -
          paragraph.length -
          2;
      } else {
        if (currentChunk) {
          currentChunk += '\n\n' + paragraph;
        } else {
          currentChunk = paragraph;
          currentStartOffset = text.indexOf(paragraph);
        }
        currentTokens += paraTokens;
      }
    }

    if (currentChunk.trim()) {
      chunks.push({
        text: currentChunk.trim(),
        tokens: currentTokens,
        startOffset: currentStartOffset,
        endOffset: currentStartOffset + currentChunk.length,
      });
    }

    return chunks.filter((chunk) => chunk.tokens >= minTokens);
  }

  private splitIntoParagraphs(text: string): string[] {
    const clean = text.trim();
    if (!clean) return [];

    const parts = clean.split(
      /\n{2,}|^#{1,6}\s.+$|\n\d+\.\s+|\n[A-Z][a-zA-Z]+:\s/m,
    );

    return parts.map((p) => p.trim()).filter((p) => p.length > 0);
  }

  private splitIntoSentences(text: string): string[] {
    const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
    return sentences.map((s) => s.trim()).filter((s) => s.length > 0);
  }

  private getOverlapText(text: string, overlapTokens: number): string {
    const words = text.split(/\s+/);
    const overlapWords = Math.floor(overlapTokens * 0.75);
    return words.slice(-overlapWords).join(' ');
  }

  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }
}
