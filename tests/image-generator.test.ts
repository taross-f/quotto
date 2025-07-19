import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { generateQuoteImage } from '../src/image-generator';
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

  it('should handle Japanese kinsoku processing (line break prohibition)', async () => {
    const quoteData: QuoteData = {
      quote: 'これは日本語の禁則処理のテストです。句読点（、。）や括弧（「」）が正しく処理されることを確認します。',
      title: '禁則処理テスト',
      author: 'テスト作者'
    };
    
    const outputPath = path.join(testOutputDir, 'kinsoku-test.png');
    await generateQuoteImage(quoteData, outputPath);
    
    expect(fs.existsSync(outputPath)).toBe(true);
  });

  it('should handle line start prohibited characters', async () => {
    const quoteData: QuoteData = {
      quote: 'テスト文章です、これは禁則処理のテストです。行頭に句読点が来ないことを確認します！長い文章で改行位置を調整する必要があります。',
      title: '行頭禁則テスト',
      author: 'テスト'
    };
    
    const outputPath = path.join(testOutputDir, 'line-start-prohibited.png');
    await generateQuoteImage(quoteData, outputPath);
    
    expect(fs.existsSync(outputPath)).toBe(true);
  });

  it('should handle line end prohibited characters', async () => {
    const quoteData: QuoteData = {
      quote: '括弧の処理をテストします。「引用文」や（補足説明）が行をまたがないように処理されることを確認します。',
      title: '行末禁則テスト',
      author: 'テスト'
    };
    
    const outputPath = path.join(testOutputDir, 'line-end-prohibited.png');
    await generateQuoteImage(quoteData, outputPath);
    
    expect(fs.existsSync(outputPath)).toBe(true);
  });
});