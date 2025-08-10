import { describe, it, expect } from 'bun:test';
import { 
  createNonEmptyString, 
  createPositiveNumber,
  QuottoError,
  ErrorCode
} from '../src/types';

describe('Type Validators', () => {
  describe('createNonEmptyString', () => {
    it('should accept valid non-empty strings', () => {
      const result = createNonEmptyString('Valid string');
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('Valid string');
      }
    });

    it('should trim whitespace', () => {
      const result = createNonEmptyString('  Trimmed string  ');
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('Trimmed string');
      }
    });

    it('should reject empty strings', () => {
      const result = createNonEmptyString('');
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('String cannot be empty');
      }
    });

    it('should reject strings with only whitespace', () => {
      const result = createNonEmptyString('   ');
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('String cannot be empty');
      }
    });

    it('should accept strings with newlines', () => {
      const result = createNonEmptyString('Line 1\nLine 2');
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('Line 1\nLine 2');
      }
    });

    it('should accept Japanese characters', () => {
      const result = createNonEmptyString('こんにちは');
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('こんにちは');
      }
    });
  });

  describe('createPositiveNumber', () => {
    it('should accept positive integers', () => {
      const result = createPositiveNumber(42);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(42);
      }
    });

    it('should accept positive decimals', () => {
      const result = createPositiveNumber(3.14);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(3.14);
      }
    });

    it('should accept very small positive numbers', () => {
      const result = createPositiveNumber(0.0001);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(0.0001);
      }
    });

    it('should reject zero', () => {
      const result = createPositiveNumber(0);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Number must be positive and finite');
      }
    });

    it('should reject negative numbers', () => {
      const result = createPositiveNumber(-10);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Number must be positive and finite');
      }
    });

    it('should reject Infinity', () => {
      const result = createPositiveNumber(Infinity);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Number must be positive and finite');
      }
    });

    it('should reject negative Infinity', () => {
      const result = createPositiveNumber(-Infinity);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Number must be positive and finite');
      }
    });

    it('should reject NaN', () => {
      const result = createPositiveNumber(NaN);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Number must be positive and finite');
      }
    });
  });

  describe('QuottoError', () => {
    it('should create error with message and code', () => {
      const error = new QuottoError('Test error', ErrorCode.EMPTY_QUOTE);
      
      expect(error.message).toBe('Test error');
      expect(error.code).toBe(ErrorCode.EMPTY_QUOTE);
      expect(error.name).toBe('QuottoError');
      expect(error.context).toBeUndefined();
    });

    it('should create error with context', () => {
      const context = { foo: 'bar', count: 42 };
      const error = new QuottoError('Test error', ErrorCode.FILE_WRITE_FAILED, context);
      
      expect(error.message).toBe('Test error');
      expect(error.code).toBe(ErrorCode.FILE_WRITE_FAILED);
      expect(error.context).toEqual(context);
    });

    it('should be instanceof Error', () => {
      const error = new QuottoError('Test error', ErrorCode.INVALID_CONFIG);
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(QuottoError);
    });
  });

  describe('ErrorCode enum', () => {
    it('should have all expected error codes', () => {
      expect(ErrorCode.EMPTY_QUOTE).toBe('EMPTY_QUOTE');
      expect(ErrorCode.INVALID_OUTPUT_PATH).toBe('INVALID_OUTPUT_PATH');
      expect(ErrorCode.FONT_SIZE_CALCULATION_FAILED).toBe('FONT_SIZE_CALCULATION_FAILED');
      expect(ErrorCode.SVG_GENERATION_FAILED).toBe('SVG_GENERATION_FAILED');
      expect(ErrorCode.FILE_WRITE_FAILED).toBe('FILE_WRITE_FAILED');
      expect(ErrorCode.INVALID_CONFIG).toBe('INVALID_CONFIG');
    });
  });
});