// Main library exports
export { MailBuilder, createMailBuilder } from './editor/MailBuilder';
export { useEditorStore } from './store';
export { EmailRenderer, renderEmail } from './renderer/EmailRenderer';
export { createStorageProvider, S3StorageProvider, MinioStorageProvider } from './storage';
export { dragDropManager, DragDropManager } from './editor/DragDropManager';
export { keyboardManager, KeyboardManager } from './editor/KeyboardManager';

// Block factories
export {
  createBlock,
  createTextBlock,
  createHeadingBlock,
  createImageBlock,
  createButtonBlock,
  createDividerBlock,
  createSpacerBlock,
  createColumnsBlock,
  createColumnBlock,
  createSocialBlock,
  createVideoBlock,
  createHtmlBlock,
  createMenuBlock,
  createFooterBlock,
  createHeaderBlock,
  createLogoBlock,
  createListBlock,
  BLOCK_DEFINITIONS,
} from './blocks/factory';

// Types
export type {
  Block,
  BlockType,
  TextBlock,
  HeadingBlock,
  ImageBlock,
  ButtonBlock,
  DividerBlock,
  SpacerBlock,
  ColumnsBlock,
  ColumnBlock,
  SocialBlock,
  VideoBlock,
  HtmlBlock,
  MenuBlock,
  FooterBlock,
  HeaderBlock,
  LogoBlock,
  ListBlock,
  BlockDefinition,
} from './types/blocks';

export type {
  EditorState,
  EditorConfig,
  EditorTheme,
  StorageConfig,
  EmailData,
  EmailMetadata,
  CustomBlockDefinition,
  RenderContext,
  BlockSettingDefinition,
  EditorAction,
} from './types/editor';

export type {
  BlockStyles,
  EmailStyles,
} from './types/styles';

export {
  DEFAULT_EMAIL_STYLES,
  DEFAULT_BLOCK_STYLES,
  FONT_FAMILIES,
  FONT_SIZES,
  FONT_WEIGHTS,
} from './types/styles';

export type {
  Variable,
  VariableGroup,
} from './types/variables';

export {
  DEFAULT_VARIABLES,
  VARIABLE_PATTERN,
  parseVariables,
  replaceVariables,
  createVariableTag,
  isValidVariableKey,
} from './types/variables';

export type {
  StorageProvider,
  UploadResult,
  StorageObject,
  S3Config,
  MinioConfig,
  Asset,
  AssetFolder,
  AssetLibrary,
  ImageOptimizationOptions,
} from './types/storage';

export {
  SUPPORTED_IMAGE_TYPES,
  MAX_FILE_SIZE,
} from './types/storage';

// Utilities
export {
  generateId,
  generateBlockId,
  generateShortId,
} from './utils/id';

export {
  stylesToCss,
  stylesToInlineStyle,
  parseInlineStyles,
  mergeStyles,
  getPaddingShorthand,
  getMarginShorthand,
} from './utils/styles';

export {
  escapeHtml,
  unescapeHtml,
  sanitizeHtml,
  stripHtmlTags,
  wrapInTable,
  createEmailWrapper,
  createConditionalComment,
} from './utils/html';
