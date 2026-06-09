import {
  DesignProject,
  ExportOptions,
  ExportFormat,
} from '../types';
import { convertSizeToPx } from './sizes';
import { PreviewManager } from './PreviewManager';

export class ExportManager {
  private previewManager: PreviewManager;

  constructor(previewManager: PreviewManager) {
    this.previewManager = previewManager;
  }

  async exportToBlob(
    project: DesignProject,
    options: ExportOptions
  ): Promise<Blob> {
    const { width, height } = convertSizeToPx(project.canvas.size);
    const scale = options.scale || 2;

    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context not available');

    ctx.scale(scale, scale);

    ctx.fillStyle = project.canvas.backgroundColor;
    ctx.fillRect(0, 0, width, height);

    const sortedElements = [...project.canvas.elements].sort(
      (a, b) => (a.zIndex || 0) - (b.zIndex || 0)
    );

    for (const el of sortedElements) {
      if (el.visible === false) continue;
      await this.drawElement(ctx, el as any, project);
    }

    if (project.watermark?.enabled && options.includeWatermark !== false) {
      this.drawWatermark(ctx, project.watermark, width, height);
    }

    let mimeType: string;
    let quality = options.quality;

    switch (options.format) {
      case 'png':
        mimeType = 'image/png';
        break;
      case 'jpg':
      case 'jpeg':
        mimeType = 'image/jpeg';
        quality = quality ?? 0.92;
        break;
      case 'svg':
        return this.exportToSvgBlob(project, options);
      case 'pdf':
        throw new Error('PDF 格式导出暂不支持，请使用 PNG、JPG 或 SVG 格式。如需导出 PDF，建议先导出为 PNG 图片后转换。');
      default:
        mimeType = 'image/png';
    }

    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to create blob'));
        },
        mimeType,
        quality
      );
    });
  }

  async exportToDataUrl(
    project: DesignProject,
    options: ExportOptions
  ): Promise<string> {
    const blob = await this.exportToBlob(project, options);
    return this.blobToDataUrl(blob);
  }

  async download(
    project: DesignProject,
    options: ExportOptions
  ): Promise<string> {
    const blob = await this.exportToBlob(project, options);
    const url = URL.createObjectURL(blob);

    const filename = options.filename || this.generateFilename(project, options.format);

    if (typeof document !== 'undefined') {
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }

    setTimeout(() => URL.revokeObjectURL(url), 60000);
    return url;
  }

  private generateFilename(project: DesignProject, format: ExportFormat): string {
    const safeName = project.name.replace(/[^a-z0-9_\-]/gi, '_');
    const extMap: Record<ExportFormat, string> = {
      png: 'png',
      jpg: 'jpg',
      jpeg: 'jpg',
      svg: 'svg',
      pdf: 'pdf',
    };
    return `${safeName || 'design'}_${Date.now()}.${extMap[format]}`;
  }

  private async drawElement(
    ctx: CanvasRenderingContext2D,
    element: any,
    project: DesignProject
  ): Promise<void> {
    ctx.save();
    if (element.rotation) {
      ctx.translate(element.x + element.width / 2, element.y + element.height / 2);
      ctx.rotate((element.rotation * Math.PI) / 180);
      ctx.translate(-(element.x + element.width / 2), -(element.y + element.height / 2));
    }
    if (element.opacity !== undefined) {
      ctx.globalAlpha = element.opacity;
    }

    switch (element.type) {
      case 'text':
        this.drawText(ctx, element);
        break;
      case 'shape':
        this.drawShape(ctx, element);
        break;
      case 'image':
        await this.drawImageElement(ctx, element);
        break;
      case 'question_card':
        this.drawQuestionCard(ctx, element);
        break;
    }

    ctx.restore();
  }

  private drawText(ctx: CanvasRenderingContext2D, el: any): void {
    const s = el.style;
    ctx.font = `${s.fontStyle} ${s.fontWeight} ${s.fontSize}px ${s.fontFamily}`;
    ctx.fillStyle = s.color;
    ctx.textBaseline = 'top';

    const alignMap: Record<string, CanvasTextAlign> = {
      left: 'left',
      center: 'center',
      right: 'right',
      justify: 'left',
    };
    ctx.textAlign = alignMap[s.textAlign] || 'left';

    const lines = this.wrapTextForCanvas(ctx, el.content, el.width);
    const lineHeight = s.fontSize * (s.lineHeight || 1.5);
    const totalHeight = lines.length * lineHeight;

    let startY = el.y;
    if (s.verticalAlign === 'middle') {
      startY = el.y + (el.height - totalHeight) / 2;
    } else if (s.verticalAlign === 'bottom') {
      startY = el.y + el.height - totalHeight;
    }

    let startX = el.x;
    if (s.textAlign === 'center') {
      startX = el.x + el.width / 2;
    } else if (s.textAlign === 'right') {
      startX = el.x + el.width;
    }

    lines.forEach((line, i) => {
      ctx.fillText(line, startX, startY + i * lineHeight);
    });
  }

  private wrapTextForCanvas(
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number
  ): string[] {
    const chars = text.split('');
    const lines: string[] = [];
    let current = '';

    for (const char of chars) {
      if (char === '\n') {
        lines.push(current);
        current = '';
        continue;
      }
      const test = current + char;
      if (ctx.measureText(test).width > maxWidth && current) {
        lines.push(current);
        current = char;
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);
    return lines;
  }

  private drawShape(ctx: CanvasRenderingContext2D, el: any): void {
    if (el.fill) ctx.fillStyle = el.fill;
    if (el.stroke) {
      ctx.strokeStyle = el.stroke;
      ctx.lineWidth = el.strokeWidth || 1;
    }

    if (el.shape === 'rectangle') {
      const r = el.borderRadius || 0;
      if (r > 0) {
        this.roundRect(ctx, el.x, el.y, el.width, el.height, r);
      } else {
        ctx.fillRect(el.x, el.y, el.width, el.height);
        if (el.stroke) ctx.strokeRect(el.x, el.y, el.width, el.height);
      }
    } else if (el.shape === 'circle') {
      ctx.beginPath();
      ctx.arc(el.x + el.width / 2, el.y + el.height / 2, Math.min(el.width, el.height) / 2, 0, Math.PI * 2);
      ctx.fill();
      if (el.stroke) ctx.stroke();
    } else if (el.shape === 'triangle') {
      ctx.beginPath();
      ctx.moveTo(el.x + el.width / 2, el.y);
      ctx.lineTo(el.x + el.width, el.y + el.height);
      ctx.lineTo(el.x, el.y + el.height);
      ctx.closePath();
      ctx.fill();
      if (el.stroke) ctx.stroke();
    }
  }

  private roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.fill();
  }

  private async drawImageElement(
    ctx: CanvasRenderingContext2D,
    el: any
  ): Promise<void> {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        let sx = 0,
          sy = 0,
          sw = img.naturalWidth,
          sh = img.naturalHeight;

        if (el.crop) {
          sx = el.crop.x;
          sy = el.crop.y;
          sw = el.crop.width;
          sh = el.crop.height;
        }

        if (el.borderRadius) {
          ctx.save();
          this.roundRect(ctx, el.x, el.y, el.width, el.height, el.borderRadius);
          ctx.clip();
        }

        ctx.drawImage(img, sx, sy, sw, sh, el.x, el.y, el.width, el.height);

        if (el.borderRadius) {
          ctx.restore();
        }
        resolve();
      };
      img.onerror = () => resolve();
      img.src = el.src;
    });
  }

  private drawQuestionCard(ctx: CanvasRenderingContext2D, el: any): void {
    const style = el.style || {};

    if (style.backgroundColor) {
      ctx.fillStyle = style.backgroundColor;
      const r = style.borderRadius || 0;
      if (r > 0) {
        this.roundRect(ctx, el.x, el.y, el.width, el.height, r);
      } else {
        ctx.fillRect(el.x, el.y, el.width, el.height);
      }
    }

    if (style.borderColor) {
      ctx.strokeStyle = style.borderColor;
      ctx.lineWidth = style.borderWidth || 2;
      if (style.borderRadius) {
        this.roundRect(ctx, el.x, el.y, el.width, el.height, style.borderRadius);
        ctx.stroke();
      } else {
        ctx.strokeRect(el.x, el.y, el.width, el.height);
      }
    }
  }

  private drawWatermark(
    ctx: CanvasRenderingContext2D,
    config: any,
    width: number,
    height: number
  ): void {
    ctx.save();
    ctx.globalAlpha = config.opacity;

    const size = config.size || 24;
    ctx.font = `600 ${size}px ${config.fontFamily || 'system-ui'}`;
    ctx.fillStyle = config.color || '#000000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const positions: Record<string, [number, number]> = {
      top_left: [50, 30],
      top_center: [width / 2, 30],
      top_right: [width - 50, 30],
      middle_left: [50, height / 2],
      middle_center: [width / 2, height / 2],
      middle_right: [width - 50, height / 2],
      bottom_left: [50, height - 30],
      bottom_center: [width / 2, height - 30],
      bottom_right: [width - 50, height - 30],
    };

    const pos = positions[config.position] || positions.bottom_right;

    if (config.position === 'repeat') {
      const spacing = size * 8;
      for (let x = 0; x < width; x += spacing) {
        for (let y = 0; y < height; y += spacing) {
          ctx.save();
          ctx.translate(x + spacing / 2, y + spacing / 2);
          ctx.rotate(((config.rotation || -30) * Math.PI) / 180);
          ctx.fillText(config.text || '', 0, 0);
          ctx.restore();
        }
      }
    } else {
      ctx.save();
      ctx.translate(pos[0], pos[1]);
      if (config.rotation) ctx.rotate((config.rotation * Math.PI) / 180);
      ctx.fillText(config.text || '', 0, 0);
      ctx.restore();
    }

    ctx.restore();
  }

  private async exportToSvgBlob(
    project: DesignProject,
    options: ExportOptions
  ): Promise<Blob> {
    const { width, height } = convertSizeToPx(project.canvas.size);
    const svgContent = this.generateSvg(project, width, height);
    return new Blob([svgContent], { type: 'image/svg+xml' });
  }

  private escapeXml(str: string): string {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  private generateSvg(project: DesignProject, width: number, height: number): string {
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;
    svg += `<rect width="100%" height="100%" fill="${this.escapeXml(project.canvas.backgroundColor)}"/>`;

    const sorted = [...project.canvas.elements].sort(
      (a, b) => (a.zIndex || 0) - (b.zIndex || 0)
    );

    sorted.forEach((el) => {
      if (el.visible === false) return;
      if (el.type === 'text') {
        const t = el as any;
        svg += `<text x="${t.x}" y="${t.y + t.style.fontSize}" font-family="${this.escapeXml(t.style.fontFamily)}" font-size="${t.style.fontSize}" font-weight="${t.style.fontWeight}" fill="${this.escapeXml(t.style.color)}">${this.escapeXml(t.content)}</text>`;
      } else if (el.type === 'shape') {
        const s = el as any;
        if (s.shape === 'rectangle') {
          svg += `<rect x="${s.x}" y="${s.y}" width="${s.width}" height="${s.height}" fill="${this.escapeXml(s.fill || 'none')}" stroke="${this.escapeXml(s.stroke || 'none')}" stroke-width="${s.strokeWidth || 0}" rx="${s.borderRadius || 0}"/>`;
        } else if (s.shape === 'circle') {
          svg += `<circle cx="${s.x + s.width / 2}" cy="${s.y + s.height / 2}" r="${Math.min(s.width, s.height) / 2}" fill="${this.escapeXml(s.fill || 'none')}" stroke="${this.escapeXml(s.stroke || 'none')}" stroke-width="${s.strokeWidth || 0}"/>`;
        }
      } else if (el.type === 'image') {
        const img = el as any;
        svg += `<image x="${img.x}" y="${img.y}" width="${img.width}" height="${img.height}" href="${this.escapeXml(img.src)}" preserveAspectRatio="xMidYMid slice"/>`;
      }
    });

    svg += '</svg>';
    return svg;
  }

  private blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}
