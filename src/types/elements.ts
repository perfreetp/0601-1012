import { SizeConfig, ColorTheme } from './size';

export type ElementType =
  | 'text'
  | 'image'
  | 'shape'
  | 'illustration'
  | 'question_card'
  | 'watermark';

export interface BaseElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  opacity?: number;
  zIndex?: number;
  locked?: boolean;
  visible?: boolean;
}

export type FontFamily = string;
export type FontSize = number;
export type FontWeight = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
export type FontStyle = 'normal' | 'italic';
export type TextAlign = 'left' | 'center' | 'right' | 'justify';
export type TextVerticalAlign = 'top' | 'middle' | 'bottom';

export interface TextStyle {
  fontFamily: FontFamily;
  fontSize: FontSize;
  fontWeight: FontWeight;
  fontStyle: FontStyle;
  color: string;
  textAlign: TextAlign;
  verticalAlign: TextVerticalAlign;
  lineHeight?: number;
  letterSpacing?: number;
  textDecoration?: 'none' | 'underline' | 'line-through';
  textShadow?: TextShadow;
}

export interface TextShadow {
  offsetX: number;
  offsetY: number;
  blur: number;
  color: string;
}

export interface TextElement extends BaseElement {
  type: 'text';
  content: string;
  style: TextStyle;
}

export interface ImageCropConfig {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ImageElement extends BaseElement {
  type: 'image';
  src: string;
  alt?: string;
  crop?: ImageCropConfig;
  borderRadius?: number;
  filter?: ImageFilter;
}

export interface ImageFilter {
  brightness?: number;
  contrast?: number;
  saturation?: number;
  blur?: number;
  grayscale?: number;
}

export type ShapeType = 'rectangle' | 'circle' | 'triangle' | 'line' | 'arrow';

export interface ShapeElement extends BaseElement {
  type: 'shape';
  shape: ShapeType;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  borderRadius?: number;
}

export interface IllustrationAsset {
  id: string;
  name: string;
  category: string;
  tags: string[];
  svgUrl: string;
  previewUrl: string;
  author?: string;
  license?: string;
}

export interface IllustrationElement extends BaseElement {
  type: 'illustration';
  assetId: string;
  svgUrl: string;
  colorOverride?: Record<string, string>;
}

export type QuestionType =
  | 'single_choice'
  | 'multiple_choice'
  | 'true_false'
  | 'fill_blank'
  | 'short_answer'
  | 'matching';

export interface QuestionOption {
  id: string;
  label: string;
  content: string;
  isCorrect?: boolean;
}

export interface MatchingPair {
  id: string;
  left: string;
  right: string;
}

export interface QuestionCardStyle {
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  titleStyle?: Partial<TextStyle>;
  optionStyle?: Partial<TextStyle>;
  correctHighlightColor?: string;
}

export interface QuestionCardElement extends BaseElement {
  type: 'question_card';
  questionType: QuestionType;
  questionContent: string;
  options?: QuestionOption[];
  matchingPairs?: MatchingPair[];
  correctAnswer?: string | string[];
  explanation?: string;
  style: QuestionCardStyle;
}

export type DesignElement =
  | TextElement
  | ImageElement
  | ShapeElement
  | IllustrationElement
  | QuestionCardElement;
