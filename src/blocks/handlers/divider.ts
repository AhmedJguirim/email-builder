import type { Block, DividerBlock } from '../../types/blocks';
import type { BlockHandler, BlockHandlerCallbacks } from './types';

export const dividerHandler: BlockHandler = {
  renderProperties(block: Block): string {
    if (block.type !== 'divider') return '';
    const div = block as DividerBlock;
    return `
      <div class="property-group">
        <label>Style</label>
        <select id="divider-style">
          <option value="solid" ${div.dividerStyles.style === 'solid' ? 'selected' : ''}>Solid</option>
          <option value="dashed" ${div.dividerStyles.style === 'dashed' ? 'selected' : ''}>Dashed</option>
          <option value="dotted" ${div.dividerStyles.style === 'dotted' ? 'selected' : ''}>Dotted</option>
        </select>
      </div>
      <div class="property-group">
        <label>Color</label>
        <input type="color" id="divider-color" value="${div.dividerStyles.color}" />
      </div>
      <div class="property-group">
        <label>Thickness</label>
        <input type="text" id="divider-thickness" value="${div.dividerStyles.thickness}" />
      </div>
      <div class="property-group">
        <label>Width</label>
        <input type="text" id="divider-width" value="${div.dividerStyles.width}" />
      </div>
    `;
  },

  attachListeners(
    properties: HTMLElement,
    block: Block,
    callbacks: BlockHandlerCallbacks
  ): void {
    if (block.type !== 'divider') return;
    const div = block as DividerBlock;

    const handlers: Record<string, (value: string) => Partial<Block>> = {
      'divider-style': (v) => ({ dividerStyles: { ...div.dividerStyles, style: v as 'solid' | 'dashed' | 'dotted' } }),
      'divider-color': (v) => ({ dividerStyles: { ...div.dividerStyles, color: v } }),
      'divider-thickness': (v) => ({ dividerStyles: { ...div.dividerStyles, thickness: v } }),
      'divider-width': (v) => ({ dividerStyles: { ...div.dividerStyles, width: v } }),
    };

    Object.keys(handlers).forEach((id) => {
      const el = properties.querySelector(`#${id}`) as HTMLInputElement | HTMLSelectElement;
      if (el) {
        el.addEventListener('change', () => {
          callbacks.updateBlock(block.id, handlers[id](el.value) as Partial<Block>);
          callbacks.renderCanvas();
        });
      }
    });
  },
};
