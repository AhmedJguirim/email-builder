import type { BlockStyles } from './styles';

export type BlockType =
  | 'text'
  | 'heading'
  | 'image'
  | 'button'
  | 'divider'
  | 'spacer'
  | 'columns'
  | 'column'
  | 'social'
  | 'video'
  | 'html'
  | 'menu'
  | 'footer'
  | 'header'
  | 'logo'
  | 'list';

export interface BlockBase {
  id: string;
  type: BlockType;
  styles: BlockStyles;
  locked?: boolean;
  hidden?: boolean;
}

export interface TextBlock extends BlockBase {
  type: 'text';
  content: string;
  placeholder?: string;
}

export interface HeadingBlock extends BlockBase {
  type: 'heading';
  content: string;
  level: 1 | 2 | 3 | 4 | 5 | 6;
}

export interface ImageBlock extends BlockBase {
  type: 'image';
  src: string;
  alt: string;
  link?: string;
  width?: string;
  height?: string;
}

export interface ButtonBlock extends BlockBase {
  type: 'button';
  text: string;
  link: string;
  buttonStyles: {
    backgroundColor: string;
    textColor: string;
    borderRadius: string;
    paddingX: string;
    paddingY: string;
    fontSize: string;
    fontWeight: string;
    borderWidth: string;
    borderColor: string;
    fullWidth: boolean;
  };
}

export interface DividerBlock extends BlockBase {
  type: 'divider';
  dividerStyles: {
    style: 'solid' | 'dashed' | 'dotted';
    color: string;
    thickness: string;
    width: string;
  };
}

export interface SpacerBlock extends BlockBase {
  type: 'spacer';
  height: string;
}

export interface ColumnBlock extends BlockBase {
  type: 'column';
  width: string;
  children: Block[];
}

export interface ColumnsBlock extends BlockBase {
  type: 'columns';
  columns: ColumnBlock[];
  gap: string;
  stackOnMobile: boolean;
  mobileReverse: boolean;
}

export interface SocialLink {
  id: string;
  platform: 'facebook' | 'twitter' | 'instagram' | 'linkedin' | 'youtube' | 'tiktok' | 'pinterest' | 'custom';
  url: string;
  icon?: string;
}

export interface SocialBlock extends BlockBase {
  type: 'social';
  links: SocialLink[];
  iconSize: string;
  iconStyle: 'color' | 'dark' | 'light' | 'outline';
  spacing: string;
  alignment: 'left' | 'center' | 'right';
}

export interface VideoBlock extends BlockBase {
  type: 'video';
  videoUrl: string;
  thumbnailUrl?: string;
  playButtonColor: string;
}

export interface HtmlBlock extends BlockBase {
  type: 'html';
  content: string;
}

export interface MenuItem {
  id: string;
  text: string;
  link: string;
}

export interface MenuBlock extends BlockBase {
  type: 'menu';
  items: MenuItem[];
  separator: string;
  layout: 'horizontal' | 'vertical';
}

export interface FooterBlock extends BlockBase {
  type: 'footer';
  content: string;
  showUnsubscribe: boolean;
  showAddress: boolean;
  address?: string;
}

export interface HeaderBlock extends BlockBase {
  type: 'header';
  preheaderText?: string;
  showWebVersion: boolean;
  webVersionText?: string;
}

export interface LogoBlock extends BlockBase {
  type: 'logo';
  src: string;
  alt: string;
  link?: string;
  width: string;
  alignment: 'left' | 'center' | 'right';
}

export interface ListItem {
  id: string;
  content: string;
}

export interface ListBlock extends BlockBase {
  type: 'list';
  items: ListItem[];
  listType: 'ordered' | 'unordered';
  bulletStyle?: string;
}

export type Block =
  | TextBlock
  | HeadingBlock
  | ImageBlock
  | ButtonBlock
  | DividerBlock
  | SpacerBlock
  | ColumnsBlock
  | ColumnBlock
  | SocialBlock
  | VideoBlock
  | HtmlBlock
  | MenuBlock
  | FooterBlock
  | HeaderBlock
  | LogoBlock
  | ListBlock;

export interface BlockDefinition {
  type: BlockType;
  label: string;
  icon: string;
  category: 'content' | 'layout' | 'media' | 'social' | 'structure';
  defaultProps: Partial<Block>;
}
