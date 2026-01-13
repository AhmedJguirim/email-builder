import type { Block, SpacerBlock } from '../../types/blocks';
import type { BlockHandler, BlockHandlerCallbacks } from './types';

export const spacerHandler: BlockHandler = {
  renderProperties(block: Block): string {
    if (block.type !== 'spacer') return '';
    const spacer = block as SpacerBlock;
    return `
      <div class="property-group">
        <label>Height</label>
        <input type="text" id="spacer-height" value="${spacer.height}" />
      </div>
    `;
  },

  attachListeners(
    properties: HTMLElement,
    block: Block,
    callbacks: BlockHandlerCallbacks
  ): void {
    if (block.type !== 'spacer') return;

    const heightInput = properties.querySelector('#spacer-height') as HTMLInputElement;
    if (heightInput) {
      heightInput.addEventListener('change', () => {
        callbacks.updateBlock(block.id, { height: heightInput.value } as Partial<Block>);
        callbacks.renderCanvas();
      });
    }
  },
};
