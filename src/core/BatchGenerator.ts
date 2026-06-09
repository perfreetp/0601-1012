import {
  DesignProject,
  BatchGenerateItem,
  BatchGenerateResult,
  Template,
  DesignElement,
  TextElement,
  ImageElement,
} from '../types';
import { TemplateManager } from './TemplateManager';
import { generateId, deepClone } from '../utils';

export class BatchGenerator {
  private templateManager: TemplateManager;

  constructor(templateManager: TemplateManager) {
    this.templateManager = templateManager;
  }

  replaceTextVariables(
    elements: DesignElement[],
    variables: Record<string, string>
  ): DesignElement[] {
    return elements.map((el) => {
      if (el.type === 'text') {
        const textEl = el as TextElement;
        let content = textEl.content;
        Object.entries(variables).forEach(([key, value]) => {
          content = content.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
        });
        return { ...textEl, content };
      }
      if (el.type === 'question_card') {
        const qEl = el as any;
        let questionContent = qEl.questionContent;
        Object.entries(variables).forEach(([key, value]) => {
          questionContent = questionContent.replace(
            new RegExp(`\\{\\{${key}\\}\\}`, 'g'),
            value
          );
        });
        const options = qEl.options?.map((opt: any) => {
          let optContent = opt.content;
          Object.entries(variables).forEach(([key, value]) => {
            optContent = optContent.replace(
              new RegExp(`\\{\\{${key}\\}\\}`, 'g'),
              value
            );
          });
          return { ...opt, content: optContent };
        });
        return { ...qEl, questionContent, options };
      }
      return el;
    });
  }

  replaceImageVariables(
    elements: DesignElement[],
    variables: Record<string, string>
  ): DesignElement[] {
    return elements.map((el) => {
      if (el.type === 'image') {
        const imgEl = el as ImageElement;
        let src = imgEl.src;
        Object.entries(variables).forEach(([key, value]) => {
          if (value.startsWith('http') || value.startsWith('data:')) {
            src = src.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
          }
        });
        return { ...imgEl, src };
      }
      return el;
    });
  }

  applyVariables(
    project: DesignProject,
    variables: Record<string, string>
  ): DesignProject {
    const cloned = deepClone(project);
    cloned.canvas.elements = this.replaceTextVariables(
      cloned.canvas.elements,
      variables
    );
    cloned.canvas.elements = this.replaceImageVariables(
      cloned.canvas.elements,
      variables
    );
    cloned.updatedAt = Date.now();
    return cloned;
  }

  generateProjectFromTemplate(
    templateId: string,
    variables: Record<string, string>,
    projectType: 'course_cover' | 'flashcard',
    userId: string
  ): DesignProject | null {
    const project = this.templateManager.applyTemplateToProject(
      templateId,
      projectType,
      userId
    );
    if (!project) return null;
    return this.applyVariables(project, variables);
  }

  async generate(
    items: BatchGenerateItem[],
    projectType: 'course_cover' | 'flashcard',
    userId: string,
    onProgress?: (completed: number, total: number, current: BatchGenerateResult) => void
  ): Promise<BatchGenerateResult[]> {
    const results: BatchGenerateResult[] = [];
    const total = items.length;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      try {
        const project = this.generateProjectFromTemplate(
          item.templateId,
          item.variables,
          projectType,
          userId
        );

        if (!project) {
          throw new Error(`Failed to generate project for template ${item.templateId}`);
        }

        const result: BatchGenerateResult = {
          itemId: item.id,
          success: true,
        };
        results.push(result);

        if (onProgress) {
          onProgress(i + 1, total, result);
        }
      } catch (error) {
        results.push({
          itemId: item.id,
          success: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return results;
  }

  prepareBatchItems(
    templateId: string,
    variableList: Array<Record<string, string>>,
    filenameTemplate?: string
  ): BatchGenerateItem[] {
    return variableList.map((variables, index) => ({
      id: generateId('batch_item'),
      templateId,
      variables,
      outputFilename: filenameTemplate
        ? filenameTemplate.replace('{index}', String(index + 1))
        : undefined,
    }));
  }
}
