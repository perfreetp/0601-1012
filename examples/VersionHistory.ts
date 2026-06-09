import {
  CreativeDesignSDK,
  DesignVersion,
} from '../src';

export interface VersionHistoryOptions {
  container: HTMLElement;
  sdk: CreativeDesignSDK;
  onVersionRestored?: (version: DesignVersion) => void;
  onVersionCreated?: (version: DesignVersion) => void;
}

export class VersionHistory {
  private sdk: CreativeDesignSDK;
  private container: HTMLElement;
  private options: VersionHistoryOptions;
  private el: HTMLElement | null = null;

  constructor(options: VersionHistoryOptions) {
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
      <div class="cd-version-history" style="font-family:system-ui,sans-serif;background:#fff;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;height:100%;display:flex;flex-direction:column;">
        <div class="cd-header" style="padding:12px 16px;border-bottom:1px solid #e5e7eb;display:flex;align-items:center;justify-content:space-between;">
          <div style="font-weight:600;font-size:16px;color:#1f2937;">历史版本</div>
          <button id="cd-save-version-btn" style="padding:6px 12px;background:#3b82f6;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px;">保存新版本</button>
        </div>

        <div class="cd-save-form" id="cd-save-form" style="display:none;padding:12px 16px;border-bottom:1px solid #e5e7eb;background:#f9fafb;">
          <input id="cd-version-desc" type="text" placeholder="版本说明（选填）" style="width:100%;padding:8px 12px;border:1px solid #d1d5db;border-radius:6px;font-size:14px;margin-bottom:8px;box-sizing:border-box;" />
          <div style="display:flex;gap:8px;justify-content:flex-end;">
            <button id="cd-cancel-save" style="padding:6px 12px;border:1px solid #d1d5db;background:#fff;border-radius:6px;cursor:pointer;font-size:13px;">取消</button>
            <button id="cd-confirm-save" style="padding:6px 12px;background:#3b82f6;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px;">确认保存</button>
          </div>
        </div>

        <div class="cd-version-list" id="cd-version-list" style="flex:1;overflow-y:auto;padding:8px;"></div>
      </div>
    `;

    this.el = this.container.querySelector('.cd-version-history');
    this.renderVersionList();
  }

  private renderVersionList(): void {
    const list = this.container.querySelector('#cd-version-list') as HTMLElement;
    const versions = this.sdk.listVersions();

    if (versions.length === 0) {
      list.innerHTML = `
        <div style="padding:32px 16px;text-align:center;color:#9ca3af;">
          <div style="font-size:36px;margin-bottom:8px;">📜</div>
          <div style="font-size:14px;">暂无历史版本</div>
          <div style="font-size:12px;margin-top:4px;">点击上方按钮保存第一个版本</div>
        </div>
      `;
      return;
    }

    list.innerHTML = versions
      .map(
        (v, idx) => `
        <div class="cd-version-item" data-id="${v.id}" style="padding:12px;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:8px;cursor:pointer;transition:all .2s;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="font-weight:600;font-size:14px;color:#1f2937;">版本 ${v.version}</span>
              ${idx === 0 ? '<span style="padding:2px 8px;background:#dcfce7;color:#166534;border-radius:999px;font-size:11px;">当前</span>' : ''}
            </div>
            <div style="font-size:12px;color:#9ca3af;">${this.formatDate(v.createdAt)}</div>
          </div>
          ${v.description ? `<div style="font-size:13px;color:#6b7280;margin-bottom:8px;">${v.description}</div>` : ''}
          <div style="display:flex;gap:6px;">
            <button class="cd-restore-btn" data-id="${v.id}" style="padding:4px 10px;border:1px solid #d1d5db;background:#fff;border-radius:6px;cursor:pointer;font-size:12px;color:#374151;">恢复</button>
            <button class="cd-delete-btn" data-id="${v.id}" style="padding:4px 10px;border:1px solid #fecaca;background:#fff;color:#dc2626;border-radius:6px;cursor:pointer;font-size:12px;">删除</button>
          </div>
        </div>
      `
      )
      .join('');

    list.querySelectorAll('.cd-restore-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = (btn as HTMLElement).dataset.id as string;
        this.restoreVersion(id);
      });
    });

    list.querySelectorAll('.cd-delete-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = (btn as HTMLElement).dataset.id as string;
        this.deleteVersion(id);
      });
    });

    list.querySelectorAll('.cd-version-item').forEach((el) => {
      el.addEventListener('click', () => {
        this.highlightVersion((el as HTMLElement).dataset.id as string);
      });
    });
  }

  private highlightVersion(versionId: string): void {
    this.container.querySelectorAll('.cd-version-item').forEach((el) => {
      const item = el as HTMLElement;
      if (item.dataset.id === versionId) {
        item.style.borderColor = '#3b82f6';
        item.style.backgroundColor = '#eff6ff';
      } else {
        item.style.borderColor = '#e5e7eb';
        item.style.backgroundColor = '#fff';
      }
    });
  }

  private bindEvents(): void {
    const saveBtn = this.container.querySelector('#cd-save-version-btn') as HTMLButtonElement;
    const saveForm = this.container.querySelector('#cd-save-form') as HTMLElement;
    const cancelBtn = this.container.querySelector('#cd-cancel-save') as HTMLButtonElement;
    const confirmBtn = this.container.querySelector('#cd-confirm-save') as HTMLButtonElement;

    saveBtn.addEventListener('click', () => {
      saveForm.style.display = saveForm.style.display === 'none' ? 'block' : 'none';
    });

    cancelBtn.addEventListener('click', () => {
      saveForm.style.display = 'none';
      (this.container.querySelector('#cd-version-desc') as HTMLInputElement).value = '';
    });

    confirmBtn.addEventListener('click', () => {
      const description = (this.container.querySelector('#cd-version-desc') as HTMLInputElement).value;
      this.saveVersion(description);
      saveForm.style.display = 'none';
      (this.container.querySelector('#cd-version-desc') as HTMLInputElement).value = '';
    });
  }

  private saveVersion(description?: string): void {
    const version = this.sdk.saveVersion(description);
    if (version) {
      this.renderVersionList();
      if (this.options.onVersionCreated) {
        this.options.onVersionCreated(version);
      }
    }
  }

  private restoreVersion(versionId: string): void {
    const version = this.sdk.getVersion(versionId);
    if (!version) return;

    if (confirm(`确定要恢复到「版本 ${version.version}」吗？\n当前未保存的修改将会丢失。`)) {
      const restored = this.sdk.restoreVersion(versionId);
      if (restored) {
        this.renderVersionList();
        if (this.options.onVersionRestored) {
          this.options.onVersionRestored(version);
        }
      }
    }
  }

  private deleteVersion(versionId: string): void {
    if (confirm('确定要删除该版本吗？此操作不可恢复。')) {
      const deleted = this.sdk.deleteVersion(versionId);
      if (deleted) {
        this.renderVersionList();
      }
    }
  }

  private formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins} 分钟前`;
    if (diffHours < 24) return `${diffHours} 小时前`;
    if (diffDays < 7) return `${diffDays} 天前`;

    return date.toLocaleDateString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  refresh(): void {
    this.renderVersionList();
  }

  destroy(): void {
    if (this.el) {
      this.el.remove();
    }
  }
}
