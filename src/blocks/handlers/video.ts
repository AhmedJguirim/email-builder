import type { Block, VideoBlock } from '../../types/blocks';
import { addStyleListener } from '../helpers';
import type { BlockHandler, BlockHandlerCallbacks } from './types';

function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/);
  return match ? match[1] : null;
}

export const videoHandler: BlockHandler = {
  renderContent(block: Block): string {
    if (block.type !== 'video') return '';
    const video = block as VideoBlock;
    if (!video.videoUrl) {
      return `<div class="placeholder video-placeholder">Click to add video URL</div>`;
    }
    const videoId = extractYouTubeId(video.videoUrl);
    const thumbnailUrl = video.thumbnailUrl || (videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : '');
    return `
      <div class="video-preview" style="position: relative; cursor: pointer;">
        ${thumbnailUrl 
          ? `<img src="${thumbnailUrl}" alt="Video thumbnail" style="width: 100%; height: auto; display: block;" onerror="this.src='https://img.youtube.com/vi/${videoId}/hqdefault.jpg'" />`
          : `<div style="background: #000; padding: 80px; text-align: center; color: #fff;">Video: ${video.videoUrl}</div>`
        }
        <div class="play-button-overlay" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 68px; height: 48px; background: ${video.playButtonColor}; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </div>
      </div>
    `;
  },

  renderProperties(block: Block): string {
    if (block.type !== 'video') return '';
    const video = block as VideoBlock;
    return `
      <div class="property-group">
        <label>YouTube URL</label>
        <input type="url" id="video-url" value="${video.videoUrl}" placeholder="https://youtube.com/watch?v=..." />
      </div>
      <div class="property-group">
        <label>Custom Thumbnail URL (optional)</label>
        <input type="url" id="video-thumbnail" value="${video.thumbnailUrl || ''}" placeholder="Leave empty for auto-generated" />
      </div>
      <div class="property-group">
        <label>Play Button Color</label>
        <input type="color" id="video-play-color" value="${video.playButtonColor}" />
      </div>
    `;
  },

  attachListeners(
    properties: HTMLElement,
    block: Block,
    callbacks: BlockHandlerCallbacks
  ): void {
    if (block.type !== 'video') return;

    const handlers: Record<string, (value: string) => Partial<Block>> = {
      'video-url': (v) => ({ videoUrl: v }),
      'video-thumbnail': (v) => ({ thumbnailUrl: v }),
      'video-play-color': (v) => ({ playButtonColor: v }),
    };

    addStyleListener('backgroundColor', properties, block, callbacks,'#block-bg-color');
    addStyleListener('paddingLeft', properties, block, callbacks,'#padding-left');
    addStyleListener('paddingRight', properties, block, callbacks,'#padding-right');
    addStyleListener('paddingTop', properties, block, callbacks,'#padding-top');
    addStyleListener('paddingBottom', properties, block, callbacks,'#padding-bottom');

    Object.keys(handlers).forEach((id) => {
      const el = properties.querySelector(`#${id}`) as HTMLInputElement;
      if (el) {
        el.addEventListener('change', () => {
          callbacks.updateBlock(block.id, handlers[id](el.value) as Partial<Block>);
          callbacks.renderCanvas();
        });
      }
    });
  },
};
