import { SizeConfig, ColorTheme } from './size';
import { DesignElement } from './elements';

export type TemplateCategory = 'course_cover' | 'flashcard' | 'certificate' | 'worksheet';

export interface Template {
  id: string;
  name: string;
  category: TemplateCategory;
  description?: string;
  thumbnailUrl?: string;
  size: SizeConfig;
  theme: ColorTheme;
  elements: DesignElement[];
  tags?: string[];
  author?: string;
  createdAt: number;
  updatedAt: number;
  isSystem: boolean;
}

export interface TemplateFilter {
  category?: TemplateCategory;
  tags?: string[];
  keyword?: string;
  isSystem?: boolean;
}
