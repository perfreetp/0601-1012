import {
  SDKConfig,
  SDKEventName,
  SDKEventMap,
  DesignProject,
  DesignElement,
  SizeConfig,
  SizePreset,
  ColorTheme,
  ThemePreset,
  TemplateFilter,
  TemplateCategory,
  Template,
  ExportOptions,
  ExportFormat,
  DesignVersion,
  MaterialValidationRules,
  WatermarkConfig,
  Collaborator,
  CollaboratorRole,
  CopyrightInfo,
  CopyrightTip,
  BatchGenerateItem,
  BatchGenerateResult,
  ValidationResult,
  PreviewCallback,
  HistoryState,
  CursorPosition,
  Permission,
} from './types';

import {
  TemplateManager,
  ImageCropper,
  TypographyManager,
  QuestionCardManager,
  IllustrationLibrary,
  BatchGenerator,
  PreviewManager,
  ExportManager,
  VersionManager,
  MaterialValidator,
  CopyrightManager,
  HistoryManager,
  CollaboratorManager,
  WatermarkManager,
  defaultThemes,
  defaultSizes,
  sizePresetConfigs,
  getSize,
  createCustomSize,
  getTheme,
  createCustomTheme,
  convertSizeToPx,
} from './core';

import {
  generateId,
  deepClone,
} from './utils';

type EventListener<K extends SDKEventName> = (data: SDKEventMap[K]) => void;

export class CreativeDesignSDK {
  private config: Required<SDKConfig>;
  private currentUserId: string;
  private project: DesignProject | null = null;
  private selectedElementId: string | null = null;

  private templateManager: TemplateManager;
  private imageCropper: ImageCropper;
  private typographyManager: TypographyManager;
  private questionCardManager: QuestionCardManager;
  private illustrationLibrary: IllustrationLibrary;
  private batchGenerator: BatchGenerator;
  private previewManager: PreviewManager;
  private exportManager: ExportManager;
  private versionManager: VersionManager;
  private materialValidator: MaterialValidator;
  private copyrightManager: CopyrightManager;
  private historyManager: HistoryManager;
  private collaboratorManager: CollaboratorManager;
  private watermarkManager: WatermarkManager;

  private eventListeners: Map<SDKEventName, Set<EventListener<any>>> = new Map();

  constructor(config: SDKConfig = {}) {
    this.config = {
      apiBaseUrl: config.apiBaseUrl || '',
      storagePrefix: config.storagePrefix || 'creative_design_',
      maxHistorySize: config.maxHistorySize || 50,
      defaultLocale: config.defaultLocale || 'zh-CN',
      assetBaseUrl: config.assetBaseUrl || '',
    };

    this.currentUserId = generateId('user');

    this.templateManager = new TemplateManager();
    this.imageCropper = new ImageCropper();
    this.typographyManager = new TypographyManager();
    this.questionCardManager = new QuestionCardManager();
    this.illustrationLibrary = new IllustrationLibrary();
    this.batchGenerator = new BatchGenerator(this.templateManager);
    this.previewManager = new PreviewManager();
    this.exportManager = new ExportManager(this.previewManager);
    this.versionManager = new VersionManager(this.config.storagePrefix);
    this.materialValidator = new MaterialValidator();
    this.copyrightManager = new CopyrightManager();
    this.historyManager = new HistoryManager(this.config.maxHistorySize);
    this.collaboratorManager = new CollaboratorManager(this.currentUserId);
    this.watermarkManager = new WatermarkManager();
  }

  getConfig(): Required<SDKConfig> {
    return { ...this.config };
  }

  getCurrentUserId(): string {
    return this.currentUserId;
  }

  setCurrentUserId(userId: string): void {
    this.currentUserId = userId;
    this.collaboratorManager.setCurrentUserId(userId);
  }

  on<K extends SDKEventName>(event: K, listener: EventListener<K>): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(listener);
    return () => this.off(event, listener);
  }

  off<K extends SDKEventName>(event: K, listener: EventListener<K>): void {
    this.eventListeners.get(event)?.delete(listener);
  }

  private emit<K extends SDKEventName>(event: K, data: SDKEventMap[K]): void {
    this.eventListeners.get(event)?.forEach((l) => {
      try {
        l(data);
      } catch (e) {
        console.error(`Event listener error [${event}]:`, e);
      }
    });
  }

  createProject(
    type: 'course_cover' | 'flashcard',
    templateId: string,
    name?: string
  ): DesignProject | null {
    const project = this.templateManager.applyTemplateToProject(
      templateId,
      type,
      this.currentUserId
    );
    if (!project) return null;

    if (name) project.name = name;

    this.project = project;
    this.historyManager.setInitialProject(project);
    this.selectedElementId = null;

    const owner = this.collaboratorManager.addCollaborator(
      '我',
      'owner',
      undefined,
      this.currentUserId
    );
    project.collaborators = [owner];

    this.emit('project:loaded', project);
    return project;
  }

  loadProject(project: DesignProject): void {
    this.project = deepClone(project);
    this.historyManager.setInitialProject(this.project);
    this.selectedElementId = null;

    project.collaborators.forEach((c) => {
      if (c.id === this.currentUserId) {
        this.collaboratorManager.addCollaborator(c.name, c.role, c.avatarUrl, c.id);
      }
    });

    if (project.watermark) {
      this.watermarkManager.setConfig(project.watermark);
    }

    this.emit('project:loaded', this.project);
  }

  getProject(): DesignProject | null {
    return this.project ? deepClone(this.project) : null;
  }

  saveProject(): DesignProject | null {
    if (!this.project) return null;
    this.project.updatedAt = Date.now();
    this.emit('project:saved', this.project);
    return deepClone(this.project);
  }

  updateProjectName(name: string): void {
    if (!this.project) return;
    this.project.name = name;
    this.project.updatedAt = Date.now();
  }

  listTemplates(filter?: TemplateFilter): Template[] {
    return this.templateManager.listTemplates(filter);
  }

  getTemplate(id: string): Template | undefined {
    return this.templateManager.getTemplate(id);
  }

  selectTemplate(id: string): Template | null {
    const tpl = this.templateManager.selectTemplate(id);
    if (tpl) this.emit('template:selected', tpl);
    return tpl;
  }

  listTemplatesByCategory(category: TemplateCategory): Template[] {
    return this.templateManager.listByCategory(category);
  }

  saveCustomTemplate(
    project: DesignProject,
    name: string,
    category: TemplateCategory,
    description?: string,
    tags?: string[]
  ): Template {
    const tpl = this.templateManager.createTemplateFromProject(
      project,
      name,
      category,
      description,
      tags
    );
    return this.templateManager.saveCustomTemplate(tpl as any);
  }

  getSizePresets(): typeof sizePresetConfigs {
    return sizePresetConfigs;
  }

  getSize(preset: SizePreset): SizeConfig {
    return getSize(preset);
  }

  createCustomSize(width: number, height: number, unit?: SizeConfig['unit'], dpi?: number): SizeConfig {
    return createCustomSize(width, height, unit, dpi);
  }

  setCanvasSize(size: SizeConfig | SizePreset): void {
    if (!this.project) return;
    const newSize = typeof size === 'string' ? getSize(size) : size;
    this.project.canvas.size = newSize;
    this.project.updatedAt = Date.now();
    this.emit('canvas:size_changed', newSize);
    this.notifyPreview();
  }

  getCanvasSize(): SizeConfig | null {
    return this.project?.canvas.size || null;
  }

  convertSizeToPx(size: SizeConfig): { width: number; height: number } {
    return convertSizeToPx(size);
  }

  getThemePresets(): typeof defaultThemes {
    return defaultThemes;
  }

  getThemePreset(preset: ThemePreset): ColorTheme {
    return getTheme(preset);
  }

  createCustomTheme(colors: Partial<ColorTheme>): ColorTheme {
    return createCustomTheme(colors);
  }

  setTheme(theme: ColorTheme | ThemePreset): void {
    if (!this.project) return;
    const newTheme = typeof theme === 'string' ? getTheme(theme) : theme;
    this.project.canvas.theme = newTheme;
    this.project.canvas.backgroundColor = newTheme.background;
    this.project.updatedAt = Date.now();
    this.emit('theme:changed', newTheme);
    this.notifyPreview();
  }

  getTheme(): ColorTheme | null {
    return this.project?.canvas.theme || null;
  }

  addElement(element: DesignElement): void {
    if (!this.project) return;
    this.project.canvas.elements.push(element);
    this.project.updatedAt = Date.now();
    this.historyManager.recordElementAdd(this.currentUserId, element);
    this.emit('element:added', element);
    this.selectElement(element.id);
    this.notifyPreview();
  }

  updateElement(id: string, changes: Partial<DesignElement>): void {
    if (!this.project) return;
    const idx = this.project.canvas.elements.findIndex((e) => e.id === id);
    if (idx === -1) return;

    const previous = deepClone(this.project.canvas.elements[idx]);
    const updated = { ...this.project.canvas.elements[idx], ...changes } as DesignElement;
    this.project.canvas.elements[idx] = updated;
    this.project.updatedAt = Date.now();

    this.historyManager.recordElementUpdate(this.currentUserId, previous, updated);
    this.emit('element:updated', { element: updated, changes });
    this.notifyPreview();
  }

  deleteElement(id: string): void {
    if (!this.project) return;
    const idx = this.project.canvas.elements.findIndex((e) => e.id === id);
    if (idx === -1) return;

    const [deleted] = this.project.canvas.elements.splice(idx, 1);
    this.project.updatedAt = Date.now();

    this.historyManager.recordElementDelete(this.currentUserId, deleted);
    this.emit('element:deleted', id);

    if (this.selectedElementId === id) {
      this.selectElement(null);
    }
    this.notifyPreview();
  }

  getElement(id: string): DesignElement | undefined {
    return this.project?.canvas.elements.find((e) => e.id === id);
  }

  getElements(): DesignElement[] {
    return this.project ? [...this.project.canvas.elements] : [];
  }

  selectElement(id: string | null): void {
    this.selectedElementId = id;
    this.emit('element:selected', id);
  }

  getSelectedElement(): DesignElement | null {
    if (!this.selectedElementId || !this.project) return null;
    return this.project.canvas.elements.find((e) => e.id === this.selectedElementId) || null;
  }

  getSelectedElementId(): string | null {
    return this.selectedElementId;
  }

  moveElement(id: string, x: number, y: number): void {
    const el = this.getElement(id);
    if (!el) return;
    if (el.x === x && el.y === y) return;
    this.updateElement(id, { x, y });
  }

  resizeElement(id: string, width: number, height: number): void {
    const el = this.getElement(id);
    if (!el) return;
    if (el.width === width && el.height === height) return;
    this.updateElement(id, { width, height });
  }

  get images(): ImageCropper {
    return this.imageCropper;
  }

  get typography(): TypographyManager {
    return this.typographyManager;
  }

  get questionCards(): QuestionCardManager {
    return this.questionCardManager;
  }

  get illustrations(): IllustrationLibrary {
    return this.illustrationLibrary;
  }

  setPreviewContainer(container: HTMLElement | null): void {
    this.previewManager.setContainer(container);
  }

  onPreview(callback: PreviewCallback): () => void {
    return this.previewManager.onPreview(callback);
  }

  renderPreview(scale: number = 1): HTMLElement | null {
    if (!this.project) return null;
    const el = this.previewManager.render(this.project, scale);
    this.emit('preview:ready', { element: el, project: this.project });
    return el;
  }

  notifyPreview(): void {
    if (this.project) {
      this.previewManager.notify(this.project);
    }
  }

  async export(options: ExportOptions): Promise<string> {
    if (!this.project) throw new Error('No project loaded');
    this.emit('export:started', options);
    const url = await this.exportManager.download(this.project, options);
    this.emit('export:completed', { url, options });
    return url;
  }

  async exportToBlob(options: ExportOptions): Promise<Blob> {
    if (!this.project) throw new Error('No project loaded');
    this.emit('export:started', options);
    const blob = await this.exportManager.exportToBlob(this.project, options);
    const url = URL.createObjectURL(blob);
    this.emit('export:completed', { url, options });
    return blob;
  }

  async exportToDataUrl(options: ExportOptions): Promise<string> {
    if (!this.project) throw new Error('No project loaded');
    return this.exportManager.exportToDataUrl(this.project, options);
  }

  getExportFormats(): ExportFormat[] {
    return ['png', 'jpg', 'svg', 'pdf'];
  }

  saveVersion(description?: string, tags?: string[]): DesignVersion | null {
    if (!this.project) return null;
    const version = this.versionManager.saveVersion(
      this.project,
      this.currentUserId,
      description,
      tags
    );
    this.emit('version:created', version);
    return version;
  }

  listVersions(): DesignVersion[] {
    if (!this.project) return [];
    return this.versionManager.listVersions(this.project.id);
  }

  getVersion(versionId: string): DesignVersion | undefined {
    if (!this.project) return undefined;
    return this.versionManager.getVersion(this.project.id, versionId);
  }

  restoreVersion(versionId: string): DesignProject | null {
    if (!this.project) return null;
    const restored = this.versionManager.restoreVersion(this.project.id, versionId);
    if (restored) {
      this.project = restored;
      this.historyManager.setInitialProject(this.project);
      this.notifyPreview();
      const version = this.versionManager.getVersion(this.project.id, versionId);
      if (version) this.emit('version:restored', version);
    }
    return restored;
  }

  deleteVersion(versionId: string): boolean {
    if (!this.project) return false;
    return this.versionManager.deleteVersion(this.project.id, versionId);
  }

  validate(rules?: MaterialValidationRules): ValidationResult {
    if (!this.project) return { valid: false, errors: [{ code: 'NO_PROJECT', message: 'No project loaded', severity: 'error' }], warnings: [] };
    if (rules) {
      const validator = new MaterialValidator(rules);
      return validator.validateProject(this.project);
    }
    return this.materialValidator.validateProject(this.project);
  }

  validateElement(element: DesignElement): ValidationResult {
    return this.materialValidator.validateElement(element);
  }

  checkCopyright(): CopyrightTip[] {
    if (!this.project) return [];
    return this.materialValidator.checkCopyrightCompliance(this.project);
  }

  get copyright(): CopyrightManager {
    return this.copyrightManager;
  }

  setCopyrightInfo(info: CopyrightInfo): void {
    if (!this.project) return;
    this.project.copyrightInfo = info;
    this.project.updatedAt = Date.now();
  }

  getCopyrightInfo(): CopyrightInfo | undefined {
    return this.project?.copyrightInfo;
  }

  canUndo(): boolean {
    return this.historyManager.canUndo();
  }

  canRedo(): boolean {
    return this.historyManager.canRedo();
  }

  undo(): void {
    if (!this.project || !this.canUndo()) return;
    const action = this.historyManager.undo();
    if (action) {
      this.project = this.historyManager.applyUndoToProject(this.project, action);
      this.emit('undo', action);
      this.notifyPreview();
    }
  }

  redo(): void {
    if (!this.project || !this.canRedo()) return;
    const action = this.historyManager.redo();
    if (action) {
      this.project = this.historyManager.applyRedoToProject(this.project, action);
      this.emit('redo', action);
      this.notifyPreview();
    }
  }

  getHistoryState(): HistoryState {
    return this.historyManager.getState();
  }

  onHistoryChange(listener: (state: HistoryState) => void): () => void {
    return this.historyManager.onStateChange(listener);
  }

  clearHistory(): void {
    this.historyManager.clear();
  }

  addCollaborator(
    name: string,
    role: CollaboratorRole = 'viewer',
    avatarUrl?: string,
    customId?: string
  ): Collaborator {
    const collab = this.collaboratorManager.addCollaborator(name, role, avatarUrl, customId);
    if (this.project) {
      this.project.collaborators = this.collaboratorManager.getCollaborators();
    }
    this.emit('collaborator:joined', collab);
    return collab;
  }

  removeCollaborator(id: string): boolean {
    const removed = this.collaboratorManager.removeCollaborator(id);
    if (removed && this.project) {
      this.project.collaborators = this.collaboratorManager.getCollaborators();
    }
    if (removed) this.emit('collaborator:left', id);
    return removed;
  }

  updateCollaboratorRole(id: string, role: CollaboratorRole): boolean {
    const updated = this.collaboratorManager.updateRole(id, role);
    if (updated && this.project) {
      this.project.collaborators = this.collaboratorManager.getCollaborators();
    }
    return updated;
  }

  getCollaborators(): Collaborator[] {
    return this.collaboratorManager.getCollaborators();
  }

  getPermissions(): Permission {
    const collab = this.collaboratorManager.getCurrentCollaborator();
    if (!collab) {
      return {
        canEdit: false,
        canExport: false,
        canShare: false,
        canDelete: false,
        canManageVersions: false,
        canManageCollaborators: false,
      };
    }
    return this.collaboratorManager.getPermissionsForRole(collab.role);
  }

  hasPermission(permission: keyof Permission): boolean {
    return this.collaboratorManager.hasPermission(this.currentUserId, permission);
  }

  getRolePermissions(role: CollaboratorRole): Permission {
    return this.collaboratorManager.getPermissionsForRole(role);
  }

  updateCursor(x: number, y: number, selectedElementId?: string): void {
    this.collaboratorManager.updateCursor(x, y, selectedElementId);
  }

  setRemoteCursor(cursor: CursorPosition): void {
    this.collaboratorManager.setRemoteCursor(cursor);
    this.emit('cursor:moved', cursor);
  }

  getRemoteCursors(): CursorPosition[] {
    return this.collaboratorManager.getCursors();
  }

  getCollaboratorColor(userId: string): string {
    return this.collaboratorManager.getCollaboratorColor(userId);
  }

  get watermark(): WatermarkManager {
    return this.watermarkManager;
  }

  setWatermark(config: Partial<WatermarkConfig>): WatermarkConfig {
    const result = this.watermarkManager.setConfig(config);
    if (this.project) {
      this.project.watermark = result;
      this.project.updatedAt = Date.now();
      this.notifyPreview();
    }
    return result;
  }

  getWatermark(): WatermarkConfig {
    return this.watermarkManager.getConfig();
  }

  applyWatermarkPreset(preset: 'copyright' | 'confidential' | 'draft' | 'preview' | 'brand'): WatermarkConfig {
    const result = this.watermarkManager.applyPreset(preset);
    if (this.project) {
      this.project.watermark = result;
      this.project.updatedAt = Date.now();
      this.notifyPreview();
    }
    return result;
  }

  async batchGenerate(
    items: BatchGenerateItem[],
    projectType: 'course_cover' | 'flashcard',
    onProgress?: (completed: number, total: number, current: BatchGenerateResult) => void
  ): Promise<BatchGenerateResult[]> {
    return this.batchGenerator.generate(items, projectType, this.currentUserId, onProgress);
  }

  prepareBatchItems(
    templateId: string,
    variableList: Array<Record<string, string>>,
    filenameTemplate?: string
  ): BatchGenerateItem[] {
    return this.batchGenerator.prepareBatchItems(templateId, variableList, filenameTemplate);
  }

  dispose(): void {
    this.eventListeners.clear();
    this.project = null;
  }
}
