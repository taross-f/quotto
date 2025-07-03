import { describe, it, expect } from 'bun:test';
import { parseCliArgs } from '../src/cli-parser';

describe('CLI Parser', () => {
  it('should parse quote text argument', () => {
    const args = ['--quote', 'This is a test quote'];
    const result = parseCliArgs(args);
    
    expect(result.quote).toBe('This is a test quote');
  });

  it('should parse book title argument', () => {
    const args = ['--quote', 'test quote', '--title', 'Test Book'];
    const result = parseCliArgs(args);
    
    expect(result.title).toBe('Test Book');
  });

  it('should parse author argument', () => {
    const args = ['--quote', 'test quote', '--author', 'Test Author'];
    const result = parseCliArgs(args);
    
    expect(result.author).toBe('Test Author');
  });

  it('should parse output file argument', () => {
    const args = ['--quote', 'test quote', '--output', 'test-output.png'];
    const result = parseCliArgs(args);
    
    expect(result.output).toBe('test-output.png');
  });

  it('should have default output filename when not specified', () => {
    const args = ['--quote', 'test'];
    const result = parseCliArgs(args);
    
    expect(result.output).toMatch(/quotto-quote-\d+\.png/);
  });

  it('should require quote argument', () => {
    const args = ['--title', 'Test Book'];
    
    expect(() => parseCliArgs(args)).toThrow('Quote text is required');
  });

  it('should parse all arguments together', () => {
    const args = [
      '--quote', 'Test quote text',
      '--title', 'Test Book',
      '--author', 'Test Author',
      '--output', 'test.png'
    ];
    const result = parseCliArgs(args);
    
    expect(result.quote).toBe('Test quote text');
    expect(result.title).toBe('Test Book');
    expect(result.author).toBe('Test Author');
    expect(result.output).toBe('test.png');
  });

  it('should handle newline characters in quote', () => {
    const args = ['--quote', 'First line\\nSecond line'];
    const result = parseCliArgs(args);
    
    expect(result.quote).toBe('First line\nSecond line');
  });

  it('should handle newline characters in title and author', () => {
    const args = [
      '--quote', 'test quote',
      '--title', 'Book\\nTitle',
      '--author', 'Author\\nName'
    ];
    const result = parseCliArgs(args);
    
    expect(result.title).toBe('Book\nTitle');
    expect(result.author).toBe('Author\nName');
  });
});