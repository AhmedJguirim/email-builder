import type { Block, SocialBlock, SocialLink } from '../../types/blocks';
import type { BlockHandler, BlockHandlerCallbacks } from './types';
import { getSocialIcon } from './social-helper';

export const socialHandler: BlockHandler = {
  renderContent(block: Block): string {
    if (block.type !== 'social') return '';
    const social = block as SocialBlock;
    return `
      <div style="text-align: ${social.alignment};">
        ${social.links.map(link => `
          <a href="${link.url}" style="display: inline-block; margin: 0 ${social.spacing}; text-decoration: none;">
            ${getSocialIcon(link.platform, social.iconSize, social.iconStyle)}
          </a>
        `).join('')}
      </div>
    `;
  },

  renderProperties(block: Block): string {
    if (block.type !== 'social') return '';
    const social = block as SocialBlock;
    return `
      <div class="property-group">
        <label>Alignment</label>
        <select id="social-alignment">
          <option value="left" ${social.alignment === 'left' ? 'selected' : ''}>Left</option>
          <option value="center" ${social.alignment === 'center' ? 'selected' : ''}>Center</option>
          <option value="right" ${social.alignment === 'right' ? 'selected' : ''}>Right</option>
        </select>
      </div>
      <div class="property-group">
        <label>Icon Size</label>
        <input type="text" id="social-icon-size" value="${social.iconSize}" />
      </div>
      <div class="property-group">
        <label>Icon Style</label>
        <select id="social-icon-style">
          <option value="color" ${social.iconStyle === 'color' ? 'selected' : ''}>Color</option>
          <option value="dark" ${social.iconStyle === 'dark' ? 'selected' : ''}>Dark</option>
          <option value="light" ${social.iconStyle === 'light' ? 'selected' : ''}>Light</option>
          <option value="outline" ${social.iconStyle === 'outline' ? 'selected' : ''}>Outline</option>
        </select>
      </div>
      <div class="property-group">
        <label>Spacing</label>
        <input type="text" id="social-spacing" value="${social.spacing}" />
      </div>
      <div class="property-group">
        <label>Social Links</label>
        <div class="social-links-editor">
          ${social.links.map((link, idx) => `
            <div class="social-link-row" data-link-id="${link.id}">
              <select class="social-platform-select" data-index="${idx}">
                <option value="facebook" ${link.platform === 'facebook' ? 'selected' : ''}>Facebook</option>
                <option value="twitter" ${link.platform === 'twitter' ? 'selected' : ''}>Twitter/X</option>
                <option value="instagram" ${link.platform === 'instagram' ? 'selected' : ''}>Instagram</option>
                <option value="linkedin" ${link.platform === 'linkedin' ? 'selected' : ''}>LinkedIn</option>
                <option value="youtube" ${link.platform === 'youtube' ? 'selected' : ''}>YouTube</option>
                <option value="tiktok" ${link.platform === 'tiktok' ? 'selected' : ''}>TikTok</option>
                <option value="pinterest" ${link.platform === 'pinterest' ? 'selected' : ''}>Pinterest</option>
              </select>
              <input type="url" class="social-url-input" data-index="${idx}" value="${link.url}" placeholder="https://..." />
              <button class="btn-small btn-danger remove-social-link" data-index="${idx}">×</button>
            </div>
          `).join('')}
        </div>
        <button class="btn-upload add-social-link" id="add-social-link">+ Add Link</button>
      </div>
    `;
  },

  attachListeners(
    properties: HTMLElement,
    block: Block,
    callbacks: BlockHandlerCallbacks
  ): void {
    if (block.type !== 'social') return;
    const social = block as SocialBlock;

    const simpleHandlers: Record<string, (value: string) => Partial<Block>> = {
      'social-alignment': (v) => ({ alignment: v as 'left' | 'center' | 'right' }),
      'social-icon-size': (v) => ({ iconSize: v }),
      'social-icon-style': (v) => ({ iconStyle: v as 'color' | 'dark' | 'light' | 'outline' }),
      'social-spacing': (v) => ({ spacing: v }),
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

    properties.querySelectorAll('.social-platform-select').forEach((select) => {
      select.addEventListener('change', () => {
        const index = parseInt((select as HTMLElement).dataset.index || '0');
        const newLinks = [...social.links];
        newLinks[index] = { ...newLinks[index], platform: (select as HTMLSelectElement).value as SocialLink['platform'] };
        callbacks.updateBlock(block.id, { links: newLinks } as Partial<Block>);
        callbacks.renderCanvas();
      });
    });

    properties.querySelectorAll('.social-url-input').forEach((input) => {
      input.addEventListener('change', () => {
        const index = parseInt((input as HTMLElement).dataset.index || '0');
        const newLinks = [...social.links];
        newLinks[index] = { ...newLinks[index], url: (input as HTMLInputElement).value };
        callbacks.updateBlock(block.id, { links: newLinks } as Partial<Block>);
        callbacks.renderCanvas();
      });
    });

    properties.querySelectorAll('.remove-social-link').forEach((btn) => {
      btn.addEventListener('click', () => {
        const index = parseInt((btn as HTMLElement).dataset.index || '0');
        const newLinks = social.links.filter((_, i) => i !== index);
        callbacks.updateBlock(block.id, { links: newLinks } as Partial<Block>);
        callbacks.renderProperties();
        callbacks.renderCanvas();
      });
    });

    const addBtn = properties.querySelector('#add-social-link');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        const newLinks: SocialLink[] = [...social.links, { id: `social-link-${Date.now()}`, platform: 'facebook', url: '#' }];
        callbacks.updateBlock(block.id, { links: newLinks } as Partial<Block>);
        callbacks.renderProperties();
        callbacks.renderCanvas();
      });
    }
  },
};
