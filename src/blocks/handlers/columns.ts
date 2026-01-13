import type { Block, ColumnsBlock } from '../../types/blocks';
import type { BlockHandler, BlockHandlerCallbacks } from './types';

export const columnsHandler: BlockHandler = {
  renderContent(block: Block): string {
    if (block.type !== 'columns') return '';
    const columns = block as ColumnsBlock;
    // Note: Columns rendering requires access to renderBlockEditor which is in MailBuilder
    // This will be handled specially in MailBuilder.renderBlockContent
    return '';
  },

  renderProperties(block: Block): string {
    if (block.type !== 'columns') return '';
    const columns = block as ColumnsBlock;
    return `
      <div class="property-group">
        <label>Number of Columns</label>
        <select id="columns-count">
          <option value="1" ${columns.columns.length === 1 ? 'selected' : ''}>1 Column</option>
          <option value="2" ${columns.columns.length === 2 ? 'selected' : ''}>2 Columns</option>
          <option value="3" ${columns.columns.length === 3 ? 'selected' : ''}>3 Columns</option>
          <option value="4" ${columns.columns.length === 4 ? 'selected' : ''}>4 Columns</option>
        </select>
      </div>
      <div class="property-group">
        <label>Gap</label>
        <input type="text" id="columns-gap" value="${columns.gap}" />
      </div>
      <div class="property-group">
        <label>
          <input type="checkbox" id="columns-stack-mobile" ${columns.stackOnMobile ? 'checked' : ''} />
          Stack on Mobile
        </label>
      </div>
      <div class="property-group">
        <label>
          <input type="checkbox" id="columns-reverse-mobile" ${columns.mobileReverse ? 'checked' : ''} />
          Reverse Order on Mobile
        </label>
      </div>
      <div class="property-group">
        <label>Column Widths</label>
        ${columns.columns.map((col, idx) => `
          <div style="margin-bottom: 4px;">
            <label style="font-size: 11px;">Column ${idx + 1}</label>
            <input type="text" class="column-width-input" data-index="${idx}" value="${col.width}" style="width: 100%;" />
          </div>
        `).join('')}
      </div>
    `;
  },

  attachListeners(
    properties: HTMLElement,
    block: Block,
    callbacks: BlockHandlerCallbacks
  ): void {
    if (block.type !== 'columns') return;
    const columns = block as ColumnsBlock;

    const gapInput = properties.querySelector('#columns-gap') as HTMLInputElement;
    if (gapInput) {
      gapInput.addEventListener('change', () => {
        callbacks.updateBlock(block.id, { gap: gapInput.value } as Partial<Block>);
        callbacks.renderCanvas();
      });
    }

    const stackCheckbox = properties.querySelector('#columns-stack-mobile') as HTMLInputElement;
    if (stackCheckbox) {
      stackCheckbox.addEventListener('change', () => {
        callbacks.updateBlock(block.id, { stackOnMobile: stackCheckbox.checked } as Partial<Block>);
        callbacks.renderCanvas();
      });
    }

    const reverseCheckbox = properties.querySelector('#columns-reverse-mobile') as HTMLInputElement;
    if (reverseCheckbox) {
      reverseCheckbox.addEventListener('change', () => {
        callbacks.updateBlock(block.id, { mobileReverse: reverseCheckbox.checked } as Partial<Block>);
        callbacks.renderCanvas();
      });
    }

    properties.querySelectorAll('.column-width-input').forEach((input) => {
      input.addEventListener('change', () => {
        const index = parseInt((input as HTMLElement).dataset.index || '0');
        const newColumns = [...columns.columns];
        newColumns[index] = { ...newColumns[index], width: (input as HTMLInputElement).value };
        callbacks.updateBlock(block.id, { columns: newColumns } as Partial<Block>);
        callbacks.renderCanvas();
      });
    });
  },
};
