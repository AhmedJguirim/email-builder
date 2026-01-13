import type { Block, TextBlock } from '../../types/blocks';
import type { BlockHandler, BlockHandlerCallbacks } from './types';

export const textHandler: BlockHandler = {
  renderProperties(block: Block): string {
    if (block.type !== 'text') return '';
    return `
      <div class="property-group">
        <label>Placeholder Text</label>
        <input type="text" id="text-placeholder" value="${(block as TextBlock).placeholder || ''}" />
      </div>
    `;
  },

  attachListeners(
    properties: HTMLElement,
    block: Block,
    callbacks: BlockHandlerCallbacks
  ): void {
    if (block.type !== 'text') return;

    const placeholderInput = properties.querySelector('#text-placeholder') as HTMLInputElement;
    if (placeholderInput) {
      placeholderInput.addEventListener('change', () => {
        callbacks.updateBlock(block.id, { placeholder: placeholderInput.value } as Partial<Block>);
        callbacks.renderCanvas();
      });
    }
  },
};
