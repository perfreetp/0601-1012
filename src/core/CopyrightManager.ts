import { CopyrightInfo, CopyrightTip } from '../types';

const DEFAULT_LICENSES = [
  { id: 'CC0', name: 'CC0 公共领域', url: 'https://creativecommons.org/publicdomain/zero/1.0/', commercial: true, modification: true, attribution: false },
  { id: 'CC_BY', name: 'CC BY 署名', url: 'https://creativecommons.org/licenses/by/4.0/', commercial: true, modification: true, attribution: true },
  { id: 'CC_BY_SA', name: 'CC BY-SA 署名-相同方式共享', url: 'https://creativecommons.org/licenses/by-sa/4.0/', commercial: true, modification: true, attribution: true },
  { id: 'CC_BY_NC', name: 'CC BY-NC 署名-非商业性使用', url: 'https://creativecommons.org/licenses/by-nc/4.0/', commercial: false, modification: true, attribution: true },
  { id: 'MIT', name: 'MIT License', url: 'https://opensource.org/licenses/MIT', commercial: true, modification: true, attribution: true },
  { id: 'Proprietary', name: '专有版权', url: '', commercial: false, modification: false, attribution: true },
];

export class CopyrightManager {
  private tips: CopyrightTip[] = [];
  private listeners: Set<(tips: CopyrightTip[]) => void> = new Set();

  getLicenses() {
    return DEFAULT_LICENSES;
  }

  createCopyrightInfo(
    author?: string,
    licenseId: string = 'CC_BY',
    options?: Partial<CopyrightInfo>
  ): CopyrightInfo {
    const license = DEFAULT_LICENSES.find((l) => l.id === licenseId) || DEFAULT_LICENSES[0];
    return {
      author,
      license: license.name,
      licenseUrl: license.url,
      attributionRequired: license.attribution,
      commercialUseAllowed: license.commercial,
      modificationAllowed: license.modification,
      ...options,
    };
  }

  checkImageCopyright(src: string, elementId?: string): CopyrightTip | null {
    if (!src) return null;

    if (src.startsWith('data:')) {
      return {
        id: `copy_data_${Date.now()}`,
        level: 'info',
        message: '使用 base64 内联图片，请确认版权归属',
        suggestion: '建议使用自有图片或明确授权的素材',
        elementId,
      };
    }

    if (src.includes('unsplash.com')) {
      return {
        id: `copy_unsplash_${Date.now()}`,
        level: 'info',
        message: 'Unsplash 图片遵循 Unsplash License，可免费商用',
        suggestion: '可参考 https://unsplash.com/license 了解详情',
        elementId,
      };
    }

    if (src.includes('pexels.com')) {
      return {
        id: `copy_pexels_${Date.now()}`,
        level: 'info',
        message: 'Pexels 图片遵循 Pexels License，可免费商用',
        suggestion: '可参考 https://www.pexels.com/license/ 了解详情',
        elementId,
      };
    }

    if (src.includes('pixabay.com')) {
      return {
        id: `copy_pixabay_${Date.now()}`,
        level: 'info',
        message: 'Pixabay 图片遵循 Pixabay License，可免费商用',
        suggestion: '可参考 https://pixabay.com/service/license/ 了解详情',
        elementId,
      };
    }

    return {
      id: `copy_external_${Date.now()}`,
      level: 'warning',
      message: '使用外部图片源，请确认已获得合法授权',
      suggestion: '检查图片来源网站的版权政策，必要时获取书面授权',
      elementId,
    };
  }

  addTip(tip: CopyrightTip): void {
    this.tips.push(tip);
    this.notifyListeners();
  }

  clearTips(): void {
    this.tips = [];
    this.notifyListeners();
  }

  getTips(): CopyrightTip[] {
    return [...this.tips];
  }

  getWarnings(): CopyrightTip[] {
    return this.tips.filter((t) => t.level === 'warning' || t.level === 'danger');
  }

  getInfos(): CopyrightTip[] {
    return this.tips.filter((t) => t.level === 'info');
  }

  onTipsChange(listener: (tips: CopyrightTip[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach((l) => {
      try {
        l([...this.tips]);
      } catch (e) {
        console.error(e);
      }
    });
  }

  generateAttributionText(info: CopyrightInfo): string {
    const parts: string[] = [];
    if (info.author) parts.push(`作者: ${info.author}`);
    if (info.license) parts.push(`授权: ${info.license}`);
    if (info.source) parts.push(`来源: ${info.source}`);
    if (info.notice) parts.push(info.notice);
    return parts.join(' | ');
  }

  canUseCommercially(info: CopyrightInfo): boolean {
    return info.commercialUseAllowed;
  }

  canModify(info: CopyrightInfo): boolean {
    return info.modificationAllowed;
  }
}
