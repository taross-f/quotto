import type { CliArgs, MutableCliArgs, ValidationResult } from './types';
import { createNonEmptyString, QuottoError, ErrorCode } from './types';

function validateCliFlag(
  flag: string,
  value: string | undefined
): ValidationResult<string> {
  if (value === undefined) {
    return { success: false, error: `Value for ${flag} is missing` };
  }

  const processed = value.replace(/\\n/g, '\n');
  const validation = createNonEmptyString(processed);

  if (!validation.success) {
    return {
      success: false,
      error: `${flag} cannot be empty: ${validation.error}`,
    };
  }

  return { success: true, data: validation.data };
}

export function parseCliArgs(args: readonly string[]): CliArgs {
  const result: MutableCliArgs = {};

  for (let i = 0; i < args.length; i += 2) {
    const flag = args[i];
    const value = args[i + 1];

    switch (flag) {
      case '--quote': {
        const validation = validateCliFlag(flag, value);
        if (!validation.success) {
          throw new QuottoError(validation.error, ErrorCode.EMPTY_QUOTE, {
            flag,
            value,
          });
        }
        result.quote = validation.data;
        break;
      }
      case '--title': {
        if (value !== undefined) {
          const processed = value.replace(/\\n/g, '\n').trim();
          if (processed.length > 0) {
            result.title = processed;
          }
        }
        break;
      }
      case '--author': {
        if (value !== undefined) {
          const processed = value.replace(/\\n/g, '\n').trim();
          if (processed.length > 0) {
            result.author = processed;
          }
        }
        break;
      }
      case '--output': {
        if (value !== undefined) {
          const trimmed = value.trim();
          if (trimmed.length > 0) {
            result.output = trimmed;
          }
        }
        break;
      }
    }
  }

  if (!result.quote) {
    throw new QuottoError('Quote text is required', ErrorCode.EMPTY_QUOTE);
  }

  if (!result.output) {
    const timestamp = Date.now();
    result.output = `quotto-quote-${timestamp}.png`;
  }

  return result as CliArgs;
}
