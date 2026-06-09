import { ImageElement, ImageCropConfig, ImageFilter } from '../types';
import { deepClone } from '../utils';

export class ImageCropper {
  async loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
      img.src = src;
    });
  }

  getNaturalSize(src: string): Promise<{ width: number; height: number }> {
    return this.loadImage(src).then((img) => ({
      width: img.naturalWidth,
      height: img.naturalHeight,
    }));
  }

  applyCrop(element: ImageElement, crop: ImageCropConfig): ImageElement {
    return {
      ...deepClone(element),
      crop,
    };
  }

  applyFilter(element: ImageElement, filter: ImageFilter): ImageElement {
    return {
      ...deepClone(element),
      filter: { ...element.filter, ...filter },
    };
  }

  resetCrop(element: ImageElement): ImageElement {
    const { crop, ...rest } = deepClone(element);
    return rest as ImageElement;
  }

  resetFilter(element: ImageElement): ImageElement {
    const { filter, ...rest } = deepClone(element);
    return rest as ImageElement;
  }

  async cropImageToCanvas(
    src: string,
    crop: ImageCropConfig,
    outputWidth: number,
    outputHeight: number,
    mimeType: string = 'image/png',
    quality: number = 0.92
  ): Promise<string> {
    const img = await this.loadImage(src);
    const canvas = document.createElement('canvas');
    canvas.width = outputWidth;
    canvas.height = outputHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context not available');

    ctx.drawImage(
      img,
      crop.x,
      crop.y,
      crop.width,
      crop.height,
      0,
      0,
      outputWidth,
      outputHeight
    );

    return canvas.toDataURL(mimeType, quality);
  }

  calculateCoverCrop(
    imageWidth: number,
    imageHeight: number,
    targetWidth: number,
    targetHeight: number
  ): ImageCropConfig {
    const imageRatio = imageWidth / imageHeight;
    const targetRatio = targetWidth / targetHeight;

    let cropWidth: number;
    let cropHeight: number;
    let offsetX: number;
    let offsetY: number;

    if (imageRatio > targetRatio) {
      cropHeight = imageHeight;
      cropWidth = imageHeight * targetRatio;
      offsetX = (imageWidth - cropWidth) / 2;
      offsetY = 0;
    } else {
      cropWidth = imageWidth;
      cropHeight = imageWidth / targetRatio;
      offsetX = 0;
      offsetY = (imageHeight - cropHeight) / 2;
    }

    return {
      x: offsetX,
      y: offsetY,
      width: cropWidth,
      height: cropHeight,
    };
  }

  calculateContainCrop(
    imageWidth: number,
    imageHeight: number,
    targetWidth: number,
    targetHeight: number
  ): { crop: ImageCropConfig; scale: number } {
    const scale = Math.min(targetWidth / imageWidth, targetHeight / imageHeight);
    return {
      crop: { x: 0, y: 0, width: imageWidth, height: imageHeight },
      scale,
    };
  }
}
