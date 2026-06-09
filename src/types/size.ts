export interface SizeConfig {
  width: number;
  height: number;
  unit: 'px' | 'mm' | 'cm' | 'inch';
  dpi?: number;
}

export type SizePreset =
  | 'A4'
  | 'A5'
  | '16:9'
  | '4:3'
  | '1:1'
  | '9:16'
  | 'course_cover_landscape'
  | 'course_cover_portrait'
  | 'flashcard_standard'
  | 'flashcard_mini'
  | 'custom';

export interface SizePresetConfig {
  name: string;
  size: SizeConfig;
  description?: string;
}

export interface ColorTheme {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  textSecondary: string;
  border: string;
}

export type ThemePreset =
  | 'default_light'
  | 'default_dark'
  | 'ocean_blue'
  | 'forest_green'
  | 'sunset_orange'
  | 'lavender_purple'
  | 'education_bright'
  | 'education_soft'
  | 'custom';
