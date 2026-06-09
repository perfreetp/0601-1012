export * from './size';
export * from './elements';
export * from './template';
export * from './project';
export * from './meta';
export type { MaterialValidationRules } from '../core/MaterialValidator';

import type { Template } from './template';
import type { DesignElement } from './elements';
import type { SizeConfig, ColorTheme } from './size';
import type { DesignProject, DesignVersion, ExportOptions } from './project';
import type { HistoryAction, Collaborator, CursorPosition, CopyrightTip } from './meta';

export interface SDKConfig {
  apiBaseUrl?: string;
  storagePrefix?: string;
  maxHistorySize?: number;
  defaultLocale?: string;
  assetBaseUrl?: string;
}

export type SDKEventName =
  | 'template:selected'
  | 'element:added'
  | 'element:updated'
  | 'element:deleted'
  | 'element:selected'
  | 'canvas:size_changed'
  | 'theme:changed'
  | 'project:saved'
  | 'project:loaded'
  | 'version:created'
  | 'version:restored'
  | 'export:started'
  | 'export:completed'
  | 'preview:ready'
  | 'undo'
  | 'redo'
  | 'collaborator:joined'
  | 'collaborator:left'
  | 'cursor:moved'
  | 'copyright:warning'
  | 'error';

export interface SDKEventMap {
  'template:selected': Template;
  'element:added': DesignElement;
  'element:updated': { element: DesignElement; changes: Partial<DesignElement> };
  'element:deleted': string;
  'element:selected': string | null;
  'canvas:size_changed': SizeConfig;
  'theme:changed': ColorTheme;
  'project:saved': DesignProject;
  'project:loaded': DesignProject;
  'version:created': DesignVersion;
  'version:restored': DesignVersion;
  'export:started': ExportOptions;
  'export:completed': { url: string; options: ExportOptions };
  'preview:ready': { element: HTMLElement | null; project: DesignProject };
  'undo': HistoryAction;
  'redo': HistoryAction;
  'collaborator:joined': Collaborator;
  'collaborator:left': string;
  'cursor:moved': CursorPosition;
  'copyright:warning': CopyrightTip[];
  'error': { code: string; message: string; details?: unknown };
}

export type PreviewCallback = (project: DesignProject) => void;
