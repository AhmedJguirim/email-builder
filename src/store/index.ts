import { create } from 'zustand';
import type { Block, ColumnBlock, EditorState, EmailStyles, Variable, HistoryState } from '../types';
import { DEFAULT_EMAIL_STYLES } from '../types/styles';
import { generateId } from '../utils/id';

const MAX_HISTORY_LENGTH = 50;

interface EditorStore extends EditorState {
  setBlocks: (blocks: Block[]) => void;
  addBlock: (block: Block, index?: number, parentId?: string) => void;
  updateBlock: (id: string, updates: Partial<Block>) => void;
  deleteBlock: (id: string) => void;
  moveBlock: (id: string, toIndex: number, parentId?: string) => void;
  duplicateBlock: (id: string) => void;
  selectBlock: (id: string | null) => void;
  hoverBlock: (id: string | null) => void;
  setDrag: (blockId: string | null, targetId?: string | null, position?: 'before' | 'after' | 'inside' | null) => void;
  setEmailStyles: (styles: Partial<EmailStyles>) => void;
  setVariables: (variables: Variable[]) => void;
  undo: () => void;
  redo: () => void;
  setPreviewMode: (mode: 'desktop' | 'mobile') => void;
  setZoom: (zoom: number) => void;
  toggleGrid: () => void;
  reset: () => void;
  getBlockById: (id: string) => Block | undefined;
  getBlockPath: (id: string) => string[];
}

function findBlockById(blocks: Block[], id: string): Block | undefined {
  for (const block of blocks) {
    if (block.id === id) return block;
    if (block.type === 'columns') {
      for (const column of block.columns) {
        if (column.id === id) return column;
        const found = findBlockById(column.children, id);
        if (found) return found;
      }
    }
  }
  return undefined;
}

function findBlockPath(blocks: Block[], id: string, path: string[] = []): string[] | null {
  for (const block of blocks) {
    if (block.id === id) return [...path, id];
    if (block.type === 'columns') {
      for (const column of block.columns) {
        if (column.id === id) return [...path, block.id, id];
        const found = findBlockPath(column.children, id, [...path, block.id, column.id]);
        if (found) return found;
      }
    }
  }
  return null;
}

function updateBlockInTree(blocks: Block[], id: string, updates: Partial<Block>): Block[] {
  return blocks.map(block => {
    if (block.id === id) {
      return { ...block, ...updates } as Block;
    }
    if (block.type === 'columns') {
      return {
        ...block,
        columns: block.columns.map((column: ColumnBlock) => {
          if (column.id === id) {
            return { ...column, ...updates };
          }
          return {
            ...column,
            children: updateBlockInTree(column.children, id, updates),
          };
        }),
      };
    }
    return block;
  });
}

function deleteBlockFromTree(blocks: Block[], id: string): Block[] {
  return blocks
    .filter(block => block.id !== id)
    .map(block => {
      if (block.type === 'columns') {
        return {
          ...block,
          columns: block.columns.map(column => ({
            ...column,
            children: deleteBlockFromTree(column.children, id),
          })),
        };
      }
      return block;
    });
}

function insertBlockInTree(
  blocks: Block[],
  newBlock: Block,
  index: number,
  parentId?: string
): Block[] {
  if (!parentId) {
    const newBlocks = [...blocks];
    newBlocks.splice(index, 0, newBlock);
    return newBlocks;
  }

  return blocks.map(block => {
    if (block.type === 'columns') {
      return {
        ...block,
        columns: block.columns.map(column => {
          if (column.id === parentId) {
            const newChildren = [...column.children];
            newChildren.splice(index, 0, newBlock);
            return { ...column, children: newChildren };
          }
          return column;
        }),
      };
    }
    return block;
  });
}

function cloneBlock(block: Block): Block {
  const newId = generateId();
  
  if (block.type === 'columns') {
    return {
      ...block,
      id: newId,
      columns: block.columns.map(col => ({
        ...col,
        id: generateId(),
        children: col.children.map(child => cloneBlock(child)),
      })),
    };
  }
  
  return { ...block, id: newId };
}

const initialState: EditorState = {
  blocks: [],
  selectedBlockId: null,
  hoveredBlockId: null,
  draggedBlockId: null,
  dropTargetId: null,
  dropPosition: null,
  emailStyles: DEFAULT_EMAIL_STYLES,
  variables: [],
  history: { past: [], future: [] },
  isDirty: false,
  previewMode: 'desktop',
  showGrid: false,
  zoom: 100,
};

function pushToHistory(history: HistoryState, blocks: Block[]): HistoryState {
  const newPast = [...history.past, blocks].slice(-MAX_HISTORY_LENGTH);
  return { past: newPast, future: [] };
}

export const useEditorStore = create<EditorStore>((set, get) => ({
  ...initialState,

  setBlocks: (blocks) => {
    const state = get();
    set({
      blocks,
      history: pushToHistory(state.history, state.blocks),
      isDirty: true,
    });
  },

  addBlock: (block, index, parentId) => {
    const state = get();
    const idx = index ?? state.blocks.length;
    const newBlocks = insertBlockInTree(state.blocks, block, idx, parentId);
    set({
      blocks: newBlocks,
      selectedBlockId: block.id,
      history: pushToHistory(state.history, state.blocks),
      isDirty: true,
    });
  },

  updateBlock: (id, updates) => {
    const state = get();
    const newBlocks = updateBlockInTree(state.blocks, id, updates);
    set({
      blocks: newBlocks,
      history: pushToHistory(state.history, state.blocks),
      isDirty: true,
    });
  },

  deleteBlock: (id) => {
    const state = get();
    const newBlocks = deleteBlockFromTree(state.blocks, id);
    set({
      blocks: newBlocks,
      selectedBlockId: state.selectedBlockId === id ? null : state.selectedBlockId,
      history: pushToHistory(state.history, state.blocks),
      isDirty: true,
    });
  },

  moveBlock: (id, toIndex, parentId) => {
    const state = get();
    const block = findBlockById(state.blocks, id);
    if (!block) return;

    const withoutBlock = deleteBlockFromTree(state.blocks, id);
    const newBlocks = insertBlockInTree(withoutBlock, block, toIndex, parentId);
    
    set({
      blocks: newBlocks,
      history: pushToHistory(state.history, state.blocks),
      isDirty: true,
    });
  },

  duplicateBlock: (id) => {
    const state = get();
    const block = findBlockById(state.blocks, id);
    if (!block) return;

    const cloned = cloneBlock(block);
    const blockIndex = state.blocks.findIndex(b => b.id === id);
    const newBlocks = [...state.blocks];
    newBlocks.splice(blockIndex + 1, 0, cloned);

    set({
      blocks: newBlocks,
      selectedBlockId: cloned.id,
      history: pushToHistory(state.history, state.blocks),
      isDirty: true,
    });
  },

  selectBlock: (id) => set({ selectedBlockId: id }),
  
  hoverBlock: (id) => set({ hoveredBlockId: id }),

  setDrag: (blockId, targetId, position) => set({
    draggedBlockId: blockId,
    dropTargetId: targetId ?? null,
    dropPosition: position ?? null,
  }),

  setEmailStyles: (styles) => {
    const state = get();
    set({
      emailStyles: { ...state.emailStyles, ...styles },
      isDirty: true,
    });
  },

  setVariables: (variables) => set({ variables }),

  undo: () => {
    const state = get();
    if (state.history.past.length === 0) return;

    const previous = state.history.past[state.history.past.length - 1];
    const newPast = state.history.past.slice(0, -1);

    set({
      blocks: previous,
      history: {
        past: newPast,
        future: [state.blocks, ...state.history.future],
      },
      isDirty: true,
    });
  },

  redo: () => {
    const state = get();
    if (state.history.future.length === 0) return;

    const next = state.history.future[0];
    const newFuture = state.history.future.slice(1);

    set({
      blocks: next,
      history: {
        past: [...state.history.past, state.blocks],
        future: newFuture,
      },
      isDirty: true,
    });
  },

  setPreviewMode: (mode) => set({ previewMode: mode }),

  setZoom: (zoom) => set({ zoom: Math.max(25, Math.min(200, zoom)) }),

  toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),

  reset: () => set(initialState),

  getBlockById: (id) => findBlockById(get().blocks, id),

  getBlockPath: (id) => findBlockPath(get().blocks, id) || [],
}));

export type { EditorStore };
