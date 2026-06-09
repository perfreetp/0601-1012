import {
  Template,
  TemplateFilter,
  TemplateCategory,
  DesignProject,
  DesignCanvas,
  ColorTheme,
  SizeConfig,
} from '../types';
import { systemTemplates } from './templates';
import { generateId, deepClone } from '../utils';

export class TemplateManager {
  private templates: Map<string, Template> = new Map();
  private customTemplates: Map<string, Template> = new Map();

  constructor() {
    systemTemplates.forEach((t) => this.templates.set(t.id, t));
  }

  listTemplates(filter?: TemplateFilter): Template[] {
    let result = Array.from(this.templates.values());

    if (filter) {
      if (filter.category) {
        result = result.filter((t) => t.category === filter.category);
      }
      if (filter.isSystem !== undefined) {
        result = result.filter((t) => t.isSystem === filter.isSystem);
      }
      if (filter.tags && filter.tags.length > 0) {
        result = result.filter((t) =>
          t.tags?.some((tag) => filter.tags!.includes(tag))
        );
      }
      if (filter.keyword) {
        const keyword = filter.keyword.toLowerCase();
        result = result.filter(
          (t) =>
            t.name.toLowerCase().includes(keyword) ||
            t.description?.toLowerCase().includes(keyword) ||
            t.tags?.some((tag) => tag.toLowerCase().includes(keyword))
        );
      }
    }

    return result.sort((a, b) => b.updatedAt - a.updatedAt);
  }

  getTemplate(id: string): Template | undefined {
    return this.templates.get(id);
  }

  selectTemplate(id: string): Template | null {
    const template = this.templates.get(id);
    return template ? deepClone(template) : null;
  }

  listByCategory(category: TemplateCategory): Template[] {
    return this.listTemplates({ category });
  }

  saveCustomTemplate(template: Omit<Template, 'id' | 'isSystem' | 'createdAt' | 'updatedAt'>): Template {
    const now = Date.now();
    const newTemplate: Template = {
      ...template,
      id: generateId('tpl'),
      isSystem: false,
      createdAt: now,
      updatedAt: now,
    };
    this.templates.set(newTemplate.id, newTemplate);
    this.customTemplates.set(newTemplate.id, newTemplate);
    return newTemplate;
  }

  deleteCustomTemplate(id: string): boolean {
    if (this.customTemplates.has(id)) {
      this.templates.delete(id);
      this.customTemplates.delete(id);
      return true;
    }
    return false;
  }

  applyTemplateToProject(
    templateId: string,
    projectType: 'course_cover' | 'flashcard',
    userId: string
  ): DesignProject | null {
    const template = this.selectTemplate(templateId);
    if (!template) return null;

    const now = Date.now();
    return {
      id: generateId('proj'),
      name: template.name,
      type: projectType,
      canvas: {
        size: deepClone(template.size),
        theme: deepClone(template.theme),
        backgroundColor: template.theme.background,
        elements: deepClone(template.elements),
      },
      collaborators: [
        {
          id: userId,
          name: '我',
          role: 'owner',
          color: '#3B82F6',
          joinedAt: now,
          lastActiveAt: now,
        },
      ],
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
    };
  }

  createTemplateFromProject(
    project: DesignProject,
    name: string,
    category: TemplateCategory,
    description?: string,
    tags?: string[]
  ): Template {
    const now = Date.now();
    return {
      id: generateId('tpl'),
      name,
      category,
      description,
      size: deepClone(project.canvas.size),
      theme: deepClone(project.canvas.theme),
      elements: deepClone(project.canvas.elements),
      tags,
      createdAt: now,
      updatedAt: now,
      isSystem: false,
    };
  }

  searchTemplates(keyword: string): Template[] {
    return this.listTemplates({ keyword });
  }
}
