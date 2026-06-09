export interface WatermarkConfig {
  enabled: boolean;
  text?: string;
  imageUrl?: string;
  opacity: number;
  position:
    | 'top_left'
    | 'top_center'
    | 'top_right'
    | 'middle_left'
    | 'middle_center'
    | 'middle_right'
    | 'bottom_left'
    | 'bottom_center'
    | 'bottom_right'
    | 'repeat';
  size: number;
  rotation?: number;
  color?: string;
  fontFamily?: string;
}

export type CollaboratorRole = 'owner' | 'editor' | 'viewer' | 'commenter';

export interface Collaborator {
  id: string;
  name: string;
  avatarUrl?: string;
  role: CollaboratorRole;
  color: string;
  joinedAt: number;
  lastActiveAt?: number;
}

export interface Permission {
  canEdit: boolean;
  canExport: boolean;
  canShare: boolean;
  canDelete: boolean;
  canManageVersions: boolean;
  canManageCollaborators: boolean;
}

export interface CopyrightInfo {
  author?: string;
  source?: string;
  license?: string;
  licenseUrl?: string;
  attributionRequired: boolean;
  commercialUseAllowed: boolean;
  modificationAllowed: boolean;
  notice?: string;
}

export interface CopyrightTip {
  id: string;
  level: 'info' | 'warning' | 'danger';
  message: string;
  suggestion?: string;
  elementId?: string;
}

export interface CursorPosition {
  userId: string;
  userName: string;
  color: string;
  x: number;
  y: number;
  selectedElementId?: string;
  lastUpdate: number;
}

export interface HistoryAction {
  type: 'add' | 'update' | 'delete' | 'move' | 'resize' | 'style';
  elementId?: string;
  previousState?: any;
  nextState?: any;
  timestamp: number;
  userId: string;
}

export interface HistoryState {
  past: HistoryAction[];
  future: HistoryAction[];
  currentIndex: number;
  maxHistorySize: number;
}
