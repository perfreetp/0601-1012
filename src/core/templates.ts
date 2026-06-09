import {
  Template,
  TemplateCategory,
  TemplateFilter,
  ColorTheme,
  SizeConfig,
  TextElement,
  ImageElement,
  ShapeElement,
  QuestionCardElement,
} from '../types';
import { generateId } from '../utils';
import { defaultThemes } from './themes';
import { defaultSizes } from './sizes';

const createDefaultCoverElements = (theme: ColorTheme, size: SizeConfig) => {
  const elements: (TextElement | ShapeElement | ImageElement)[] = [];

  elements.push({
    id: generateId('shape'),
    type: 'shape',
    x: 0,
    y: 0,
    width: size.width,
    height: size.height * 0.4,
    shape: 'rectangle',
    fill: theme.primary,
    zIndex: 0,
  });

  elements.push({
    id: generateId('text'),
    type: 'text',
    x: size.width * 0.08,
    y: size.height * 0.1,
    width: size.width * 0.84,
    height: size.height * 0.15,
    content: '课程标题',
    zIndex: 1,
    style: {
      fontFamily: 'system-ui, sans-serif',
      fontSize: 48,
      fontWeight: 700,
      fontStyle: 'normal',
      color: '#ffffff',
      textAlign: 'left',
      verticalAlign: 'middle',
      lineHeight: 1.2,
    },
  });

  elements.push({
    id: generateId('text'),
    type: 'text',
    x: size.width * 0.08,
    y: size.height * 0.25,
    width: size.width * 0.84,
    height: size.height * 0.08,
    content: '副标题 / 讲师介绍',
    zIndex: 1,
    style: {
      fontFamily: 'system-ui, sans-serif',
      fontSize: 20,
      fontWeight: 400,
      fontStyle: 'normal',
      color: theme.secondary,
      textAlign: 'left',
      verticalAlign: 'top',
      lineHeight: 1.4,
    },
  });

  elements.push({
    id: generateId('text'),
    type: 'text',
    x: size.width * 0.08,
    y: size.height * 0.55,
    width: size.width * 0.84,
    height: size.height * 0.25,
    content: '课程简介：这里可以简要描述课程内容、学习目标和适用人群。通过精炼的文字吸引学员的注意力。',
    zIndex: 1,
    style: {
      fontFamily: 'system-ui, sans-serif',
      fontSize: 18,
      fontWeight: 400,
      fontStyle: 'normal',
      color: theme.text,
      textAlign: 'left',
      verticalAlign: 'top',
      lineHeight: 1.8,
    },
  });

  return elements;
};

const createFlashcardElements = (theme: ColorTheme, size: SizeConfig) => {
  const elements: (TextElement | ShapeElement | QuestionCardElement)[] = [];

  elements.push({
    id: generateId('shape'),
    type: 'shape',
    x: 0,
    y: 0,
    width: size.width,
    height: size.height,
    shape: 'rectangle',
    fill: theme.background,
    borderWidth: 2,
    stroke: theme.border,
    borderRadius: 16,
    zIndex: 0,
  });

  elements.push({
    id: generateId('qcard'),
    type: 'question_card',
    x: size.width * 0.05,
    y: size.height * 0.08,
    width: size.width * 0.9,
    height: size.height * 0.84,
    questionType: 'single_choice',
    questionContent: '以下哪个选项是正确的？',
    options: [
      { id: 'A', label: 'A', content: '选项一的描述内容', isCorrect: false },
      { id: 'B', label: 'B', content: '选项二的描述内容（正确答案）', isCorrect: true },
      { id: 'C', label: 'C', content: '选项三的描述内容', isCorrect: false },
      { id: 'D', label: 'D', content: '选项四的描述内容', isCorrect: false },
    ],
    correctAnswer: 'B',
    explanation: '这是答案解析，帮助学生理解为什么选择B。',
    style: {
      backgroundColor: theme.background,
      titleStyle: {
        fontSize: 20,
        fontWeight: 600,
        color: theme.text,
      },
      optionStyle: {
        fontSize: 16,
        color: theme.textSecondary,
      },
      correctHighlightColor: theme.accent,
    },
    zIndex: 1,
  });

  return elements;
};

const now = Date.now();

export const systemTemplates: Template[] = [
  {
    id: 'tpl_cover_standard',
    name: '标准课程封面',
    category: 'course_cover',
    description: '经典课程封面设计，适用于各类课程',
    size: defaultSizes.course_cover_landscape,
    theme: defaultThemes.default_light,
    elements: createDefaultCoverElements(defaultThemes.default_light, defaultSizes.course_cover_landscape),
    tags: ['经典', '通用', '商务'],
    createdAt: now,
    updatedAt: now,
    isSystem: true,
  },
  {
    id: 'tpl_cover_education',
    name: '活泼教育风封面',
    category: 'course_cover',
    description: '色彩鲜艳活泼，适合K12教育和培训',
    size: defaultSizes.course_cover_landscape,
    theme: defaultThemes.education_bright,
    elements: createDefaultCoverElements(defaultThemes.education_bright, defaultSizes.course_cover_landscape),
    tags: ['活泼', '教育', 'K12'],
    createdAt: now,
    updatedAt: now,
    isSystem: true,
  },
  {
    id: 'tpl_cover_minimal',
    name: '极简风格封面',
    category: 'course_cover',
    description: '简约现代设计，突出内容本身',
    size: defaultSizes.course_cover_portrait,
    theme: defaultThemes.default_dark,
    elements: createDefaultCoverElements(defaultThemes.default_dark, defaultSizes.course_cover_portrait),
    tags: ['极简', '现代', '专业'],
    createdAt: now,
    updatedAt: now,
    isSystem: true,
  },
  {
    id: 'tpl_flashcard_standard',
    name: '标准练习卡',
    category: 'flashcard',
    description: '单选题练习卡模板',
    size: defaultSizes.flashcard_standard,
    theme: defaultThemes.default_light,
    elements: createFlashcardElements(defaultThemes.default_light, defaultSizes.flashcard_standard),
    tags: ['单选', '标准', '通用'],
    createdAt: now,
    updatedAt: now,
    isSystem: true,
  },
  {
    id: 'tpl_flashcard_soft',
    name: '柔和练习卡',
    category: 'flashcard',
    description: '柔和配色，长时间阅读不疲劳',
    size: defaultSizes.flashcard_standard,
    theme: defaultThemes.education_soft,
    elements: createFlashcardElements(defaultThemes.education_soft, defaultSizes.flashcard_standard),
    tags: ['柔和', '护眼', '多选'],
    createdAt: now,
    updatedAt: now,
    isSystem: true,
  },
  {
    id: 'tpl_flashcard_mini',
    name: '迷你练习卡',
    category: 'flashcard',
    description: '小尺寸练习卡，适合移动端',
    size: defaultSizes.flashcard_mini,
    theme: defaultThemes.forest_green,
    elements: createFlashcardElements(defaultThemes.forest_green, defaultSizes.flashcard_mini),
    tags: ['迷你', '移动', '判断'],
    createdAt: now,
    updatedAt: now,
    isSystem: true,
  },
];
