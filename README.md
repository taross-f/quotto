# Quotto - Beautiful Quote Image Generator

A CLI tool to generate beautiful quote images inspired by e-reader aesthetics, built with TypeScript, Bun, and Ink.

## Features

- 📚 Generate beautiful quote images with customizable text
- 🎨 Clean, minimalist design inspired by e-reader interfaces
- 📝 Support for multiline quotes with `\n` escape sequences
- ⚡ Fast execution with Bun runtime
- 🎯 Interactive CLI with Ink React components
- 🧪 Comprehensive test coverage with TDD approach

## Installation

### Prerequisites

- [Bun](https://bun.sh/) (v1.0.0 or higher)
- Node.js (for compatibility)

### Install from source

```bash
git clone https://github.com/taross-f/quotto.git
cd quotto
bun install
```

### Development setup

```bash
# Install dependencies
bun install

# Run tests
bun test

# Run linter
bun run lint

# Start development mode
bun run dev
```

## Usage

### Basic usage

```bash
bun run src/cli.tsx --quote "Your inspiring quote here"
```

### With all options

```bash
bun run src/cli.tsx \
  --quote "Innovation distinguishes\nbetween a leader and a follower." \
  --title "Various Interviews" \
  --author "Steve Jobs" \
  --output "my-quote.png"
```

### Command options

- `--quote` (required): The quote text to display. Supports `\n` for line breaks
- `--title` (optional): Book or source title. Supports `\n` for line breaks
- `--author` (optional): Author name. Supports `\n` for line breaks
- `--output` (optional): Output filename (default: `innyo-quote-[timestamp].png`)
- `--help, -h`: Show help message

### Examples

```bash
# Simple quote
bun run src/cli.tsx --quote "The only way to do great work is to love what you do."

# Quote with attribution
bun run src/cli.tsx \
  --quote "Stay hungry,\nstay foolish." \
  --title "Stanford Commencement Address" \
  --author "Steve Jobs"

# Custom output filename
bun run src/cli.tsx \
  --quote "Your time is limited,\ndon't waste it living someone else's life." \
  --output "inspirational.png"
```

## Development

### Project structure

```
quotto/
├── src/
│   ├── cli.tsx           # Main CLI interface with Ink
│   ├── cli-parser.ts     # Command line argument parser
│   └── image-generator.ts # SVG-based image generation
├── tests/
│   ├── cli.test.ts       # CLI parser tests
│   ├── image-generator.test.ts # Image generation tests
│   └── setup.test.ts     # Test setup verification
├── biome.json           # Biome linter configuration
├── tsconfig.json        # TypeScript configuration
└── package.json         # Project dependencies
```

### Testing

The project follows Test-Driven Development (TDD) principles:

```bash
# Run all tests
bun test

# Run specific test file
bun test tests/cli.test.ts

# Watch mode
bun test --watch
```

### Code quality

Using Biome for linting and formatting:

```bash
# Check code quality
bun run lint

# Fix lint issues
bun run lint:fix

# Format code
bun run format
```

## Output

Quotto generates PNG images with:
- Clean, minimalist design
- Customizable quote text with automatic word wrapping
- Optional book title and author attribution
- Subtle branding elements
- High-quality rendering using Sharp

## License and Disclaimer

This project is provided as-is for educational and personal use.

**⚠️ Important Notice:**
- This software is provided "AS IS" without warranty of any kind
- Users are responsible for their own use of this tool
- The maintainers assume no responsibility for how the tool is used
- Management and deployment of this tool is entirely at the user's own risk
- Users must ensure compliance with all applicable laws and regulations
- Any consequences arising from the use of this tool are the sole responsibility of the user

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Write tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## Tech Stack

- **Runtime**: [Bun](https://bun.sh/)
- **Language**: TypeScript
- **CLI Framework**: [Ink](https://github.com/vadimdemedes/ink) (React for CLIs)
- **Image Processing**: [Sharp](https://sharp.pixelplumbing.com/)
- **Linting**: [Biome](https://biomejs.dev/)
- **Testing**: Bun test runner

---

Built with ❤️ using modern web technologies