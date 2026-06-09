import {
  QuestionCardElement,
  QuestionType,
  QuestionOption,
  QuestionCardStyle,
  ColorTheme,
  MatchingPair,
} from '../types';
import { generateElementId, generateId, deepClone } from '../utils';

export class QuestionCardManager {
  createMatching(
    question: string,
    pairs: Array<{ left: string; right: string }>,
    x: number,
    y: number,
    width: number,
    height: number,
    theme?: ColorTheme
  ): QuestionCardElement {
    const matchingPairs: MatchingPair[] = pairs.map((p) => ({
      id: generateId('pair'),
      left: p.left,
      right: p.right,
    }));

    return this.createQuestionCard(
      'matching',
      question,
      [],
      '',
      x,
      y,
      width,
      height,
      theme,
      matchingPairs
    );
  }
  createSingleChoice(
    question: string,
    options: string[],
    correctIndex: number,
    x: number,
    y: number,
    width: number,
    height: number,
    theme?: ColorTheme
  ): QuestionCardElement {
    const questionOptions: QuestionOption[] = options.map((opt, idx) => ({
      id: generateId('opt'),
      label: String.fromCharCode(65 + idx),
      content: opt,
      isCorrect: idx === correctIndex,
    }));

    return this.createQuestionCard(
      'single_choice',
      question,
      questionOptions,
      questionOptions[correctIndex]?.id,
      x,
      y,
      width,
      height,
      theme
    );
  }

  createMultipleChoice(
    question: string,
    options: string[],
    correctIndices: number[],
    x: number,
    y: number,
    width: number,
    height: number,
    theme?: ColorTheme
  ): QuestionCardElement {
    const questionOptions: QuestionOption[] = options.map((opt, idx) => ({
      id: generateId('opt'),
      label: String.fromCharCode(65 + idx),
      content: opt,
      isCorrect: correctIndices.includes(idx),
    }));

    const correctAnswers = questionOptions
      .filter((_, idx) => correctIndices.includes(idx))
      .map((opt) => opt.id);

    return this.createQuestionCard(
      'multiple_choice',
      question,
      questionOptions,
      correctAnswers,
      x,
      y,
      width,
      height,
      theme
    );
  }

  createTrueFalse(
    question: string,
    isTrue: boolean,
    x: number,
    y: number,
    width: number,
    height: number,
    theme?: ColorTheme
  ): QuestionCardElement {
    const options: QuestionOption[] = [
      { id: generateId('opt'), label: 'T', content: '正确', isCorrect: isTrue },
      { id: generateId('opt'), label: 'F', content: '错误', isCorrect: !isTrue },
    ];

    return this.createQuestionCard(
      'true_false',
      question,
      options,
      options[isTrue ? 0 : 1].id,
      x,
      y,
      width,
      height,
      theme
    );
  }

  createFillBlank(
    question: string,
    correctAnswer: string,
    x: number,
    y: number,
    width: number,
    height: number,
    theme?: ColorTheme
  ): QuestionCardElement {
    return this.createQuestionCard(
      'fill_blank',
      question,
      [],
      correctAnswer,
      x,
      y,
      width,
      height,
      theme
    );
  }

  createShortAnswer(
    question: string,
    referenceAnswer: string,
    x: number,
    y: number,
    width: number,
    height: number,
    theme?: ColorTheme
  ): QuestionCardElement {
    return this.createQuestionCard(
      'short_answer',
      question,
      [],
      referenceAnswer,
      x,
      y,
      width,
      height,
      theme
    );
  }

  createQuestionCard(
    questionType: QuestionType,
    questionContent: string,
    options: QuestionOption[],
    correctAnswer: string | string[],
    x: number,
    y: number,
    width: number,
    height: number,
    theme?: ColorTheme,
    matchingPairs?: MatchingPair[]
  ): QuestionCardElement {
    const style: QuestionCardStyle = {};
    if (theme) {
      style.backgroundColor = theme.background;
      style.borderColor = theme.border;
      style.titleStyle = {
        fontSize: 20,
        fontWeight: 600,
        color: theme.text,
      };
      style.optionStyle = {
        fontSize: 16,
        color: theme.textSecondary,
      };
      style.correctHighlightColor = theme.accent;
    }

    return {
      id: generateElementId('qcard'),
      type: 'question_card',
      x,
      y,
      width,
      height,
      questionType,
      questionContent,
      options,
      matchingPairs,
      correctAnswer,
      style,
      zIndex: 1,
    };
  }

  changeQuestionType(
    element: QuestionCardElement,
    newType: QuestionType,
    theme?: ColorTheme
  ): QuestionCardElement {
    const cloned = deepClone(element);
    cloned.questionType = newType;

    switch (newType) {
      case 'true_false': {
        const tId = generateId('opt');
        const fId = generateId('opt');
        cloned.options = [
          { id: tId, label: 'T', content: '正确', isCorrect: true },
          { id: fId, label: 'F', content: '错误', isCorrect: false },
        ];
        cloned.correctAnswer = tId;
        cloned.matchingPairs = undefined;
        break;
      }
      case 'single_choice': {
        if (!cloned.options || cloned.options.length === 0) {
          cloned.options = [
            { id: generateId('opt'), label: 'A', content: '选项A', isCorrect: true },
            { id: generateId('opt'), label: 'B', content: '选项B', isCorrect: false },
            { id: generateId('opt'), label: 'C', content: '选项C', isCorrect: false },
            { id: generateId('opt'), label: 'D', content: '选项D', isCorrect: false },
          ];
          cloned.correctAnswer = cloned.options[0].id;
        } else {
          const correctOpts = cloned.options.filter((o) => o.isCorrect);
          const firstCorrect = correctOpts[0] || cloned.options[0];
          cloned.options = cloned.options.map((o) => ({
            ...o,
            isCorrect: o.id === firstCorrect.id,
          }));
          cloned.correctAnswer = firstCorrect.id;
        }
        cloned.matchingPairs = undefined;
        break;
      }
      case 'multiple_choice': {
        if (!cloned.options || cloned.options.length === 0) {
          cloned.options = [
            { id: generateId('opt'), label: 'A', content: '选项A', isCorrect: true },
            { id: generateId('opt'), label: 'B', content: '选项B', isCorrect: true },
            { id: generateId('opt'), label: 'C', content: '选项C', isCorrect: false },
            { id: generateId('opt'), label: 'D', content: '选项D', isCorrect: false },
          ];
          cloned.correctAnswer = cloned.options.filter((o) => o.isCorrect).map((o) => o.id);
        } else {
          cloned.correctAnswer = cloned.options.filter((o) => o.isCorrect).map((o) => o.id);
        }
        cloned.matchingPairs = undefined;
        break;
      }
      case 'fill_blank':
      case 'short_answer':
        cloned.options = [];
        cloned.matchingPairs = undefined;
        cloned.correctAnswer = '';
        break;
      case 'matching':
        cloned.options = [];
        cloned.correctAnswer = '';
        cloned.matchingPairs = [
          { id: generateId('pair'), left: '左项1', right: '右项1' },
          { id: generateId('pair'), left: '左项2', right: '右项2' },
          { id: generateId('pair'), left: '左项3', right: '右项3' },
        ];
        break;
    }

    if (theme) {
      cloned.style = {
        backgroundColor: theme.background,
        borderColor: theme.border,
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
      };
    }

    return cloned;
  }

  updateQuestion(element: QuestionCardElement, content: string): QuestionCardElement {
    return { ...deepClone(element), questionContent: content };
  }

  updateOptions(element: QuestionCardElement, options: QuestionOption[]): QuestionCardElement {
    return { ...deepClone(element), options };
  }

  addOption(element: QuestionCardElement, content: string): QuestionCardElement {
    const newOption: QuestionOption = {
      id: generateId('opt'),
      label: String.fromCharCode(65 + (element.options?.length || 0)),
      content,
      isCorrect: false,
    };
    return {
      ...deepClone(element),
      options: [...(element.options || []), newOption],
    };
  }

  removeOption(element: QuestionCardElement, optionId: string): QuestionCardElement {
    return {
      ...deepClone(element),
      options: element.options?.filter((o) => o.id !== optionId) || [],
    };
  }

  updateOptionContent(element: QuestionCardElement, optionId: string, content: string): QuestionCardElement {
    return {
      ...deepClone(element),
      options: element.options?.map((o) =>
        o.id === optionId ? { ...o, content } : o
      ) || [],
    };
  }

  setCorrectAnswer(element: QuestionCardElement, answerId: string | string[]): QuestionCardElement {
    let updatedOptions = element.options;
    if (updatedOptions && updatedOptions.length > 0) {
      updatedOptions = updatedOptions.map((o) => {
        if (Array.isArray(answerId)) {
          return { ...o, isCorrect: answerId.includes(o.id) };
        }
        return { ...o, isCorrect: o.id === answerId };
      });
    }
    return {
      ...deepClone(element),
      correctAnswer: answerId,
      options: updatedOptions,
    };
  }

  setExplanation(element: QuestionCardElement, explanation: string): QuestionCardElement {
    return { ...deepClone(element), explanation };
  }

  updateStyle(element: QuestionCardElement, styleChanges: Partial<QuestionCardStyle>): QuestionCardElement {
    return {
      ...deepClone(element),
      style: { ...element.style, ...styleChanges },
    };
  }

  checkAnswer(element: QuestionCardElement, userAnswer: string | string[]): { correct: boolean; correctAnswer: string | string[] } {
    if (Array.isArray(element.correctAnswer) && Array.isArray(userAnswer)) {
      const sortedCorrect = [...element.correctAnswer].sort();
      const sortedUser = [...userAnswer].sort();
      return {
        correct: JSON.stringify(sortedCorrect) === JSON.stringify(sortedUser),
        correctAnswer: element.correctAnswer,
      };
    }
    return {
      correct: element.correctAnswer === userAnswer,
      correctAnswer: element.correctAnswer as string,
    };
  }

  setCorrectAnswerText(element: QuestionCardElement, text: string): QuestionCardElement {
    return { ...deepClone(element), correctAnswer: text };
  }

  addMatchingPair(element: QuestionCardElement, left = '左项', right = '右项'): QuestionCardElement {
    const pairs = [...(element.matchingPairs || [])];
    pairs.push({ id: generateId('pair'), left, right });
    return { ...deepClone(element), matchingPairs: pairs };
  }

  removeMatchingPair(element: QuestionCardElement, pairId: string): QuestionCardElement {
    return {
      ...deepClone(element),
      matchingPairs: (element.matchingPairs || []).filter((p) => p.id !== pairId),
    };
  }

  updateMatchingPair(
    element: QuestionCardElement,
    pairId: string,
    changes: Partial<MatchingPair>
  ): QuestionCardElement {
    return {
      ...deepClone(element),
      matchingPairs: (element.matchingPairs || []).map((p) =>
        p.id === pairId ? { ...p, ...changes } : p
      ),
    };
  }
}
