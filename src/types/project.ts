import { SizeConfig, ColorTheme } from './size';
import { DesignElement } from './elements';
import { WatermarkConfig, Collaborator, CopyrightInfo } from './meta';

export interface DesignCanvas {
  size: SizeConfig;
  theme: ColorTheme;
  backgroundColor: string;
  elements: DesignElement[];
}

export interface DesignProject {
  id: string;
  name: string;
  description?: string;
  type: 'course_cover' | 'flashcard';
  canvas: DesignCanvas;
  watermark?: WatermarkConfig;
  collaborators: Collaborator[];
  copyrightInfo?: CopyrightInfo;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
}

export interface DesignVersion {
  id: string;
  projectId: string;
  version: number;
  snapshot: DesignProject;
  description?: string;
  createdAt: number;
  createdBy: string;
  tags?: string[];
}

export type ExportFormat = 'png' | 'jpg' | 'svg' | 'pdf';

export interface ExportOptions {
  format: ExportFormat;
  quality?: number;
  scale?: number;
  includeWatermark?: boolean;
  filename?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  code: string;
  message: string;
  elementId?: string;
  severity: 'error' | 'warning';
}

export interface ValidationWarning {
  code: string;
  message: string;
  elementId?: string;
}

export interface BatchGenerateItem {
  id: string;
  templateId: string;
  variables: Record<string, string>;
  outputFilename?: string;
}

export interface BatchGenerateResult {
  itemId: string;
  success: boolean;
  blob?: Blob;
  url?: string;
  error?: string;
}
