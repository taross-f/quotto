#!/usr/bin/env bun
import type React from 'react';
import { useState, useEffect } from 'react';
import { render, Text, Box, Newline } from 'ink';
import { parseCliArgs } from './cli-parser';
import { generateKindleQuoteImage } from './image-generator';

interface AppProps {
  args: string[];
}

const App: React.FC<AppProps> = ({ args }) => {
  const [status, setStatus] = useState<'parsing' | 'generating' | 'success' | 'error'>('parsing');
  const [message, setMessage] = useState<string>('');
  const [outputPath, setOutputPath] = useState<string>('');

  useEffect(() => {
    const processArgs = async () => {
      try {
        setStatus('parsing');
        setMessage('Parsing arguments...');
        
        const parsedArgs = parseCliArgs(args);
        setOutputPath(parsedArgs.output);
        
        setStatus('generating');
        setMessage('Generating Kindle quote image...');
        
        await generateKindleQuoteImage({
          quote: parsedArgs.quote,
          title: parsedArgs.title,
          author: parsedArgs.author,
        }, parsedArgs.output);
        
        setStatus('success');
        setMessage(`Image generated successfully: ${parsedArgs.output}`);
      } catch (error) {
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'An unknown error occurred');
      }
    };

    processArgs();
  }, [args]);

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold color="blue">
        📚 Innyo Quote Generator
      </Text>
      <Newline />
      
      {status === 'parsing' && (
        <Text color="yellow">⏳ {message}</Text>
      )}
      
      {status === 'generating' && (
        <Text color="yellow">🎨 {message}</Text>
      )}
      
      {status === 'success' && (
        <Box flexDirection="column">
          <Text color="green">✅ {message}</Text>
          <Newline />
          <Text color="gray">Output file: {outputPath}</Text>
        </Box>
      )}
      
      {status === 'error' && (
        <Box flexDirection="column">
          <Text color="red">❌ Error: {message}</Text>
          <Newline />
          <Text color="gray">Usage: innyo --quote "Your quote" [--title "Book Title"] [--author "Author Name"] [--output "output.png"]</Text>
        </Box>
      )}
    </Box>
  );
};

const args = process.argv.slice(2);

if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  console.log(`
📚 Innyo Quote Generator

Usage:
  innyo --quote "Your quote text" [options]

Options:
  --quote     Quote text (required) - supports \\n for line breaks
  --title     Book title (optional) - supports \\n for line breaks
  --author    Author name (optional) - supports \\n for line breaks
  --output    Output file path (optional, defaults to innyo-quote-[timestamp].png)
  --help, -h  Show this help message

Examples:
  innyo --quote "The only way to do great work is to love what you do."
  innyo --quote "Stay hungry,\\nstay foolish." --title "Stanford Commencement" --author "Steve Jobs"
  innyo --quote "Innovation distinguishes\\nbetween a leader and a follower." --title "Various Interviews" --author "Steve Jobs" --output "my-quote.png"
`);
  process.exit(0);
}

render(<App args={args} />);