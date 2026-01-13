import type { Block, HtmlBlock } from '../../types/blocks';
import type { BlockHandler, BlockHandlerCallbacks } from './types';

export const htmlHandler: BlockHandler = {
  renderContent(block: Block): string {
    if (block.type !== 'html') return '';
    const html = block as HtmlBlock;
    return `<div class="html-preview">${html.content}</div>`;
  },

  renderProperties(block: Block): string {
    if (block.type !== 'html') return '';
    const html = block as HtmlBlock;
    return `
      <div class="property-group">
        <label>Custom HTML</label>
        <textarea id="html-content" rows="8" style="font-family: monospace;">${html.content}</textarea>
      </div>
    `;
  },

  attachListeners(
    properties: HTMLElement,
    block: Block,
    callbacks: BlockHandlerCallbacks
  ): void {
    if (block.type !== 'html') return;

    const contentTextarea = properties.querySelector('#html-content') as HTMLTextAreaElement;
    if (contentTextarea) {
      contentTextarea.addEventListener('change', () => {
        callbacks.updateBlock(block.id, { content: contentTextarea.value } as Partial<Block>);
        callbacks.renderCanvas();
      });
    }
  },
};
