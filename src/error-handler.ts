import type { QuottoError, ErrorCode } from './types';

export interface ErrorContext {
  readonly operation: string;
  readonly timestamp: string;
  readonly args?: Record<string, unknown>;
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorLog: Array<{ error: QuottoError; context: ErrorContext }> = [];

  private constructor() {}

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  handleError(error: QuottoError, context: ErrorContext): void {
    this.errorLog.push({ error, context });

    if (process.env.NODE_ENV === 'development') {
      console.error(
        `[${context.timestamp}] ${context.operation}:`,
        error.message
      );
      if (error.context) {
        console.error('Error context:', error.context);
      }
    }
  }

  getErrorLog(): ReadonlyArray<{ error: QuottoError; context: ErrorContext }> {
    return this.errorLog;
  }

  clearErrorLog(): void {
    this.errorLog = [];
  }

  formatError(error: QuottoError): string {
    let message = error.message;

    if (error.context && process.env.NODE_ENV === 'development') {
      message += `\nContext: ${JSON.stringify(error.context, null, 2)}`;
    }

    return message;
  }

  getErrorSuggestion(errorCode: ErrorCode): string | null {
    const suggestions: Record<ErrorCode, string> = {
      EMPTY_QUOTE: 'Provide a non-empty quote text using --quote "Your quote"',
      INVALID_OUTPUT_PATH: 'Specify a valid output path ending with .png',
      FONT_SIZE_CALCULATION_FAILED: 'Try shorter text or contact support',
      SVG_GENERATION_FAILED: 'Try again or check system resources',
      FILE_WRITE_FAILED: 'Check file permissions and disk space',
      INVALID_CONFIG: 'Check configuration values are valid',
    };

    return suggestions[errorCode] || null;
  }
}

export function handleAsyncError<
  T extends (...args: unknown[]) => Promise<unknown>,
>(fn: T, operation: string): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      const errorHandler = ErrorHandler.getInstance();
      const context: ErrorContext = {
        operation,
        timestamp: new Date().toISOString(),
        args: args.length > 0 ? { args } : undefined,
      };

      if (error instanceof Error && 'code' in error) {
        errorHandler.handleError(error as QuottoError, context);
      }

      throw error;
    }
  }) as T;
}
