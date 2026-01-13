import type { Block } from '../../types/blocks';

export interface BlockHandler {
  renderProperties(block: Block): string;
  attachListeners(
    properties: HTMLElement,
    block: Block,
    callbacks: BlockHandlerCallbacks
  ): void;
}

export interface BlockHandlerCallbacks {
  updateBlock: (blockId: string, updates: Partial<Block>) => void;
  renderCanvas: () => void;
  renderProperties: () => void;
  handleImageUpload: (blockId: string) => void;
}
