import { describe, it, expect } from 'bun:test';
import { parseWithCommander, createCliProgram } from '../src/cli-commander';
import { QuottoError, ErrorCode } from '../src/types';

describe('CLI Commander', () => {
  it('should parse quote argument with short flag', () => {
    const args = ['node', 'quotto', '-q', 'Test quote'];
    const result = parseWithCommander(args);
    
    expect(result.quote).toBe('Test quote');
    expect(result.output).toMatch(/^quotto-quote-\d+\.png$/);
  });

  it('should parse quote argument with long flag', () => {
    const args = ['node', 'quotto', '--quote', 'Test quote'];
    const result = parseWithCommander(args);
    
    expect(result.quote).toBe('Test quote');
  });

  it('should parse all arguments with short flags', () => {
    const args = [
      'node', 'quotto',
      '-q', 'Test quote',
      '-t', 'Test title',
      '-a', 'Test author',
      '-o', 'output.png'
    ];
    const result = parseWithCommander(args);
    
    expect(result.quote).toBe('Test quote');
    expect(result.title).toBe('Test title');
    expect(result.author).toBe('Test author');
    expect(result.output).toBe('output.png');
  });

  it('should parse all arguments with long flags', () => {
    const args = [
      'node', 'quotto',
      '--quote', 'Test quote',
      '--title', 'Test title',
      '--author', 'Test author',
      '--output', 'output.png'
    ];
    const result = parseWithCommander(args);
    
    expect(result.quote).toBe('Test quote');
    expect(result.title).toBe('Test title');
    expect(result.author).toBe('Test author');
    expect(result.output).toBe('output.png');
  });

  it('should handle newline characters in text', () => {
    const args = [
      'node', 'quotto',
      '--quote', 'Line 1\\nLine 2',
      '--title', 'Title\\nSubtitle',
      '--author', 'First\\nLast'
    ];
    const result = parseWithCommander(args);
    
    expect(result.quote).toBe('Line 1\nLine 2');
    expect(result.title).toBe('Title\nSubtitle');
    expect(result.author).toBe('First\nLast');
  });

  it('should throw error for missing quote', () => {
    const args = ['node', 'quotto'];
    
    expect(() => parseWithCommander(args)).toThrow(QuottoError);
    expect(() => parseWithCommander(args)).toThrow('Quote text is required');
  });

  it('should throw error for empty quote', () => {
    const args = ['node', 'quotto', '--quote', '   '];
    
    expect(() => parseWithCommander(args)).toThrow(QuottoError);
    expect(() => parseWithCommander(args)).toThrow('Quote text cannot be empty');
  });

  it('should throw error for invalid output extension', () => {
    const args = [
      'node', 'quotto',
      '--quote', 'Test quote',
      '--output', 'output.jpg'
    ];
    
    expect(() => parseWithCommander(args)).toThrow(QuottoError);
    expect(() => parseWithCommander(args)).toThrow('Output file must have .png extension');
  });

  it('should generate default output filename with timestamp', () => {
    const args = ['node', 'quotto', '--quote', 'Test quote'];
    const before = Date.now();
    const result = parseWithCommander(args);
    const after = Date.now();
    
    const match = result.output.match(/^quotto-quote-(\d+)\.png$/);
    expect(match).toBeTruthy();
    
    if (match) {
      const timestamp = parseInt(match[1]);
      expect(timestamp).toBeGreaterThanOrEqual(before);
      expect(timestamp).toBeLessThanOrEqual(after);
    }
  });

  it('should trim whitespace from arguments', () => {
    const args = [
      'node', 'quotto',
      '--quote', '  Test quote  ',
      '--title', '  Test title  ',
      '--author', '  Test author  ',
      '--output', '  output.png  '
    ];
    const result = parseWithCommander(args);
    
    expect(result.quote).toBe('Test quote');
    expect(result.title).toBe('Test title');
    expect(result.author).toBe('Test author');
    expect(result.output).toBe('output.png');
  });

  it('should ignore empty optional arguments', () => {
    const args = [
      'node', 'quotto',
      '--quote', 'Test quote',
      '--title', '',
      '--author', '   '
    ];
    const result = parseWithCommander(args);
    
    expect(result.quote).toBe('Test quote');
    expect(result.title).toBeUndefined();
    expect(result.author).toBeUndefined();
  });

  it('should create CLI program with correct configuration', () => {
    const program = createCliProgram();
    
    expect(program.name()).toBe('quotto');
    expect(program.version()).toBe('1.1.0');
    
    const options = program.options;
    const hasQuoteOption = options.some(opt => 
      opt.short === '-q' && opt.long === '--quote'
    );
    const hasTitleOption = options.some(opt => 
      opt.short === '-t' && opt.long === '--title'
    );
    const hasAuthorOption = options.some(opt => 
      opt.short === '-a' && opt.long === '--author'
    );
    const hasOutputOption = options.some(opt => 
      opt.short === '-o' && opt.long === '--output'
    );
    
    expect(hasQuoteOption).toBe(true);
    expect(hasTitleOption).toBe(true);
    expect(hasAuthorOption).toBe(true);
    expect(hasOutputOption).toBe(true);
  });
});