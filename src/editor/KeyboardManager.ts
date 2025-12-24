import { useEditorStore } from '../store';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  action: () => void;
  description: string;
}

export class KeyboardManager {
  private shortcuts: KeyboardShortcut[] = [];
  private enabled: boolean = true;

  constructor() {
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.registerDefaultShortcuts();
  }

  private registerDefaultShortcuts(): void {
    const store = useEditorStore;

    this.register({
      key: 'z',
      ctrl: true,
      action: () => store.getState().undo(),
      description: 'Undo',
    });

    this.register({
      key: 'z',
      ctrl: true,
      shift: true,
      action: () => store.getState().redo(),
      description: 'Redo',
    });

    this.register({
      key: 'y',
      ctrl: true,
      action: () => store.getState().redo(),
      description: 'Redo (alternative)',
    });

    this.register({
      key: 'd',
      ctrl: true,
      action: () => {
        const { selectedBlockId, duplicateBlock } = store.getState();
        if (selectedBlockId) {
          duplicateBlock(selectedBlockId);
        }
      },
      description: 'Duplicate selected block',
    });

    this.register({
      key: 'Delete',
      action: () => {
        const { selectedBlockId, deleteBlock } = store.getState();
        if (selectedBlockId) {
          deleteBlock(selectedBlockId);
        }
      },
      description: 'Delete selected block',
    });

    this.register({
      key: 'Backspace',
      action: () => {
        const { selectedBlockId, deleteBlock } = store.getState();
        if (selectedBlockId) {
          deleteBlock(selectedBlockId);
        }
      },
      description: 'Delete selected block',
    });

    this.register({
      key: 'Escape',
      action: () => {
        store.getState().selectBlock(null);
      },
      description: 'Deselect block',
    });

    this.register({
      key: 'ArrowUp',
      action: () => this.selectPreviousBlock(),
      description: 'Select previous block',
    });

    this.register({
      key: 'ArrowDown',
      action: () => this.selectNextBlock(),
      description: 'Select next block',
    });

    this.register({
      key: 'ArrowUp',
      ctrl: true,
      action: () => this.moveBlockUp(),
      description: 'Move block up',
    });

    this.register({
      key: 'ArrowDown',
      ctrl: true,
      action: () => this.moveBlockDown(),
      description: 'Move block down',
    });

    this.register({
      key: '+',
      ctrl: true,
      action: () => {
        const { zoom, setZoom } = store.getState();
        setZoom(zoom + 10);
      },
      description: 'Zoom in',
    });

    this.register({
      key: '-',
      ctrl: true,
      action: () => {
        const { zoom, setZoom } = store.getState();
        setZoom(zoom - 10);
      },
      description: 'Zoom out',
    });

    this.register({
      key: '0',
      ctrl: true,
      action: () => {
        store.getState().setZoom(100);
      },
      description: 'Reset zoom',
    });
  }

  private selectPreviousBlock(): void {
    const store = useEditorStore.getState();
    const { blocks, selectedBlockId, selectBlock } = store;
    
    if (blocks.length === 0) return;
    
    if (!selectedBlockId) {
      selectBlock(blocks[blocks.length - 1].id);
      return;
    }

    const currentIndex = blocks.findIndex((b: { id: string }) => b.id === selectedBlockId);
    if (currentIndex > 0) {
      selectBlock(blocks[currentIndex - 1].id);
    }
  }

  private selectNextBlock(): void {
    const store = useEditorStore.getState();
    const { blocks, selectedBlockId, selectBlock } = store;
    
    if (blocks.length === 0) return;
    
    if (!selectedBlockId) {
      selectBlock(blocks[0].id);
      return;
    }

    const currentIndex = blocks.findIndex((b: { id: string }) => b.id === selectedBlockId);
    if (currentIndex < blocks.length - 1) {
      selectBlock(blocks[currentIndex + 1].id);
    }
  }

  private moveBlockUp(): void {
    const store = useEditorStore.getState();
    const { blocks, selectedBlockId, moveBlock } = store;
    
    if (!selectedBlockId) return;

    const currentIndex = blocks.findIndex((b: { id: string }) => b.id === selectedBlockId);
    if (currentIndex > 0) {
      moveBlock(selectedBlockId, currentIndex - 1);
    }
  }

  private moveBlockDown(): void {
    const store = useEditorStore.getState();
    const { blocks, selectedBlockId, moveBlock } = store;
    
    if (!selectedBlockId) return;

    const currentIndex = blocks.findIndex((b: { id: string }) => b.id === selectedBlockId);
    if (currentIndex < blocks.length - 1) {
      moveBlock(selectedBlockId, currentIndex + 2);
    }
  }

  register(shortcut: KeyboardShortcut): void {
    this.shortcuts.push(shortcut);
  }

  unregister(key: string, modifiers?: { ctrl?: boolean; shift?: boolean; alt?: boolean }): void {
    this.shortcuts = this.shortcuts.filter(s => {
      if (s.key !== key) return true;
      if (modifiers?.ctrl !== undefined && s.ctrl !== modifiers.ctrl) return true;
      if (modifiers?.shift !== undefined && s.shift !== modifiers.shift) return true;
      if (modifiers?.alt !== undefined && s.alt !== modifiers.alt) return true;
      return false;
    });
  }

  enable(): void {
    this.enabled = true;
  }

  disable(): void {
    this.enabled = false;
  }

  attach(element: HTMLElement | Document = document): void {
    element.addEventListener('keydown', this.handleKeyDown as EventListener);
  }

  detach(element: HTMLElement | Document = document): void {
    element.removeEventListener('keydown', this.handleKeyDown as EventListener);
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.enabled) return;

    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      return;
    }

    for (const shortcut of this.shortcuts) {
      if (this.matchesShortcut(event, shortcut)) {
        event.preventDefault();
        shortcut.action();
        return;
      }
    }
  }

  private matchesShortcut(event: KeyboardEvent, shortcut: KeyboardShortcut): boolean {
    const ctrlMatch = shortcut.ctrl ? (event.ctrlKey || event.metaKey) : !(event.ctrlKey || event.metaKey);
    const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
    const altMatch = shortcut.alt ? event.altKey : !event.altKey;

    return (
      event.key === shortcut.key &&
      ctrlMatch &&
      shiftMatch &&
      altMatch
    );
  }

  getShortcuts(): KeyboardShortcut[] {
    return [...this.shortcuts];
  }
}

export const keyboardManager = new KeyboardManager();
