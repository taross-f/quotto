import sharp from "sharp";
import * as fs from "node:fs";
import * as path from "node:path";

export interface QuoteData {
  quote: string;
  title?: string;
  author?: string;
}

const CANVAS_WIDTH = 600;
const MIN_CANVAS_HEIGHT = 400;
const MAX_CANVAS_HEIGHT = 1200;
const MARGIN = 60;
const MAX_TEXT_WIDTH = CANVAS_WIDTH - MARGIN * 2;
const FOOTER_HEIGHT = 50;

// Minimum readable font sizes
const MIN_QUOTE_FONT_SIZE = 16;
const MIN_TITLE_FONT_SIZE = 14;
const MIN_AUTHOR_FONT_SIZE = 12;

// Maximum lines per section to maintain readability
const MAX_QUOTE_LINES = 15;
const MAX_TITLE_LINES = 6;
const MAX_AUTHOR_LINES = 3;

// 禁則処理用の文字セット
const LINE_START_PROHIBITED = "、。）」』！？、。．，）】｝・ゝゞ々ー～…";
const LINE_END_PROHIBITED = "（「『（【｛";

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

function wrapText(text: string, maxWidth: number, fontSize: number): string[] {
  // First, split by existing newlines
  const paragraphs = text.split("\n");
  const allLines: string[] = [];

  for (const paragraph of paragraphs) {
    if (paragraph.trim() === "") {
      allLines.push("");
      continue;
    }

    const chars = paragraph.split("");
    let currentLine = "";
    let currentWidth = 0;

    for (let i = 0; i < chars.length; i++) {
      const char = chars[i];
      const charWidth = getCharWidth(char);
      const estimatedPixelWidth = charWidth * fontSize * 0.5;

      if (currentWidth + estimatedPixelWidth > maxWidth && currentLine) {
        // 禁則処理: 行末禁則文字のチェック
        let lineBreakPos = currentLine.length;
        let moveToNext = "";
        
        // 現在の行の最後の文字が行末禁則文字の場合
        if (LINE_END_PROHIBITED.includes(currentLine[currentLine.length - 1])) {
          // 行末禁則文字を次の行に移動
          lineBreakPos = currentLine.length - 1;
          moveToNext = currentLine[currentLine.length - 1];
        }
        
        // 次の文字が行頭禁則文字の場合
        if (LINE_START_PROHIBITED.includes(char)) {
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
  const ellipsis = "...";
  if (lastLine.length > 10) {
    truncatedLines.push(lastLine.substring(0, lastLine.length - 3) + ellipsis);
  } else {
    truncatedLines.push(lastLine + ellipsis);
  }
  
  return truncatedLines;
}

function calculateOptimalFontSizes(quoteData: QuoteData): {
  quoteFontSize: number;
  titleFontSize: number;
  authorFontSize: number;
} {
  // Base font sizes
  let quoteFontSize = 24;
  let titleFontSize = 18;
  let authorFontSize = 16;

  // Calculate estimated line counts with base font sizes
  const quoteLines = wrapText(quoteData.quote, MAX_TEXT_WIDTH, quoteFontSize);
  const titleLines = quoteData.title ? wrapText(quoteData.title, MAX_TEXT_WIDTH, titleFontSize) : [];
  const authorLines = quoteData.author ? wrapText(quoteData.author, MAX_TEXT_WIDTH, authorFontSize) : [];

  // Check if we need to reduce font sizes based on line counts
  if (quoteLines.length > MAX_QUOTE_LINES || 
      titleLines.length > MAX_TITLE_LINES || 
      authorLines.length > MAX_AUTHOR_LINES) {
    
    // Use minimum font sizes for very long content
    quoteFontSize = MIN_QUOTE_FONT_SIZE;
    titleFontSize = MIN_TITLE_FONT_SIZE;
    authorFontSize = MIN_AUTHOR_FONT_SIZE;
  }

  return { quoteFontSize, titleFontSize, authorFontSize };
}

function calculateRequiredHeight(
  quoteData: QuoteData,
  fontSizes: { quoteFontSize: number; titleFontSize: number; authorFontSize: number }
): number {
  const { quoteFontSize, titleFontSize, authorFontSize } = fontSizes;
  
  let totalHeight = 120; // Starting Y position
  
  // Quote section - limit to max lines
  const quoteLines = truncateTextToMaxLines(
    wrapText(quoteData.quote, MAX_TEXT_WIDTH, quoteFontSize),
    MAX_QUOTE_LINES
  );
  totalHeight += quoteLines.length * (quoteFontSize + 8);
  totalHeight += 40; // Section spacing
  
  // Title section - limit to max lines
  if (quoteData.title) {
    const titleLines = truncateTextToMaxLines(
      wrapText(quoteData.title, MAX_TEXT_WIDTH, titleFontSize),
      MAX_TITLE_LINES
    );
    totalHeight += titleLines.length * (titleFontSize + 6);
    totalHeight += 20; // Section spacing
  }
  
  // Author section - limit to max lines
  if (quoteData.author) {
    const authorLines = truncateTextToMaxLines(
      wrapText(quoteData.author, MAX_TEXT_WIDTH, authorFontSize),
      MAX_AUTHOR_LINES
    );
    totalHeight += authorLines.length * (authorFontSize + 4);
  }
  
  totalHeight += FOOTER_HEIGHT; // Footer space
  
  return totalHeight;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function generateQuoteImage(
  quoteData: QuoteData,
  outputPath: string
): Promise<void> {
  if (!quoteData.quote || quoteData.quote.trim() === "") {
    throw new Error("Quote text cannot be empty");
  }

  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Calculate optimal font sizes based on content length
  const fontSizes = calculateOptimalFontSizes(quoteData);
  const { quoteFontSize, titleFontSize, authorFontSize } = fontSizes;

  // Calculate required canvas height
  const requiredHeight = calculateRequiredHeight(quoteData, fontSizes);
  const canvasHeight = Math.max(MIN_CANVAS_HEIGHT, Math.min(MAX_CANVAS_HEIGHT, requiredHeight));

  const quoteLines = truncateTextToMaxLines(
    wrapText(quoteData.quote, MAX_TEXT_WIDTH, quoteFontSize),
    MAX_QUOTE_LINES
  );

  let currentY = 120;

  let quoteElements = "";
  for (const line of quoteLines) {
    quoteElements += `<text x="${
      CANVAS_WIDTH / 2
    }" y="${currentY}" fill="#2c3e50" font-size="${quoteFontSize}" font-family="Georgia, serif" text-anchor="middle" font-style="italic">${escapeXml(
      line
    )}</text>`;
    currentY += quoteFontSize + 8;
  }

  currentY += 40;

  let titleElement = "";
  if (quoteData.title) {
    const titleLines = truncateTextToMaxLines(
      wrapText(quoteData.title, MAX_TEXT_WIDTH, titleFontSize),
      MAX_TITLE_LINES
    );
    for (const line of titleLines) {
      titleElement += `<text x="${
        CANVAS_WIDTH / 2
      }" y="${currentY}" fill="#34495e" font-size="${titleFontSize}" font-family="Georgia, serif" text-anchor="middle" font-weight="bold">${escapeXml(
        line
      )}</text>`;
      currentY += titleFontSize + 6;
    }
    currentY += 20;
  }

  let authorElement = "";
  if (quoteData.author) {
    const authorLines = truncateTextToMaxLines(
      wrapText(quoteData.author, MAX_TEXT_WIDTH, authorFontSize),
      MAX_AUTHOR_LINES
    );
    for (const line of authorLines) {
      authorElement += `<text x="${
        CANVAS_WIDTH / 2
      }" y="${currentY}" fill="#7f8c8d" font-size="${authorFontSize}" font-family="Georgia, serif" text-anchor="middle">${escapeXml(
        line
      )}</text>`;
      currentY += authorFontSize + 4;
    }
  }

  const svg = `
    <svg width="${CANVAS_WIDTH}" height="${canvasHeight}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f8f9fa"/>
      <rect x="0" y="0" width="100%" height="8" fill="#3498db"/>
      <rect x="0" y="${
        canvasHeight - 8
      }" width="100%" height="8" fill="#3498db"/>
      
      <text x="${
        CANVAS_WIDTH / 2
      }" y="120" fill="#b0b0b0" font-size="120" font-family="Times New Roman, serif" font-weight="bold" opacity="0.3" text-anchor="middle">"</text>
      
      <rect x="${MARGIN}" y="90" width="${MAX_TEXT_WIDTH}" height="2" fill="#ecf0f1"/>
      
      ${quoteElements}
      
      <rect x="${MARGIN}" y="${
    currentY - 20
  }" width="${MAX_TEXT_WIDTH}" height="1" fill="#ecf0f1"/>
      
      ${titleElement}
      ${authorElement}
      
      <text x="${CANVAS_WIDTH / 2}" y="${
    canvasHeight - 30
  }" fill="#95a5a6" font-size="12" font-family="Arial, sans-serif" text-anchor="middle" opacity="0.7">Generated by Quotto</text>
    </svg>
  `;

  const buffer = Buffer.from(svg);

  await sharp(buffer).png().toFile(outputPath);
}
