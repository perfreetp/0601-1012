import { WatermarkConfig } from '../types';

export class WatermarkManager {
  private config: WatermarkConfig = {
    enabled: false,
    text: '',
    opacity: 0.15,
    position: 'bottom_right',
    size: 24,
    color: '#000000',
    fontFamily: 'system-ui, sans-serif',
  };

  constructor(initialConfig?: Partial<WatermarkConfig>) {
    if (initialConfig) {
      this.config = { ...this.config, ...initialConfig };
    }
  }

  getConfig(): WatermarkConfig {
    return { ...this.config };
  }

  setConfig(config: Partial<WatermarkConfig>): WatermarkConfig {
    this.config = { ...this.config, ...config };
    return { ...this.config };
  }

  enable(): WatermarkConfig {
    return this.setConfig({ enabled: true });
  }

  disable(): WatermarkConfig {
    return this.setConfig({ enabled: false });
  }

  setText(text: string): WatermarkConfig {
    return this.setConfig({ text });
  }

  setImage(imageUrl: string): WatermarkConfig {
    return this.setConfig({ imageUrl });
  }

  setOpacity(opacity: number): WatermarkConfig {
    const clamped = Math.max(0, Math.min(1, opacity));
    return this.setConfig({ opacity: clamped });
  }

  setPosition(
    position: WatermarkConfig['position']
  ): WatermarkConfig {
    return this.setConfig({ position });
  }

  setSize(size: number): WatermarkConfig {
    return this.setConfig({ size: Math.max(8, size) });
  }

  setColor(color: string): WatermarkConfig {
    return this.setConfig({ color });
  }

  setRotation(rotation: number): WatermarkConfig {
    return this.setConfig({ rotation });
  }

  createTextWatermark(
    text: string,
    options?: Partial<WatermarkConfig>
  ): WatermarkConfig {
    return {
      enabled: true,
      text,
      opacity: options?.opacity ?? 0.2,
      position: options?.position ?? 'repeat',
      size: options?.size ?? 32,
      rotation: options?.rotation ?? -30,
      color: options?.color ?? '#000000',
      fontFamily: options?.fontFamily ?? 'system-ui, sans-serif',
    };
  }

  createImageWatermark(
    imageUrl: string,
    options?: Partial<WatermarkConfig>
  ): WatermarkConfig {
    return {
      enabled: true,
      imageUrl,
      opacity: options?.opacity ?? 0.3,
      position: options?.position ?? 'bottom_right',
      size: options?.size ?? 48,
    };
  }

  getPositionLabel(position: WatermarkConfig['position']): string {
    const labels: Record<WatermarkConfig['position'], string> = {
      top_left: '左上角',
      top_center: '顶部居中',
      top_right: '右上角',
      middle_left: '左侧居中',
      middle_center: '正中央',
      middle_right: '右侧居中',
      bottom_left: '左下角',
      bottom_center: '底部居中',
      bottom_right: '右下角',
      repeat: '平铺重复',
    };
    return labels[position];
  }

  getPreset(
    preset: 'copyright' | 'confidential' | 'draft' | 'preview' | 'brand'
  ): WatermarkConfig {
    const presets: Record<string, WatermarkConfig> = {
      copyright: {
        enabled: true,
        text: '© Copyright',
        opacity: 0.2,
        position: 'bottom_right',
        size: 18,
        color: '#666666',
        fontFamily: 'system-ui, sans-serif',
      },
      confidential: {
        enabled: true,
        text: '机密',
        opacity: 0.1,
        position: 'repeat',
        size: 60,
        rotation: -30,
        color: '#FF0000',
        fontFamily: 'system-ui, sans-serif',
      },
      draft: {
        enabled: true,
        text: 'DRAFT',
        opacity: 0.08,
        position: 'repeat',
        size: 80,
        rotation: -30,
        color: '#999999',
        fontFamily: 'system-ui, sans-serif',
      },
      preview: {
        enabled: true,
        text: '预览',
        opacity: 0.15,
        position: 'middle_center',
        size: 72,
        color: '#333333',
        fontFamily: 'system-ui, sans-serif',
      },
      brand: {
        enabled: true,
        text: 'BRAND',
        opacity: 0.12,
        position: 'repeat',
        size: 48,
        rotation: -45,
        color: '#3B82F6',
        fontFamily: 'system-ui, sans-serif',
      },
    };
    return { ...presets[preset] };
  }

  applyPreset(preset: 'copyright' | 'confidential' | 'draft' | 'preview' | 'brand'): WatermarkConfig {
    this.config = this.getPreset(preset);
    return { ...this.config };
  }
}
