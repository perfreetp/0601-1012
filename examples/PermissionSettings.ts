import {
  CreativeDesignSDK,
  Collaborator,
  CollaboratorRole,
  Permission,
} from '../src';

export interface PermissionSettingsOptions {
  container: HTMLElement;
  sdk: CreativeDesignSDK;
  onPermissionChange?: (role: CollaboratorRole, permissions: Permission) => void;
  onCollaboratorChange?: (collaborators: Collaborator[]) => void;
}

export class PermissionSettings {
  private sdk: CreativeDesignSDK;
  private container: HTMLElement;
  private options: PermissionSettingsOptions;
  private el: HTMLElement | null = null;

  constructor(options: PermissionSettingsOptions) {
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
      <div class="cd-permission-settings" style="font-family:system-ui,sans-serif;background:#fff;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;height:100%;display:flex;flex-direction:column;">
        <div class="cd-header" style="padding:12px 16px;border-bottom:1px solid #e5e7eb;">
          <div style="font-weight:600;font-size:16px;color:#1f2937;">权限与协作者</div>
        </div>

        <div class="cd-add-collaborator" style="padding:12px 16px;border-bottom:1px solid #e5e7eb;background:#f9fafb;">
          <div style="font-size:13px;color:#6b7280;margin-bottom:8px;">添加协作者</div>
          <div style="display:flex;gap:8px;">
            <input id="cd-collab-name" type="text" placeholder="协作者姓名" style="flex:1;padding:8px 12px;border:1px solid #d1d5db;border-radius:6px;font-size:14px;box-sizing:border-box;" />
            <select id="cd-collab-role" style="padding:8px 12px;border:1px solid #d1d5db;border-radius:6px;font-size:14px;">
              <option value="viewer">查看者</option>
              <option value="commenter">评论者</option>
              <option value="editor">编辑者</option>
              <option value="owner">所有者</option>
            </select>
            <button id="cd-add-collab-btn" style="padding:8px 16px;background:#3b82f6;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:14px;">添加</button>
          </div>
        </div>

        <div class="cd-permission-matrix" style="padding:12px 16px;border-bottom:1px solid #e5e7eb;">
          <div style="font-size:13px;color:#6b7280;margin-bottom:8px;">权限说明</div>
          <table style="width:100%;font-size:12px;border-collapse:collapse;">
            <thead>
              <tr style="background:#f9fafb;">
                <th style="padding:6px;text-align:left;border-bottom:1px solid #e5e7eb;color:#374151;">权限</th>
                <th style="padding:6px;text-align:center;border-bottom:1px solid #e5e7eb;color:#374151;">查看者</th>
                <th style="padding:6px;text-align:center;border-bottom:1px solid #e5e7eb;color:#374151;">评论者</th>
                <th style="padding:6px;text-align:center;border-bottom:1px solid #e5e7eb;color:#374151;">编辑者</th>
                <th style="padding:6px;text-align:center;border-bottom:1px solid #e5e7eb;color:#374151;">所有者</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding:6px;border-bottom:1px solid #f3f4f6;color:#374151;">查看内容</td>
                <td style="padding:6px;text-align:center;border-bottom:1px solid #f3f4f6;">✅</td>
                <td style="padding:6px;text-align:center;border-bottom:1px solid #f3f4f6;">✅</td>
                <td style="padding:6px;text-align:center;border-bottom:1px solid #f3f4f6;">✅</td>
                <td style="padding:6px;text-align:center;border-bottom:1px solid #f3f4f6;">✅</td>
              </tr>
              <tr>
                <td style="padding:6px;border-bottom:1px solid #f3f4f6;color:#374151;">编辑内容</td>
                <td style="padding:6px;text-align:center;border-bottom:1px solid #f3f4f6;">❌</td>
                <td style="padding:6px;text-align:center;border-bottom:1px solid #f3f4f6;">❌</td>
                <td style="padding:6px;text-align:center;border-bottom:1px solid #f3f4f6;">✅</td>
                <td style="padding:6px;text-align:center;border-bottom:1px solid #f3f4f6;">✅</td>
              </tr>
              <tr>
                <td style="padding:6px;border-bottom:1px solid #f3f4f6;color:#374151;">导出文件</td>
                <td style="padding:6px;text-align:center;border-bottom:1px solid #f3f4f6;">❌</td>
                <td style="padding:6px;text-align:center;border-bottom:1px solid #f3f4f6;">✅</td>
                <td style="padding:6px;text-align:center;border-bottom:1px solid #f3f4f6;">✅</td>
                <td style="padding:6px;text-align:center;border-bottom:1px solid #f3f4f6;">✅</td>
              </tr>
              <tr>
                <td style="padding:6px;border-bottom:1px solid #f3f4f6;color:#374151;">管理版本</td>
                <td style="padding:6px;text-align:center;border-bottom:1px solid #f3f4f6;">❌</td>
                <td style="padding:6px;text-align:center;border-bottom:1px solid #f3f4f6;">❌</td>
                <td style="padding:6px;text-align:center;border-bottom:1px solid #f3f4f6;">✅</td>
                <td style="padding:6px;text-align:center;border-bottom:1px solid #f3f4f6;">✅</td>
              </tr>
              <tr>
                <td style="padding:6px;color:#374151;">管理协作者</td>
                <td style="padding:6px;text-align:center;">❌</td>
                <td style="padding:6px;text-align:center;">❌</td>
                <td style="padding:6px;text-align:center;">❌</td>
                <td style="padding:6px;text-align:center;">✅</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="cd-collaborator-list" style="flex:1;overflow-y:auto;padding:12px 16px;">
          <div style="font-size:13px;color:#6b7280;margin-bottom:8px;">协作者列表</div>
          <div id="cd-collab-list"></div>
        </div>

        <div class="cd-current-permissions" style="padding:12px 16px;border-top:1px solid #e5e7eb;background:#f9fafb;">
          <div style="font-size:12px;color:#6b7280;margin-bottom:4px;">当前用户权限</div>
          <div id="cd-current-role" style="font-size:14px;font-weight:600;color:#1f2937;"></div>
        </div>
      </div>
    `;

    this.el = this.container.querySelector('.cd-permission-settings');
    this.renderCollaboratorList();
    this.updateCurrentRole();
  }

  private renderCollaboratorList(): void {
    const list = this.container.querySelector('#cd-collab-list') as HTMLElement;
    const collaborators = this.sdk.getCollaborators();
    const currentUserId = this.sdk.getCurrentUserId();
    const canManage = this.sdk.hasPermission('canManageCollaborators');

    if (collaborators.length === 0) {
      list.innerHTML = `
        <div style="padding:16px;text-align:center;color:#9ca3af;font-size:13px;">
          暂无协作者
        </div>
      `;
      return;
    }

    const roleLabels: Record<CollaboratorRole, string> = {
      owner: '所有者',
      editor: '编辑者',
      commenter: '评论者',
      viewer: '查看者',
    };

    list.innerHTML = collaborators
      .map(
        (c) => `
        <div class="cd-collab-item" data-id="${c.id}" style="display:flex;align-items:center;padding:10px;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:8px;">
          <div style="width:36px;height:36px;background:${c.color};border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:600;font-size:14px;margin-right:10px;">
            ${c.name.charAt(0).toUpperCase()}
          </div>
          <div style="flex:1;">
            <div style="font-size:14px;color:#1f2937;font-weight:500;">${c.name}${c.id === currentUserId ? ' (我)' : ''}</div>
            <div style="font-size:12px;color:#6b7280;">${this.formatDate(c.joinedAt)} 加入</div>
          </div>
          <select class="cd-collab-role-select" data-id="${c.id}" ${!canManage || c.role === 'owner' ? 'disabled' : ''} style="padding:4px 8px;border:1px solid #d1d5db;border-radius:6px;font-size:13px;margin-right:8px;">
            <option value="viewer" ${c.role === 'viewer' ? 'selected' : ''}>查看者</option>
            <option value="commenter" ${c.role === 'commenter' ? 'selected' : ''}>评论者</option>
            <option value="editor" ${c.role === 'editor' ? 'selected' : ''}>编辑者</option>
            <option value="owner" ${c.role === 'owner' ? 'selected' : ''}>所有者</option>
          </select>
          ${c.role !== 'owner' && canManage ? `<button class="cd-remove-collab" data-id="${c.id}" style="padding:4px 8px;border:1px solid #fecaca;background:#fef2f2;color:#dc2626;border-radius:6px;cursor:pointer;font-size:12px;">移除</button>` : ''}
        </div>
      `
      )
      .join('');

    list.querySelectorAll('.cd-collab-role-select').forEach((el) => {
      el.addEventListener('change', (e) => {
        const id = (el as HTMLElement).dataset.id as string;
        const role = (e.target as HTMLSelectElement).value as CollaboratorRole;
        this.updateCollaboratorRole(id, role);
      });
    });

    list.querySelectorAll('.cd-remove-collab').forEach((el) => {
      el.addEventListener('click', () => {
        const id = (el as HTMLElement).dataset.id as string;
        this.removeCollaborator(id);
      });
    });
  }

  private updateCurrentRole(): void {
    const container = this.container.querySelector('#cd-current-role') as HTMLElement;
    const permissions = this.sdk.getPermissions();
    const currentUserId = this.sdk.getCurrentUserId();
    const collaborators = this.sdk.getCollaborators();
    const me = collaborators.find((c) => c.id === currentUserId);

    const roleLabels: Record<CollaboratorRole, string> = {
      owner: '所有者',
      editor: '编辑者',
      commenter: '评论者',
      viewer: '查看者',
    };

    const perms: string[] = [];
    if (permissions.canEdit) perms.push('编辑');
    if (permissions.canExport) perms.push('导出');
    if (permissions.canManageVersions) perms.push('版本管理');
    if (permissions.canManageCollaborators) perms.push('协作者管理');

    container.innerHTML = `${me ? roleLabels[me.role] : '未知'} · ${perms.join(' · ')}`;
  }

  private bindEvents(): void {
    const addBtn = this.container.querySelector('#cd-add-collab-btn') as HTMLButtonElement;
    addBtn.addEventListener('click', () => this.addCollaborator());

    const nameInput = this.container.querySelector('#cd-collab-name') as HTMLInputElement;
    nameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.addCollaborator();
    });
  }

  private addCollaborator(): void {
    const nameInput = this.container.querySelector('#cd-collab-name') as HTMLInputElement;
    const roleSelect = this.container.querySelector('#cd-collab-role') as HTMLSelectElement;

    const name = nameInput.value.trim();
    if (!name) {
      alert('请输入协作者姓名');
      return;
    }

    const role = roleSelect.value as CollaboratorRole;
    this.sdk.addCollaborator(name, role);

    nameInput.value = '';
    this.renderCollaboratorList();
    this.updateCurrentRole();

    if (this.options.onCollaboratorChange) {
      this.options.onCollaboratorChange(this.sdk.getCollaborators());
    }
  }

  private updateCollaboratorRole(id: string, role: CollaboratorRole): void {
    this.sdk.updateCollaboratorRole(id, role);
    this.renderCollaboratorList();
    this.updateCurrentRole();

    if (this.options.onPermissionChange) {
      this.options.onPermissionChange(role, this.sdk.getRolePermissions(role));
    }
    if (this.options.onCollaboratorChange) {
      this.options.onCollaboratorChange(this.sdk.getCollaborators());
    }
  }

  private removeCollaborator(id: string): void {
    if (confirm('确定要移除该协作者吗？')) {
      this.sdk.removeCollaborator(id);
      this.renderCollaboratorList();
      this.updateCurrentRole();

      if (this.options.onCollaboratorChange) {
        this.options.onCollaboratorChange(this.sdk.getCollaborators());
      }
    }
  }

  private formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }

  refresh(): void {
    this.renderCollaboratorList();
    this.updateCurrentRole();
  }

  destroy(): void {
    if (this.el) {
      this.el.remove();
    }
  }
}
