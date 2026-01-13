import type { Block, HeaderBlock } from '../../types/blocks';
import type { BlockHandler, BlockHandlerCallbacks } from './types';

export const headerHandler: BlockHandler = {
  renderContent(block: Block): string {
    if (block.type !== 'header') return '';
    const header = block as HeaderBlock;
    return `<div style="font-size: 12px; color: #666;">${header.showWebVersion ? header.webVersionText : ''}</div>`;
  },

  renderProperties(block: Block): string {
    if (block.type !== 'header') return '';
    const header = block as HeaderBlock;
    return `
      <div class="property-group">
        <label>Preheader Text</label>
        <input type="text" id="header-preheader" value="${header.preheaderText || ''}" placeholder="Preview text shown in inbox" />
      </div>
      <div class="property-group">
        <label>
          <input type="checkbox" id="header-show-web" ${header.showWebVersion ? 'checked' : ''} />
          Show "View in Browser" Link
        </label>
      </div>
      <div class="property-group">
        <label>Web Version Text</label>
        <input type="text" id="header-web-text" value="${header.webVersionText || 'View in browser'}" />
      </div>
    `;
  },

  attachListeners(
    properties: HTMLElement,
    block: Block,
    callbacks: BlockHandlerCallbacks
  ): void {
    if (block.type !== 'header') return;

    const preheaderInput = properties.querySelector('#header-preheader') as HTMLInputElement;
    if (preheaderInput) {
      preheaderInput.addEventListener('change', () => {
        callbacks.updateBlock(block.id, { preheaderText: preheaderInput.value } as Partial<Block>);
        callbacks.renderCanvas();
      });
    }

    const showWebCheckbox = properties.querySelector('#header-show-web') as HTMLInputElement;
    if (showWebCheckbox) {
      showWebCheckbox.addEventListener('change', () => {
        callbacks.updateBlock(block.id, { showWebVersion: showWebCheckbox.checked } as Partial<Block>);
        callbacks.renderCanvas();
      });
    }

    const webTextInput = properties.querySelector('#header-web-text') as HTMLInputElement;
    if (webTextInput) {
      webTextInput.addEventListener('change', () => {
        callbacks.updateBlock(block.id, { webVersionText: webTextInput.value } as Partial<Block>);
        callbacks.renderCanvas();
      });
    }
  },
};
