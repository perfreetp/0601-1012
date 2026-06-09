import {
  CreativeDesignSDK,
  DesignProject,
  Template,
  SizePreset,
  ThemePreset,
  TextElement,
} from '../src';
import { generateElementId } from '../src/utils';

export interface CoverEditorOptions {
  container: HTMLElement;
  userId?: string;
  defaultTemplateId?: string;
  onProjectChange?: (project: DesignProject) => void;
}

export class CoverEditor {
  private sdk: CreativeDesignSDK;
  private container: HTMLElement;
  private options: CoverEditorOptions;
  private editorEl: HTMLElement | null = null;

  constructor(options: CoverEditorOptions) {
    this.options = options;
    this.container = options.container;
    this.sdk = new CreativeDesignSDK();

    if (options.userId) {
      this.sdk.setCurrentUserId(options.userId);
    }
  }

  init(): void {
    this.render();
    this.bindEvents();
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="cd-cover-editor" style="display:flex;height:100%;font-family:system-ui,sans-serif;">
        <div class="cd-sidebar" style="width:280px;background:#f8f9fa;border-right:1px solid #e5e7eb;padding:16px;overflow-y:auto;">
          <h3 style="margin:0 0 16px;font-size:16px;color:#1f2937;">课程封面编辑</h3>
          
          <div class="cd-section" style="margin-bottom:24px;">
            <div style="font-size:14px;font-weight:600;margin-bottom:8px;color:#374151;">项目名称</div>
            <input id="cd-project-name" type="text" placeholder="输入课程名称" style="width:100%;padding:8px 12px;border:1px solid #d1d5db;border-radius:6px;font-size:14px;box-sizing:border-box;" />
          </div>

          <div class="cd-section" style="margin-bottom:24px;">
            <div style="font-size:14px;font-weight:600;margin-bottom:8px;color:#374151;">选择模板</div>
            <div id="cd-templates" style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;"></div>
          </div>

          <div class="cd-section" style="margin-bottom:24px;">
            <div style="font-size:14px;font-weight:600;margin-bottom:8px;color:#374151;">尺寸预设</div>
            <select id="cd-size-select" style="width:100%;padding:8px 12px;border:1px solid #d1d5db;border-radius:6px;font-size:14px;">
              <option value="course_cover_landscape">课程封面（横版） 1920x1080</option>
              <option value="course_cover_portrait">课程封面（竖版） 1080x1440</option>
              <option value="16:9">16:9 宽屏</option>
              <option value="4:3">4:3 标准</option>
              <option value="A4">A4纸张</option>
            </select>
          </div>

          <div class="cd-section" style="margin-bottom:24px;">
            <div style="font-size:14px;font-weight:600;margin-bottom:8px;color:#374151;">主题配色</div>
            <div id="cd-themes" style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;"></div>
          </div>

          <div class="cd-section" style="margin-bottom:24px;">
            <div style="font-size:14px;font-weight:600;margin-bottom:8px;color:#374151;">标题内容</div>
            <input id="cd-title-input" type="text" placeholder="课程标题" style="width:100%;padding:8px 12px;border:1px solid #d1d5db;border-radius:6px;font-size:14px;margin-bottom:8px;box-sizing:border-box;" />
            <input id="cd-subtitle-input" type="text" placeholder="副标题" style="width:100%;padding:8px 12px;border:1px solid #d1d5db;border-radius:6px;font-size:14px;margin-bottom:8px;box-sizing:border-box;" />
            <textarea id="cd-desc-input" placeholder="课程简介" rows="3" style="width:100%;padding:8px 12px;border:1px solid #d1d5db;border-radius:6px;font-size:14px;resize:vertical;box-sizing:border-box;"></textarea>
          </div>

          <div class="cd-section" style="margin-bottom:24px;">
            <div style="font-size:14px;font-weight:600;margin-bottom:8px;color:#374151;">操作</div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              <button id="cd-undo-btn" style="padding:8px 12px;border:1px solid #d1d5db;background:#fff;border-radius:6px;cursor:pointer;font-size:14px;">撤销</button>
              <button id="cd-redo-btn" style="padding:8px 12px;border:1px solid #d1d5db;background:#fff;border-radius:6px;cursor:pointer;font-size:14px;">重做</button>
              <button id="cd-save-ver-btn" style="padding:8px 12px;border:none;background:#3b82f6;color:#fff;border-radius:6px;cursor:pointer;font-size:14px;">保存版本</button>
            </div>
          </div>
        </div>

        <div class="cd-preview" style="flex:1;background:#e5e7eb;display:flex;align-items:center;justify-content:center;overflow:auto;padding:24px;">
          <div id="cd-canvas-container" style="box-shadow:0 4px 20px rgba(0,0,0,0.1);background:#fff;"></div>
        </div>
      </div>
    `;

    this.editorEl = this.container.querySelector('.cd-cover-editor');
    this.renderTemplates();
    this.renderThemes();

    const defaultTemplateId = this.options.defaultTemplateId || 'tpl_cover_standard';
    this.sdk.createProject('course_cover', defaultTemplateId, '新课程封面');
    this.sdk.setPreviewContainer(this.container.querySelector('#cd-canvas-container') as HTMLElement);
    this.sdk.renderPreview(0.5);
    this.updateFormFromProject();
  }

  private renderTemplates(): void {
    const container = this.container.querySelector('#cd-templates') as HTMLElement;
    const templates = this.sdk.listTemplatesByCategory('course_cover');

    container.innerHTML = templates
      .map(
        (t) => `
        <div class="cd-template-item" data-id="${t.id}" style="border:2px solid #e5e7eb;border-radius:8px;padding:8px;cursor:pointer;text-align:center;transition:border-color .2s;" data-active="false">
          <div style="background:${t.theme.primary};height:40px;border-radius:4px;margin-bottom:6px;"></div>
          <div style="font-size:12px;color:#374151;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${t.name}</div>
        </div>
      `
      )
      .join('');
  }

  private renderThemes(): void {
    const container = this.container.querySelector('#cd-themes') as HTMLElement;
    const presets: ThemePreset[] = ['default_light', 'default_dark', 'ocean_blue', 'forest_green', 'sunset_orange', 'lavender_purple', 'education_bright', 'education_soft'];

    container.innerHTML = presets
      .map(
        (p) => `
        <div class="cd-theme-item" data-id="${p}" style="width:100%;aspect-ratio:1;border-radius:6px;cursor:pointer;border:2px solid transparent;overflow:hidden;display:flex;">
          <div style="flex:1;background:${this.sdk.getThemePreset(p).primary};"></div>
          <div style="flex:1;background:${this.sdk.getThemePreset(p).accent};"></div>
        </div>
      `
      )
      .join('');
  }

  private bindEvents(): void {
    this.container.querySelectorAll('.cd-template-item').forEach((el) => {
      el.addEventListener('click', (e) => {
        const id = (e.currentTarget as HTMLElement).dataset.id as string;
        this.applyTemplate(id);
      });
    });

    this.container.querySelectorAll('.cd-theme-item').forEach((el) => {
      el.addEventListener('click', (e) => {
        const id = (e.currentTarget as HTMLElement).dataset.id as ThemePreset;
        this.sdk.setTheme(id);
      });
    });

    (this.container.querySelector('#cd-size-select') as HTMLSelectElement).addEventListener('change', (e) => {
      const value = (e.target as HTMLSelectElement).value as SizePreset;
      this.sdk.setCanvasSize(value);
    });

    (this.container.querySelector('#cd-project-name') as HTMLInputElement).addEventListener('input', (e) => {
      this.sdk.updateProjectName((e.target as HTMLInputElement).value);
    });

    (this.container.querySelector('#cd-title-input') as HTMLInputElement).addEventListener('input', (e) => {
      this.updateTextElement(0, (e.target as HTMLInputElement).value);
    });

    (this.container.querySelector('#cd-subtitle-input') as HTMLInputElement).addEventListener('input', (e) => {
      this.updateTextElement(1, (e.target as HTMLInputElement).value);
    });

    (this.container.querySelector('#cd-desc-input') as HTMLTextAreaElement).addEventListener('input', (e) => {
      this.updateTextElement(2, (e.target as HTMLTextAreaElement).value);
    });

    (this.container.querySelector('#cd-undo-btn') as HTMLButtonElement).addEventListener('click', () => {
      this.sdk.undo();
      this.updateFormFromProject();
    });

    (this.container.querySelector('#cd-redo-btn') as HTMLButtonElement).addEventListener('click', () => {
      this.sdk.redo();
      this.updateFormFromProject();
    });

    (this.container.querySelector('#cd-save-ver-btn') as HTMLButtonElement).addEventListener('click', () => {
      this.sdk.saveVersion('手动保存');
      alert('版本已保存');
    });

    this.sdk.on('project:loaded', () => {
      this.sdk.renderPreview(0.5);
      this.updateFormFromProject();
    });

    this.sdk.onPreview(() => {
      this.sdk.renderPreview(0.5);
      const p = this.sdk.getProject();
      if (p && this.options.onProjectChange) {
        this.options.onProjectChange(p);
      }
    });
  }

  private applyTemplate(templateId: string): void {
    this.sdk.createProject('course_cover', templateId, this.sdk.getProject()?.name || '新课程封面');

    this.container.querySelectorAll('.cd-template-item').forEach((el) => {
      const item = el as HTMLElement;
      if (item.dataset.id === templateId) {
        item.style.borderColor = '#3b82f6';
        item.dataset.active = 'true';
      } else {
        item.style.borderColor = '#e5e7eb';
        item.dataset.active = 'false';
      }
    });
  }

  private updateTextElement(index: number, content: string): void {
    const elements = this.sdk.getElements().filter((e) => e.type === 'text') as TextElement[];
    if (elements[index]) {
      this.sdk.updateElement(elements[index].id, { content } as any);
    }
  }

  private updateFormFromProject(): void {
    const project = this.sdk.getProject();
    if (!project) return;

    const nameInput = this.container.querySelector('#cd-project-name') as HTMLInputElement;
    if (nameInput.value !== project.name) {
      nameInput.value = project.name;
    }

    const textElements = project.canvas.elements.filter((e) => e.type === 'text') as TextElement[];
    const titleInput = this.container.querySelector('#cd-title-input') as HTMLInputElement;
    const subtitleInput = this.container.querySelector('#cd-subtitle-input') as HTMLInputElement;
    const descInput = this.container.querySelector('#cd-desc-input') as HTMLTextAreaElement;

    if (textElements[0] && titleInput.value !== textElements[0].content) {
      titleInput.value = textElements[0].content;
    }
    if (textElements[1] && subtitleInput.value !== textElements[1].content) {
      subtitleInput.value = textElements[1].content;
    }
    if (textElements[2] && descInput.value !== textElements[2].content) {
      descInput.value = textElements[2].content;
    }
  }

  getSDK(): CreativeDesignSDK {
    return this.sdk;
  }

  getProject(): DesignProject | null {
    return this.sdk.getProject();
  }

  destroy(): void {
    this.sdk.dispose();
    if (this.editorEl) {
      this.editorEl.remove();
    }
  }
}
