#!/usr/bin/env bun
import type React from 'react';
import { useState, useEffect } from 'react';
import { render, Text, Box, Newline } from 'ink';
import { parseWithCommander, showHelp } from './cli-commander';
import { generateQuoteImage } from './image-generator';
import { QuottoError, ErrorCode } from './types';

interface AppProps {
  args: string[];
}

const App: React.FC<AppProps> = ({ args }) => {
  const [status, setStatus] = useState<
    'parsing' | 'generating' | 'success' | 'error'
  >('parsing');
  const [message, setMessage] = useState<string>('');
  const [outputPath, setOutputPath] = useState<string>('');
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);

  useEffect(() => {
    const processArgs = async () => {
      try {
        setStatus('parsing');
        setMessage('Parsing arguments...');

        const parsedArgs = parseWithCommander(['node', 'quotto', ...args]);
        setOutputPath(parsedArgs.output);

        setStatus('generating');
        setMessage('Generating quote image...');

        await generateQuoteImage(
          {
            quote: parsedArgs.quote,
            title: parsedArgs.title,
            author: parsedArgs.author,
          },
          parsedArgs.output
        );

        setStatus('success');
        setMessage(`Image generated successfully: ${parsedArgs.output}`);
      } catch (error) {
        setStatus('error');
        if (error instanceof QuottoError) {
          setMessage(error.message);
          setErrorCode(error.code);
        } else if (error instanceof Error) {
          setMessage(error.message);
        } else {
          setMessage('An unknown error occurred');
        }
      }
    };

    processArgs();
  }, [args]);

  return (
    <Box flexDirection='column' padding={1}>
      <Text bold color='blue'>
        📚 Quotto Quote Generator
      </Text>
      <Newline />

      {status === 'parsing' && <Text color='yellow'>⏳ {message}</Text>}

      {status === 'generating' && <Text color='yellow'>🎨 {message}</Text>}

      {status === 'success' && (
        <Box flexDirection='column'>
          <Text color='green'>✅ {message}</Text>
          <Newline />
          <Text color='gray'>Output file: {outputPath}</Text>
        </Box>
      )}

      {status === 'error' && (
        <Box flexDirection='column'>
          <Text color='red'>❌ Error: {message}</Text>
          {errorCode && <Text color='gray'>Error code: {errorCode}</Text>}
          <Newline />
          <Text color='gray'>
            Usage: quotto --quote "Your quote" [--title "Book Title"] [--author
            "Author Name"] [--output "output.png"]
          </Text>
          {errorCode === ErrorCode.EMPTY_QUOTE && (
            <Text color='yellow'>
              💡 Tip: The quote text cannot be empty or contain only whitespace
            </Text>
          )}
          {errorCode === ErrorCode.INVALID_OUTPUT_PATH && (
            <Text color='yellow'>
              💡 Tip: The output file must have a .png extension
            </Text>
          )}
        </Box>
      )}
    </Box>
  );
};

const args = process.argv.slice(2);

if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  showHelp();
  process.exit(0);
}

render(<App args={args} />);
