import type {
  Block,
  TextBlock,
  HeadingBlock,
  ImageBlock,
  ButtonBlock,
  DividerBlock,
  SpacerBlock,
  ColumnsBlock,
  SocialBlock,
  VideoBlock,
  HtmlBlock,
  MenuBlock,
  FooterBlock,
  HeaderBlock,
  LogoBlock,
  ListBlock,
} from '../types/blocks';
import type { EmailStyles, BlockStyles } from '../types/styles';
import type { Variable } from '../types/variables';
import { replaceVariables } from '../types/variables';
import { stylesToCss } from '../utils/styles';
import { createEmailWrapper, escapeHtml } from '../utils/html';

export interface RenderOptions {
  variables?: Map<string, string>;
  inlineStyles?: boolean;
  minify?: boolean;
  includeWrapper?: boolean;
}

export class EmailRenderer {
  private variables: Map<string, string>;
  private emailStyles: EmailStyles;

  constructor(emailStyles: EmailStyles, variables: Variable[] = []) {
    this.emailStyles = emailStyles;
    this.variables = new Map(
      variables.map((v) => [v.key, v.defaultValue])
    );
  }

  setVariables(variables: Map<string, string>): void {
    this.variables = variables;
  }

  updateVariable(key: string, value: string): void {
    this.variables.set(key, value);
  }

  render(blocks: Block[], options: RenderOptions = {}): string {
    const { includeWrapper = true } = options;

    const content = blocks
      .map((block) => this.renderBlock(block))
      .join('\n');

    if (!includeWrapper) {
      return content;
    }

    const bodyStyles = this.getBodyStyles();
    const containerStyles = this.getContainerStyles();

    return createEmailWrapper(
      content,
      bodyStyles,
      containerStyles,
      this.emailStyles.container.maxWidth
    );
  }

  private getBodyStyles(): string {
    const { body } = this.emailStyles;
    return `margin: 0; padding: 0; background-color: ${body.backgroundColor}; font-family: ${body.fontFamily}; font-size: ${body.fontSize}; line-height: ${body.lineHeight}; color: ${body.color};`;
  }

  private getContainerStyles(): string {
    const { container } = this.emailStyles;
    let styles = `background-color: ${container.backgroundColor}`;
    if (container.borderRadius) {
      styles += `; border-radius: ${container.borderRadius}`;
    }
    if (container.padding) {
      styles += `; padding: ${container.padding}`;
    }
    return styles;
  }

  private renderBlock(block: Block): string {
    switch (block.type) {
      case 'text':
        return this.renderText(block);
      case 'heading':
        return this.renderHeading(block);
      case 'image':
        return this.renderImage(block);
      case 'button':
        return this.renderButton(block);
      case 'divider':
        return this.renderDivider(block);
      case 'spacer':
        return this.renderSpacer(block);
      case 'columns':
        return this.renderColumns(block);
      case 'social':
        return this.renderSocial(block);
      case 'video':
        return this.renderVideo(block);
      case 'html':
        return this.renderHtml(block);
      case 'menu':
        return this.renderMenu(block);
      case 'footer':
        return this.renderFooter(block);
      case 'header':
        return this.renderHeader(block);
      case 'logo':
        return this.renderLogo(block);
      case 'list':
        return this.renderList(block);
      default:
        return '';
    }
  }

  private processContent(content: string): string {
    return replaceVariables(content, this.variables);
  }

  private wrapInRow(content: string, styles: BlockStyles): string {
    const css = stylesToCss(styles);
    return `
      <tr>
        <td style="${css}">
          ${content}
        </td>
      </tr>
    `.trim();
  }

  private renderText(block: TextBlock): string {
    const content = this.processContent(block.content);
    return this.wrapInRow(content, block.styles);
  }

  private renderHeading(block: HeadingBlock): string {
    const tag = `h${block.level}`;
    const content = this.processContent(block.content);
    const headingStyles = `margin: 0; ${stylesToCss({
      fontSize: block.styles.fontSize,
      fontWeight: block.styles.fontWeight,
      color: block.styles.color,
      fontFamily: block.styles.fontFamily,
      lineHeight: block.styles.lineHeight,
    })}`;

    return this.wrapInRow(
      `<${tag} style="${headingStyles}">${escapeHtml(content)}</${tag}>`,
      block.styles
    );
  }

  private renderImage(block: ImageBlock): string {
    if (!block.src) {
      return this.wrapInRow(
        `<div style="background: #f3f4f6; padding: 40px; text-align: center; color: #9ca3af;">Click to add image</div>`,
        block.styles
      );
    }

    const imgStyles = `display: block; max-width: 100%; height: auto;${
      block.width ? ` width: ${block.width};` : ''
    }`;
    const img = `<img src="${block.src}" alt="${escapeHtml(block.alt)}" style="${imgStyles}" />`;
    
    const content = block.link
      ? `<a href="${block.link}" target="_blank">${img}</a>`
      : img;

    return this.wrapInRow(content, block.styles);
  }

  private renderButton(block: ButtonBlock): string {
    const { buttonStyles } = block;
    const text = this.processContent(block.text);
    
    const btnStyles = `
      display: inline-block;
      background-color: ${buttonStyles.backgroundColor};
      color: ${buttonStyles.textColor};
      font-size: ${buttonStyles.fontSize};
      font-weight: ${buttonStyles.fontWeight};
      padding: ${buttonStyles.paddingY} ${buttonStyles.paddingX};
      border-radius: ${buttonStyles.borderRadius};
      border: ${buttonStyles.borderWidth} solid ${buttonStyles.borderColor};
      text-decoration: none;
      text-align: center;
      ${buttonStyles.fullWidth ? 'width: 100%; box-sizing: border-box;' : ''}
    `.replace(/\s+/g, ' ').trim();

    const button = `<a href="${block.link}" style="${btnStyles}" target="_blank">${escapeHtml(text)}</a>`;

    return this.wrapInRow(button, block.styles);
  }

  private renderDivider(block: DividerBlock): string {
    const { dividerStyles } = block;
    const hrStyles = `
      border: none;
      border-top: ${dividerStyles.thickness} ${dividerStyles.style} ${dividerStyles.color};
      width: ${dividerStyles.width};
      margin: 0 auto;
    `.replace(/\s+/g, ' ').trim();

    return this.wrapInRow(`<hr style="${hrStyles}" />`, block.styles);
  }

  private renderSpacer(block: SpacerBlock): string {
    return `
      <tr>
        <td style="height: ${block.height}; line-height: ${block.height}; font-size: 1px;">&nbsp;</td>
      </tr>
    `.trim();
  }

  private renderColumns(block: ColumnsBlock): string {
    const containerStyles = stylesToCss(block.styles);
    
    const columnsHtml = block.columns
      .map((column) => {
        const columnStyles = `width: ${column.width}; ${stylesToCss(column.styles)}; vertical-align: ${column.styles.verticalAlign || 'top'};`;
        const childrenHtml = column.children
          .map((child) => this.renderBlock(child))
          .join('');

        return `
          <td class="${block.stackOnMobile ? 'stack-column' : ''}" style="${columnStyles}">
            <table border="0" cellpadding="0" cellspacing="0" width="100%">
              ${childrenHtml}
            </table>
          </td>
        `.trim();
      })
      .join('');

    return `
      <tr>
        <td style="${containerStyles}">
          <!--[if mso]>
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
          <![endif]-->
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;">
            <tr>
              ${columnsHtml}
            </tr>
          </table>
          <!--[if mso]>
          </tr>
          </table>
          <![endif]-->
        </td>
      </tr>
    `.trim();
  }

  private renderSocial(block: SocialBlock): string {
    const icons = this.getSocialIcons(block.iconStyle);
    
    const linksHtml = block.links
      .map((link) => {
        const icon = icons[link.platform] || link.icon || '';
        return `
          <a href="${link.url}" target="_blank" style="display: inline-block; margin: 0 ${block.spacing};">
            <img src="${icon}" alt="${link.platform}" width="${block.iconSize}" height="${block.iconSize}" style="display: block; border: 0;" />
          </a>
        `.trim();
      })
      .join('');

    return this.wrapInRow(
      `<div style="text-align: ${block.alignment};">${linksHtml}</div>`,
      block.styles
    );
  }

  private getSocialIcons(style: string): Record<string, string> {
    const baseUrl = 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons';
    return {
      facebook: `${baseUrl}/facebook.svg`,
      twitter: `${baseUrl}/twitter.svg`,
      instagram: `${baseUrl}/instagram.svg`,
      linkedin: `${baseUrl}/linkedin.svg`,
      youtube: `${baseUrl}/youtube.svg`,
      tiktok: `${baseUrl}/tiktok.svg`,
      pinterest: `${baseUrl}/pinterest.svg`,
    };
  }

  private renderVideo(block: VideoBlock): string {
    const thumbnailUrl = block.thumbnailUrl || this.getVideoThumbnail(block.videoUrl);
    
    if (!block.videoUrl) {
      return this.wrapInRow(
        `<div style="background: #f3f4f6; padding: 60px; text-align: center; color: #9ca3af;">Click to add video</div>`,
        block.styles
      );
    }

    const videoLink = this.getVideoLink(block.videoUrl);
    
    return this.wrapInRow(
      `
        <a href="${videoLink}" target="_blank" style="display: block; position: relative;">
          <img src="${thumbnailUrl}" alt="Video thumbnail" style="display: block; width: 100%; height: auto;" />
          <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 60px; height: 60px; background: ${block.playButtonColor}; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
            <div style="width: 0; height: 0; border-left: 20px solid white; border-top: 12px solid transparent; border-bottom: 12px solid transparent; margin-left: 5px;"></div>
          </div>
        </a>
      `.trim(),
      block.styles
    );
  }

  private getVideoThumbnail(url: string): string {
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
    if (youtubeMatch) {
      return `https://img.youtube.com/vi/${youtubeMatch[1]}/maxresdefault.jpg`;
    }

    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      return `https://vumbnail.com/${vimeoMatch[1]}.jpg`;
    }

    return '';
  }

  private getVideoLink(url: string): string {
    return url;
  }

  private renderHtml(block: HtmlBlock): string {
    return this.wrapInRow(block.content, block.styles);
  }

  private renderMenu(block: MenuBlock): string {
    const isHorizontal = block.layout === 'horizontal';
    const separator = block.separator ? ` ${block.separator} ` : '';
    
    const itemsHtml = block.items
      .map((item, index) => {
        const link = `<a href="${item.link}" style="color: inherit; text-decoration: none;">${escapeHtml(this.processContent(item.text))}</a>`;
        const sep = isHorizontal && index < block.items.length - 1 ? separator : '';
        return isHorizontal ? `${link}${sep}` : `<div>${link}</div>`;
      })
      .join(isHorizontal ? '' : '');

    return this.wrapInRow(itemsHtml, block.styles);
  }

  private renderFooter(block: FooterBlock): string {
    const content = this.processContent(block.content);
    let html = `<div>${content}</div>`;

    if (block.showAddress && block.address) {
      const address = this.processContent(block.address);
      html += `<div style="margin-top: 10px;">${escapeHtml(address)}</div>`;
    }

    if (block.showUnsubscribe) {
      html += `<div style="margin-top: 10px;"><a href="{{ unsubscribe_link }}" style="color: inherit;">Unsubscribe</a></div>`;
    }

    return this.wrapInRow(this.processContent(html), block.styles);
  }

  private renderHeader(block: HeaderBlock): string {
    let html = '';

    if (block.showWebVersion && block.webVersionText) {
      html += `<a href="{{ view_in_browser_link }}" style="color: inherit;">${escapeHtml(block.webVersionText)}</a>`;
    }

    return this.wrapInRow(this.processContent(html), block.styles);
  }

  private renderLogo(block: LogoBlock): string {
    if (!block.src) {
      return this.wrapInRow(
        `<div style="background: #f3f4f6; padding: 20px; text-align: center; color: #9ca3af;">Click to add logo</div>`,
        block.styles
      );
    }

    const imgStyles = `display: block; width: ${block.width}; height: auto; margin: 0 ${block.alignment === 'center' ? 'auto' : block.alignment === 'right' ? '0 0 auto' : 'auto 0 0'};`;
    const img = `<img src="${block.src}" alt="${escapeHtml(block.alt)}" style="${imgStyles}" />`;
    
    const content = block.link
      ? `<a href="${block.link}" target="_blank">${img}</a>`
      : img;

    return this.wrapInRow(content, block.styles);
  }

  private renderList(block: ListBlock): string {
    const tag = block.listType === 'ordered' ? 'ol' : 'ul';
    const listStyle = block.bulletStyle || (block.listType === 'ordered' ? 'decimal' : 'disc');
    
    const itemsHtml = block.items
      .map((item) => `<li>${this.processContent(item.content)}</li>`)
      .join('');

    return this.wrapInRow(
      `<${tag} style="margin: 0; padding-left: 20px; list-style-type: ${listStyle};">${itemsHtml}</${tag}>`,
      block.styles
    );
  }
}

export function renderEmail(
  blocks: Block[],
  emailStyles: EmailStyles,
  variables: Variable[] = [],
  options: RenderOptions = {}
): string {
  const renderer = new EmailRenderer(emailStyles, variables);
  return renderer.render(blocks, options);
}
