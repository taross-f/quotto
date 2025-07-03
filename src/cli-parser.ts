export interface CliArgs {
  quote: string;
  title?: string;
  author?: string;
  output: string;
}

export function parseCliArgs(args: string[]): CliArgs {
  const result: Partial<CliArgs> = {};
  
  for (let i = 0; i < args.length; i += 2) {
    const flag = args[i];
    const value = args[i + 1];
    
    switch (flag) {
      case '--quote':
        result.quote = value?.replace(/\\n/g, '\n');
        break;
      case '--title':
        result.title = value?.replace(/\\n/g, '\n');
        break;
      case '--author':
        result.author = value?.replace(/\\n/g, '\n');
        break;
      case '--output':
        result.output = value;
        break;
    }
  }
  
  if (!result.quote) {
    throw new Error('Quote text is required');
  }
  
  if (!result.output) {
    const timestamp = Date.now();
    result.output = `innyo-quote-${timestamp}.png`;
  }
  
  return result as CliArgs;
}