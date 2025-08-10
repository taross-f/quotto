import { Command } from 'commander';
import type { CliArgs } from './types';
import { QuottoError, ErrorCode } from './types';

export function createCliProgram(): Command {
  const program = new Command();

  program
    .name('quotto')
    .description('CLI tool to generate beautiful quote images with Quotto')
    .version('1.1.0', '-v, --version')
    .usage('--quote "Your quote" [options]')
    .requiredOption(
      '-q, --quote <text>',
      'Quote text (required) - supports \\n for line breaks'
    )
    .option(
      '-t, --title <text>',
      'Book title (optional) - supports \\n for line breaks'
    )
    .option(
      '-a, --author <text>',
      'Author name (optional) - supports \\n for line breaks'
    )
    .option(
      '-o, --output <path>',
      'Output file path (optional, defaults to quotto-quote-[timestamp].png)'
    )
    .addHelpText(
      'after',
      `
Examples:
  $ quotto --quote "The only way to do great work is to love what you do."
  $ quotto --quote "Stay hungry,\\nstay foolish." --title "Stanford Commencement" --author "Steve Jobs"
  $ quotto --quote "Innovation distinguishes\\nbetween a leader and a follower." --title "Various Interviews" --author "Steve Jobs" --output "my-quote.png"

Notes:
  - Use \\n for line breaks in quote, title, or author text
  - Output file must have .png extension
  - If output directory doesn't exist, it will be created automatically
    `
    )
    .configureOutput({
      writeOut: (str) => process.stdout.write(str),
      writeErr: (str) => process.stderr.write(str),
      outputError: (str, write) => write(`\x1b[31m${str}\x1b[0m`), // Red color for errors
    });

  // Custom error handling
  program.exitOverride((err) => {
    if (err.code === 'commander.missingMandatoryOptionValue') {
      throw new QuottoError(
        'Quote text is required. Use --quote "Your quote text"',
        ErrorCode.EMPTY_QUOTE
      );
    }
    throw err;
  });

  return program;
}

export function parseWithCommander(args: string[]): CliArgs {
  const program = createCliProgram();

  try {
    program.parse(args, { from: 'user' });
  } catch (error) {
    if (error instanceof QuottoError) {
      throw error;
    }
    // Re-throw commander errors as QuottoErrors
    if (error instanceof Error) {
      throw new QuottoError(error.message, ErrorCode.EMPTY_QUOTE);
    }
    throw error;
  }

  const options = program.opts();

  // Process newlines in text
  const processText = (text: string | undefined): string | undefined => {
    if (!text) return undefined;
    return text.replace(/\\n/g, '\n').trim() || undefined;
  };

  const quote = processText(options.quote);
  if (!quote) {
    throw new QuottoError('Quote text cannot be empty', ErrorCode.EMPTY_QUOTE);
  }

  const result: CliArgs = {
    quote,
    title: processText(options.title),
    author: processText(options.author),
    output: options.output?.trim() || `quotto-quote-${Date.now()}.png`,
  };

  // Validate output path
  if (!result.output.endsWith('.png')) {
    throw new QuottoError(
      'Output file must have .png extension',
      ErrorCode.INVALID_OUTPUT_PATH,
      { providedPath: result.output }
    );
  }

  return result;
}

export function showHelp(): void {
  const program = createCliProgram();
  program.outputHelp();
}
