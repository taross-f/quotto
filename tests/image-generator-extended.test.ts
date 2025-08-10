import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { generateQuoteImage, wrapText } from '../src/image-generator';
import type { QuoteData } from '../src/types';
import { QuottoError, ErrorCode } from '../src/types';
import { DEFAULT_CONFIG } from '../src/constants';
import * as fs from 'node:fs';
import * as path from 'node:path';

const testOutputDir = './test-output-extended';

describe('Image Generator Extended', () => {
  beforeEach(() => {
    if (fs.existsSync(testOutputDir)) {
      fs.rmSync(testOutputDir, { recursive: true });
    }
    fs.mkdirSync(testOutputDir);
  });

  afterEach(() => {
    if (fs.existsSync(testOutputDir)) {
      fs.rmSync(testOutputDir, { recursive: true });
    }
  });

  describe('Error handling', () => {
    it('should throw error for invalid output path without .png extension', async () => {
      const quoteData: QuoteData = {
        quote: 'Test quote'
      };
      
      const outputPath = path.join(testOutputDir, 'invalid.jpg');
      
      await expect(generateQuoteImage(quoteData, outputPath))
        .rejects.toThrow(QuottoError);
      await expect(generateQuoteImage(quoteData, outputPath))
        .rejects.toThrow('Output path must have .png extension');
    });

    it('should throw error for empty output path', async () => {
      const quoteData: QuoteData = {
        quote: 'Test quote'
      };
      
      await expect(generateQuoteImage(quoteData, ''))
        .rejects.toThrow(QuottoError);
      await expect(generateQuoteImage(quoteData, ''))
        .rejects.toThrow('Output path cannot be empty');
    });

    it('should throw error for whitespace-only quote', async () => {
      const quoteData: QuoteData = {
        quote: '   \n\t   '
      };
      
      const outputPath = path.join(testOutputDir, 'test.png');
      
      await expect(generateQuoteImage(quoteData, outputPath))
        .rejects.toThrow(QuottoError);
    });

    it('should handle file write errors gracefully', async () => {
      const quoteData: QuoteData = {
        quote: 'Test quote'
      };
      
      // Create a directory with the same name as the output file to cause an error
      const outputPath = path.join(testOutputDir, 'test.png');
      fs.mkdirSync(outputPath);
      
      await expect(generateQuoteImage(quoteData, outputPath))
        .rejects.toThrow(QuottoError);
      await expect(generateQuoteImage(quoteData, outputPath))
        .rejects.toThrow(/Failed to write image file/);
    });
  });

  describe('Edge cases', () => {
    it('should handle very long quote that exceeds max lines', async () => {
      const longQuote = Array(20).fill('This is a very long line that will wrap').join(' ');
      const quoteData: QuoteData = {
        quote: longQuote,
        title: 'Long Quote Test',
        author: 'Test Author'
      };
      
      const outputPath = path.join(testOutputDir, 'long-quote.png');
      await generateQuoteImage(quoteData, outputPath);
      
      expect(fs.existsSync(outputPath)).toBe(true);
    });

    it('should handle very long title that exceeds max lines', async () => {
      const longTitle = Array(10).fill('Very Long Title Part').join(' ');
      const quoteData: QuoteData = {
        quote: 'Short quote',
        title: longTitle,
        author: 'Test Author'
      };
      
      const outputPath = path.join(testOutputDir, 'long-title.png');
      await generateQuoteImage(quoteData, outputPath);
      
      expect(fs.existsSync(outputPath)).toBe(true);
    });

    it('should handle very long author that exceeds max lines', async () => {
      const longAuthor = Array(5).fill('Very Long Author Name Part').join(' ');
      const quoteData: QuoteData = {
        quote: 'Short quote',
        title: 'Title',
        author: longAuthor
      };
      
      const outputPath = path.join(testOutputDir, 'long-author.png');
      await generateQuoteImage(quoteData, outputPath);
      
      expect(fs.existsSync(outputPath)).toBe(true);
    });

    it('should handle content that reaches maximum canvas height', async () => {
      const veryLongContent = Array(50).fill('Line').join('\n');
      const quoteData: QuoteData = {
        quote: veryLongContent,
        title: Array(10).fill('Title Line').join('\n'),
        author: Array(5).fill('Author Line').join('\n')
      };
      
      const outputPath = path.join(testOutputDir, 'max-height.png');
      await generateQuoteImage(quoteData, outputPath);
      
      expect(fs.existsSync(outputPath)).toBe(true);
    });

    it('should handle single character quote', async () => {
      const quoteData: QuoteData = {
        quote: 'A'
      };
      
      const outputPath = path.join(testOutputDir, 'single-char.png');
      await generateQuoteImage(quoteData, outputPath);
      
      expect(fs.existsSync(outputPath)).toBe(true);
    });

    it('should handle special characters in text', async () => {
      const quoteData: QuoteData = {
        quote: '< > & " \' Special characters',
        title: 'Title with & and <tags>',
        author: 'Author "Name" with quotes'
      };
      
      const outputPath = path.join(testOutputDir, 'special-chars.png');
      await generateQuoteImage(quoteData, outputPath);
      
      expect(fs.existsSync(outputPath)).toBe(true);
    });

    it('should handle Unicode emoji characters', async () => {
      const quoteData: QuoteData = {
        quote: 'Quote with emojis 🎉 😊 🚀',
        title: 'Title 📚',
        author: 'Author 👨‍💻'
      };
      
      const outputPath = path.join(testOutputDir, 'emoji.png');
      await generateQuoteImage(quoteData, outputPath);
      
      expect(fs.existsSync(outputPath)).toBe(true);
    });
  });

  describe('wrapText edge cases', () => {
    it('should handle empty paragraphs', () => {
      const text = 'Line 1\n\nLine 3';
      const lines = wrapText(text, 500, 20);
      
      expect(lines).toContain('Line 1');
      expect(lines).toContain('');
      expect(lines).toContain('Line 3');
    });

    it('should handle text with only newlines', () => {
      const text = '\n\n\n';
      const lines = wrapText(text, 500, 20);
      
      expect(lines).toEqual(['', '', '', '']);
    });

    it('should handle very narrow width', () => {
      const text = 'Word1 Word2 Word3';
      const lines = wrapText(text, 50, 20);
      
      expect(lines.length).toBeGreaterThan(1);
    });

    it('should handle zero-width characters', () => {
      const text = 'Text\u200BWith\u200BZero\u200BWidth\u200BSpaces';
      const lines = wrapText(text, 500, 20);
      
      expect(lines).toBeDefined();
      expect(lines.length).toBeGreaterThan(0);
    });

    it('should handle mixed width characters correctly', () => {
      const text = 'ABC日本語DEF';
      const lines = wrapText(text, 100, 20);
      
      expect(lines).toBeDefined();
      expect(lines[0]).toContain('ABC');
    });
  });

  describe('Custom configuration', () => {
    it('should use custom configuration when provided', async () => {
      const customConfig = {
        ...DEFAULT_CONFIG,
        colors: {
          ...DEFAULT_CONFIG.colors,
          background: '#000000',
          accent: '#ff0000'
        }
      };
      
      const quoteData: QuoteData = {
        quote: 'Custom config test'
      };
      
      const outputPath = path.join(testOutputDir, 'custom-config.png');
      await generateQuoteImage(quoteData, outputPath, customConfig);
      
      expect(fs.existsSync(outputPath)).toBe(true);
    });

    it('should handle minimum font sizes', async () => {
      const customConfig = {
        ...DEFAULT_CONFIG,
        font: {
          ...DEFAULT_CONFIG.font,
          sizes: {
            ...DEFAULT_CONFIG.font.sizes,
            quote: { base: 12, min: 8 },
            title: { base: 10, min: 6 },
            author: { base: 8, min: 4 }
          }
        }
      };
      
      const quoteData: QuoteData = {
        quote: 'Small font test',
        title: 'Tiny title',
        author: 'Mini author'
      };
      
      const outputPath = path.join(testOutputDir, 'small-fonts.png');
      await generateQuoteImage(quoteData, outputPath, customConfig);
      
      expect(fs.existsSync(outputPath)).toBe(true);
    });
  });
});