import type {
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
} from '../types/blocks';
import { DEFAULT_BLOCK_STYLES } from '../types/styles';
import { generateBlockId } from '../utils/id';

export function createTextBlock(overrides?: Partial<TextBlock>): TextBlock {
  return {
    id: generateBlockId('text'),
    type: 'text',
    content: '<p>Enter your text here...</p>',
    placeholder: 'Enter your text here...',
    hasTypography: true,
    hasSpacing: true,
    styles: { ...DEFAULT_BLOCK_STYLES },
    ...overrides,
  };
}

export function createHeadingBlock(overrides?: Partial<HeadingBlock>): HeadingBlock {
  return {
    id: generateBlockId('heading'),
    type: 'heading',
    content: 'Your Heading',
    level: 2,
    hasTypography: true,
    hasSpacing: true,
    styles: {
      ...DEFAULT_BLOCK_STYLES,
      fontSize: '24px',
      fontWeight: '700',
    },
    ...overrides,
  };
}

export function createImageBlock(overrides?: Partial<ImageBlock>): ImageBlock {
  return {
    id: generateBlockId('image'),
    type: 'image',
    src: '',
    alt: 'Image',
    width: '100%',
    hasTypography: false,
    hasSpacing: true,
    styles: {
      ...DEFAULT_BLOCK_STYLES,
      textAlign: 'center',
    },
    ...overrides,
  };
}

export function createButtonBlock(overrides?: Partial<ButtonBlock>): ButtonBlock {
  return {
    id: generateBlockId('button'),
    type: 'button',
    text: 'Click Here',
    link: '#',
    hasTypography: true,
    hasSpacing: true,
    buttonStyles: {
      backgroundColor: '#3b82f6',
      textColor: '#ffffff',
      borderRadius: '4px',
      paddingX: '24px',
      paddingY: '12px',
      textDecoration: 'none',
      fontStyle: 'normal',
      fontWeight: '700',
      borderWidth: '0',
      borderColor: 'transparent',
      fullWidth: false,
    },
    styles: {
      ...DEFAULT_BLOCK_STYLES,
      textAlign: 'center',
    },
    ...overrides,
  };
}

export function createDividerBlock(overrides?: Partial<DividerBlock>): DividerBlock {
  return {
    id: generateBlockId('divider'),
    type: 'divider',
    hasTypography: false,
    hasSpacing: false,
    dividerStyles: {
      style: 'solid',
      color: '#e5e7eb',
      thickness: '1px',
      width: '100%',
    },
    styles: {
      ...DEFAULT_BLOCK_STYLES,
      paddingTop: '20px',
      paddingBottom: '20px',
    },
    ...overrides,
  };
}

export function createSpacerBlock(overrides?: Partial<SpacerBlock>): SpacerBlock {
  return {
    id: generateBlockId('spacer'),
    type: 'spacer',
    height: '20px',
    hasTypography: false,
    hasSpacing: false,
    styles: {},
    ...overrides,
  };
}

export function createColumnBlock(overrides?: Partial<ColumnBlock>): ColumnBlock {
  return {
    id: generateBlockId('column'),
    type: 'column',
    width: '50%',
    hasTypography: false,
    hasSpacing: true,
    children: [],
    styles: {
      paddingTop: '10px',
      paddingRight: '10px',
      paddingBottom: '10px',
      paddingLeft: '10px',
      verticalAlign: 'top',
    },
    ...overrides,
  };
}

export function createColumnsBlock(
  columnCount: number = 2,
  overrides?: Partial<ColumnsBlock>
): ColumnsBlock {
  const widths = {
    1: ['100%'],
    2: ['50%', '50%'],
    3: ['33.33%', '33.33%', '33.33%'],
    4: ['25%', '25%', '25%', '25%'],
  };

  const columnWidths = widths[columnCount as keyof typeof widths] || widths[2];
  const columns = columnWidths.map((width) =>
    createColumnBlock({ width })
  );

  return {
    id: generateBlockId('columns'),
    type: 'columns',
    columns,
    gap: '0px',
    hasTypography: false,
    hasSpacing: false,
    styles: { ...DEFAULT_BLOCK_STYLES },
    ...overrides,
  };
}

export function createSocialBlock(overrides?: Partial<SocialBlock>): SocialBlock {
  return {
    id: generateBlockId('social'),
    type: 'social',
    links: [
      { id: generateBlockId('social-link'), platform: 'facebook', url: '#' },
      { id: generateBlockId('social-link'), platform: 'twitter', url: '#' },
      { id: generateBlockId('social-link'), platform: 'instagram', url: '#' },
      { id: generateBlockId('social-link'), platform: 'linkedin', url: '#' },
    ],
    iconSize: '32px',
    iconStyle: 'color',
    spacing: '8px',
    alignment: 'center',
    hasTypography: false,
    hasSpacing: false,
    styles: { ...DEFAULT_BLOCK_STYLES },
    ...overrides,
  };
}

export function createVideoBlock(overrides?: Partial<VideoBlock>): VideoBlock {
  return {
    id: generateBlockId('video'),
    type: 'video',
    videoUrl: '',
    playButtonColor: '#ff0000',
    hasTypography: false,
    hasSpacing: true,
    styles: {
      ...DEFAULT_BLOCK_STYLES,
      textAlign: 'center',
    },
    ...overrides,
  };
}

export function createHtmlBlock(overrides?: Partial<HtmlBlock>): HtmlBlock {
  return {
    id: generateBlockId('html'),
    type: 'html',
    content: '<!-- Enter your custom HTML here -->',
    styles: { ...DEFAULT_BLOCK_STYLES },
    hasTypography: false,
    hasSpacing: false,
    ...overrides,
  };
}

export function createMenuBlock(overrides?: Partial<MenuBlock>): MenuBlock {
  return {
    id: generateBlockId('menu'),
    type: 'menu',
    items: [
      { id: generateBlockId('menu-item'), text: 'Home', link: '#' },
      { id: generateBlockId('menu-item'), text: 'About', link: '#' },
      { id: generateBlockId('menu-item'), text: 'Contact', link: '#' },
    ],
    separator: '|',
    layout: 'horizontal',
    hasTypography: true,
    hasSpacing: true,
    styles: {
      ...DEFAULT_BLOCK_STYLES,
      textAlign: 'center',
    },
    ...overrides,
  };
}

export function createFooterBlock(overrides?: Partial<FooterBlock>): FooterBlock {
  return {
    id: generateBlockId('footer'),
    type: 'footer',
    content: '© {{ current_year }} {{ company_name }}. All rights reserved.',
    showUnsubscribe: true,
    showAddress: true,
    address: '{{ company_address }}',
    hasTypography: true,
    hasSpacing: true,
    styles: {
      ...DEFAULT_BLOCK_STYLES,
      fontSize: '12px',
      color: '#6b7280',
      textAlign: 'center',
    },
    ...overrides,
  };
}

export function createHeaderBlock(overrides?: Partial<HeaderBlock>): HeaderBlock {
  return {
    id: generateBlockId('header'),
    type: 'header',
    preheaderText: '',
    showWebVersion: true,
    webVersionText: 'View in browser',
    hasTypography: true,
    hasSpacing: true,
    styles: {
      ...DEFAULT_BLOCK_STYLES,
      fontSize: '12px',
      color: '#6b7280',
      textAlign: 'center',
    },
    ...overrides,
  };
}

export function createLogoBlock(overrides?: Partial<LogoBlock>): LogoBlock {
  return {
    id: generateBlockId('logo'),
    type: 'logo',
    src: '',
    alt: 'Logo',
    width: '150px',
    alignment: 'center',
    hasTypography: false,
    hasSpacing: true,
    styles: {
      ...DEFAULT_BLOCK_STYLES,
      paddingTop: '20px',
      paddingBottom: '20px',
    },
    ...overrides,
  };
}

export function createListBlock(overrides?: Partial<ListBlock>): ListBlock {
  return {
    id: generateBlockId('list'),
    type: 'list',
    items: [
      { id: generateBlockId('list-item'), content: 'List item 1' },
      { id: generateBlockId('list-item'), content: 'List item 2' },
      { id: generateBlockId('list-item'), content: 'List item 3' },
    ],
    listType: 'unordered',
    hasTypography: true,
    hasSpacing: true,
    styles: { ...DEFAULT_BLOCK_STYLES },
    ...overrides,
  };
}

export function createBlock(type: BlockType, overrides?: Partial<Block>): Block {
  const factories: Record<BlockType, () => Block> = {
    text: () => createTextBlock(overrides as Partial<TextBlock>),
    heading: () => createHeadingBlock(overrides as Partial<HeadingBlock>),
    image: () => createImageBlock(overrides as Partial<ImageBlock>),
    button: () => createButtonBlock(overrides as Partial<ButtonBlock>),
    divider: () => createDividerBlock(overrides as Partial<DividerBlock>),
    spacer: () => createSpacerBlock(overrides as Partial<SpacerBlock>),
    columns: () => createColumnsBlock(2, overrides as Partial<ColumnsBlock>),
    column: () => createColumnBlock(overrides as Partial<ColumnBlock>),
    social: () => createSocialBlock(overrides as Partial<SocialBlock>),
    video: () => createVideoBlock(overrides as Partial<VideoBlock>),
    html: () => createHtmlBlock(overrides as Partial<HtmlBlock>),
    menu: () => createMenuBlock(overrides as Partial<MenuBlock>),
    footer: () => createFooterBlock(overrides as Partial<FooterBlock>),
    header: () => createHeaderBlock(overrides as Partial<HeaderBlock>),
    logo: () => createLogoBlock(overrides as Partial<LogoBlock>),
    list: () => createListBlock(overrides as Partial<ListBlock>),
  };

  const factory = factories[type];
  if (!factory) {
    throw new Error(`Unknown block type: ${type}`);
  }

  return factory();
}

export const BLOCK_DEFINITIONS = [
  {
    type: 'heading' as BlockType,
    label: 'Heading',
    icon: 'heading',
    category: 'content' as const,
  },
  {
    type: 'text' as BlockType,
    label: 'Text',
    icon: 'text',
    category: 'content' as const,
  },
  {
    type: 'image' as BlockType,
    label: 'Image',
    icon: 'image',
    category: 'media' as const,
  },
  {
    type: 'button' as BlockType,
    label: 'Button',
    icon: 'button',
    category: 'content' as const,
  },
  {
    type: 'divider' as BlockType,
    label: 'Divider',
    icon: 'divider',
    category: 'layout' as const,
  },
  {
    type: 'spacer' as BlockType,
    label: 'Spacer',
    icon: 'spacer',
    category: 'layout' as const,
  },
  {
    type: 'columns' as BlockType,
    label: 'Columns',
    icon: 'columns',
    category: 'layout' as const,
  },
  {
    type: 'social' as BlockType,
    label: 'Social Links',
    icon: 'social',
    category: 'social' as const,
  },
  {
    type: 'video' as BlockType,
    label: 'Video',
    icon: 'video',
    category: 'media' as const,
  },
  {
    type: 'menu' as BlockType,
    label: 'Menu',
    icon: 'menu',
    category: 'structure' as const,
  },
  {
    type: 'logo' as BlockType,
    label: 'Logo',
    icon: 'logo',
    category: 'structure' as const,
  },
  {
    type: 'header' as BlockType,
    label: 'Header',
    icon: 'header',
    category: 'structure' as const,
  },
  {
    type: 'footer' as BlockType,
    label: 'Footer',
    icon: 'footer',
    category: 'structure' as const,
  },
  {
    type: 'list' as BlockType,
    label: 'List',
    icon: 'list',
    category: 'content' as const,
  },
  // {
  //   type: 'html' as BlockType,
  //   label: 'Custom HTML',
  //   icon: 'code',
  //   category: 'content' as const,
  // },
];
