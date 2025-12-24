import type { Block } from './blocks';
import type { EmailStyles } from './styles';
import type { Variable } from './variables';

export interface EditorState {
  blocks: Block[];
  selectedBlockId: string | null;
  hoveredBlockId: string | null;
  draggedBlockId: string | null;
  dropTargetId: string | null;
  dropPosition: 'before' | 'after' | 'inside' | null;
  emailStyles: EmailStyles;
  variables: Variable[];
  history: HistoryState;
  isDirty: boolean;
  previewMode: 'desktop' | 'mobile';
  showGrid: boolean;
  zoom: number;
}

export interface HistoryState {
  past: Block[][];
  future: Block[][];
}

export interface EditorConfig {
  container: HTMLElement | string;
  initialBlocks?: Block[];
  initialStyles?: Partial<EmailStyles>;
  variables?: Variable[];
  storage?: StorageConfig;
  theme?: EditorTheme;
  readOnly?: boolean;
  autosave?: boolean;
  autosaveInterval?: number;
  maxHistoryLength?: number;
  onBlockSelect?: (block: Block | null) => void;
  onBlockChange?: (blocks: Block[]) => void;
  onSave?: (data: EmailData) => void;
  onAssetUpload?: (file: File) => Promise<string>;
  customBlocks?: CustomBlockDefinition[];
}

export interface StorageConfig {
  type: 's3' | 'minio' | 'custom';
  endpoint?: string;
  bucket: string;
  region?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  pathPrefix?: string;
  customUploader?: (file: File) => Promise<string>;
}

export interface EditorTheme {
  primaryColor?: string;
  secondaryColor?: string;
  backgroundColor?: string;
  textColor?: string;
  borderRadius?: string;
  fontFamily?: string;
}

export interface EmailData {
  blocks: Block[];
  styles: EmailStyles;
  variables: Variable[];
  metadata: EmailMetadata;
}

export interface EmailMetadata {
  name?: string;
  subject?: string;
  preheader?: string;
  createdAt: string;
  updatedAt: string;
  version: string;
}

export interface CustomBlockDefinition {
  type: string;
  label: string;
  icon: string;
  category: 'content' | 'layout' | 'media' | 'social' | 'structure';
  defaultProps: Record<string, unknown>;
  render: (block: Block, ctx: RenderContext) => string;
  renderEditor: (block: Block, ctx: RenderContext) => HTMLElement;
  settings?: BlockSettingDefinition[];
}

export interface RenderContext {
  variables: Map<string, string>;
  isEditor: boolean;
  isMobile: boolean;
}

export interface BlockSettingDefinition {
  key: string;
  label: string;
  type: 'text' | 'number' | 'color' | 'select' | 'toggle' | 'slider' | 'image' | 'link' | 'richtext';
  options?: { label: string; value: string }[];
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: unknown;
}

export type EditorAction =
  | { type: 'SET_BLOCKS'; payload: Block[] }
  | { type: 'ADD_BLOCK'; payload: { block: Block; index?: number; parentId?: string } }
  | { type: 'UPDATE_BLOCK'; payload: { id: string; updates: Partial<Block> } }
  | { type: 'DELETE_BLOCK'; payload: string }
  | { type: 'MOVE_BLOCK'; payload: { id: string; toIndex: number; parentId?: string } }
  | { type: 'DUPLICATE_BLOCK'; payload: string }
  | { type: 'SELECT_BLOCK'; payload: string | null }
  | { type: 'HOVER_BLOCK'; payload: string | null }
  | { type: 'SET_DRAG'; payload: { blockId: string | null; targetId?: string | null; position?: 'before' | 'after' | 'inside' | null } }
  | { type: 'SET_EMAIL_STYLES'; payload: Partial<EmailStyles> }
  | { type: 'SET_VARIABLES'; payload: Variable[] }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'SET_PREVIEW_MODE'; payload: 'desktop' | 'mobile' }
  | { type: 'SET_ZOOM'; payload: number }
  | { type: 'TOGGLE_GRID' };
