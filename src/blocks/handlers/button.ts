import type { Block, ButtonBlock } from '../../types/blocks';
import type { BlockHandler, BlockHandlerCallbacks } from './types';

export const buttonHandler: BlockHandler = {
  renderProperties(block: Block): string {
    if (block.type !== 'button') return '';
    const btn = block as ButtonBlock;
    return `
      <div class="property-group">
        <label>Button Text</label>
        <input type="text" id="btn-text" value="${btn.text}" />
      </div>
      <div class="property-group">
        <label>Link URL</label>
        <input type="url" id="btn-link" value="${btn.link}" />
      </div>
      <div class="property-group">
        <label>Background Color</label>
        <input type="color" id="btn-bg-color" value="${btn.buttonStyles.backgroundColor}" />
      </div>
      <div class="property-group">
        <label>Text Color</label>
        <input type="color" id="btn-text-color" value="${btn.buttonStyles.textColor}" />
      </div>
      <div class="property-group">
        <label>Border Radius</label>
        <input type="text" id="btn-radius" value="${btn.buttonStyles.borderRadius}" />
      </div>
      <div class="property-group">
        <label>Full Width</label>
        <input type="checkbox" id="btn-full-width" ${btn.buttonStyles.fullWidth ? 'checked' : ''} />
      </div>
    `;
  },

  attachListeners(
    properties: HTMLElement,
    block: Block,
    callbacks: BlockHandlerCallbacks
  ): void {
    if (block.type !== 'button') return;
    const btn = block as ButtonBlock;

    const handlers: Record<string, (value: string | boolean) => Partial<Block>> = {
      'btn-text': (v) => ({ text: v as string }),
      'btn-link': (v) => ({ link: v as string }),
      'btn-bg-color': (v) => ({ buttonStyles: { ...btn.buttonStyles, backgroundColor: v as string } }),
      'btn-text-color': (v) => ({ buttonStyles: { ...btn.buttonStyles, textColor: v as string } }),
      'btn-radius': (v) => ({ buttonStyles: { ...btn.buttonStyles, borderRadius: v as string } }),
      'btn-full-width': (v) => ({ buttonStyles: { ...btn.buttonStyles, fullWidth: v as boolean } }),
    };

    Object.keys(handlers).forEach((id) => {
      const el = properties.querySelector(`#${id}`) as HTMLInputElement;
      if (el) {
        el.addEventListener('change', () => {
          const value = el.type === 'checkbox' ? el.checked : el.value;
          callbacks.updateBlock(block.id, handlers[id](value) as Partial<Block>);
          callbacks.renderCanvas();
        });
      }
    });
  },
};
