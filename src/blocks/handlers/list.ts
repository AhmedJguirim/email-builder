import type { Block, ListBlock } from '../../types/blocks';
import type { BlockHandler, BlockHandlerCallbacks } from './types';

export const listHandler: BlockHandler = {
  renderContent(block: Block): string {
    if (block.type !== 'list') return '';
    const list = block as ListBlock;
    const listTag = list.listType === 'ordered' ? 'ol' : 'ul';
    return `<${listTag} style="margin: 0; padding-left: 20px;">${list.items.map(item => `<li>${item.content}</li>`).join('')}</${listTag}>`;
  },

  renderProperties(block: Block): string {
    if (block.type !== 'list') return '';
    const list = block as ListBlock;
    return `
      <div class="property-group">
        <label>List Type</label>
        <select id="list-type">
          <option value="unordered" ${list.listType === 'unordered' ? 'selected' : ''}>Bulleted</option>
          <option value="ordered" ${list.listType === 'ordered' ? 'selected' : ''}>Numbered</option>
        </select>
      </div>
      <div class="property-group">
        <label>List Items</label>
        <div class="list-items-editor">
          ${list.items.map((item, idx) => `
            <div class="list-item-row" data-item-id="${item.id}">
              <input type="text" class="list-item-input" data-index="${idx}" value="${item.content}" />
              <button class="btn-small btn-danger remove-list-item" data-index="${idx}">×</button>
            </div>
          `).join('')}
        </div>
        <button class="btn-upload add-list-item" id="add-list-item">+ Add Item</button>
      </div>
    `;
  },

  attachListeners(
    properties: HTMLElement,
    block: Block,
    callbacks: BlockHandlerCallbacks
  ): void {
    if (block.type !== 'list') return;
    const list = block as ListBlock;

    const typeSelect = properties.querySelector('#list-type') as HTMLSelectElement;
    if (typeSelect) {
      typeSelect.addEventListener('change', () => {
        callbacks.updateBlock(block.id, { listType: typeSelect.value as 'ordered' | 'unordered' } as Partial<Block>);
        callbacks.renderCanvas();
      });
    }

    properties.querySelectorAll('.list-item-input').forEach((input) => {
      input.addEventListener('change', () => {
        const index = parseInt((input as HTMLElement).dataset.index || '0');
        const newItems = [...list.items];
        newItems[index] = { ...newItems[index], content: (input as HTMLInputElement).value };
        list.items = newItems;
        callbacks.updateBlock(block.id, { items: newItems } as Partial<Block>);
        callbacks.renderCanvas();
      });
    });

    properties.querySelectorAll('.remove-list-item').forEach((btn) => {
      btn.addEventListener('click', () => {
        const index = parseInt((btn as HTMLElement).dataset.index || '0');
        const newItems = list.items.filter((_, i) => i !== index);
        callbacks.updateBlock(block.id, { items: newItems } as Partial<Block>);
        callbacks.renderProperties();
        callbacks.renderCanvas();
      });
    });

    const addBtn = properties.querySelector('#add-list-item');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        const newItems = [...list.items, { id: `list-item-${Date.now()}`, content: 'New item' }];
        callbacks.updateBlock(block.id, { items: newItems } as Partial<Block>);
        callbacks.renderProperties();
        callbacks.renderCanvas();
      });
    }
  },
};
