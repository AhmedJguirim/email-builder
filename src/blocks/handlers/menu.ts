import type { Block, MenuBlock, MenuItem } from '../../types/blocks';
import type { BlockHandler, BlockHandlerCallbacks } from './types';

export const menuHandler: BlockHandler = {
  renderContent(block: Block): string {
    if (block.type !== 'menu') return '';
    const menu = block as MenuBlock;
    return `<div style="text-align: center;">${menu.items.map(item => `<a href="${item.link}" style="margin: 0 8px; color: inherit; text-decoration: none;">${item.text}</a>`).join(menu.separator)}</div>`;
  },

  renderProperties(block: Block): string {
    if (block.type !== 'menu') return '';
    const menu = block as MenuBlock;
    return `
      <div class="property-group">
        <label>Layout</label>
        <select id="menu-layout">
          <option value="horizontal" ${menu.layout === 'horizontal' ? 'selected' : ''}>Horizontal</option>
          <option value="vertical" ${menu.layout === 'vertical' ? 'selected' : ''}>Vertical</option>
        </select>
      </div>
      <div class="property-group">
        <label>Separator</label>
        <input type="text" id="menu-separator" value="${menu.separator}" />
      </div>
      <div class="property-group">
        <label>Menu Items</label>
        <div class="menu-items-editor">
          ${menu.items.map((item, idx) => `
            <div class="menu-item-row" data-item-id="${item.id}">
              <input type="text" class="menu-item-text" data-index="${idx}" value="${item.text}" placeholder="Text" />
              <input type="url" class="menu-item-link" data-index="${idx}" value="${item.link}" placeholder="Link URL" />
              <button class="btn-small btn-danger remove-menu-item" data-index="${idx}">×</button>
            </div>
          `).join('')}
        </div>
        <button class="btn-upload add-menu-item" id="add-menu-item">+ Add Item</button>
      </div>
    `;
  },

  attachListeners(
    properties: HTMLElement,
    block: Block,
    callbacks: BlockHandlerCallbacks
  ): void {
    if (block.type !== 'menu') return;
    const menu = block as MenuBlock;

    const simpleHandlers: Record<string, (value: string) => Partial<Block>> = {
      'menu-layout': (v) => ({ layout: v as 'horizontal' | 'vertical' }),
      'menu-separator': (v) => ({ separator: v }),
    };

    Object.keys(simpleHandlers).forEach((id) => {
      const el = properties.querySelector(`#${id}`) as HTMLInputElement | HTMLSelectElement;
      if (el) {
        el.addEventListener('change', () => {
          callbacks.updateBlock(block.id, simpleHandlers[id](el.value) as Partial<Block>);
          callbacks.renderCanvas();
        });
      }
    });

    properties.querySelectorAll('.menu-item-text').forEach((input) => {
      input.addEventListener('change', () => {
        const index = parseInt((input as HTMLElement).dataset.index || '0');
        const newItems = [...menu.items];
        newItems[index] = { ...newItems[index], text: (input as HTMLInputElement).value };
        callbacks.updateBlock(block.id, { items: newItems } as Partial<Block>);
        callbacks.renderCanvas();
      });
    });

    properties.querySelectorAll('.menu-item-link').forEach((input) => {
      input.addEventListener('change', () => {
        const index = parseInt((input as HTMLElement).dataset.index || '0');
        const newItems = [...menu.items];
        newItems[index] = { ...newItems[index], link: (input as HTMLInputElement).value };
        callbacks.updateBlock(block.id, { items: newItems } as Partial<Block>);
        callbacks.renderCanvas();
      });
    });

    properties.querySelectorAll('.remove-menu-item').forEach((btn) => {
      btn.addEventListener('click', () => {
        const index = parseInt((btn as HTMLElement).dataset.index || '0');
        const newItems = menu.items.filter((_, i) => i !== index);
        callbacks.updateBlock(block.id, { items: newItems } as Partial<Block>);
        callbacks.renderProperties();
        callbacks.renderCanvas();
      });
    });

    const addBtn = properties.querySelector('#add-menu-item');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        const newItems: MenuItem[] = [...menu.items, { id: `menu-item-${Date.now()}`, text: 'New Link', link: '#' }];
        callbacks.updateBlock(block.id, { items: newItems } as Partial<Block>);
        callbacks.renderProperties();
        callbacks.renderCanvas();
      });
    }
  },
};
