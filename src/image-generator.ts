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

    for (const char of chars) {
      const charWidth = getCharWidth(char);
      const estimatedPixelWidth = charWidth * fontSize * 0.5;

      if (currentWidth + estimatedPixelWidth > maxWidth && currentLine) {
        allLines.push(currentLine);
        currentLine = char;
        currentWidth = estimatedPixelWidth;
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

function calculateOptimalFontSizes(quoteData: QuoteData): {
  quoteFontSize: number;
  titleFontSize: number;
  authorFontSize: number;
} {
  // Base font sizes
  let quoteFontSize = 24;
  let titleFontSize = 18;
  let authorFontSize = 16;

  // Calculate total text length to determine if we need to reduce font sizes
  const totalTextLength = quoteData.quote.length + 
    (quoteData.title?.length || 0) + 
    (quoteData.author?.length || 0);

  // Reduce font sizes for very long content
  if (totalTextLength > 500) {
    quoteFontSize = 18;
    titleFontSize = 14;
    authorFontSize = 12;
  } else if (totalTextLength > 300) {
    quoteFontSize = 20;
    titleFontSize = 16;
    authorFontSize = 14;
  }

  return { quoteFontSize, titleFontSize, authorFontSize };
}

function calculateRequiredHeight(
  quoteData: QuoteData,
  fontSizes: { quoteFontSize: number; titleFontSize: number; authorFontSize: number }
): number {
  const { quoteFontSize, titleFontSize, authorFontSize } = fontSizes;
  
  let totalHeight = 120; // Starting Y position
  
  // Quote section
  const quoteLines = wrapText(quoteData.quote, MAX_TEXT_WIDTH, quoteFontSize);
  totalHeight += quoteLines.length * (quoteFontSize + 8);
  totalHeight += 40; // Section spacing
  
  // Title section
  if (quoteData.title) {
    const titleLines = wrapText(quoteData.title, MAX_TEXT_WIDTH, titleFontSize);
    totalHeight += titleLines.length * (titleFontSize + 6);
    totalHeight += 20; // Section spacing
  }
  
  // Author section
  if (quoteData.author) {
    const authorLines = wrapText(quoteData.author, MAX_TEXT_WIDTH, authorFontSize);
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

  const quoteLines = wrapText(quoteData.quote, MAX_TEXT_WIDTH, quoteFontSize);

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
    const titleLines = wrapText(quoteData.title, MAX_TEXT_WIDTH, titleFontSize);
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
    const authorLines = wrapText(
      quoteData.author,
      MAX_TEXT_WIDTH,
      authorFontSize
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
