import {
  CreativeDesignSDK,
  IllustrationAsset,
  ImageElement,
  DesignElement,
} from '../src';
import { createImageElement, generateElementId } from '../src/utils';

export interface MaterialSelectorOptions {
  container: HTMLElement;
  sdk: CreativeDesignSDK;
  onMaterialSelect?: (element: DesignElement) => void;
}

export type MaterialTab = 'illustration' | 'image' | 'shape' | 'icon';

export class MaterialSelector {
  private sdk: CreativeDesignSDK;
  private container: HTMLElement;
  private options: MaterialSelectorOptions;
  private activeTab: MaterialTab = 'illustration';
  private selectorEl: HTMLElement | null = null;

  constructor(options: MaterialSelectorOptions) {
    this.sdk = options.sdk;
    this.container = options.container;
    this.options = options;
  }

  init(): void {
    this.render();
    this.bindEvents();
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="cd-material-selector" style="font-family:system-ui,sans-serif;background:#fff;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
        <div class="cd-tabs" style="display:flex;border-bottom:1px solid #e5e7eb;">
          <button class="cd-tab-btn" data-tab="illustration" style="flex:1;padding:12px;border:none;background:none;cursor:pointer;font-size:14px;color:#6b7280;border-bottom:2px solid transparent;transition:all .2s;">插图库</button>
          <button class="cd-tab-btn" data-tab="image" style="flex:1;padding:12px;border:none;background:none;cursor:pointer;font-size:14px;color:#6b7280;border-bottom:2px solid transparent;transition:all .2s;">上传图片</button>
          <button class="cd-tab-btn" data-tab="shape" style="flex:1;padding:12px;border:none;background:none;cursor:pointer;font-size:14px;color:#6b7280;border-bottom:2px solid transparent;transition:all .2s;">形状</button>
          <button class="cd-tab-btn" data-tab="icon" style="flex:1;padding:12px;border:none;background:none;cursor:pointer;font-size:14px;color:#6b7280;border-bottom:2px solid transparent;transition:all .2s;">图标</button>
        </div>

        <div class="cd-tab-content" style="padding:16px;max-height:500px;overflow-y:auto;">
          <div id="cd-material-search" style="margin-bottom:12px;">
            <input id="cd-search-input" type="text" placeholder="搜索素材..." style="width:100%;padding:8px 12px;border:1px solid #d1d5db;border-radius:6px;font-size:14px;box-sizing:border-box;" />
          </div>

          <div id="cd-categories" style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px;"></div>

          <div id="cd-material-grid" style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;"></div>
        </div>
      </div>
    `;

    this.selectorEl = this.container.querySelector('.cd-material-selector');
    this.setActiveTab('illustration');
  }

  private setActiveTab(tab: MaterialTab): void {
    this.activeTab = tab;

    this.container.querySelectorAll('.cd-tab-btn').forEach((btn) => {
      const btnEl =btn as HTMLElement;
      if (btnEl.dataset.tab === tab) {
        btnEl.style.color = '#3b82f6';
        btnEl.style.borderBottomColor = '#3b82f6';
      } else {
        btnEl.style.color = '#6b7280';
        btnEl.style.borderBottomColor = 'transparent';
      }
    });

    this.renderCategories();
    this.renderMaterialGrid();
  }

  private renderCategories(): void {
    const container = this.container.querySelector('#cd-categories') as HTMLElement;
    let categories: string[] = [];

    if (this.activeTab === 'illustration') {
      categories = this.sdk.illustrations.getCategories();
    } else if (this.activeTab === 'shape') {
      categories = ['全部', '矩形', '圆形', '三角形', '线条'];
    } else {
      categories = ['全部'];
    }

    container.innerHTML = categories
      .map(
        (cat) => `
        <button class="cd-cat-btn" data-cat="${cat}" style="padding:4px 10px;border:1px solid #e5e7eb;background:#fff;border-radius:999px;cursor:pointer;font-size:12px;color:#374151;">${cat}</button>
      `
      )
      .join('');

    container.querySelectorAll('.cd-cat-btn').forEach((el) => {
      el.addEventListener('click', () => {
        this.renderMaterialGrid((el as HTMLElement).dataset.cat);
      });
    });
  }

  private renderMaterialGrid(category?: string): void {
    const container = this.container.querySelector('#cd-material-grid') as HTMLElement;

    if (this.activeTab === 'illustration') {
      this.renderIllustrations(container, category);
    } else if (this.activeTab === 'image') {
      this.renderImageUpload(container);
    } else if (this.activeTab === 'shape') {
      this.renderShapes(container, category);
    } else if (this.activeTab === 'icon') {
      this.renderIcons(container);
    }
  }

  private renderIllustrations(container: HTMLElement, category?: string): void {
    let illustrations: IllustrationAsset[];

    if (category && category !== '全部') {
      illustrations = this.sdk.illustrations.listByCategory(category);
    } else {
      illustrations = this.sdk.illustrations.listAll();
    }

    container.innerHTML = illustrations
      .map(
        (ill) => `
        <div class="cd-material-item" data-type="illustration" data-id="${ill.id}" data-name="${ill.name}" style="aspect-ratio:1;border:1px solid #e5e7eb;border-radius:8px;padding:8px;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#f9fafb;transition:all .2s;">
          <div style="width:60%;height:60%;background:linear-gradient(135deg,#dbeafe,#bfdbfe);border-radius:8px;margin-bottom:6px;display:flex;align-items:center;justify-content:center;font-size:24px;color:#3b82f6;">🎨</div>
          <div style="font-size:11px;color:#374151;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;width:100%;">${ill.name}</div>
        </div>
      `
      )
      .join('');

    container.querySelectorAll('.cd-material-item').forEach((el) => {
      el.addEventListener('click', () => {
        const id = (el as HTMLElement).dataset.id as string;
        this.selectIllustration(id);
      });
    });
  }

  private renderImageUpload(container: HTMLElement): void {
    container.innerHTML = `
      <div id="cd-upload-area" style="grid-column:span 4;padding:32px;border:2px dashed #d1d5db;border-radius:8px;text-align:center;cursor:pointer;background:#fafafa;">
        <div style="font-size:36px;margin-bottom:8px;">📷</div>
        <div style="font-size:14px;color:#374151;margin-bottom:4px;">点击或拖拽上传图片</div>
        <div style="font-size:12px;color:#9ca3af;">支持 PNG、JPG、WEBP、SVG 格式</div>
        <input id="cd-image-input" type="file" accept="image/*" style="display:none;" />
      </div>
      <div style="grid-column:span 4;font-size:12px;color:#6b7280;margin-top:8px;font-weight:600;">示例素材</div>
      ${this.getSampleImages()}
    `;

    const uploadArea = container.querySelector('#cd-upload-area');
    const fileInput = container.querySelector('#cd-image-input') as HTMLInputElement;

    uploadArea?.addEventListener('click', () => fileInput.click());

    fileInput?.addEventListener('change', (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) this.handleImageUpload(file);
    });

    container.querySelectorAll('.cd-material-item').forEach((el) => {
      el.addEventListener('click', () => {
        const src = (el as HTMLElement).dataset.src as string;
        this.selectImage(src);
      });
    });
  }

  private getSampleImages(): string {
    const samples = [
      { src: '', name: '风景图', emoji: '🌄' },
      { src: '', name: '人物图', emoji: '👤' },
      { src: '', name: '教育图', emoji: '📚' },
      { src: '', name: '科技图', emoji: '💻' },
    ];
    return samples
      .map(
        (s) => `
        <div class="cd-material-item" data-type="image" data-src="${s.src}" style="aspect-ratio:1;border:1px solid #e5e7eb;border-radius:8px;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#f9fafb;cursor:pointer;">
          <div style="font-size:32px;">${s.emoji}</div>
          <div style="font-size:11px;color:#374151;margin-top:4px;">${s.name}</div>
        </div>
      `
      )
      .join('');
  }

  private renderShapes(container: HTMLElement, category?: string): void {
    const shapes = [
      { type: 'rectangle', name: '矩形', emoji: '⬜', cat: '矩形' },
      { type: 'circle', name: '圆形', emoji: '⚪', cat: '圆形' },
      { type: 'triangle', name: '三角形', emoji: '🔺', cat: '三角形' },
      { type: 'line', name: '线条', emoji: '➖', cat: '线条' },
      { type: 'arrow', name: '箭头', emoji: '➡️', cat: '线条' },
    ];

    const filtered = category && category !== '全部' ? shapes.filter((s) => s.cat === category) : shapes;

    container.innerHTML = filtered
      .map(
        (s) => `
        <div class="cd-material-item" data-type="shape" data-shape="${s.type}" style="aspect-ratio:1;border:1px solid #e5e7eb;border-radius:8px;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#f9fafb;cursor:pointer;">
          <div style="font-size:32px;">${s.emoji}</div>
          <div style="font-size:11px;color:#374151;margin-top:4px;">${s.name}</div>
        </div>
      `
      )
      .join('');

    container.querySelectorAll('.cd-material-item').forEach((el) => {
      el.addEventListener('click', () => {
        const shape = (el as HTMLElement).dataset.shape as string;
        this.selectShape(shape as any);
      });
    });
  }

  private renderIcons(container: HTMLElement): void {
    const icons = [
      { name: '学习', emoji: '📖' },
      { name: '思考', emoji: '💡' },
      { name: '奖杯', emoji: '🏆' },
      { name: '星星', emoji: '⭐' },
      { name: '目标', emoji: '🎯' },
      { name: '进度', emoji: '📊' },
      { name: '时钟', emoji: '⏰' },
      { name: '用户', emoji: '👤' },
    ];

    container.innerHTML = icons
      .map(
        (i) => `
        <div class="cd-material-item" data-type="icon" data-name="${i.name}" style="aspect-ratio:1;border:1px solid #e5e7eb;border-radius:8px;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#f9fafb;cursor:pointer;">
          <div style="font-size:32px;">${i.emoji}</div>
          <div style="font-size:11px;color:#374151;margin-top:4px;">${i.name}</div>
        </div>
      `
      )
      .join('');

    container.querySelectorAll('.cd-material-item').forEach((el) => {
      el.addEventListener('click', () => {
        const name = (el as HTMLElement).dataset.name as string;
        alert(`已选择图标: ${name}\n（图标功能需要配合图标库扩展使用`);
      });
    });
  }

  private bindEvents(): void {
    this.container.querySelectorAll('.cd-tab-btn').forEach((el) => {
      el.addEventListener('click', () => {
        this.setActiveTab((el as HTMLElement).dataset.tab as MaterialTab);
      });
    });

    const searchInput = this.container.querySelector('#cd-search-input') as HTMLInputElement;
    searchInput?.addEventListener('input', (e) => {
      const keyword = (e.target as HTMLInputElement).value;
      if (this.activeTab === 'illustration') {
        const container = this.container.querySelector('#cd-material-grid') as HTMLElement;
        const results = this.sdk.illustrations.search(keyword);
        if (keyword) {
          this.renderSearchResults(container, results);
        } else {
          this.renderMaterialGrid();
        }
      }
    });
  }

  private renderSearchResults(container: HTMLElement, results: IllustrationAsset[]): void {
    if (results.length === 0) {
      container.innerHTML = '<div style="grid-column:span 4;text-align:center;padding:32px;color:#9ca3af;">未找到匹配的素材</div>';
      return;
    }
    this.renderIllustrations(container);
  }

  private handleImageUpload(file: File): void {
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      this.selectImage(src);
    };
    reader.readAsDataURL(file);
  }

  private selectIllustration(assetId: string): void {
    const theme = this.sdk.getTheme();
    const size = this.sdk.getCanvasSize();
    if (!size) return;

    const element = this.sdk.illustrations.createIllustrationElement(
      assetId,
      size.width * 0.3,
      size.height * 0.3,
      200,
      200
    );

    if (element) {
      this.sdk.addElement(element);
      if (this.options.onMaterialSelect) {
        this.options.onMaterialSelect(element);
      }
    }
  }

  private selectImage(src: string): void {
    const size = this.sdk.getCanvasSize();
    if (!size) return;

    const element = createImageElement(
      src || this.getPlaceholderImage(),
      size.width * 0.2,
      size.height * 0.2,
      300,
      200
    );

    this.sdk.addElement(element);
    if (this.options.onMaterialSelect) {
      this.options.onMaterialSelect(element);
    }
  }

  private selectShape(shape: 'rectangle' | 'circle' | 'triangle' | 'line' | 'arrow'): void {
    const theme = this.sdk.getTheme();
    const size = this.sdk.getCanvasSize();
    if (!size) return;

    const element: any = {
      id: generateElementId('shape'),
      type: 'shape',
      shape,
      x: size.width * 0.3,
      y: size.height * 0.3,
      width: 150,
      height: 150,
      fill: theme?.primary || '#3b82f6',
      zIndex: 1,
    };

    this.sdk.addElement(element);
    if (this.options.onMaterialSelect) {
      this.options.onMaterialSelect(element);
    }
  }

  private getPlaceholderImage(): string {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="#e5e7eb"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#9ca3af" font-family="system-ui" font-size="20">示例图片</text></svg>`;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  destroy(): void {
    if (this.selectorEl) {
      this.selectorEl.remove();
    }
  }
}
