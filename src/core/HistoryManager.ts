import { HistoryState, HistoryAction, DesignElement, DesignProject } from '../types';
import { deepClone } from '../utils';

export class HistoryManager {
  private state: HistoryState;
  private projectSnapshot: DesignProject | null = null;
  private listeners: Set<(state: HistoryState) => void> = new Set();

  constructor(maxHistorySize: number = 50) {
    this.state = {
      past: [],
      future: [],
      currentIndex: -1,
      maxHistorySize,
    };
  }

  setInitialProject(project: DesignProject): void {
    this.projectSnapshot = deepClone(project);
    this.state.past = [];
    this.state.future = [];
    this.state.currentIndex = -1;
  }

  canUndo(): boolean {
    return this.state.past.length > 0;
  }

  canRedo(): boolean {
    return this.state.future.length > 0;
  }

  record(
    actionType: HistoryAction['type'],
    userId: string,
    previousState: any,
    nextState: any,
    elementId?: string
  ): HistoryAction {
    const action: HistoryAction = {
      type: actionType,
      elementId,
      previousState,
      nextState,
      timestamp: Date.now(),
      userId,
    };

    this.state.past.push(action);
    this.state.future = [];

    if (this.state.past.length > this.state.maxHistorySize) {
      this.state.past.shift();
    }

    this.state.currentIndex = this.state.past.length - 1;
    this.notifyListeners();
    return action;
  }

  recordElementAdd(
    userId: string,
    element: DesignElement
  ): HistoryAction {
    return this.record('add', userId, null, deepClone(element), element.id);
  }

  recordElementUpdate(
    userId: string,
    previous: DesignElement,
    next: DesignElement
  ): HistoryAction {
    return this.record(
      'update',
      userId,
      deepClone(previous),
      deepClone(next),
      next.id
    );
  }

  recordElementDelete(
    userId: string,
    element: DesignElement
  ): HistoryAction {
    return this.record('delete', userId, deepClone(element), null, element.id);
  }

  recordElementMove(
    userId: string,
    elementId: string,
    from: { x: number; y: number },
    to: { x: number; y: number }
  ): HistoryAction {
    return this.record('move', userId, from, to, elementId);
  }

  recordElementResize(
    userId: string,
    elementId: string,
    from: { width: number; height: number },
    to: { width: number; height: number }
  ): HistoryAction {
    return this.record('resize', userId, from, to, elementId);
  }

  recordStyleChange(
    userId: string,
    elementId: string,
    previousStyle: any,
    nextStyle: any
  ): HistoryAction {
    return this.record('style', userId, previousStyle, nextStyle, elementId);
  }

  undo(): HistoryAction | null {
    if (!this.canUndo()) return null;
    const action = this.state.past.pop()!;
    this.state.future.unshift(action);
    this.state.currentIndex = this.state.past.length - 1;
    this.notifyListeners();
    return action;
  }

  redo(): HistoryAction | null {
    if (!this.canRedo()) return null;
    const action = this.state.future.shift()!;
    this.state.past.push(action);
    this.state.currentIndex = this.state.past.length - 1;
    this.notifyListeners();
    return action;
  }

  getPastActions(limit?: number): HistoryAction[] {
    const actions = [...this.state.past].reverse();
    return limit ? actions.slice(0, limit) : actions;
  }

  getFutureActions(limit?: number): HistoryAction[] {
    const actions = [...this.state.future];
    return limit ? actions.slice(0, limit) : actions;
  }

  getState(): HistoryState {
    return { ...this.state, past: [...this.state.past], future: [...this.state.future] };
  }

  clear(): void {
    this.state.past = [];
    this.state.future = [];
    this.state.currentIndex = -1;
    this.notifyListeners();
  }

  setMaxHistorySize(size: number): void {
    this.state.maxHistorySize = size;
    while (this.state.past.length > size) {
      this.state.past.shift();
    }
  }

  onStateChange(listener: (state: HistoryState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach((l) => {
      try {
        l(this.getState());
      } catch (e) {
        console.error(e);
      }
    });
  }

  applyUndoToProject(project: DesignProject, action: HistoryAction): DesignProject {
    const updated = deepClone(project);

    switch (action.type) {
      case 'add':
        updated.canvas.elements = updated.canvas.elements.filter(
          (e) => e.id !== action.elementId
        );
        break;
      case 'update':
      case 'style':
        if (action.previousState) {
          const idx = updated.canvas.elements.findIndex((e) => e.id === action.elementId);
          if (idx !== -1) {
            updated.canvas.elements[idx] = action.previousState;
          }
        }
        break;
      case 'delete':
        if (action.previousState) {
          updated.canvas.elements.push(action.previousState);
        }
        break;
      case 'move':
        updated.canvas.elements = updated.canvas.elements.map((e) =>
          e.id === action.elementId
            ? { ...e, x: action.previousState.x, y: action.previousState.y }
            : e
        );
        break;
      case 'resize':
        updated.canvas.elements = updated.canvas.elements.map((e) =>
          e.id === action.elementId
            ? {
                ...e,
                width: action.previousState.width,
                height: action.previousState.height,
              }
            : e
        );
        break;
    }

    updated.updatedAt = Date.now();
    return updated;
  }

  applyRedoToProject(project: DesignProject, action: HistoryAction): DesignProject {
    const updated = deepClone(project);

    switch (action.type) {
      case 'add':
        if (action.nextState) {
          updated.canvas.elements.push(action.nextState);
        }
        break;
      case 'update':
      case 'style':
        if (action.nextState) {
          const idx = updated.canvas.elements.findIndex((e) => e.id === action.elementId);
          if (idx !== -1) {
            updated.canvas.elements[idx] = action.nextState;
          }
        }
        break;
      case 'delete':
        updated.canvas.elements = updated.canvas.elements.filter(
          (e) => e.id !== action.elementId
        );
        break;
      case 'move':
        updated.canvas.elements = updated.canvas.elements.map((e) =>
          e.id === action.elementId
            ? { ...e, x: action.nextState.x, y: action.nextState.y }
            : e
        );
        break;
      case 'resize':
        updated.canvas.elements = updated.canvas.elements.map((e) =>
          e.id === action.elementId
            ? {
                ...e,
                width: action.nextState.width,
                height: action.nextState.height,
              }
            : e
        );
        break;
    }

    updated.updatedAt = Date.now();
    return updated;
  }
}
