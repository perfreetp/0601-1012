import { DesignProject, DesignVersion } from '../types';
import { generateId, deepClone } from '../utils';

const STORAGE_PREFIX = 'creative_design_';

export class VersionManager {
  private versions: Map<string, DesignVersion[]> = new Map();
  private storagePrefix: string;

  constructor(storagePrefix: string = STORAGE_PREFIX) {
    this.storagePrefix = storagePrefix;
  }

  saveVersion(
    project: DesignProject,
    userId: string,
    description?: string,
    tags?: string[]
  ): DesignVersion {
    const projectVersions = this.versions.get(project.id) || [];
    const versionNumber = projectVersions.length + 1;

    const version: DesignVersion = {
      id: generateId('ver'),
      projectId: project.id,
      version: versionNumber,
      snapshot: deepClone(project),
      description,
      tags,
      createdAt: Date.now(),
      createdBy: userId,
    };

    projectVersions.push(version);
    this.versions.set(project.id, projectVersions);
    this.persistToStorage(project.id);
    return version;
  }

  listVersions(projectId: string): DesignVersion[] {
    this.loadFromStorage(projectId);
    const versions = this.versions.get(projectId) || [];
    return [...versions].sort((a, b) => b.version - a.version);
  }

  getVersion(projectId: string, versionId: string): DesignVersion | undefined {
    this.loadFromStorage(projectId);
    return this.versions.get(projectId)?.find((v) => v.id === versionId);
  }

  getLatestVersion(projectId: string): DesignVersion | undefined {
    const versions = this.listVersions(projectId);
    return versions[0];
  }

  restoreVersion(
    projectId: string,
    versionId: string
  ): DesignProject | null {
    const version = this.getVersion(projectId, versionId);
    if (!version) return null;

    const restored: DesignProject = {
      ...deepClone(version.snapshot),
      id: projectId,
      updatedAt: Date.now(),
    };

    return restored;
  }

  deleteVersion(projectId: string, versionId: string): boolean {
    const versions = this.versions.get(projectId);
    if (!versions) return false;

    const idx = versions.findIndex((v) => v.id === versionId);
    if (idx === -1) return false;

    versions.splice(idx, 1);
    this.versions.set(projectId, versions);
    this.persistToStorage(projectId);
    return true;
  }

  clearVersions(projectId: string): void {
    this.versions.delete(projectId);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.storagePrefix + 'versions_' + projectId);
    }
  }

  compareVersions(
    projectId: string,
    versionId1: string,
    versionId2: string
  ): { added: string[]; removed: string[]; modified: string[] } | null {
    const v1 = this.getVersion(projectId, versionId1);
    const v2 = this.getVersion(projectId, versionId2);
    if (!v1 || !v2) return null;

    const ids1 = new Set(v1.snapshot.canvas.elements.map((e) => e.id));
    const ids2 = new Set(v2.snapshot.canvas.elements.map((e) => e.id));

    const added: string[] = [];
    const removed: string[] = [];
    const modified: string[] = [];

    ids2.forEach((id) => {
      if (!ids1.has(id)) added.push(id);
    });
    ids1.forEach((id) => {
      if (!ids2.has(id)) removed.push(id);
    });

    const map1 = new Map(v1.snapshot.canvas.elements.map((e) => [e.id, e]));
    ids1.forEach((id) => {
      if (ids2.has(id)) {
        const el1 = map1.get(id)!;
        const el2 = v2.snapshot.canvas.elements.find((e) => e.id === id)!;
        if (JSON.stringify(el1) !== JSON.stringify(el2)) {
          modified.push(id);
        }
      }
    });

    return { added, removed, modified };
  }

  setVersionTags(
    projectId: string,
    versionId: string,
    tags: string[]
  ): boolean {
    const version = this.getVersion(projectId, versionId);
    if (!version) return false;
    version.tags = tags;
    this.persistToStorage(projectId);
    return true;
  }

  private persistToStorage(projectId: string): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const versions = this.versions.get(projectId) || [];
      localStorage.setItem(
        this.storagePrefix + 'versions_' + projectId,
        JSON.stringify(versions)
      );
    } catch (e) {
      console.warn('Failed to persist versions:', e);
    }
  }

  private loadFromStorage(projectId: string): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const raw = localStorage.getItem(this.storagePrefix + 'versions_' + projectId);
      if (raw) {
        const versions = JSON.parse(raw) as DesignVersion[];
        this.versions.set(projectId, versions);
      }
    } catch (e) {
      console.warn('Failed to load versions:', e);
    }
  }
}
