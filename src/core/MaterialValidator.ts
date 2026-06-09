import {
  DesignProject,
  DesignElement,
  TextElement,
  ImageElement,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  CopyrightTip,
} from '../types';

export interface MaterialValidationRules {
  maxImageSizeMB?: number;
  allowedImageFormats?: string[];
  minImageResolution?: { width: number; height: number };
  maxTextLength?: number;
  requireAltText?: boolean;
}

const DEFAULT_RULES: Required<MaterialValidationRules> = {
  maxImageSizeMB: 10,
  allowedImageFormats: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'],
  minImageResolution: { width: 100, height: 100 },
  maxTextLength: 2000,
  requireAltText: false,
};

export class MaterialValidator {
  private rules: Required<MaterialValidationRules>;

  constructor(rules?: MaterialValidationRules) {
    this.rules = { ...DEFAULT_RULES, ...rules };
  }

  validateProject(project: DesignProject): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (!project.name || project.name.trim().length === 0) {
      errors.push({
        code: 'PROJECT_NAME_EMPTY',
        message: '项目名称不能为空',
        severity: 'error',
      });
    }

    if (project.canvas.elements.length === 0) {
      warnings.push({
        code: 'NO_ELEMENTS',
        message: '画布为空，建议添加内容',
      });
    }

    project.canvas.elements.forEach((el) => {
      const elErrors = this.validateElement(el);
      errors.push(...elErrors.errors);
      warnings.push(...elErrors.warnings);
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  validateElement(element: DesignElement): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (element.width <= 0 || element.height <= 0) {
      errors.push({
        code: 'INVALID_DIMENSIONS',
        message: `元素尺寸无效: ${element.width}x${element.height}`,
        elementId: element.id,
        severity: 'error',
      });
    }

    if (element.x < -10000 || element.y < -10000) {
      warnings.push({
        code: 'ELEMENT_OUT_OF_BOUNDS',
        message: '元素位置超出画布边界',
        elementId: element.id,
      });
    }

    if (element.type === 'text') {
      const textEl = element as TextElement;
      if (textEl.content.length > this.rules.maxTextLength) {
        errors.push({
          code: 'TEXT_TOO_LONG',
          message: `文本长度超过最大限制 (${this.rules.maxTextLength})`,
          elementId: element.id,
          severity: 'error',
        });
      }
      if (textEl.content.trim().length === 0) {
        warnings.push({
          code: 'TEXT_EMPTY',
          message: '文本元素内容为空',
          elementId: element.id,
        });
      }
      if (textEl.style.fontSize < 8) {
        warnings.push({
          code: 'FONT_SIZE_TOO_SMALL',
          message: '字体大小可能过小，不易阅读',
          elementId: element.id,
        });
      }
    }

    if (element.type === 'image') {
      const imgEl = element as ImageElement;
      if (!imgEl.src || imgEl.src.trim().length === 0) {
        errors.push({
          code: 'IMAGE_SRC_EMPTY',
          message: '图片源地址为空',
          elementId: element.id,
          severity: 'error',
        });
      }
      if (this.rules.requireAltText && (!imgEl.alt || imgEl.alt.trim().length === 0)) {
        warnings.push({
          code: 'IMAGE_ALT_MISSING',
          message: '建议为图片添加替代文本',
          elementId: element.id,
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  async validateImageSource(
    src: string
  ): Promise<{ valid: boolean; errors: string[]; info?: { width: number; height: number; size?: number; type?: string } }> {
    const errors: string[] = [];

    if (!src || src.trim().length === 0) {
      return { valid: false, errors: ['图片源地址为空'] };
    }

    if (src.startsWith('data:')) {
      const match = src.match(/^data:([^;]+);base64,/);
      if (match) {
        const mimeType = match[1];
        if (!this.rules.allowedImageFormats.includes(mimeType)) {
          errors.push(`不支持的图片格式: ${mimeType}`);
        }
        const base64Length = src.split(',')[1]?.length || 0;
        const sizeBytes = (base64Length * 3) / 4;
        const sizeMB = sizeBytes / (1024 * 1024);
        if (sizeMB > this.rules.maxImageSizeMB) {
          errors.push(`图片大小超过限制: ${sizeMB.toFixed(2)}MB > ${this.rules.maxImageSizeMB}MB`);
        }
      }
    }

    try {
      const dimensions = await this.getImageDimensions(src);
      if (
        dimensions.width < this.rules.minImageResolution.width ||
        dimensions.height < this.rules.minImageResolution.height
      ) {
        errors.push(
          `图片分辨率低于建议值: ${dimensions.width}x${dimensions.height} < ${this.rules.minImageResolution.width}x${this.rules.minImageResolution.height}`
        );
      }
      return {
        valid: errors.length === 0,
        errors,
        info: dimensions,
      };
    } catch (e) {
      errors.push('无法加载图片');
      return { valid: false, errors };
    }
  }

  private getImageDimensions(src: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = reject;
      img.src = src;
    });
  }

  checkCopyrightCompliance(project: DesignProject): CopyrightTip[] {
    const tips: CopyrightTip[] = [];

    project.canvas.elements.forEach((el) => {
      if (el.type === 'image') {
        const imgEl = el as ImageElement;
        if (imgEl.src.startsWith('http') && !imgEl.src.includes('data:image')) {
          tips.push({
            id: `copy_${el.id}`,
            level: 'warning',
            message: '使用外部图片链接，请确保已获得使用授权',
            suggestion: '建议使用已授权的素材库图片或自行上传',
            elementId: el.id,
          });
        }
      }
      if (el.type === 'illustration') {
        tips.push({
          id: `copy_${el.id}`,
          level: 'info',
          message: '插图素材使用前请确认授权协议',
          suggestion: '查看素材详情中的 license 字段',
          elementId: el.id,
        });
      }
    });

    if (!project.copyrightInfo) {
      tips.push({
        id: 'copy_project',
        level: 'info',
        message: '建议添加项目版权信息',
        suggestion: '设置 copyrightInfo 明确版权归属和使用条款',
      });
    }

    return tips;
  }
}
