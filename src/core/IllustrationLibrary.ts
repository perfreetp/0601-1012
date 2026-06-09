import { IllustrationAsset, IllustrationElement } from '../types';
import { generateElementId, generateId } from '../utils';

const defaultIllustrations: IllustrationAsset[] = [
  {
    id: 'ill_edu_001',
    name: '读书学习',
    category: 'education',
    tags: ['学习', '读书', '教育'],
    svgUrl: '',
    previewUrl: '',
    author: 'Creative Design',
    license: 'MIT',
  },
  {
    id: 'ill_edu_002',
    name: '在线课堂',
    category: 'education',
    tags: ['在线', '课堂', '视频'],
    svgUrl: '',
    previewUrl: '',
    author: 'Creative Design',
    license: 'MIT',
  },
  {
    id: 'ill_edu_003',
    name: '思考问题',
    category: 'education',
    tags: ['思考', '问号', '创意'],
    svgUrl: '',
    previewUrl: '',
    author: 'Creative Design',
    license: 'MIT',
  },
  {
    id: 'ill_edu_004',
    name: '考试测评',
    category: 'education',
    tags: ['考试', '测评', '试卷'],
    svgUrl: '',
    previewUrl: '',
    author: 'Creative Design',
    license: 'MIT',
  },
  {
    id: 'ill_edu_005',
    name: '毕业证书',
    category: 'education',
    tags: ['毕业', '证书', '成就'],
    svgUrl: '',
    previewUrl: '',
    author: 'Creative Design',
    license: 'MIT',
  },
  {
    id: 'ill_sci_001',
    name: '科学实验',
    category: 'science',
    tags: ['科学', '实验', '试管'],
    svgUrl: '',
    previewUrl: '',
    author: 'Creative Design',
    license: 'MIT',
  },
  {
    id: 'ill_sci_002',
    name: '数学公式',
    category: 'science',
    tags: ['数学', '公式', '几何'],
    svgUrl: '',
    previewUrl: '',
    author: 'Creative Design',
    license: 'MIT',
  },
  {
    id: 'ill_char_001',
    name: '学生头像',
    category: 'character',
    tags: ['学生', '头像', '人物'],
    svgUrl: '',
    previewUrl: '',
    author: 'Creative Design',
    license: 'MIT',
  },
  {
    id: 'ill_char_002',
    name: '教师形象',
    category: 'character',
    tags: ['教师', '人物', '教学'],
    svgUrl: '',
    previewUrl: '',
    author: 'Creative Design',
    license: 'MIT',
  },
  {
    id: 'ill_icon_001',
    name: '灯泡创意',
    category: 'icon',
    tags: ['灯泡', '创意', '灵感'],
    svgUrl: '',
    previewUrl: '',
    author: 'Creative Design',
    license: 'MIT',
  },
  {
    id: 'ill_icon_002',
    name: '奖杯荣誉',
    category: 'icon',
    tags: ['奖杯', '荣誉', '胜利'],
    svgUrl: '',
    previewUrl: '',
    author: 'Creative Design',
    license: 'MIT',
  },
  {
    id: 'ill_icon_003',
    name: '书籍知识',
    category: 'icon',
    tags: ['书籍', '知识', '阅读'],
    svgUrl: '',
    previewUrl: '',
    author: 'Creative Design',
    license: 'MIT',
  },
  {
    id: 'ill_bg_001',
    name: '波浪背景',
    category: 'background',
    tags: ['波浪', '背景', '装饰'],
    svgUrl: '',
    previewUrl: '',
    author: 'Creative Design',
    license: 'MIT',
  },
  {
    id: 'ill_bg_002',
    name: '几何装饰',
    category: 'background',
    tags: ['几何', '装饰', '抽象'],
    svgUrl: '',
    previewUrl: '',
    author: 'Creative Design',
    license: 'MIT',
  },
];

export class IllustrationLibrary {
  private assets: Map<string, IllustrationAsset> = new Map();
  private categories: Set<string> = new Set();

  constructor() {
    defaultIllustrations.forEach((ill) => {
      this.assets.set(ill.id, ill);
      this.categories.add(ill.category);
    });
  }

  listAll(): IllustrationAsset[] {
    return Array.from(this.assets.values());
  }

  listByCategory(category: string): IllustrationAsset[] {
    return this.listAll().filter((ill) => ill.category === category);
  }

  search(keyword: string): IllustrationAsset[] {
    const kw = keyword.toLowerCase();
    return this.listAll().filter(
      (ill) =>
        ill.name.toLowerCase().includes(kw) ||
        ill.category.toLowerCase().includes(kw) ||
        ill.tags.some((t) => t.toLowerCase().includes(kw))
    );
  }

  getCategories(): string[] {
    return Array.from(this.categories);
  }

  getAsset(id: string): IllustrationAsset | undefined {
    return this.assets.get(id);
  }

  addAsset(asset: Omit<IllustrationAsset, 'id'>): IllustrationAsset {
    const newAsset: IllustrationAsset = {
      ...asset,
      id: generateId('ill'),
    };
    this.assets.set(newAsset.id, newAsset);
    this.categories.add(newAsset.category);
    return newAsset;
  }

  createIllustrationElement(
    assetId: string,
    x: number,
    y: number,
    width: number,
    height: number,
    colorOverride?: Record<string, string>
  ): IllustrationElement | null {
    const asset = this.assets.get(assetId);
    if (!asset) return null;

    return {
      id: generateElementId('illustration'),
      type: 'illustration',
      x,
      y,
      width,
      height,
      assetId,
      svgUrl: asset.svgUrl,
      colorOverride,
      zIndex: 1,
    };
  }

  overrideColors(
    element: IllustrationElement,
    colorOverride: Record<string, string>
  ): IllustrationElement {
    return {
      ...element,
      colorOverride: { ...element.colorOverride, ...colorOverride },
    };
  }
}
