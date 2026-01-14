import type { Block, ImageBlock } from '../../types/blocks';
import { addStyleListener } from '../helpers';
import type { BlockHandler, BlockHandlerCallbacks } from './types';

export const imageHandler: BlockHandler = {
  renderContent(block: Block): string {
    if (block.type !== 'image') return '';
    const img = block as ImageBlock;
    if (!img.src) {
      return `<div class="placeholder image-placeholder">Click to add image</div>`;
    }
    const imgTag = `<img src="${img.src}" alt="${img.alt}" style="width: ${img.width || '100%'}; max-width: 100%; border: 0; line-height: 100%; height: auto; text-decoration: none; display: block; margin: 0 auto;" />`;
    return img.link ? `<a href="${img.link}">${imgTag}</a>` : imgTag;
  },

  renderProperties(block: Block): string {
    if (block.type !== 'image') return '';
    const img = block as ImageBlock;
    const currentWidth = parseInt(img.width || '100') || 100;
    return `
      <div class="property-group">
        <label>Image URL</label>
        <input type="url" id="img-src" value="${img.src}" />
        <button class="btn-upload" id="btn-upload-image">Upload</button>
      </div>
      <div class="property-group">
        <label>Alt Text</label>
        <input type="text" id="img-alt" value="${img.alt}" />
      </div>
      <div class="property-group">
        <label>Link URL</label>
        <input type="url" id="img-link" value="${img.link || ''}" />
      </div>
      <div class="property-group">
        <label>Width: <span id="img-width-value">${img.width || '100%'}</span></label>
        <input type="range" id="img-width-slider" min="10" max="100" value="${currentWidth}" style="width: 100%;" />
        <input type="text" id="img-width" value="${img.width || '100%'}" style="margin-top: 4px;" />
      </div>
    `;
  },

  attachListeners(
    properties: HTMLElement,
    block: Block,
    callbacks: BlockHandlerCallbacks
  ): void {
    if (block.type !== 'image') return;

    addStyleListener('backgroundColor', properties, block, callbacks,'#block-bg-color');
    addStyleListener('paddingLeft', properties, block, callbacks,'#padding-left');
    addStyleListener('paddingRight', properties, block, callbacks,'#padding-right');
    addStyleListener('paddingTop', properties, block, callbacks,'#padding-top');
    addStyleListener('paddingBottom', properties, block, callbacks,'#padding-bottom');

    const handlers: Record<string, (value: string) => Partial<Block>> = {
      'img-src': (v) => ({ src: v }),
      'img-alt': (v) => ({ alt: v }),
      'img-link': (v) => ({ link: v }),
      'img-width': (v) => ({ width: v }),
    };

    Object.keys(handlers).forEach((id) => {
      const el = properties.querySelector(`#${id}`) as HTMLInputElement;
      if (el) {
        el.addEventListener('change', () => {
          callbacks.updateBlock(block.id, handlers[id](el.value) as Partial<Block>);
          callbacks.renderCanvas();
        });
      }
    });

    const uploadBtn = properties.querySelector('#btn-upload-image');
    if (uploadBtn) {
      uploadBtn.addEventListener('click', () => callbacks.handleImageUpload(block.id));
    }

    const slider = properties.querySelector('#img-width-slider') as HTMLInputElement;
    const widthInput = properties.querySelector('#img-width') as HTMLInputElement;
    const widthValue = properties.querySelector('#img-width-value');
    if (slider && widthInput) {
      slider.addEventListener('input', () => {
        const value = `${slider.value}%`;
        widthInput.value = value;
        if (widthValue) widthValue.textContent = value;
        callbacks.updateBlock(block.id, { width: value } as Partial<Block>);
        callbacks.renderCanvas();
      });
    }
  },
};
