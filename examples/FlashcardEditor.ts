import {
  CreativeDesignSDK,
  DesignProject,
  QuestionCardElement,
  QuestionType,
  QuestionOption,
} from '../src';
import { generateId } from '../src/utils';

export interface FlashcardEditorOptions {
  container: HTMLElement;
  userId?: string;
  defaultTemplateId?: string;
  onProjectChange?: (project: DesignProject) => void;
}

export class FlashcardEditor {
  private sdk: CreativeDesignSDK;
  private container: HTMLElement;
  private options: FlashcardEditorOptions;
  private editorEl: HTMLElement | null = null;

  constructor(options: FlashcardEditorOptions) {
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
      <div class="cd-flashcard-editor" style="display:flex;height:100%;font-family:system-ui,sans-serif;">
        <div class="cd-sidebar" style="width:320px;background:#f8f9fa;border-right:1px solid #e5e7eb;padding:16px;overflow-y:auto;">
          <h3 style="margin:0 0 16px;font-size:16px;color:#1f2937;">练习卡编辑</h3>

          <div class="cd-section" style="margin-bottom:24px;">
            <div style="font-size:14px;font-weight:600;margin-bottom:8px;color:#374151;">题型选择</div>
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;">
              <button class="cd-qtype-btn" data-type="single_choice" style="padding:8px;border:1px solid #d1d5db;background:#fff;border-radius:6px;cursor:pointer;font-size:12px;">单选</button>
              <button class="cd-qtype-btn" data-type="multiple_choice" style="padding:8px;border:1px solid #d1d5db;background:#fff;border-radius:6px;cursor:pointer;font-size:12px;">多选</button>
              <button class="cd-qtype-btn" data-type="true_false" style="padding:8px;border:1px solid #d1d5db;background:#fff;border-radius:6px;cursor:pointer;font-size:12px;">判断</button>
              <button class="cd-qtype-btn" data-type="fill_blank" style="padding:8px;border:1px solid #d1d5db;background:#fff;border-radius:6px;cursor:pointer;font-size:12px;">填空</button>
              <button class="cd-qtype-btn" data-type="short_answer" style="padding:8px;border:1px solid #d1d5db;background:#fff;border-radius:6px;cursor:pointer;font-size:12px;">简答</button>
              <button class="cd-qtype-btn" data-type="matching" style="padding:8px;border:1px solid #d1d5db;background:#fff;border-radius:6px;cursor:pointer;font-size:12px;">匹配</button>
            </div>
          </div>

          <div class="cd-section" style="margin-bottom:24px;">
            <div style="font-size:14px;font-weight:600;margin-bottom:8px;color:#374151;">选择模板</div>
            <div id="cd-flashcard-templates" style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;"></div>
          </div>

          <div class="cd-section" style="margin-bottom:24px;">
            <div style="font-size:14px;font-weight:600;margin-bottom:8px;color:#374151;">题目内容</div>
            <textarea id="cd-question-input" placeholder="请输入题目内容" rows="3" style="width:100%;padding:8px 12px;border:1px solid #d1d5db;border-radius:6px;font-size:14px;resize:vertical;box-sizing:border-box;margin-bottom:8px;"></textarea>
          </div>

          <div class="cd-section" style="margin-bottom:24px;">
            <div style="font-size:14px;font-weight:600;margin-bottom:8px;color:#374151;display:flex;justify-content:space-between;align-items:center;">
              <span>选项设置</span>
              <button id="cd-add-option-btn" style="padding:4px 10px;border:none;background:#3b82f6;color:#fff;border-radius:4px;cursor:pointer;font-size:12px;">+ 添加</button>
            </div>
            <div id="cd-options-list" style="display:flex;flex-direction:column;gap:6px;"></div>
          </div>

          <div class="cd-section" style="margin-bottom:24px;">
            <div style="font-size:14px;font-weight:600;margin-bottom:8px;color:#374151;">答案解析</div>
            <textarea id="cd-explanation-input" placeholder="输入答案解析（选填）" rows="2" style="width:100%;padding:8px 12px;border:1px solid #d1d5db;border-radius:6px;font-size:14px;resize:vertical;box-sizing:border-box;"></textarea>
          </div>

          <div class="cd-section" style="margin-bottom:24px;">
            <div style="font-size:14px;font-weight:600;margin-bottom:8px;color:#374151;">主题配色</div>
            <div id="cd-flashcard-themes" style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;"></div>
          </div>

          <div class="cd-section">
            <div style="font-size:14px;font-weight:600;margin-bottom:8px;color:#374151;">操作</div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              <button id="cd-fl-undo-btn" style="padding:8px 12px;border:1px solid #d1d5db;background:#fff;border-radius:6px;cursor:pointer;font-size:14px;">撤销</button>
              <button id="cd-fl-redo-btn" style="padding:8px 12px;border:1px solid #d1d5db;background:#fff;border-radius:6px;cursor:pointer;font-size:14px;">重做</button>
              <button id="cd-fl-check-btn" style="padding:8px 12px;border:none;background:#10b981;color:#fff;border-radius:6px;cursor:pointer;font-size:14px;">验证</button>
            </div>
          </div>
        </div>

        <div class="cd-preview" style="flex:1;background:#e5e7eb;display:flex;align-items:center;justify-content:center;overflow:auto;padding:24px;">
          <div id="cd-flashcard-container" style="box-shadow:0 4px 20px rgba(0,0,0,0.1);background:#fff;"></div>
        </div>
      </div>
    `;

    this.editorEl = this.container.querySelector('.cd-flashcard-editor');
    this.renderTemplates();
    this.renderThemes();

    const defaultTemplateId = this.options.defaultTemplateId || 'tpl_flashcard_standard';
    this.sdk.createProject('flashcard', defaultTemplateId, '新练习卡');
    this.sdk.setPreviewContainer(this.container.querySelector('#cd-flashcard-container') as HTMLElement);
    this.sdk.renderPreview(1);
    this.updateFormFromProject();
  }

  private renderTemplates(): void {
    const container = this.container.querySelector('#cd-flashcard-templates') as HTMLElement;
    const templates = this.sdk.listTemplatesByCategory('flashcard');

    container.innerHTML = templates
      .map(
        (t) => `
        <div class="cd-fl-template-item" data-id="${t.id}" style="border:2px solid #e5e7eb;border-radius:8px;padding:8px;cursor:pointer;text-align:center;transition:border-color .2s;">
          <div style="background:linear-gradient(135deg,${t.theme.primary},${t.theme.accent});height:36px;border-radius:4px;margin-bottom:6px;"></div>
          <div style="font-size:12px;color:#374151;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${t.name}</div>
        </div>
      `
      )
      .join('');
  }

  private renderThemes(): void {
    const container = this.container.querySelector('#cd-flashcard-themes') as HTMLElement;
    const themes = ['default_light', 'education_soft', 'forest_green', 'ocean_blue', 'sunset_orange', 'lavender_purple', 'education_bright', 'default_dark'];

    container.innerHTML = themes
      .map(
        (p) => `
        <div class="cd-fl-theme-item" data-id="${p}" style="width:100%;aspect-ratio:1;border-radius:6px;cursor:pointer;border:2px solid transparent;overflow:hidden;display:flex;">
          <div style="flex:1;background:${this.sdk.getTheme(p as any).primary};"></div>
          <div style="flex:1;background:${this.sdk.getTheme(p as any).accent};"></div>
        </div>
      `
      )
      .join('');
  }

  private bindEvents(): void {
    this.container.querySelectorAll('.cd-fl-template-item').forEach((el) => {
      el.addEventListener('click', (e) => {
        const id = (e.currentTarget as HTMLElement).dataset.id as string;
        this.sdk.createProject('flashcard', id, this.sdk.getProject()?.name || '新练习卡');
      });
    });

    this.container.querySelectorAll('.cd-fl-theme-item').forEach((el) => {
      el.addEventListener('click', (e) => {
        const id = (e.currentTarget as HTMLElement).dataset.id as any;
        this.sdk.setTheme(id);
      });
    });

    this.container.querySelectorAll('.cd-qtype-btn').forEach((el) => {
      el.addEventListener('click', (e) => {
        const type = (e.currentTarget as HTMLElement).dataset.type as QuestionType;
        this.changeQuestionType(type);
      });
    });

    (this.container.querySelector('#cd-question-input') as HTMLTextAreaElement).addEventListener('input', (e) => {
      this.updateQuestionContent((e.target as HTMLTextAreaElement).value);
    });

    (this.container.querySelector('#cd-explanation-input') as HTMLTextAreaElement).addEventListener('input', (e) => {
      this.updateExplanation((e.target as HTMLTextAreaElement).value);
    });

    (this.container.querySelector('#cd-add-option-btn') as HTMLButtonElement).addEventListener('click', () => {
      this.addOption();
    });

    (this.container.querySelector('#cd-fl-undo-btn') as HTMLButtonElement).addEventListener('click', () => {
      this.sdk.undo();
      this.updateFormFromProject();
    });

    (this.container.querySelector('#cd-fl-redo-btn') as HTMLButtonElement).addEventListener('click', () => {
      this.sdk.redo();
      this.updateFormFromProject();
    });

    (this.container.querySelector('#cd-fl-check-btn') as HTMLButtonElement).addEventListener('click', () => {
      const result = this.sdk.validate();
      if (result.valid) {
        alert('校验通过！');
      } else {
        alert('校验失败：\n' + result.errors.map((e) => e.message).join('\n'));
      }
    });

    this.sdk.on('project:loaded', () => {
      this.sdk.renderPreview(1);
      this.updateFormFromProject();
    });

    this.sdk.onPreview(() => {
      this.sdk.renderPreview(1);
      const p = this.sdk.getProject();
      if (p && this.options.onProjectChange) {
        this.options.onProjectChange(p);
      }
    });
  }

  private getQuestionCardElement(): QuestionCardElement | null {
    const elements = this.sdk.getElements().filter((e) => e.type === 'question_card') as QuestionCardElement[];
    return elements[0] || null;
  }

  private changeQuestionType(type: QuestionType): void {
    const qc = this.getQuestionCardElement();
    if (!qc) return;

    const baseElement = this.sdk.questionCards.createQuestionCard(
      type,
      qc.questionContent || '新题目',
      qc.x,
      qc.y,
      qc.width,
      qc.height,
      this.sdk.getTheme() || undefined
    );

    this.sdk.deleteElement(qc.id);
    this.sdk.addElement(baseElement);
    this.renderOptions();
  }

  private updateQuestionContent(content: string): void {
    const qc = this.getQuestionCardElement();
    if (!qc) return;
    this.sdk.updateElement(qc.id, { questionContent: content } as any);
  }

  private updateExplanation(explanation: string): void {
    const qc = this.getQuestionCardElement();
    if (!qc) return;
    this.sdk.updateElement(qc.id, { explanation } as any);
  }

  private addOption(): void {
    const qc = this.getQuestionCardElement();
    if (!qc) return;
    const updated = this.sdk.questionCards.addOption(qc, '新选项');
    this.sdk.updateElement(qc.id, updated as any);
    this.renderOptions();
  }

  private removeOption(optionId: string): void {
    const qc = this.getQuestionCardElement();
    if (!qc) return;
    const updated = this.sdk.questionCards.removeOption(qc, optionId);
    this.sdk.updateElement(qc.id, updated as any);
    this.renderOptions();
  }

  private updateOptionContent(optionId: string, content: string): void {
    const qc = this.getQuestionCardElement();
    if (!qc) return;
    const updated = this.sdk.questionCards.updateOptionContent(qc, optionId, content);
    this.sdk.updateElement(qc.id, updated as any);
  }

  private setCorrectOption(optionId: string, multi: boolean = false): void {
    const qc = this.getQuestionCardElement();
    if (!qc) return;

    if (multi) {
      const currentCorrect = qc.options?.filter((o) => o.isCorrect).map((o) => o.id) || [];
      const newCorrect = currentCorrect.includes(optionId)
        ? currentCorrect.filter((id) => id !== optionId)
        : [...currentCorrect, optionId];
      const updated = this.sdk.questionCards.setCorrectAnswer(qc, newCorrect);
      this.sdk.updateElement(qc.id, updated as any);
    } else {
      const updated = this.sdk.questionCards.setCorrectAnswer(qc, optionId);
      this.sdk.updateElement(qc.id, updated as any);
    }
    this.renderOptions();
  }

  private renderOptions(): void {
    const qc = this.getQuestionCardElement();
    const list = this.container.querySelector('#cd-options-list') as HTMLElement;
    if (!qc || !qc.options) {
      list.innerHTML = '<div style="font-size:12px;color:#999;padding:8px;">此题型无需选项</div>';
      return;
    }

    const isMulti = qc.questionType === 'multiple_choice';

    list.innerHTML = qc.options
      .map(
        (opt, idx) => `
        <div class="cd-option-item" data-id="${opt.id}" style="display:flex;align-items:center;gap:6px;padding:6px;border:1px solid #e5e7eb;border-radius:6px;background:#fff;">
          <input type="${isMulti ? 'checkbox' : 'radio'}" name="cd-correct" ${opt.isCorrect ? 'checked' : ''} data-option-id="${opt.id}" style="cursor:pointer;" />
          <span style="font-weight:600;color:#374151;width:20px;">${String.fromCharCode(65 + idx)}.</span>
          <input type="text" value="${opt.content.replace(/"/g, '&quot;')}" data-option-id="${opt.id}" class="cd-option-input" style="flex:1;padding:4px 8px;border:1px solid #e5e7eb;border-radius:4px;font-size:13px;" />
          <button class="cd-remove-option" data-option-id="${opt.id}" style="padding:2px 8px;border:1px solid #fecaca;background:#fef2f2;color:#dc2626;border-radius:4px;cursor:pointer;font-size:12px;">×</button>
        </div>
      `
      )
      .join('');

    list.querySelectorAll('input[name="cd-correct"]').forEach((el) => {
      el.addEventListener('change', (e) => {
        const id = (e.target as HTMLInputElement).dataset.optionId as string;
        this.setCorrectOption(id, isMulti);
      });
    });

    list.querySelectorAll('.cd-option-input').forEach((el) => {
      el.addEventListener('input', (e) => {
        const id = (e.target as HTMLInputElement).dataset.optionId as string;
        this.updateOptionContent(id, (e.target as HTMLInputElement).value);
      });
    });

    list.querySelectorAll('.cd-remove-option').forEach((el) => {
      el.addEventListener('click', (e) => {
        const id = (e.currentTarget as HTMLElement).dataset.optionId as string;
        this.removeOption(id);
      });
    });
  }

  private updateFormFromProject(): void {
    const project = this.sdk.getProject();
    if (!project) return;

    const qc = this.getQuestionCardElement();
    if (qc) {
      const questionInput = this.container.querySelector('#cd-question-input') as HTMLTextAreaElement;
      const explanationInput = this.container.querySelector('#cd-explanation-input') as HTMLTextAreaElement;

      if (questionInput.value !== qc.questionContent) {
        questionInput.value = qc.questionContent;
      }
      if (explanationInput.value !== (qc.explanation || '')) {
        explanationInput.value = qc.explanation || '';
      }

      this.renderOptions();
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
