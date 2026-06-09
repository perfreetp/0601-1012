import { TextElement, TextStyle, FontSize, FontWeight, FontStyle, TextAlign } from '../types';
import { generateElementId, deepClone } from '../utils';

export class TypographyManager {
  createTitle(
    content: string,
    x: number,
    y: number,
    width: number,
    height: number,
    level: 1 | 2 | 3 = 1,
    themeColor: string = '#1F2937'
  ): TextElement {
    const levelConfig: Record<number, Partial<TextStyle>> = {
      1: { fontSize: 48, fontWeight: 700, lineHeight: 1.2 },
      2: { fontSize: 32, fontWeight: 600, lineHeight: 1.3 },
      3: { fontSize: 24, fontWeight: 600, lineHeight: 1.4 },
    };

    const config = levelConfig[level];

    return {
      id: generateElementId('text'),
      type: 'text',
      x,
      y,
      width,
      height,
      content,
      style: {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: config.fontSize as FontSize,
        fontWeight: config.fontWeight as FontWeight,
        fontStyle: 'normal',
        color: themeColor,
        textAlign: 'left',
        verticalAlign: 'middle',
        lineHeight: config.lineHeight,
      },
    };
  }

  createSubtitle(
    content: string,
    x: number,
    y: number,
    width: number,
    height: number,
    themeColor: string = '#6B7280'
  ): TextElement {
    return {
      id: generateElementId('text'),
      type: 'text',
      x,
      y,
      width,
      height,
      content,
      style: {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: 20,
        fontWeight: 400,
        fontStyle: 'normal',
        color: themeColor,
        textAlign: 'left',
        verticalAlign: 'top',
        lineHeight: 1.5,
      },
    };
  }

  createBody(
    content: string,
    x: number,
    y: number,
    width: number,
    height: number,
    themeColor: string = '#374151'
  ): TextElement {
    return {
      id: generateElementId('text'),
      type: 'text',
      x,
      y,
      width,
      height,
      content,
      style: {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: 16,
        fontWeight: 400,
        fontStyle: 'normal',
        color: themeColor,
        textAlign: 'left',
        verticalAlign: 'top',
        lineHeight: 1.8,
      },
    };
  }

  updateContent(element: TextElement, content: string): TextElement {
    return { ...deepClone(element), content };
  }

  updateStyle(element: TextElement, styleChanges: Partial<TextStyle>): TextElement {
    return {
      ...deepClone(element),
      style: { ...element.style, ...styleChanges },
    };
  }

  setFontSize(element: TextElement, fontSize: FontSize): TextElement {
    return this.updateStyle(element, { fontSize });
  }

  setFontWeight(element: TextElement, fontWeight: FontWeight): TextElement {
    return this.updateStyle(element, { fontWeight });
  }

  setFontStyle(element: TextElement, fontStyle: FontStyle): TextElement {
    return this.updateStyle(element, { fontStyle });
  }

  setColor(element: TextElement, color: string): TextElement {
    return this.updateStyle(element, { color });
  }

  setAlignment(element: TextElement, align: TextAlign): TextElement {
    return this.updateStyle(element, { textAlign: align });
  }

  setLineHeight(element: TextElement, lineHeight: number): TextElement {
    return this.updateStyle(element, { lineHeight });
  }

  toggleBold(element: TextElement): TextElement {
    const currentWeight = element.style.fontWeight;
    const newWeight: FontWeight = currentWeight >= 600 ? 400 : 700;
    return this.setFontWeight(element, newWeight);
  }

  toggleItalic(element: TextElement): TextElement {
    const newStyle: FontStyle = element.style.fontStyle === 'italic' ? 'normal' : 'italic';
    return this.setFontStyle(element, newStyle);
  }

  measureText(content: string, style: TextStyle): { width: number; height: number } {
    if (typeof document === 'undefined') {
      return { width: content.length * style.fontSize * 0.5, height: style.fontSize * (style.lineHeight || 1.5) };
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return { width: content.length * style.fontSize * 0.5, height: style.fontSize * (style.lineHeight || 1.5) };
    }

    ctx.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize}px ${style.fontFamily}`;
    const metrics = ctx.measureText(content);
    return {
      width: metrics.width,
      height: style.fontSize * (style.lineHeight || 1.5),
    };
  }

  wrapText(content: string, style: TextStyle, maxWidth: number): string[] {
    const words = content.split('');
    const lines: string[] = [];
    let currentLine = '';

    for (const char of words) {
      const testLine = currentLine + char;
      const { width } = this.measureText(testLine, style);
      if (width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = char;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }
}
