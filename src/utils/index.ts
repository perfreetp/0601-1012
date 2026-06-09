import { DesignElement, TextElement, ImageElement, ShapeElement, IllustrationElement, QuestionCardElement } from '../types';

export const generateId = (prefix: string = 'id'): string => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

export const generateElementId = (type: string): string => {
  return `${type}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
};

export const createTextElement = (
  content: string,
  x: number,
  y: number,
  width: number,
  height: number,
  overrides?: Partial<TextElement>
): TextElement => {
  return {
    id: generateElementId('text'),
    type: 'text',
    x,
    y,
    width,
    height,
    content,
    style: {
      fontFamily: 'system-ui, sans-serif',
      fontSize: 16,
      fontWeight: 400,
      fontStyle: 'normal',
      color: '#333333',
      textAlign: 'left',
      verticalAlign: 'top',
      lineHeight: 1.5,
    },
    ...overrides,
  };
};

export const createImageElement = (
  src: string,
  x: number,
  y: number,
  width: number,
  height: number,
  overrides?: Partial<ImageElement>
): ImageElement => {
  return {
    id: generateElementId('image'),
    type: 'image',
    x,
    y,
    width,
    height,
    src,
    ...overrides,
  };
};

export const createShapeElement = (
  shape: 'rectangle' | 'circle' | 'triangle' | 'line' | 'arrow',
  x: number,
  y: number,
  width: number,
  height: number,
  overrides?: Partial<ShapeElement>
): ShapeElement => {
  return {
    id: generateElementId('shape'),
    type: 'shape',
    shape,
    x,
    y,
    width,
    height,
    fill: '#e0e0e0',
    ...overrides,
  };
};

export const createQuestionCardElement = (
  questionType: 'single_choice' | 'multiple_choice' | 'true_false' | 'fill_blank' | 'short_answer' | 'matching',
  questionContent: string,
  x: number,
  y: number,
  width: number,
  height: number,
  overrides?: Partial<QuestionCardElement>
): QuestionCardElement => {
  return {
    id: generateElementId('question'),
    type: 'question_card',
    x,
    y,
    width,
    height,
    questionType,
    questionContent,
    style: {},
    ...overrides,
  };
};

export const cloneElement = <T extends DesignElement>(element: T): T => {
  return JSON.parse(JSON.stringify(element));
};

export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

export const hexToRgba = (hex: string, alpha: number = 1): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return hex;
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const debounce = <T extends (...args: any[]) => any>(
  fn: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
};
