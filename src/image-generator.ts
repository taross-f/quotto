import sharp from 'sharp';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { DEFAULT_CONFIG, getMaxTextWidth } from './constants';
import type {
  QuoteData,
  AppConfig,
  FontSizes,
  ElementResult,
  SvgParts,
  ValidationResult,
  NonEmptyString,
  QuottoError,
  ErrorCode,
} from './types';
import {
  createNonEmptyString,
  QuottoError as QuottoErrorClass,
  ErrorCode as EC,
} from './types';

function getCharWidth(char: string): number {
  // Check if character is full-width (Japanese, Chinese, Korean, etc.)
  const code = char.charCodeAt(0);
  if (
    (code >= 0x3000 && code <= 0x303f) || // CJK punctuation
    (code >= 0x3040 && code <= 0x309f) || // Hiragana
    (code >= 0x30a0 && code <= 0x30ff) || // Katakana
    (code >= 0x4e00 && code <= 0x9faf) || // CJK unified ideographs
    (code >= 0xff00 && code <= 0xffef) // Full-width ASCII
  ) {
    return 2;
  }
  return 1;
}

function calculateTextWidth(text: string): number {
  let width = 0;
  for (const char of text) {
    width += getCharWidth(char);
  }
  return width;
}

export function wrapText(
  text: string,
  maxWidth: number,
  fontSize: number,
  config: AppConfig = DEFAULT_CONFIG
): string[] {
  // First, split by existing newlines
  const paragraphs = text.split('\n');
  const allLines: string[] = [];

  for (const paragraph of paragraphs) {
    if (paragraph.trim() === '') {
      allLines.push('');
      continue;
    }

    const chars = paragraph.split('');
    let currentLine = '';
    let currentWidth = 0;

    for (let i = 0; i < chars.length; i++) {
      const char = chars[i];
      const charWidth = getCharWidth(char);
      const estimatedPixelWidth = charWidth * fontSize * 0.5;

      if (currentWidth + estimatedPixelWidth > maxWidth && currentLine) {
        // 禁則処理: 行末禁則文字のチェック
        let lineBreakPos = currentLine.length;
        let moveToNext = '';

        // 現在の行の最後の文字が行末禁則文字の場合
        if (
          config.text.kinsoku.lineEndProhibited.includes(
            currentLine[currentLine.length - 1]
          )
        ) {
          // 行末禁則文字を次の行に移動
          lineBreakPos = currentLine.length - 1;
          moveToNext = currentLine[currentLine.length - 1];
        }

        // 次の文字が行頭禁則文字の場合
        if (config.text.kinsoku.lineStartProhibited.includes(char)) {
          // 現在の行の最後の文字も次の行に移動
          if (lineBreakPos > 0) {
            lineBreakPos--;
            moveToNext = currentLine[lineBreakPos] + moveToNext;
          }
        }

        // 行を分割
        const finalLine = currentLine.substring(0, lineBreakPos);
        if (finalLine) {
          allLines.push(finalLine);
        }

        // 次の行を開始
        currentLine = moveToNext + char;
        currentWidth = 0;
        for (const c of currentLine) {
          currentWidth += getCharWidth(c) * fontSize * 0.5;
        }
      } else {
        currentLine += char;
        currentWidth += estimatedPixelWidth;
      }
    }

    if (currentLine) {
      allLines.push(currentLine);
    }
  }

  return allLines;
}

function truncateTextToMaxLines(lines: string[], maxLines: number): string[] {
  if (lines.length <= maxLines) {
    return lines;
  }

  const truncatedLines = lines.slice(0, maxLines - 1);
  const lastLine = lines[maxLines - 1];

  // Add ellipsis to the last line, ensuring it fits
  const ellipsis = '...';
  if (lastLine.length > 10) {
    truncatedLines.push(lastLine.substring(0, lastLine.length - 3) + ellipsis);
  } else {
    truncatedLines.push(lastLine + ellipsis);
  }

  return truncatedLines;
}

function calculateOptimalFontSizes(
  quoteData: QuoteData,
  config: AppConfig = DEFAULT_CONFIG
): FontSizes {
  // Base font sizes
  let quoteFontSize = config.font.sizes.quote.base;
  let titleFontSize = config.font.sizes.title.base;
  let authorFontSize = config.font.sizes.author.base;

  const maxTextWidth = getMaxTextWidth(config);

  // Calculate estimated line counts with base font sizes
  const quoteLines = wrapText(
    quoteData.quote,
    maxTextWidth,
    quoteFontSize,
    config
  );
  const titleLines = quoteData.title
    ? wrapText(quoteData.title, maxTextWidth, titleFontSize, config)
    : [];
  const authorLines = quoteData.author
    ? wrapText(quoteData.author, maxTextWidth, authorFontSize, config)
    : [];

  // Check if we need to reduce font sizes based on line counts
  if (
    quoteLines.length > config.text.maxLines.quote ||
    titleLines.length > config.text.maxLines.title ||
    authorLines.length > config.text.maxLines.author
  ) {
    // Use minimum font sizes for very long content
    quoteFontSize = config.font.sizes.quote.min;
    titleFontSize = config.font.sizes.title.min;
    authorFontSize = config.font.sizes.author.min;
  }

  return { quoteFontSize, titleFontSize, authorFontSize };
}

function calculateRequiredHeight(
  quoteData: QuoteData,
  fontSizes: FontSizes,
  config: AppConfig = DEFAULT_CONFIG
): number {
  const { quoteFontSize, titleFontSize, authorFontSize } = fontSizes;
  const maxTextWidth = getMaxTextWidth(config);

  let totalHeight = config.spacing.startY; // Starting Y position

  // Quote section - limit to max lines
  const quoteLines = truncateTextToMaxLines(
    wrapText(quoteData.quote, maxTextWidth, quoteFontSize, config),
    config.text.maxLines.quote
  );
  totalHeight +=
    quoteLines.length * (quoteFontSize + config.spacing.lineGap.quote);
  totalHeight += config.spacing.sectionGap.afterQuote; // Section spacing

  // Title section - limit to max lines
  if (quoteData.title) {
    const titleLines = truncateTextToMaxLines(
      wrapText(quoteData.title, maxTextWidth, titleFontSize, config),
      config.text.maxLines.title
    );
    totalHeight +=
      titleLines.length * (titleFontSize + config.spacing.lineGap.title);
    totalHeight += config.spacing.sectionGap.afterTitle; // Section spacing
  }

  // Author section - limit to max lines
  if (quoteData.author) {
    const authorLines = truncateTextToMaxLines(
      wrapText(quoteData.author, maxTextWidth, authorFontSize, config),
      config.text.maxLines.author
    );
    totalHeight +=
      authorLines.length * (authorFontSize + config.spacing.lineGap.author);
  }

  totalHeight += config.canvas.footerHeight; // Footer space

  return totalHeight;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function createSvgBackground(config: AppConfig, canvasHeight: number): string {
  return `
    <rect width="100%" height="100%" fill="${config.colors.background}"/>
    <rect x="0" y="0" width="100%" height="${config.spacing.accentBar.height}" fill="${config.colors.accent}"/>
    <rect x="0" y="${canvasHeight - config.spacing.accentBar.height}" width="100%" height="${config.spacing.accentBar.height}" fill="${config.colors.accent}"/>
  `;
}

function createDecorativeQuote(config: AppConfig): string {
  return `
    <text x="${config.canvas.width / 2}" y="${config.spacing.startY}" 
          fill="${config.colors.text.decorativeQuote}" 
          font-size="${config.font.sizes.decorativeQuote}" 
          font-family="${config.font.families.serif}" 
          font-weight="bold" 
          opacity="${config.opacity.decorativeQuote}" 
          text-anchor="middle">"</text>
  `;
}

function createDecorativeLines(
  config: AppConfig,
  maxTextWidth: number,
  afterQuoteY: number
): string {
  return `
    <rect x="${config.canvas.margin}" y="90" width="${maxTextWidth}" height="${config.spacing.decorativeLine.height}" fill="${config.colors.decorative.line}"/>
    <rect x="${config.canvas.margin}" y="${afterQuoteY}" width="${maxTextWidth}" height="${config.spacing.decorativeLine.thickness}" fill="${config.colors.decorative.line}"/>
  `;
}

function createQuoteElements(
  lines: readonly string[],
  config: AppConfig,
  fontSize: number,
  startY: number
): ElementResult {
  let currentY = startY;
  let elements = '';

  for (const line of lines) {
    elements += `
      <text x="${config.canvas.width / 2}" y="${currentY}" 
            fill="${config.colors.text.quote}" 
            font-size="${fontSize}" 
            font-family="${config.font.families.serif}" 
            text-anchor="middle" 
            font-style="italic">${escapeXml(line)}</text>`;
    currentY += fontSize + config.spacing.lineGap.quote;
  }

  return { elements, endY: currentY };
}

function createTitleElements(
  lines: readonly string[],
  config: AppConfig,
  fontSize: number,
  startY: number
): ElementResult {
  let currentY = startY;
  let elements = '';

  for (const line of lines) {
    elements += `
      <text x="${config.canvas.width / 2}" y="${currentY}" 
            fill="${config.colors.text.title}" 
            font-size="${fontSize}" 
            font-family="${config.font.families.serif}" 
            text-anchor="middle" 
            font-weight="bold">${escapeXml(line)}</text>`;
    currentY += fontSize + config.spacing.lineGap.title;
  }

  return { elements, endY: currentY };
}

function createAuthorElements(
  lines: readonly string[],
  config: AppConfig,
  fontSize: number,
  startY: number
): ElementResult {
  let currentY = startY;
  let elements = '';

  for (const line of lines) {
    elements += `
      <text x="${config.canvas.width / 2}" y="${currentY}" 
            fill="${config.colors.text.author}" 
            font-size="${fontSize}" 
            font-family="${config.font.families.serif}" 
            text-anchor="middle">${escapeXml(line)}</text>`;
    currentY += fontSize + config.spacing.lineGap.author;
  }

  return { elements, endY: currentY };
}

function createFooter(config: AppConfig, canvasHeight: number): string {
  return `
    <text x="${config.canvas.width / 2}" y="${canvasHeight - 30}" 
          fill="${config.colors.text.footer}" 
          font-size="${config.font.sizes.footer}" 
          font-family="${config.font.families.sansSerif}" 
          text-anchor="middle" 
          opacity="${config.opacity.footer}">Generated by Quotto</text>
  `;
}

function assembleSvg(
  config: AppConfig,
  canvasHeight: number,
  parts: SvgParts
): string {
  return `
    <svg width="${config.canvas.width}" height="${canvasHeight}" xmlns="http://www.w3.org/2000/svg">
      ${parts.background}
      ${parts.decorativeQuote}
      ${parts.decorativeLines}
      ${parts.quote}
      ${parts.title}
      ${parts.author}
      ${parts.footer}
    </svg>
  `;
}

function validateQuoteData(quoteData: QuoteData): ValidationResult<QuoteData> {
  const quoteResult = createNonEmptyString(quoteData.quote);
  if (!quoteResult.success) {
    return {
      success: false,
      error: `Quote text is required: ${quoteResult.error}`,
    };
  }

  return { success: true, data: quoteData };
}

function validateOutputPath(outputPath: string): ValidationResult<string> {
  if (!outputPath || outputPath.trim() === '') {
    return { success: false, error: 'Output path cannot be empty' };
  }

  const trimmed = outputPath.trim();
  if (!trimmed.endsWith('.png')) {
    return { success: false, error: 'Output path must have .png extension' };
  }

  return { success: true, data: trimmed };
}

export async function generateQuoteImage(
  quoteData: QuoteData,
  outputPath: string,
  config: AppConfig = DEFAULT_CONFIG
): Promise<void> {
  // Validate inputs
  const quoteValidation = validateQuoteData(quoteData);
  if (!quoteValidation.success) {
    throw new QuottoErrorClass(quoteValidation.error, EC.EMPTY_QUOTE, {
      quoteData,
    });
  }

  const pathValidation = validateOutputPath(outputPath);
  if (!pathValidation.success) {
    throw new QuottoErrorClass(pathValidation.error, EC.INVALID_OUTPUT_PATH, {
      outputPath,
    });
  }

  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Calculate optimal font sizes based on content length
  const fontSizes = calculateOptimalFontSizes(quoteData, config);
  const { quoteFontSize, titleFontSize, authorFontSize } = fontSizes;

  // Calculate required canvas height
  const requiredHeight = calculateRequiredHeight(quoteData, fontSizes, config);
  const canvasHeight = Math.max(
    config.canvas.minHeight,
    Math.min(config.canvas.maxHeight, requiredHeight)
  );

  const maxTextWidth = getMaxTextWidth(config);

  // Prepare text lines
  const quoteLines = truncateTextToMaxLines(
    wrapText(quoteData.quote, maxTextWidth, quoteFontSize, config),
    config.text.maxLines.quote
  );

  const titleLines = quoteData.title
    ? truncateTextToMaxLines(
        wrapText(quoteData.title, maxTextWidth, titleFontSize, config),
        config.text.maxLines.title
      )
    : [];

  const authorLines = quoteData.author
    ? truncateTextToMaxLines(
        wrapText(quoteData.author, maxTextWidth, authorFontSize, config),
        config.text.maxLines.author
      )
    : [];

  // Generate SVG elements using template functions
  let currentY = config.spacing.startY;

  const quoteResult = createQuoteElements(
    quoteLines,
    config,
    quoteFontSize,
    currentY
  );
  currentY = quoteResult.endY + config.spacing.sectionGap.afterQuote;

  const titleResult =
    titleLines.length > 0
      ? createTitleElements(titleLines, config, titleFontSize, currentY)
      : { elements: '', endY: currentY };
  currentY =
    titleResult.endY +
    (titleLines.length > 0 ? config.spacing.sectionGap.afterTitle : 0);

  const authorResult =
    authorLines.length > 0
      ? createAuthorElements(authorLines, config, authorFontSize, currentY)
      : { elements: '', endY: currentY };

  // Assemble SVG
  const svg = assembleSvg(config, canvasHeight, {
    background: createSvgBackground(config, canvasHeight),
    decorativeQuote: createDecorativeQuote(config),
    decorativeLines: createDecorativeLines(
      config,
      maxTextWidth,
      quoteResult.endY - config.spacing.sectionGap.afterQuote
    ),
    quote: quoteResult.elements,
    title: titleResult.elements,
    author: authorResult.elements,
    footer: createFooter(config, canvasHeight),
  });

  const buffer = Buffer.from(svg);

  try {
    await sharp(buffer).png().toFile(outputPath);
  } catch (error) {
    throw new QuottoErrorClass(
      `Failed to write image file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      EC.FILE_WRITE_FAILED,
      { outputPath, error }
    );
  }
}
