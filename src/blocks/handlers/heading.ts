import { BlockStyles } from '@/types';
import type { Block, HeadingBlock } from '../../types/blocks';
import type { BlockHandler, BlockHandlerCallbacks } from './types';
import { addStyleListener } from '../helpers';

export const headingHandler: BlockHandler = {
  renderContent(block: Block): string {
    if (block.type !== 'heading') return '';
    const heading = block as HeadingBlock;
    return `<h${heading.level} class="editable-heading" contenteditable="true"
    style="
      padding-left: ${heading.styles.paddingLeft}px;
      padding-right: ${heading.styles.paddingRight}px;
      padding-top: ${heading.styles.paddingTop}px;
      padding-bottom: ${heading.styles.paddingBottom}px;
    "
    >${heading.content}</h${heading.level}>`;
  },

  renderProperties(block: Block): string {
    if (block.type !== 'heading') return '';
    const heading = block as HeadingBlock;
    return `
      <div class="property-group">
        <label>Heading Level</label>
        <select id="heading-level">
          <option value="1" ${heading.level === 1 ? 'selected' : ''}>Header 1</option>
          <option value="2" ${heading.level === 2 ? 'selected' : ''}>Header 2</option>
          <option value="3" ${heading.level === 3 ? 'selected' : ''}>Header 3</option>
          <option value="4" ${heading.level === 4 ? 'selected' : ''}>Header 4</option>
          <option value="5" ${heading.level === 5 ? 'selected' : ''}>Header 5</option>
          <option value="6" ${heading.level === 6 ? 'selected' : ''}>Header 6</option>
        </select>
      </div>
    `;
  },

  attachListeners(
    properties: HTMLElement,
    block: Block,
    callbacks: BlockHandlerCallbacks
  ): void {
    if (block.type !== 'heading') return;

    const levelSelect = properties.querySelector('#heading-level') as HTMLSelectElement;
    if (levelSelect) {
      levelSelect.addEventListener('change', () => {
        callbacks.updateBlock(block.id, { level: parseInt(levelSelect.value) as 1 | 2 | 3 | 4 | 5 | 6 } as Partial<Block>);
        callbacks.renderCanvas();
      });
    }

    addStyleListener('backgroundColor', properties, block, callbacks,'#block-bg-color');
    addStyleListener('paddingLeft', properties, block, callbacks,'#padding-left');
    addStyleListener('paddingRight', properties, block, callbacks,'#padding-right');
    addStyleListener('paddingTop', properties, block, callbacks,'#padding-top');
    addStyleListener('paddingBottom', properties, block, callbacks,'#padding-bottom');
    addStyleListener('fontSize', properties, block, callbacks,'#font-size');
    addStyleListener('color', properties, block, callbacks,'#text-color');
    addStyleListener('lineHeight', properties, block, callbacks,'#line-height');

  },
};
