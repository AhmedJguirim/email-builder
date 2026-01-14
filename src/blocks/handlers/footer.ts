import type { Block, FooterBlock } from '../../types/blocks';
import { addStyleListener } from '../helpers';
import type { BlockHandler, BlockHandlerCallbacks } from './types';

export const footerHandler: BlockHandler = {
  renderContent(block: Block): string {
    if (block.type !== 'footer') return '';
    const footer = block as FooterBlock;
    return `<div style="font-size: 12px; color: #666;">${footer.content}</div>`;
  },

  renderProperties(block: Block): string {
    if (block.type !== 'footer') return '';
    const footer = block as FooterBlock;
    return `
      <div class="property-group">
        <label>Footer Content</label>
        <textarea id="footer-content" rows="3">${footer.content}</textarea>
      </div>
      <div class="property-group">
        <label>
          <input type="checkbox" id="footer-show-unsubscribe" ${footer.showUnsubscribe ? 'checked' : ''} />
          Show Unsubscribe Link
        </label>
      </div>
      <div class="property-group">
        <label>
          <input type="checkbox" id="footer-show-address" ${footer.showAddress ? 'checked' : ''} />
          Show Company Address
        </label>
      </div>
      <div class="property-group">
        <label>Company Address</label>
        <input type="text" id="footer-address" value="${footer.address || ''}" />
      </div>
    `;
  },

  attachListeners(
    properties: HTMLElement,
    block: Block,
    callbacks: BlockHandlerCallbacks
  ): void {
    if (block.type !== 'footer') return;

    addStyleListener('backgroundColor', properties, block, callbacks,'#block-bg-color');
    addStyleListener('paddingLeft', properties, block, callbacks,'#padding-left');
    addStyleListener('paddingRight', properties, block, callbacks,'#padding-right');
    addStyleListener('paddingTop', properties, block, callbacks,'#padding-top');
    addStyleListener('paddingBottom', properties, block, callbacks,'#padding-bottom');
    addStyleListener('fontSize', properties, block, callbacks,'#font-size');
    addStyleListener('color', properties, block, callbacks,'#text-color');
    addStyleListener('lineHeight', properties, block, callbacks,'#line-height');

    const contentTextarea = properties.querySelector('#footer-content') as HTMLTextAreaElement;
    if (contentTextarea) {
      contentTextarea.addEventListener('change', () => {
        callbacks.updateBlock(block.id, { content: contentTextarea.value } as Partial<Block>);
        callbacks.renderCanvas();
      });
    }

    const showUnsubscribeCheckbox = properties.querySelector('#footer-show-unsubscribe') as HTMLInputElement;
    if (showUnsubscribeCheckbox) {
      showUnsubscribeCheckbox.addEventListener('change', () => {
        callbacks.updateBlock(block.id, { showUnsubscribe: showUnsubscribeCheckbox.checked } as Partial<Block>);
        callbacks.renderCanvas();
      });
    }

    const showAddressCheckbox = properties.querySelector('#footer-show-address') as HTMLInputElement;
    if (showAddressCheckbox) {
      showAddressCheckbox.addEventListener('change', () => {
        callbacks.updateBlock(block.id, { showAddress: showAddressCheckbox.checked } as Partial<Block>);
        callbacks.renderCanvas();
      });
    }

    const addressInput = properties.querySelector('#footer-address') as HTMLInputElement;
    if (addressInput) {
      addressInput.addEventListener('change', () => {
        callbacks.updateBlock(block.id, { address: addressInput.value } as Partial<Block>);
        callbacks.renderCanvas();
      });
    }
  },
};
