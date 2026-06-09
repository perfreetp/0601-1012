import {
  DesignProject,
  PreviewCallback,
  DesignElement,
  TextElement,
  ImageElement,
  ShapeElement,
  IllustrationElement,
  QuestionCardElement,
  WatermarkConfig,
} from '../types';
import { convertSizeToPx } from './sizes';

export class PreviewManager {
  private callbacks: Set<PreviewCallback> = new Set();
  private container: HTMLElement | null = null;

  setContainer(container: HTMLElement | null): void {
    this.container = container;
  }

  onPreview(callback: PreviewCallback): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  offPreview(callback: PreviewCallback): void {
    this.callbacks.delete(callback);
  }

  notify(project: DesignProject): void {
    this.callbacks.forEach((cb) => {
      try {
        cb(project);
      } catch (e) {
        console.error('Preview callback error:', e);
      }
    });
  }

  render(project: DesignProject, scale: number = 1): HTMLElement | null {
    if (!this.container) return null;

    const { width, height } = convertSizeToPx(project.canvas.size);
    const scaledWidth = width * scale;
    const scaledHeight = height * scale;

    const container = document.createElement('div');
    container.style.position = 'relative';
    container.style.width = `${scaledWidth}px`;
    container.style.height = `${scaledHeight}px`;
    container.style.backgroundColor = project.canvas.backgroundColor;
    container.style.overflow = 'hidden';
    container.style.transformOrigin = 'top left';

    const wrapper = document.createElement('div');
    wrapper.style.position = 'relative';
    wrapper.style.width = `${width}px`;
    wrapper.style.height = `${height}px`;
    wrapper.style.transform = `scale(${scale})`;
    wrapper.style.transformOrigin = 'top left';

    const sortedElements = [...project.canvas.elements].sort(
      (a, b) => (a.zIndex || 0) - (b.zIndex || 0)
    );

    sortedElements.forEach((el) => {
      const rendered = this.renderElement(el);
      if (rendered) wrapper.appendChild(rendered);
    });

    if (project.watermark?.enabled) {
      const watermarkEl = this.renderWatermark(project.watermark, width, height);
      if (watermarkEl) wrapper.appendChild(watermarkEl);
    }

    container.appendChild(wrapper);

    this.container.innerHTML = '';
    this.container.appendChild(container);

    return container;
  }

  private renderElement(element: DesignElement): HTMLElement | null {
    switch (element.type) {
      case 'text':
        return this.renderText(element as TextElement);
      case 'image':
        return this.renderImage(element as ImageElement);
      case 'shape':
        return this.renderShape(element as ShapeElement);
      case 'illustration':
        return this.renderIllustration(element as IllustrationElement);
      case 'question_card':
        return this.renderQuestionCard(element as QuestionCardElement);
      default:
        return null;
    }
  }

  private applyBaseStyles(el: HTMLElement, element: DesignElement): void {
    el.style.position = 'absolute';
    el.style.left = `${element.x}px`;
    el.style.top = `${element.y}px`;
    el.style.width = `${element.width}px`;
    el.style.height = `${element.height}px`;
    if (element.rotation !== undefined) {
      el.style.transform = `rotate(${element.rotation}deg)`;
    }
    if (element.opacity !== undefined) {
      el.style.opacity = String(element.opacity);
    }
    if (element.visible === false) {
      el.style.display = 'none';
    }
    el.style.pointerEvents = element.locked ? 'none' : 'auto';
  }

  private renderText(element: TextElement): HTMLElement {
    const el = document.createElement('div');
    this.applyBaseStyles(el, element);

    el.style.fontFamily = element.style.fontFamily;
    el.style.fontSize = `${element.style.fontSize}px`;
    el.style.fontWeight = String(element.style.fontWeight);
    el.style.fontStyle = element.style.fontStyle;
    el.style.color = element.style.color;
    el.style.textAlign = element.style.textAlign;
    el.style.lineHeight = String(element.style.lineHeight || 1.5);
    if (element.style.letterSpacing !== undefined) {
      el.style.letterSpacing = `${element.style.letterSpacing}px`;
    }
    if (element.style.textDecoration) {
      el.style.textDecoration = element.style.textDecoration;
    }
    if (element.style.textShadow) {
      const ts = element.style.textShadow;
      el.style.textShadow = `${ts.offsetX}px ${ts.offsetY}px ${ts.blur}px ${ts.color}`;
    }

    el.style.display = 'flex';
    if (element.style.verticalAlign === 'middle') {
      el.style.alignItems = 'center';
    } else if (element.style.verticalAlign === 'bottom') {
      el.style.alignItems = 'flex-end';
    } else {
      el.style.alignItems = 'flex-start';
    }

    el.style.whiteSpace = 'pre-wrap';
    el.style.wordBreak = 'break-word';
    el.innerHTML = element.content;

    return el;
  }

  private renderImage(element: ImageElement): HTMLElement {
    const el = document.createElement('div');
    this.applyBaseStyles(el, element);

    if (element.borderRadius !== undefined) {
      el.style.borderRadius = `${element.borderRadius}px`;
    }
    el.style.overflow = 'hidden';
    el.style.backgroundImage = `url(${element.src})`;
    el.style.backgroundSize = 'cover';
    el.style.backgroundPosition = 'center';

    if (element.filter) {
      const filters: string[] = [];
      if (element.filter.brightness !== undefined) filters.push(`brightness(${element.filter.brightness}%)`);
      if (element.filter.contrast !== undefined) filters.push(`contrast(${element.filter.contrast}%)`);
      if (element.filter.saturation !== undefined) filters.push(`saturate(${element.filter.saturation}%)`);
      if (element.filter.blur !== undefined) filters.push(`blur(${element.filter.blur}px)`);
      if (element.filter.grayscale !== undefined) filters.push(`grayscale(${element.filter.grayscale}%)`);
      if (filters.length > 0) {
        el.style.filter = filters.join(' ');
      }
    }

    return el;
  }

  private renderShape(element: ShapeElement): HTMLElement {
    const el = document.createElement('div');
    this.applyBaseStyles(el, element);

    if (element.shape === 'rectangle') {
      if (element.fill) el.style.backgroundColor = element.fill;
      if (element.stroke) el.style.border = `${element.strokeWidth || 1}px solid ${element.stroke}`;
      if (element.borderRadius !== undefined) el.style.borderRadius = `${element.borderRadius}px`;
    } else if (element.shape === 'circle') {
      if (element.fill) el.style.backgroundColor = element.fill;
      if (element.stroke) el.style.border = `${element.strokeWidth || 1}px solid ${element.stroke}`;
      el.style.borderRadius = '50%';
    } else if (element.shape === 'triangle') {
      el.style.width = '0';
      el.style.height = '0';
      el.style.backgroundColor = 'transparent';
      el.style.borderLeft = `${element.width / 2}px solid transparent`;
      el.style.borderRight = `${element.width / 2}px solid transparent`;
      el.style.borderBottom = `${element.height}px solid ${element.fill || '#000'}`;
    }

    return el;
  }

  private renderIllustration(element: IllustrationElement): HTMLElement {
    const el = document.createElement('div');
    this.applyBaseStyles(el, element);
    el.style.backgroundImage = `url(${element.svgUrl})`;
    el.style.backgroundSize = 'contain';
    el.style.backgroundRepeat = 'no-repeat';
    el.style.backgroundPosition = 'center';
    return el;
  }

  private renderQuestionCard(element: QuestionCardElement): HTMLElement {
    const el = document.createElement('div');
    this.applyBaseStyles(el, element);

    if (element.style.backgroundColor) {
      el.style.backgroundColor = element.style.backgroundColor;
    }
    if (element.style.borderColor) {
      el.style.border = `${element.style.borderWidth || 2}px solid ${element.style.borderColor}`;
    }
    if (element.style.borderRadius !== undefined) {
      el.style.borderRadius = `${element.style.borderRadius}px`;
    }
    el.style.padding = '20px';
    el.style.display = 'flex';
    el.style.flexDirection = 'column';
    el.style.boxSizing = 'border-box';

    const questionEl = document.createElement('div');
    questionEl.style.fontSize = `${element.style.titleStyle?.fontSize || 20}px`;
    questionEl.style.fontWeight = String(element.style.titleStyle?.fontWeight || 600);
    questionEl.style.color = element.style.titleStyle?.color || '#333';
    questionEl.style.marginBottom = '16px';
    questionEl.textContent = element.questionContent;
    el.appendChild(questionEl);

    if (element.options) {
      const optionsContainer = document.createElement('div');
      optionsContainer.style.display = 'flex';
      optionsContainer.style.flexDirection = 'column';
      optionsContainer.style.gap = '10px';

      element.options.forEach((opt) => {
        const optEl = document.createElement('div');
        optEl.style.display = 'flex';
        optEl.style.alignItems = 'center';
        optEl.style.gap = '10px';
        optEl.style.padding = '10px 14px';
        optEl.style.borderRadius = '8px';
        optEl.style.border = '1px solid #e5e7eb';

        if (opt.isCorrect && element.style.correctHighlightColor) {
          optEl.style.backgroundColor = element.style.correctHighlightColor + '20';
          optEl.style.borderColor = element.style.correctHighlightColor;
        }

        const labelEl = document.createElement('span');
        labelEl.style.fontWeight = '600';
        labelEl.style.fontSize = `${element.style.optionStyle?.fontSize || 16}px`;
        labelEl.style.color = element.style.optionStyle?.color || '#666';
        labelEl.textContent = `${opt.label}.`;

        const contentEl = document.createElement('span');
        contentEl.style.fontSize = `${element.style.optionStyle?.fontSize || 16}px`;
        contentEl.style.color = element.style.optionStyle?.color || '#333';
        contentEl.textContent = opt.content;

        optEl.appendChild(labelEl);
        optEl.appendChild(contentEl);
        optionsContainer.appendChild(optEl);
      });

      el.appendChild(optionsContainer);
    }

    return el;
  }

  private renderWatermark(
    config: WatermarkConfig,
    canvasWidth: number,
    canvasHeight: number
  ): HTMLElement | null {
    if (!config.text && !config.imageUrl) return null;

    const el = document.createElement('div');
    el.style.position = 'absolute';
    el.style.pointerEvents = 'none';
    el.style.opacity = String(config.opacity);
    el.style.zIndex = '9999';

    const positionMap: Record<string, { top?: string; bottom?: string; left?: string; right?: string }> = {
      top_left: { top: '10px', left: '10px' },
      top_center: { top: '10px', left: '50%' },
      top_right: { top: '10px', right: '10px' },
      middle_left: { top: '50%', left: '10px' },
      middle_center: { top: '50%', left: '50%' },
      middle_right: { top: '50%', right: '10px' },
      bottom_left: { bottom: '10px', left: '10px' },
      bottom_center: { bottom: '10px', left: '50%' },
      bottom_right: { bottom: '10px', right: '10px' },
    };

    const pos = positionMap[config.position] || positionMap.bottom_right;
    Object.assign(el.style, pos);

    if (config.position.includes('center')) {
      el.style.transform = 'translateX(-50%)';
    }
    if (config.position.includes('middle')) {
      el.style.transform = (el.style.transform ? el.style.transform + ' ' : '') + 'translateY(-50%)';
    }

    if (config.rotation) {
      el.style.transform = (el.style.transform ? el.style.transform + ' ' : '') + `rotate(${config.rotation}deg)`;
    }

    if (config.text) {
      el.style.fontSize = `${config.size}px`;
      el.style.color = config.color || '#000000';
      el.style.fontFamily = config.fontFamily || 'system-ui, sans-serif';
      el.style.fontWeight = '600';
      el.textContent = config.text;
    } else if (config.imageUrl) {
      el.style.width = `${config.size * 3}px`;
      el.style.height = `${config.size}px`;
      el.style.backgroundImage = `url(${config.imageUrl})`;
      el.style.backgroundSize = 'contain';
      el.style.backgroundRepeat = 'no-repeat';
    }

    return el;
  }
}
