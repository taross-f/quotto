import { describe, it, expect, beforeEach } from 'bun:test';
import { ErrorHandler, handleAsyncError } from '../src/error-handler';
import { QuottoError, ErrorCode } from '../src/types';

describe('ErrorHandler', () => {
  let errorHandler: ErrorHandler;

  beforeEach(() => {
    errorHandler = ErrorHandler.getInstance();
    errorHandler.clearErrorLog();
  });

  it('should be a singleton', () => {
    const instance1 = ErrorHandler.getInstance();
    const instance2 = ErrorHandler.getInstance();
    
    expect(instance1).toBe(instance2);
  });

  it('should handle and log errors', () => {
    const error = new QuottoError('Test error', ErrorCode.EMPTY_QUOTE, { test: 'data' });
    const context = {
      operation: 'test-operation',
      timestamp: new Date().toISOString(),
      args: { foo: 'bar' }
    };
    
    errorHandler.handleError(error, context);
    const log = errorHandler.getErrorLog();
    
    expect(log).toHaveLength(1);
    expect(log[0].error).toBe(error);
    expect(log[0].context).toEqual(context);
  });

  it('should clear error log', () => {
    const error = new QuottoError('Test error', ErrorCode.EMPTY_QUOTE);
    const context = {
      operation: 'test-operation',
      timestamp: new Date().toISOString()
    };
    
    errorHandler.handleError(error, context);
    expect(errorHandler.getErrorLog()).toHaveLength(1);
    
    errorHandler.clearErrorLog();
    expect(errorHandler.getErrorLog()).toHaveLength(0);
  });

  it('should format error message', () => {
    const error = new QuottoError('Test error', ErrorCode.EMPTY_QUOTE);
    const formatted = errorHandler.formatError(error);
    
    expect(formatted).toBe('Test error');
  });

  it('should format error message with context in development', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    
    const error = new QuottoError('Test error', ErrorCode.EMPTY_QUOTE, { test: 'data' });
    const formatted = errorHandler.formatError(error);
    
    expect(formatted).toContain('Test error');
    expect(formatted).toContain('Context:');
    expect(formatted).toContain('"test": "data"');
    
    process.env.NODE_ENV = originalEnv;
  });

  it('should get error suggestion for known error codes', () => {
    const suggestions = [
      {
        code: ErrorCode.EMPTY_QUOTE,
        expected: 'Provide a non-empty quote text using --quote "Your quote"'
      },
      {
        code: ErrorCode.INVALID_OUTPUT_PATH,
        expected: 'Specify a valid output path ending with .png'
      },
      {
        code: ErrorCode.FILE_WRITE_FAILED,
        expected: 'Check file permissions and disk space'
      },
      {
        code: ErrorCode.SVG_GENERATION_FAILED,
        expected: 'Try again or check system resources'
      },
      {
        code: ErrorCode.FONT_SIZE_CALCULATION_FAILED,
        expected: 'Try shorter text or contact support'
      },
      {
        code: ErrorCode.INVALID_CONFIG,
        expected: 'Check configuration values are valid'
      }
    ];
    
    for (const { code, expected } of suggestions) {
      const suggestion = errorHandler.getErrorSuggestion(code);
      expect(suggestion).toBe(expected);
    }
  });

  it('should return null for unknown error code', () => {
    const suggestion = errorHandler.getErrorSuggestion('UNKNOWN' as ErrorCode);
    expect(suggestion).toBeNull();
  });
});

describe('handleAsyncError', () => {
  it('should execute function successfully', async () => {
    const testFn = async (value: number) => value * 2;
    const wrappedFn = handleAsyncError(testFn, 'test-operation');
    
    const result = await wrappedFn(5);
    expect(result).toBe(10);
  });

  it('should rethrow errors and log them', async () => {
    const errorHandler = ErrorHandler.getInstance();
    errorHandler.clearErrorLog();
    
    const testFn = async () => {
      throw new QuottoError('Test error', ErrorCode.EMPTY_QUOTE);
    };
    const wrappedFn = handleAsyncError(testFn, 'test-operation');
    
    await expect(wrappedFn()).rejects.toThrow('Test error');
    
    const log = errorHandler.getErrorLog();
    expect(log).toHaveLength(1);
    expect(log[0].context.operation).toBe('test-operation');
  });

  it('should handle functions with multiple arguments', async () => {
    const testFn = async (a: number, b: string, c: boolean) => {
      return `${a}-${b}-${c}`;
    };
    const wrappedFn = handleAsyncError(testFn, 'test-operation');
    
    const result = await wrappedFn(42, 'test', true);
    expect(result).toBe('42-test-true');
  });

  it('should handle non-QuottoError exceptions', async () => {
    const testFn = async () => {
      throw new Error('Regular error');
    };
    const wrappedFn = handleAsyncError(testFn, 'test-operation');
    
    await expect(wrappedFn()).rejects.toThrow('Regular error');
  });
});