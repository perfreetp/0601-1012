import { Collaborator, CollaboratorRole, CursorPosition, Permission } from '../types';
import { generateId } from '../utils';

const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];

export class CollaboratorManager {
  private collaborators: Map<string, Collaborator> = new Map();
  private cursors: Map<string, CursorPosition> = new Map();
  private listeners: Set<() => void> = new Set();
  private currentUserId: string;

  constructor(currentUserId: string) {
    this.currentUserId = currentUserId;
  }

  setCurrentUserId(userId: string): void {
    this.currentUserId = userId;
  }

  getCurrentUserId(): string {
    return this.currentUserId;
  }

  addCollaborator(
    name: string,
    role: CollaboratorRole = 'viewer',
    avatarUrl?: string,
    customId?: string
  ): Collaborator {
    const id = customId || generateId('user');
    const colorIndex = this.collaborators.size % COLORS.length;
    const collaborator: Collaborator = {
      id,
      name,
      avatarUrl,
      role,
      color: COLORS[colorIndex],
      joinedAt: Date.now(),
      lastActiveAt: Date.now(),
    };
    this.collaborators.set(id, collaborator);
    this.notifyListeners();
    return collaborator;
  }

  removeCollaborator(id: string): boolean {
    if (id === this.currentUserId) return false;
    const removed = this.collaborators.delete(id);
    this.cursors.delete(id);
    if (removed) this.notifyListeners();
    return removed;
  }

  updateRole(id: string, role: CollaboratorRole): boolean {
    const collab = this.collaborators.get(id);
    if (!collab) return false;
    collab.role = role;
    collab.lastActiveAt = Date.now();
    this.notifyListeners();
    return true;
  }

  getCollaborators(): Collaborator[] {
    return Array.from(this.collaborators.values());
  }

  getCollaborator(id: string): Collaborator | undefined {
    return this.collaborators.get(id);
  }

  getCurrentCollaborator(): Collaborator | undefined {
    return this.collaborators.get(this.currentUserId);
  }

  hasPermission(userId: string, permission: keyof Permission): boolean {
    const collab = this.collaborators.get(userId);
    if (!collab) return false;

    const rolePermissions: Record<CollaboratorRole, Permission> = {
      owner: {
        canEdit: true,
        canExport: true,
        canShare: true,
        canDelete: true,
        canManageVersions: true,
        canManageCollaborators: true,
      },
      editor: {
        canEdit: true,
        canExport: true,
        canShare: false,
        canDelete: false,
        canManageVersions: true,
        canManageCollaborators: false,
      },
      commenter: {
        canEdit: false,
        canExport: true,
        canShare: false,
        canDelete: false,
        canManageVersions: false,
        canManageCollaborators: false,
      },
      viewer: {
        canEdit: false,
        canExport: false,
        canShare: false,
        canDelete: false,
        canManageVersions: false,
        canManageCollaborators: false,
      },
    };

    return rolePermissions[collab.role][permission];
  }

  canCurrentUserEdit(): boolean {
    return this.hasPermission(this.currentUserId, 'canEdit');
  }

  canCurrentUserExport(): boolean {
    return this.hasPermission(this.currentUserId, 'canExport');
  }

  canCurrentUserShare(): boolean {
    return this.hasPermission(this.currentUserId, 'canShare');
  }

  canCurrentUserDelete(): boolean {
    return this.hasPermission(this.currentUserId, 'canDelete');
  }

  getPermissionsForRole(role: CollaboratorRole): Permission {
    const rolePermissions: Record<CollaboratorRole, Permission> = {
      owner: {
        canEdit: true,
        canExport: true,
        canShare: true,
        canDelete: true,
        canManageVersions: true,
        canManageCollaborators: true,
      },
      editor: {
        canEdit: true,
        canExport: true,
        canShare: false,
        canDelete: false,
        canManageVersions: true,
        canManageCollaborators: false,
      },
      commenter: {
        canEdit: false,
        canExport: true,
        canShare: false,
        canDelete: false,
        canManageVersions: false,
        canManageCollaborators: false,
      },
      viewer: {
        canEdit: false,
        canExport: false,
        canShare: false,
        canDelete: false,
        canManageVersions: false,
        canManageCollaborators: false,
      },
    };
    return rolePermissions[role];
  }

  updateCursor(
    x: number,
    y: number,
    selectedElementId?: string
  ): void {
    const collab = this.getCurrentCollaborator();
    if (!collab) return;

    const cursor: CursorPosition = {
      userId: this.currentUserId,
      userName: collab.name,
      color: collab.color,
      x,
      y,
      selectedElementId,
      lastUpdate: Date.now(),
    };
    this.cursors.set(this.currentUserId, cursor);
  }

  setRemoteCursor(cursor: CursorPosition): void {
    this.cursors.set(cursor.userId, cursor);
  }

  getCursors(): CursorPosition[] {
    return Array.from(this.cursors.values()).filter(
      (c) => c.userId !== this.currentUserId
    );
  }

  getCursor(userId: string): CursorPosition | undefined {
    return this.cursors.get(userId);
  }

  clearStaleCursors(maxAgeMs: number = 30000): void {
    const now = Date.now();
    const stale: string[] = [];
    this.cursors.forEach((cursor, id) => {
      if (now - cursor.lastUpdate > maxAgeMs && id !== this.currentUserId) {
        stale.push(id);
      }
    });
    stale.forEach((id) => this.cursors.delete(id));
  }

  onCollaboratorsChange(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach((l) => {
      try {
        l();
      } catch (e) {
        console.error(e);
      }
    });
  }

  getCollaboratorColor(userId: string): string {
    return this.collaborators.get(userId)?.color || '#999999';
  }

  getEditors(): Collaborator[] {
    return this.getCollaborators().filter(
      (c) => c.role === 'owner' || c.role === 'editor'
    );
  }

  getViewers(): Collaborator[] {
    return this.getCollaborators().filter((c) => c.role === 'viewer');
  }
}
