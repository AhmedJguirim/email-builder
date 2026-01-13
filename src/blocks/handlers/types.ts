import type { Block } from '../../types/blocks';

export interface BlockHandler {
  renderProperties(block: Block): string;
  renderContent(block: Block): string;
  attachListeners(
    properties: HTMLElement,
    block: Block,
    callbacks: BlockHandlerCallbacks
  ): void;
  updateProperty?(
    block: Block,
    propertyId: string,
    value: string | boolean
  ): Partial<Block> | null;
}

export interface BlockHandlerCallbacks {
  updateBlock: (blockId: string, updates: Partial<Block>) => void;
  renderCanvas: () => void;
  renderProperties: () => void;
  handleImageUpload: (blockId: string) => void;
}
