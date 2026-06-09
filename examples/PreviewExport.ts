import {
  CreativeDesignSDK,
  ExportOptions,
  ExportFormat,
  DesignProject,
  WatermarkConfig,
  CopyrightTip,
} from '../src';

export interface PreviewExportOptions {
  container: HTMLElement;
  sdk: CreativeDesignSDK;
  onExport?: (url: string, options: ExportOptions) => void;
}

export class PreviewExport {
  private sdk: CreativeDesignSDK;
  private container: HTMLElement;
  private options: PreviewExportOptions;
  private el: HTMLElement | null = null;
  private previewScale: number = 0.5;

  constructor(options: PreviewExportOptions) {
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
      <div class="cd-preview-export" style="font-family:system-ui,sans-serif;background:#fff;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;display:flex;flex-direction:column;height:100%;">
        <div class="cd-header" style="padding:12px 16px;border-bottom:1px solid #e5e7eb;display:flex;align-items:center;justify-content:space-between;">
          <div style="font-weight:600;font-size:16px;color:#1f2937;">预览与导出</div>
          <div style="display:flex;gap:8px;align-items:center;">
            <button id="cd-zoom-out" style="width:32px;height:32px;border:1px solid #d1d5db;background:#fff;border-radius:6px;cursor:pointer;font-size:14px;">−</button>
            <span id="cd-zoom-level" style="font-size:13px;color:#374151;min-width:48px;text-align:center;">50%</span>
            <button id="cd-zoom-in" style="width:32px;height:32px;border:1px solid #d1d5db;background:#fff;border-radius:6px;cursor:pointer;font-size:14px;">+</button>
            <button id="cd-zoom-fit" style="padding:6px 12px;border:1px solid #d1d5db;background:#fff;border-radius:6px;cursor:pointer;font-size:12px;">适应</button>
          </div>
        </div>

        <div class="cd-preview-area" style="flex:1;background:#9ca3af20;padding:24px;overflow:auto;display:flex;align-items:center;justify-content:center;">
          <div id="cd-preview-canvas" style="background:#fff;box-shadow:0 4px 20px rgba(0,0,0,0.1);"></div>
        </div>

        <div class="cd-export-panel" style="padding:16px;border-top:1px solid #e5e7eb;display:flex;flex-direction:column;gap:12px;">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div>
              <div style="font-size:12px;color:#6b7280;margin-bottom:6px;">导出格式</div>
              <select id="cd-export-format" style="width:100%;padding:8px 12px;border:1px solid #d1d5db;border-radius:6px;font-size:14px;">
                <option value="png">PNG (高清)</option>
                <option value="jpg">JPG (压缩)</option>
                <option value="svg">SVG (矢量)</option>
                <option value="pdf">PDF (文档)</option>
              </select>
            </div>
            <div>
              <div style="font-size:12px;color:#6b7280;margin-bottom:6px;">导出质量</div>
              <select id="cd-export-scale" style="width:100%;padding:8px 12px;border:1px solid #d1d5db;border-radius:6px;font-size:14px;">
                <option value="1">1x (标准)</option>
                <option value="2">2x (高清)</option>
                <option value="3">3x (超清)</option>
              </select>
            </div>
          </div>

          <div>
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
              <span style="font-size:12px;color:#6b7280;">添加水印</span>
              <label style="position:relative;display:inline-block;width:40px;height:22px;">
                <input id="cd-watermark-toggle" type="checkbox" style="opacity:0;width:0;height:0;" />
                <span id="cd-watermark-slider" style="position:absolute;cursor:pointer;inset:0;background-color:#d1d5db;border-radius:22px;transition:.3s;">
                  <span id="cd-watermark-dot" style="position:absolute;height:18px;width:18px;left:2px;bottom:2px;background-color:white;border-radius:50%;transition:.3s;"></span>
                </span>
              </label>
            </div>
            <div id="cd-watermark-options" style="display:none;gap:8px;margin-top:8px;">
              <input id="cd-watermark-text" type="text" placeholder="水印文字" value="预览" style="flex:1;padding:6px 10px;border:1px solid #d1d5db;border-radius:6px;font-size:13px;" />
              <select id="cd-watermark-preset" style="padding:6px 10px;border:1px solid #d1d5db;border-radius:6px;font-size:13px;">
                <option value="">自定义</option>
                <option value="copyright">版权</option>
                <option value="draft">草稿</option>
                <option value="preview">预览</option>
                <option value="confidential">机密</option>
              </select>
            </div>
          </div>

          <div id="cd-copyright-tips" style="font-size:12px;color:#f59e0b;display:none;padding:8px 12px;background:#fffbeb;border:1px solid #fde68a;border-radius:6px;"></div>

          <button id="cd-export-btn" style="width:100%;padding:10px 16px;background:#3b82f6;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:14px;font-weight:500;">导出文件</button>
        </div>
      </div>
    `;

    this.el = this.container.querySelector('.cd-preview-export');
    this.sdk.setPreviewContainer(this.container.querySelector('#cd-preview-canvas') as HTMLElement);
    this.sdk.renderPreview(this.previewScale);
    this.checkCopyright();
    this.updateWatermarkUI();

    this.sdk.onPreview(() => {
      this.sdk.renderPreview(this.previewScale);
    });
  }

  private bindEvents(): void {
    const zoomIn = this.container.querySelector('#cd-zoom-in') as HTMLButtonElement;
    const zoomOut = this.container.querySelector('#cd-zoom-out') as HTMLButtonElement;
    const zoomFit = this.container.querySelector('#cd-zoom-fit') as HTMLButtonElement;

    zoomIn.addEventListener('click', () => this.zoom(Math.min(this.previewScale + 0.25, 2)));
    zoomOut.addEventListener('click', () => this.zoom(Math.max(this.previewScale - 0.25, 0.25)));
    zoomFit.addEventListener('click', () => this.zoom(0.5));

    const watermarkToggle = this.container.querySelector('#cd-watermark-toggle') as HTMLInputElement;
    watermarkToggle.addEventListener('change', (e) => {
      const enabled = (e.target as HTMLInputElement).checked;
      this.toggleWatermark(enabled);
    });

    const watermarkText = this.container.querySelector('#cd-watermark-text') as HTMLInputElement;
    watermarkText.addEventListener('input', (e) => {
      this.sdk.setWatermark({ text: (e.target as HTMLInputElement).value });
    });

    const watermarkPreset = this.container.querySelector('#cd-watermark-preset') as HTMLSelectElement;
    watermarkPreset.addEventListener('change', (e) => {
      const value = (e.target as HTMLSelectElement).value as any;
      if (value) {
        this.sdk.applyWatermarkPreset(value);
        this.updateWatermarkUI();
      }
    });

    const exportBtn = this.container.querySelector('#cd-export-btn') as HTMLButtonElement;
    exportBtn.addEventListener('click', () => this.handleExport());
  }

  private zoom(scale: number): void {
    this.previewScale = scale;
    const zoomLevel = this.container.querySelector('#cd-zoom-level') as HTMLElement;
    zoomLevel.textContent = `${Math.round(scale * 100)}%`;
    this.sdk.renderPreview(scale);
  }

  private toggleWatermark(enabled: boolean): void {
    const options = this.container.querySelector('#cd-watermark-options') as HTMLElement;
    const slider = this.container.querySelector('#cd-watermark-slider') as HTMLElement;
    const dot = this.container.querySelector('#cd-watermark-dot') as HTMLElement;

    if (enabled) {
      options.style.display = 'flex';
      slider.style.backgroundColor = '#3b82f6';
      dot.style.transform = 'translateX(18px)';
      this.sdk.watermark.enable();
    } else {
      options.style.display = 'none';
      slider.style.backgroundColor = '#d1d5db';
      dot.style.transform = 'translateX(0)';
      this.sdk.watermark.disable();
    }
    this.sdk.renderPreview(this.previewScale);
  }

  private updateWatermarkUI(): void {
    const wm = this.sdk.getWatermark();
    const toggle = this.container.querySelector('#cd-watermark-toggle') as HTMLInputElement;
    const text = this.container.querySelector('#cd-watermark-text') as HTMLInputElement;

    toggle.checked = wm.enabled;
    text.value = wm.text || '';
    this.toggleWatermark(wm.enabled);
  }

  private checkCopyright(): void {
    const tips = this.sdk.checkCopyright();
    const container = this.container.querySelector('#cd-copyright-tips') as HTMLElement;
    if (tips.length > 0) {
      container.style.display = 'block';
      container.innerHTML = tips.map((t) => `⚠️ ${t.message}`).join('<br/>');
    }
  }

  private async handleExport(): Promise<void> {
    const format = (this.container.querySelector('#cd-export-format') as HTMLSelectElement).value as ExportFormat;
    const scale = parseFloat((this.container.querySelector('#cd-export-scale') as HTMLSelectElement).value);

    const exportOptions: ExportOptions = {
      format,
      scale,
      includeWatermark: true,
      quality: 0.92,
    };

    try {
      const url = await this.sdk.export(exportOptions);
      if (this.options.onExport) {
        this.options.onExport(url, exportOptions);
      }
    } catch (e) {
      alert('导出失败: ' + (e instanceof Error ? e.message : String(e)));
    }
  }

  destroy(): void {
    if (this.el) {
      this.el.remove();
    }
  }
}
