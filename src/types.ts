export interface QuoteData {
  readonly quote: string;
  readonly title?: string;
  readonly author?: string;
}

export interface CliArgs {
  readonly quote: string;
  readonly title?: string;
  readonly author?: string;
  readonly output: string;
}

export interface MutableCliArgs {
  quote?: string;
  title?: string;
  author?: string;
  output?: string;
}

export interface FontSizes {
  readonly quoteFontSize: number;
  readonly titleFontSize: number;
  readonly authorFontSize: number;
}

export interface ElementResult {
  readonly elements: string;
  readonly endY: number;
}

export interface SvgParts {
  readonly background: string;
  readonly decorativeQuote: string;
  readonly decorativeLines: string;
  readonly quote: string;
  readonly title: string;
  readonly author: string;
  readonly footer: string;
}

export interface TextProcessingResult {
  readonly lines: readonly string[];
  readonly estimatedHeight: number;
}

export type ValidationResult<T> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: string };

export interface ImageGenerationOptions {
  readonly config?: AppConfig;
  readonly outputPath: string;
}

export interface AppConfig {
  readonly canvas: {
    readonly width: number;
    readonly minHeight: number;
    readonly maxHeight: number;
    readonly margin: number;
    readonly footerHeight: number;
  };
  readonly font: {
    readonly families: {
      readonly serif: string;
      readonly sansSerif: string;
    };
    readonly sizes: {
      readonly quote: {
        readonly base: number;
        readonly min: number;
      };
      readonly title: {
        readonly base: number;
        readonly min: number;
      };
      readonly author: {
        readonly base: number;
        readonly min: number;
      };
      readonly footer: number;
      readonly decorativeQuote: number;
    };
    readonly lineHeights: {
      readonly quote: number;
      readonly title: number;
      readonly author: number;
    };
  };
  readonly text: {
    readonly maxLines: {
      readonly quote: number;
      readonly title: number;
      readonly author: number;
    };
    readonly kinsoku: {
      readonly lineStartProhibited: string;
      readonly lineEndProhibited: string;
    };
  };
  readonly colors: {
    readonly background: string;
    readonly accent: string;
    readonly text: {
      readonly quote: string;
      readonly title: string;
      readonly author: string;
      readonly footer: string;
      readonly decorativeQuote: string;
    };
    readonly decorative: {
      readonly line: string;
    };
  };
  readonly opacity: {
    readonly decorativeQuote: number;
    readonly footer: number;
  };
  readonly spacing: {
    readonly startY: number;
    readonly sectionGap: {
      readonly afterQuote: number;
      readonly afterTitle: number;
    };
    readonly lineGap: {
      readonly quote: number;
      readonly title: number;
      readonly author: number;
    };
    readonly decorativeLine: {
      readonly height: number;
      readonly thickness: number;
    };
    readonly accentBar: {
      readonly height: number;
    };
  };
}

export enum ErrorCode {
  EMPTY_QUOTE = 'EMPTY_QUOTE',
  INVALID_OUTPUT_PATH = 'INVALID_OUTPUT_PATH',
  FONT_SIZE_CALCULATION_FAILED = 'FONT_SIZE_CALCULATION_FAILED',
  SVG_GENERATION_FAILED = 'SVG_GENERATION_FAILED',
  FILE_WRITE_FAILED = 'FILE_WRITE_FAILED',
  INVALID_CONFIG = 'INVALID_CONFIG',
}

export class QuottoError extends Error {
  constructor(
    message: string,
    public readonly code: ErrorCode,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'QuottoError';
  }
}

export type NonEmptyString = string & { readonly __brand: unique symbol };

export function createNonEmptyString(
  value: string
): ValidationResult<NonEmptyString> {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return { success: false, error: 'String cannot be empty' };
  }
  return { success: true, data: trimmed as NonEmptyString };
}

export type PositiveNumber = number & { readonly __brand: unique symbol };

export function createPositiveNumber(
  value: number
): ValidationResult<PositiveNumber> {
  if (value <= 0 || !Number.isFinite(value)) {
    return { success: false, error: 'Number must be positive and finite' };
  }
  return { success: true, data: value as PositiveNumber };
}
