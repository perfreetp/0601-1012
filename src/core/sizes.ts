import { SizeConfig, SizePreset, SizePresetConfig } from '../types';

const mmToPx = (mm: number, dpi: number = 96): number => Math.round((mm / 25.4) * dpi);
const cmToPx = (cm: number, dpi: number = 96): number => Math.round((cm * 10 / 25.4) * dpi);
const inchToPx = (inch: number, dpi: number = 96): number => Math.round(inch * dpi);

export const defaultSizes: Record<SizePreset, SizeConfig> = {
  A4: { width: mmToPx(210), height: mmToPx(297), unit: 'mm', dpi: 96 },
  A5: { width: mmToPx(148), height: mmToPx(210), unit: 'mm', dpi: 96 },
  '16:9': { width: 1920, height: 1080, unit: 'px', dpi: 96 },
  '4:3': { width: 1600, height: 1200, unit: 'px', dpi: 96 },
  '1:1': { width: 1080, height: 1080, unit: 'px', dpi: 96 },
  '9:16': { width: 1080, height: 1920, unit: 'px', dpi: 96 },
  course_cover_landscape: { width: 1920, height: 1080, unit: 'px', dpi: 96 },
  course_cover_portrait: { width: 1080, height: 1440, unit: 'px', dpi: 96 },
  flashcard_standard: { width: 800, height: 600, unit: 'px', dpi: 96 },
  flashcard_mini: { width: 400, height: 300, unit: 'px', dpi: 96 },
  custom: { width: 800, height: 600, unit: 'px', dpi: 96 },
};

export const sizePresetConfigs: Record<SizePreset, SizePresetConfig> = {
  A4: { name: 'A4', size: defaultSizes.A4, description: '标准A4纸张尺寸' },
  A5: { name: 'A5', size: defaultSizes.A5, description: 'A5纸张尺寸' },
  '16:9': { name: '16:9 宽屏', size: defaultSizes['16:9'], description: '16:9 宽屏比例' },
  '4:3': { name: '4:3 标准', size: defaultSizes['4:3'], description: '4:3 标准比例' },
  '1:1': { name: '1:1 正方形', size: defaultSizes['1:1'], description: '1:1 正方形' },
  '9:16': { name: '9:16 竖屏', size: defaultSizes['9:16'], description: '9:16 竖屏比例' },
  course_cover_landscape: { name: '课程封面（横版）', size: defaultSizes.course_cover_landscape, description: '适合在线课程的横版封面' },
  course_cover_portrait: { name: '课程封面（竖版）', size: defaultSizes.course_cover_portrait, description: '适合在线课程的竖版封面' },
  flashcard_standard: { name: '标准练习卡', size: defaultSizes.flashcard_standard, description: '标准尺寸练习卡' },
  flashcard_mini: { name: '迷你练习卡', size: defaultSizes.flashcard_mini, description: '移动端迷你练习卡' },
  custom: { name: '自定义', size: defaultSizes.custom, description: '自定义尺寸' },
};

export const getSize = (preset: SizePreset): SizeConfig => {
  return defaultSizes[preset] || defaultSizes.custom;
};

export const createCustomSize = (width: number, height: number, unit: SizeConfig['unit'] = 'px', dpi: number = 96): SizeConfig => {
  return { width, height, unit, dpi };
};

export const convertSizeToPx = (size: SizeConfig): { width: number; height: number } => {
  const dpi = size.dpi || 96;
  switch (size.unit) {
    case 'mm':
      return { width: mmToPx(size.width, dpi), height: mmToPx(size.height, dpi) };
    case 'cm':
      return { width: cmToPx(size.width, dpi), height: cmToPx(size.height, dpi) };
    case 'inch':
      return { width: inchToPx(size.width, dpi), height: inchToPx(size.height, dpi) };
    case 'px':
    default:
      return { width: size.width, height: size.height };
  }
};
