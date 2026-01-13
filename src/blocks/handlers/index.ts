import type { BlockType } from '../../types/blocks';
import type { BlockHandler } from './types';

import { textHandler } from './text';
import { headingHandler } from './heading';
import { buttonHandler } from './button';
import { imageHandler } from './image';
import { dividerHandler } from './divider';
import { spacerHandler } from './spacer';
import { listHandler } from './list';
import { videoHandler } from './video';
import { socialHandler } from './social';
import { menuHandler } from './menu';
import { logoHandler } from './logo';
import { headerHandler } from './header';
import { footerHandler } from './footer';
import { htmlHandler } from './html';
import { columnsHandler } from './columns';

export const blockHandlers: Partial<Record<BlockType, BlockHandler>> = {
  text: textHandler,
  heading: headingHandler,
  button: buttonHandler,
  image: imageHandler,
  divider: dividerHandler,
  spacer: spacerHandler,
  list: listHandler,
  video: videoHandler,
  social: socialHandler,
  menu: menuHandler,
  logo: logoHandler,
  header: headerHandler,
  footer: footerHandler,
  html: htmlHandler,
  columns: columnsHandler,
};

export function getBlockHandler(type: BlockType): BlockHandler | undefined {
  return blockHandlers[type];
}

export * from './types';
