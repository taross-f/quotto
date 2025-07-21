import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { generateQuoteImage, wrapText } from '../src/image-generator';
import * as fs from 'node:fs';
import * as path from 'node:path';

interface QuoteData {
  quote: string;
  title?: string;
  author?: string;
}

describe('Image Generator', () => {
  const testOutputDir = './test-output';
  
  beforeEach(() => {
    if (!fs.existsSync(testOutputDir)) {
      fs.mkdirSync(testOutputDir, { recursive: true });
    }
  });

  afterEach(() => {
    if (fs.existsSync(testOutputDir)) {
      fs.rmSync(testOutputDir, { recursive: true, force: true });
    }
  });

  it('should generate image with quote only', async () => {
    const quoteData: QuoteData = {
      quote: 'The only way to do great work is to love what you do.'
    };
    
    const outputPath = path.join(testOutputDir, 'quote-only.png');
    await generateQuoteImage(quoteData, outputPath);
    
    expect(fs.existsSync(outputPath)).toBe(true);
    
    const stats = fs.statSync(outputPath);
    expect(stats.size).toBeGreaterThan(0);
  });

  it('should generate image with quote and title', async () => {
    const quoteData: QuoteData = {
      quote: 'Stay hungry, stay foolish.',
      title: 'Stanford Commencement Address'
    };
    
    const outputPath = path.join(testOutputDir, 'quote-title.png');
    await generateQuoteImage(quoteData, outputPath);
    
    expect(fs.existsSync(outputPath)).toBe(true);
  });

  it('should generate image with quote, title and author', async () => {
    const quoteData: QuoteData = {
      quote: 'Innovation distinguishes between a leader and a follower.',
      title: 'Various Interviews',
      author: 'Steve Jobs'
    };
    
    const outputPath = path.join(testOutputDir, 'quote-title-author.png');
    await generateQuoteImage(quoteData, outputPath);
    
    expect(fs.existsSync(outputPath)).toBe(true);
  });

  it('should handle long quotes by wrapping text', async () => {
    const quoteData: QuoteData = {
      quote: 'This is a very long quote that should be wrapped across multiple lines to ensure it fits properly within the image boundaries and maintains good readability.',
      title: 'Test Book',
      author: 'Test Author'
    };
    
    const outputPath = path.join(testOutputDir, 'long-quote.png');
    await generateQuoteImage(quoteData, outputPath);
    
    expect(fs.existsSync(outputPath)).toBe(true);
  });

  it('should handle long title by wrapping text', async () => {
    const quoteData: QuoteData = {
      quote: 'Short quote',
      title: 'This is a very long book title that should be wrapped across multiple lines to ensure proper display within the image boundaries',
      author: 'Author'
    };
    
    const outputPath = path.join(testOutputDir, 'long-title.png');
    await generateQuoteImage(quoteData, outputPath);
    
    expect(fs.existsSync(outputPath)).toBe(true);
  });

  it('should handle long author name by wrapping text', async () => {
    const quoteData: QuoteData = {
      quote: 'Short quote',
      title: 'Book Title',
      author: 'This is a very long author name with multiple collaborators and contributors that should wrap properly'
    };
    
    const outputPath = path.join(testOutputDir, 'long-author.png');
    await generateQuoteImage(quoteData, outputPath);
    
    expect(fs.existsSync(outputPath)).toBe(true);
  });

  it('should throw error for empty quote', async () => {
    const quoteData: QuoteData = {
      quote: ''
    };
    
    const outputPath = path.join(testOutputDir, 'empty-quote.png');
    
    await expect(generateQuoteImage(quoteData, outputPath))
      .rejects.toThrow('Quote text cannot be empty');
  });

  it('should create directory if it does not exist', async () => {
    const quoteData: QuoteData = {
      quote: 'Test quote'
    };
    
    const nestedPath = path.join(testOutputDir, 'nested', 'path', 'test.png');
    await generateQuoteImage(quoteData, nestedPath);
    
    expect(fs.existsSync(nestedPath)).toBe(true);
  });

  it('should handle Japanese text with proper wrapping', async () => {
    const quoteData: QuoteData = {
      quote: 'そもそも新しいことをやると失敗するものなんですよ。でも、失敗することは問題じゃない。',
      title: '経営者の心得',
      author: '日本の経営者'
    };
    
    const outputPath = path.join(testOutputDir, 'japanese-text.png');
    await generateQuoteImage(quoteData, outputPath);
    
    expect(fs.existsSync(outputPath)).toBe(true);
  });

  it('should handle Japanese text with newlines', async () => {
    const quoteData: QuoteData = {
      quote: 'そもそも新しいことをやると失敗するものなんですよ。\nでも、失敗することは問題じゃない。\n大切なのは失敗から何を得るか。',
      title: 'ユニクロ',
      author: '杉本 貴司'
    };
    
    const outputPath = path.join(testOutputDir, 'japanese-multiline.png');
    await generateQuoteImage(quoteData, outputPath);
    
    expect(fs.existsSync(outputPath)).toBe(true);
  });

  it('should handle mixed Japanese and English text', async () => {
    const quoteData: QuoteData = {
      quote: 'Innovation（イノベーション）は、失敗から生まれる。\nThe best way to predict the future is to invent it.',
      title: 'Technology and Business',
      author: 'Tech Leader テクノロジーリーダー'
    };
    
    const outputPath = path.join(testOutputDir, 'mixed-language.png');
    await generateQuoteImage(quoteData, outputPath);
    
    expect(fs.existsSync(outputPath)).toBe(true);
  });

  it('should handle Japanese kinsoku processing (line break prohibition)', () => {
    // Test case 1: Verify 、 doesn't appear at line start
    const text1 = 'あいうえおかきくけこ、さしすせそ';
    const lines1 = wrapText(text1, 160, 16); // Force break around the comma
    
    // Verify the comma is not at the start of the second line
    expect(lines1.length).toBe(2);
    expect(lines1[1][0]).not.toBe('、');
    
    // The implementation moves one character to prevent line-start prohibition
    expect(lines1[0]).toBe('あいうえおかきくけ');
    expect(lines1[1]).toBe('こ、さしすせそ');
    
    // Test case 2: Verify brackets and punctuation handling
    const text2 = 'テスト（これは括弧内のテキスト）、そして「引用文」。最後に！';
    const lines2 = wrapText(text2, 120, 16);
    
    // Verify no prohibited characters at line boundaries
    for (let i = 0; i < lines2.length; i++) {
      const line = lines2[i];
      if (line.length > 0) {
        // Check line doesn't start with prohibited chars
        expect('、。）」』！？'.includes(line[0])).toBe(false);
        // Check line doesn't end with prohibited chars
        expect('（「『'.includes(line[line.length - 1])).toBe(false);
      }
    }
    
    // Test case 3: Specific case with 。at potential line start
    const text3 = 'これはテストです。次の文章が続きます';
    const lines3 = wrapText(text3, 128, 16); // 8 chars would put 。at line start
    
    // Verify 。is not at line start
    if (lines3.length > 1) {
      expect(lines3[1][0]).not.toBe('。');
    }
  });

  it('should handle line start prohibited characters in detail', () => {
    // Test with a string that would normally break before a prohibited character
    const text = 'これは長い文章です、そして句読点。括弧も含みます）終了';
    const lines = wrapText(text, 100, 16); // Small width to force wrapping
    
    // Check each line doesn't start with prohibited characters
    const lineStartProhibited = '、。）」』！？、。．，）】｝・ゝゞ々ー～…';
    for (const line of lines) {
      if (line.length > 0) {
        expect(lineStartProhibited.includes(line[0])).toBe(false);
      }
    }
  });

  it('should handle line end prohibited characters in detail', () => {
    // Test with a string that would normally break after a prohibited character
    const text = '開始（括弧の内容）そして「引用文」を含む文章です';
    const lines = wrapText(text, 100, 16); // Small width to force wrapping
    
    // Check each line doesn't end with prohibited characters
    const lineEndProhibited = '（「『（【｛';
    for (const line of lines) {
      if (line.length > 0) {
        expect(lineEndProhibited.includes(line[line.length - 1])).toBe(false);
      }
    }
  });

  it('should correctly wrap text with complex kinsoku cases', () => {
    // Complex case with multiple potential break points
    const text = 'テスト（これは括弧内のテキスト）、そして「引用文」。最後に！';
    const lines = wrapText(text, 120, 16);
    
    // Verify the wrapping result
    console.log('Wrapped lines:', lines);
    
    // No line should start with prohibited characters
    const lineStartProhibited = '、。）」』！？、。．，）】｝・ゝゞ々ー～…';
    // No line should end with prohibited characters  
    const lineEndProhibited = '（「『（【｛';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.length > 0) {
        // Check line start
        expect(lineStartProhibited.includes(line[0])).toBe(false);
        // Check line end
        expect(lineEndProhibited.includes(line[line.length - 1])).toBe(false);
      }
    }
  });

  it('should demonstrate kinsoku processing is working', () => {
    // Case 1: Verify line-start prohibited character handling
    const text1 = 'あいうえおかきくけこ、さしすせそ';
    const lines1 = wrapText(text1, 160, 16);
    
    // The comma should not be at line start
    expect(lines1.length).toBe(2);
    expect(lines1[1][0]).not.toBe('、');
    // Verify the actual wrapping behavior
    expect(lines1[0]).toBe('あいうえおかきくけ');
    expect(lines1[1]).toBe('こ、さしすせそ');
    
    // Case 2: Verify multiple prohibited characters
    const text2 = 'これは文章です。「引用部分」、そして継続。';
    const lines2 = wrapText(text2, 100, 16); // Force multiple line breaks
    
    // Check all lines for kinsoku violations
    for (const line of lines2) {
      if (line.length > 0) {
        // No prohibited chars at line start
        const lineStartProhibited = '、。）」』！？、。．，）】｝・ゝゞ々ー～…';
        expect(lineStartProhibited.includes(line[0])).toBe(false);
        // No prohibited chars at line end
        const lineEndProhibited = '（「『（【｛';
        expect(lineEndProhibited.includes(line[line.length - 1])).toBe(false);
      }
    }
    
    // Case 3: Show specific example of line-start prohibition working
    const text3 = 'テスト文章、これは禁則処理のテストです。';
    const lines3 = wrapText(text3, 80, 16); // Width that would put 、 at line start
    
    // Verify the comma handling
    const hasCommaAtLineStart = lines3.some(line => line[0] === '、');
    expect(hasCommaAtLineStart).toBe(false);
    
    // Case 4: Show specific example of period handling
    const text4 = 'これはテストです。次の文章';
    const lines4 = wrapText(text4, 128, 16);
    
    // Period should not be at line start
    if (lines4.length > 1) {
      expect(lines4[1][0]).not.toBe('。');
      // The line break happens before the period
      expect(lines4[0]).toBe('これはテストで');
      expect(lines4[1]).toBe('す。次の文章');
    }
    
    // Log one example to show kinsoku in action
    console.log('Kinsoku example - preventing 。 at line start:');
    console.log('Input:', text4);
    console.log('Output:', lines4);
  });
});