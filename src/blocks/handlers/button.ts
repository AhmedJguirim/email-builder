import type { Block, ButtonBlock } from '../../types/blocks';
import { addStyleListener } from '../helpers';
import type { BlockHandler, BlockHandlerCallbacks } from './types';

export const buttonHandler: BlockHandler = {
  renderContent(block: Block): string {
    if (block.type !== 'button') return '';
    const btn = block as ButtonBlock;
    const displayStyle = btn.buttonStyles.fullWidth ? 'display: block; width: 100%;' : 'display: inline-block;';
    return `
      <a href="${btn.link}" class="email-button" style="
        ${displayStyle}
        background-color: ${btn.buttonStyles.backgroundColor};
        color: ${btn.buttonStyles.textColor};
        padding: ${btn.buttonStyles.paddingY} ${btn.buttonStyles.paddingX};
        border-radius: ${btn.buttonStyles.borderRadius};
        text-decoration: ${btn.buttonStyles.textDecoration || 'none'};
        font-style: ${btn.buttonStyles.fontStyle || 'normal'};
        font-weight: ${btn.buttonStyles.fontWeight};
      ">${btn.text}</a>
    `;
  },

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
        <label>Text Style</label>
        <div>
          <button type="button" id="btn-bold" class="btn-small">B</button>
          <button type="button" id="btn-italic" class="btn-small">I</button>
          <button type="button" id="btn-underline" class="btn-small">U</button>
        </div>
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

    addStyleListener('backgroundColor', properties, block, callbacks,'#block-bg-color');
    addStyleListener('paddingLeft', properties, block, callbacks,'#padding-left');
    addStyleListener('paddingRight', properties, block, callbacks,'#padding-right');
    addStyleListener('paddingTop', properties, block, callbacks,'#padding-top');
    addStyleListener('paddingBottom', properties, block, callbacks,'#padding-bottom');
    addStyleListener('fontSize', properties, block, callbacks,'#font-size');
    addStyleListener('color', properties, block, callbacks,'#text-color');
    addStyleListener('lineHeight', properties, block, callbacks,'#line-height');

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

    // Toggle style buttons
    const boldBtn = properties.querySelector('#btn-bold') as HTMLButtonElement | null;
    const italicBtn = properties.querySelector('#btn-italic') as HTMLButtonElement | null;
    const underlineBtn = properties.querySelector('#btn-underline') as HTMLButtonElement | null;

    if (boldBtn) {
      boldBtn.addEventListener('click', () => {
        const next = btn.buttonStyles.fontWeight === '700' ? '400' : '700';
        btn.buttonStyles.fontWeight = next;
        callbacks.updateBlock(block.id, { buttonStyles: { ...btn.buttonStyles, fontWeight: next } } as Partial<Block>);
        callbacks.renderCanvas();
        console.log(btn.buttonStyles);
      });
    }

    if (italicBtn) {
      italicBtn.addEventListener('click', () => {
        const current = btn.buttonStyles.fontStyle || 'normal';
        const next = current === 'italic' ? 'normal' : 'italic';
        btn.buttonStyles.fontStyle = next;
        callbacks.updateBlock(block.id, { buttonStyles: { ...btn.buttonStyles, fontStyle: next } } as Partial<Block>);
        callbacks.renderCanvas();
        console.log(btn.buttonStyles);
      });
    }

    if (underlineBtn) {
      underlineBtn.addEventListener('click', () => {
        const current = btn.buttonStyles.textDecoration || 'none';
        const next = current === 'underline' ? 'none' : 'underline';
        btn.buttonStyles.textDecoration = next;
        callbacks.updateBlock(block.id, { buttonStyles: { ...btn.buttonStyles, textDecoration: next } } as Partial<Block>);
        callbacks.renderCanvas();
        console.log(btn.buttonStyles);
      });
    }
  },
};
