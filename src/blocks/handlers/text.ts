import type { Block, TextBlock } from '../../types/blocks';
import { addStyleListener } from '../helpers';
import type { BlockHandler, BlockHandlerCallbacks } from './types';

export const textHandler: BlockHandler = {
  renderContent(block: Block): string {
    if (block.type !== 'text') return '';
    const textBlock = block as TextBlock;
    return `<div class="editable-text" contenteditable="true">${textBlock.content}</div>`;
  },

  renderProperties(block: Block): string {
    if (block.type !== 'text') return '';
    return `
    `;
  },

  attachListeners(
    properties: HTMLElement,
    block: Block,
    callbacks: BlockHandlerCallbacks
  ): void {
    if (block.type !== 'text') return;

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
