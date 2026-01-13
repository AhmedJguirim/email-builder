import type { Block, VideoBlock } from '../../types/blocks';
import type { BlockHandler, BlockHandlerCallbacks } from './types';

export const videoHandler: BlockHandler = {
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
