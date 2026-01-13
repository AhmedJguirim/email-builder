import type { Block, LogoBlock } from '../../types/blocks';
import type { BlockHandler, BlockHandlerCallbacks } from './types';

export const logoHandler: BlockHandler = {
  renderContent(block: Block): string {
    if (block.type !== 'logo') return '';
    const logo = block as LogoBlock;
    if (!logo.src) {
      return `<div class="placeholder logo-placeholder">Click to add logo</div>`;
    }
    const marginStyle = logo.alignment === 'center' ? '0 auto' : logo.alignment === 'right' ? '0 0 0 auto' : '0 auto 0 0';
    const imgTag = `<img src="${logo.src}" alt="${logo.alt}" style="width: ${logo.width}; height: auto; display: block; margin: ${marginStyle};" />`;
    return logo.link ? `<a href="${logo.link}">${imgTag}</a>` : imgTag;
  },

  renderProperties(block: Block): string {
    if (block.type !== 'logo') return '';
    const logo = block as LogoBlock;
    return `
      <div class="property-group">
        <label>Logo URL</label>
        <input type="url" id="logo-src" value="${logo.src}" />
        <button class="btn-upload" id="btn-upload-logo">Upload Logo</button>
      </div>
      <div class="property-group">
        <label>Alt Text</label>
        <input type="text" id="logo-alt" value="${logo.alt}" />
      </div>
      <div class="property-group">
        <label>Link URL</label>
        <input type="url" id="logo-link" value="${logo.link || ''}" />
      </div>
      <div class="property-group">
        <label>Width</label>
        <input type="text" id="logo-width" value="${logo.width}" />
      </div>
      <div class="property-group">
        <label>Alignment</label>
        <select id="logo-alignment">
          <option value="left" ${logo.alignment === 'left' ? 'selected' : ''}>Left</option>
          <option value="center" ${logo.alignment === 'center' ? 'selected' : ''}>Center</option>
          <option value="right" ${logo.alignment === 'right' ? 'selected' : ''}>Right</option>
        </select>
      </div>
    `;
  },

  attachListeners(
    properties: HTMLElement,
    block: Block,
    callbacks: BlockHandlerCallbacks
  ): void {
    if (block.type !== 'logo') return;

    const handlers: Record<string, (value: string) => Partial<Block>> = {
      'logo-src': (v) => ({ src: v }),
      'logo-alt': (v) => ({ alt: v }),
      'logo-link': (v) => ({ link: v }),
      'logo-width': (v) => ({ width: v }),
      'logo-alignment': (v) => ({ alignment: v as 'left' | 'center' | 'right' }),
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

    const uploadBtn = properties.querySelector('#btn-upload-logo');
    if (uploadBtn) {
      uploadBtn.addEventListener('click', () => callbacks.handleImageUpload(block.id));
    }
  },
};
