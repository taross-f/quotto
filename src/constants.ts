import type { AppConfig } from './types';

export const DEFAULT_CONFIG: AppConfig = {
  canvas: {
    width: 600,
    minHeight: 400,
    maxHeight: 1200,
    margin: 60,
    footerHeight: 50,
  },
  font: {
    families: {
      serif: 'Georgia, serif',
      sansSerif: 'Arial, sans-serif',
    },
    sizes: {
      quote: {
        base: 24,
        min: 16,
      },
      title: {
        base: 18,
        min: 14,
      },
      author: {
        base: 16,
        min: 12,
      },
      footer: 12,
      decorativeQuote: 120,
    },
    lineHeights: {
      quote: 8,
      title: 6,
      author: 4,
    },
  },
  text: {
    maxLines: {
      quote: 15,
      title: 6,
      author: 3,
    },
    kinsoku: {
      lineStartProhibited: '、。）」』！？、。．，）】｝・ゝゞ々ー～…',
      lineEndProhibited: '（「『（【｛',
    },
  },
  colors: {
    background: '#f8f9fa',
    accent: '#3498db',
    text: {
      quote: '#2c3e50',
      title: '#34495e',
      author: '#7f8c8d',
      footer: '#95a5a6',
      decorativeQuote: '#b0b0b0',
    },
    decorative: {
      line: '#ecf0f1',
    },
  },
  opacity: {
    decorativeQuote: 0.3,
    footer: 0.7,
  },
  spacing: {
    startY: 120,
    sectionGap: {
      afterQuote: 40,
      afterTitle: 20,
    },
    lineGap: {
      quote: 8,
      title: 6,
      author: 4,
    },
    decorativeLine: {
      height: 2,
      thickness: 1,
    },
    accentBar: {
      height: 8,
    },
  },
};

export function getMaxTextWidth(config: AppConfig): number {
  return config.canvas.width - config.canvas.margin * 2;
}
