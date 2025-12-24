import type { Block, BlockType } from '../types/blocks';
import type { EditorConfig, EmailData } from '../types/editor';
import type { EmailStyles } from '../types/styles';
import type { Variable } from '../types/variables';
import type { StorageProvider } from '../types/storage';
import { DEFAULT_EMAIL_STYLES } from '../types/styles';
import { DEFAULT_VARIABLES } from '../types/variables';
import { useEditorStore } from '../store';
import { createBlock, BLOCK_DEFINITIONS } from '../blocks/factory';
import { EmailRenderer } from '../renderer/EmailRenderer';
import { DragDropManager, dragDropManager } from './DragDropManager';
import { KeyboardManager, keyboardManager } from './KeyboardManager';
import { createStorageProvider, StorageFactoryConfig } from '../storage';
import { stylesToCss } from '../utils/styles';

export class MailBuilder {
  private container: HTMLElement;
  private config: EditorConfig;
  private renderer: EmailRenderer;
  private storageProvider: StorageProvider | null = null;
  private dragDrop: DragDropManager;
  private keyboard: KeyboardManager;
  private unsubscribe: (() => void) | null = null;

  constructor(config: EditorConfig) {
    this.config = config;
    this.dragDrop = dragDropManager;
    this.keyboard = keyboardManager;

    const containerEl = typeof config.container === 'string'
      ? document.querySelector<HTMLElement>(config.container)
      : config.container;

    if (!containerEl) {
      throw new Error('Container element not found');
    }

    this.container = containerEl;

    const emailStyles = { ...DEFAULT_EMAIL_STYLES, ...config.initialStyles };
    const variables = config.variables || DEFAULT_VARIABLES;

    this.renderer = new EmailRenderer(emailStyles, variables);

    if (config.storage) {
      this.initStorage(config.storage as StorageFactoryConfig);
    }

    this.initStore(config.initialBlocks || [], emailStyles, variables);
    this.render();
    this.attachEventListeners();

    if (config.autosave) {
      this.startAutosave(config.autosaveInterval || 30000);
    }
  }

  private initStorage(config: StorageFactoryConfig): void {
    try {
      this.storageProvider = createStorageProvider(config);
    } catch (error) {
      console.error('Failed to initialize storage provider:', error);
    }
  }

  private initStore(blocks: Block[], emailStyles: EmailStyles, variables: Variable[]): void {
    const store = useEditorStore.getState();
    store.setBlocks(blocks);
    store.setEmailStyles(emailStyles);
    store.setVariables(variables);

    this.unsubscribe = useEditorStore.subscribe((state: ReturnType<typeof useEditorStore.getState>, prevState: ReturnType<typeof useEditorStore.getState>) => {
      if (state.blocks !== prevState.blocks || state.selectedBlockId !== prevState.selectedBlockId) {
        this.renderCanvas();
      }

      if (this.config.onBlockChange && state.blocks !== prevState.blocks) {
        this.config.onBlockChange(state.blocks);
      }

      if (this.config.onBlockSelect && state.selectedBlockId !== prevState.selectedBlockId) {
        const block = state.selectedBlockId ? store.getBlockById(state.selectedBlockId) : null;
        this.config.onBlockSelect(block || null);
      }
    });
  }

  private attachEventListeners(): void {
    this.keyboard.attach(this.container);
    this.container.tabIndex = 0;
  }

  private detachEventListeners(): void {
    this.keyboard.detach(this.container);
  }

  private autosaveInterval: number | null = null;

  private startAutosave(interval: number): void {
    this.autosaveInterval = window.setInterval(() => {
      const state = useEditorStore.getState();
      if (state.isDirty && this.config.onSave) {
        this.config.onSave(this.getEmailData());
      }
    }, interval);
  }

  private stopAutosave(): void {
    if (this.autosaveInterval) {
      clearInterval(this.autosaveInterval);
      this.autosaveInterval = null;
    }
  }

  private render(): void {
    this.container.innerHTML = '';
    this.container.className = 'mailbuilder-editor';
    
    const styles = document.createElement('style');
    styles.textContent = this.getEditorStyles();
    this.container.appendChild(styles);

    const layout = document.createElement('div');
    layout.className = 'mailbuilder-layout';
    layout.innerHTML = `
      <div class="mailbuilder-sidebar" id="mailbuilder-sidebar"></div>
      <div class="mailbuilder-canvas-container">
        <div class="mailbuilder-toolbar" id="mailbuilder-toolbar"></div>
        <div class="mailbuilder-canvas-wrapper">
          <div class="mailbuilder-canvas" id="mailbuilder-canvas"></div>
        </div>
      </div>
      <div class="mailbuilder-properties" id="mailbuilder-properties"></div>
    `;
    
    this.container.appendChild(layout);
    
    this.renderSidebar();
    this.renderToolbar();
    this.renderCanvas();
    this.renderProperties();
  }

  private renderSidebar(): void {
    const sidebar = this.container.querySelector('#mailbuilder-sidebar');
    if (!sidebar) return;

    const categories = {
      content: BLOCK_DEFINITIONS.filter(b => b.category === 'content'),
      layout: BLOCK_DEFINITIONS.filter(b => b.category === 'layout'),
      media: BLOCK_DEFINITIONS.filter(b => b.category === 'media'),
      social: BLOCK_DEFINITIONS.filter(b => b.category === 'social'),
      structure: BLOCK_DEFINITIONS.filter(b => b.category === 'structure'),
    };

    sidebar.innerHTML = `
      <div class="sidebar-section">
        <h3 class="sidebar-title">Blocks</h3>
        ${Object.entries(categories).map(([category, blocks]) => `
          <div class="block-category">
            <h4 class="category-title">${category.charAt(0).toUpperCase() + category.slice(1)}</h4>
            <div class="block-list">
              ${blocks.map(block => `
                <div class="block-item" draggable="true" data-block-type="${block.type}">
                  <span class="block-icon">${this.getBlockIcon(block.type)}</span>
                  <span class="block-label">${block.label}</span>
                </div>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    `;

    sidebar.querySelectorAll('.block-item').forEach(item => {
      item.addEventListener('dragstart', (e) => {
        const blockType = (item as HTMLElement).dataset.blockType as BlockType;
        this.dragDrop.startDrag({ type: 'new-block', blockType }, e as DragEvent);
      });

      item.addEventListener('click', () => {
        const blockType = (item as HTMLElement).dataset.blockType as BlockType;
        this.addBlock(blockType);
      });
    });
  }

  private renderToolbar(): void {
    const toolbar = this.container.querySelector('#mailbuilder-toolbar');
    if (!toolbar) return;

    const state = useEditorStore.getState();

    toolbar.innerHTML = `
      <div class="toolbar-group">
        <button class="toolbar-btn" data-action="undo" title="Undo (Ctrl+Z)">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 7v6h6M3 13a9 9 0 1 0 1.8-5.4"/>
          </svg>
        </button>
        <button class="toolbar-btn" data-action="redo" title="Redo (Ctrl+Y)">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 7v6h-6M21 13a9 9 0 1 1-1.8-5.4"/>
          </svg>
        </button>
      </div>
      <div class="toolbar-group">
        <button class="toolbar-btn ${state.previewMode === 'desktop' ? 'active' : ''}" data-action="preview-desktop" title="Desktop Preview">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
          </svg>
        </button>
        <button class="toolbar-btn ${state.previewMode === 'mobile' ? 'active' : ''}" data-action="preview-mobile" title="Mobile Preview">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>
          </svg>
        </button>
      </div>
      <div class="toolbar-group">
        <button class="toolbar-btn" data-action="zoom-out" title="Zoom Out">−</button>
        <span class="zoom-level">${state.zoom}%</span>
        <button class="toolbar-btn" data-action="zoom-in" title="Zoom In">+</button>
      </div>
      <div class="toolbar-group toolbar-actions">
        <button class="toolbar-btn btn-primary" data-action="preview" title="Preview Email">Preview</button>
        <button class="toolbar-btn btn-success" data-action="export" title="Export HTML">Export</button>
      </div>
    `;

    toolbar.querySelectorAll('.toolbar-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = (btn as HTMLElement).dataset.action;
        this.handleToolbarAction(action || '');
      });
    });
  }

  private handleToolbarAction(action: string): void {
    const store = useEditorStore.getState();
    
    switch (action) {
      case 'undo':
        store.undo();
        break;
      case 'redo':
        store.redo();
        break;
      case 'preview-desktop':
        store.setPreviewMode('desktop');
        this.renderToolbar();
        this.renderCanvas();
        break;
      case 'preview-mobile':
        store.setPreviewMode('mobile');
        this.renderToolbar();
        this.renderCanvas();
        break;
      case 'zoom-in':
        store.setZoom(store.zoom + 10);
        this.renderToolbar();
        this.renderCanvas();
        break;
      case 'zoom-out':
        store.setZoom(store.zoom - 10);
        this.renderToolbar();
        this.renderCanvas();
        break;
      case 'preview':
        this.showPreview();
        break;
      case 'export':
        this.exportHtml();
        break;
    }
  }

  private renderCanvas(): void {
    const canvas = this.container.querySelector('#mailbuilder-canvas');
    if (!canvas) return;

    const state = useEditorStore.getState();
    const { blocks, selectedBlockId, previewMode, zoom, emailStyles } = state;
    
    const maxWidth = previewMode === 'mobile' ? '375px' : emailStyles.container.maxWidth;
    const containerStyles = stylesToCss({
      backgroundColor: emailStyles.container.backgroundColor,
      maxWidth,
      borderRadius: emailStyles.container.borderRadius,
      marginLeft: 'auto',
      marginRight: 'auto',
    });

    canvas.innerHTML = `
      <div class="email-container" style="${containerStyles}; transform: scale(${zoom / 100}); transform-origin: top center;">
        ${blocks.length === 0 ? this.renderEmptyState() : ''}
        ${blocks.map((block: Block, index: number) => this.renderBlockEditor(block, index, selectedBlockId)).join('')}
        <div class="drop-zone drop-zone-end" data-index="${blocks.length}"></div>
      </div>
    `;

    this.attachCanvasEventListeners(canvas as HTMLElement);
    this.registerDropZones(canvas as HTMLElement);
  }

  private renderEmptyState(): string {
    return `
      <div class="empty-state">
        <div class="empty-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <line x1="12" y1="8" x2="12" y2="16"/>
            <line x1="8" y1="12" x2="16" y2="12"/>
          </svg>
        </div>
        <h3>Start Building Your Email</h3>
        <p>Drag blocks from the sidebar or click to add them</p>
      </div>
    `;
  }

  private renderBlockEditor(block: Block, index: number, selectedBlockId: string | null): string {
    const isSelected = block.id === selectedBlockId;
    const blockStyles = stylesToCss(block.styles);
    
    return `
      <div class="block-wrapper ${isSelected ? 'selected' : ''}" 
           data-block-id="${block.id}" 
           data-block-index="${index}"
           draggable="true">
        <div class="drop-zone drop-zone-before" data-index="${index}"></div>
        <div class="block-content" style="${blockStyles}">
          ${this.renderBlockContent(block)}
        </div>
        <div class="block-toolbar">
          <button class="block-action" data-action="move-up" title="Move Up">↑</button>
          <button class="block-action" data-action="move-down" title="Move Down">↓</button>
          <button class="block-action" data-action="duplicate" title="Duplicate">⧉</button>
          <button class="block-action" data-action="delete" title="Delete">×</button>
        </div>
      </div>
    `;
  }

  private renderBlockContent(block: Block): string {
    switch (block.type) {
      case 'text':
        return `<div class="editable-text" contenteditable="true">${block.content}</div>`;
      case 'heading':
        return `<h${block.level} class="editable-heading" contenteditable="true">${block.content}</h${block.level}>`;
      case 'image':
        return block.src 
          ? `<img src="${block.src}" alt="${block.alt}" style="max-width: 100%; height: auto;" />`
          : `<div class="placeholder image-placeholder">Click to add image</div>`;
      case 'button':
        return `<a href="#" class="email-button" style="display: inline-block; background: ${block.buttonStyles.backgroundColor}; color: ${block.buttonStyles.textColor}; padding: ${block.buttonStyles.paddingY} ${block.buttonStyles.paddingX}; border-radius: ${block.buttonStyles.borderRadius}; text-decoration: none;">${block.text}</a>`;
      case 'divider':
        return `<hr style="border: none; border-top: ${block.dividerStyles.thickness} ${block.dividerStyles.style} ${block.dividerStyles.color}; width: ${block.dividerStyles.width};" />`;
      case 'spacer':
        return `<div style="height: ${block.height};"></div>`;
      case 'columns':
        return `
          <table width="100%" cellpadding="0" cellspacing="0" style="table-layout: fixed;">
            <tr>
              ${block.columns.map(col => `
                <td style="width: ${col.width}; vertical-align: top; padding: 10px;">
                  ${col.children.length === 0 
                    ? '<div class="placeholder column-placeholder">Drop blocks here</div>'
                    : col.children.map((child, idx) => this.renderBlockEditor(child, idx, useEditorStore.getState().selectedBlockId)).join('')
                  }
                </td>
              `).join('')}
            </tr>
          </table>
        `;
      case 'social':
        return `
          <div style="text-align: ${block.alignment};">
            ${block.links.map(link => `
              <span style="display: inline-block; margin: 0 ${block.spacing};">
                <span class="social-icon social-${link.platform}">${link.platform}</span>
              </span>
            `).join('')}
          </div>
        `;
      case 'logo':
        return block.src
          ? `<img src="${block.src}" alt="${block.alt}" style="width: ${block.width}; height: auto; display: block; margin: 0 ${block.alignment === 'center' ? 'auto' : block.alignment === 'right' ? '0 0 auto' : 'auto 0 0'};" />`
          : `<div class="placeholder logo-placeholder">Click to add logo</div>`;
      case 'menu':
        return `<div style="text-align: center;">${block.items.map(item => `<a href="${item.link}" style="margin: 0 8px; color: inherit; text-decoration: none;">${item.text}</a>`).join(block.separator)}</div>`;
      case 'footer':
        return `<div style="font-size: 12px; color: #666;">${block.content}</div>`;
      case 'header':
        return `<div style="font-size: 12px; color: #666;">${block.showWebVersion ? block.webVersionText : ''}</div>`;
      case 'list':
        const listTag = block.listType === 'ordered' ? 'ol' : 'ul';
        return `<${listTag} style="margin: 0; padding-left: 20px;">${block.items.map(item => `<li>${item.content}</li>`).join('')}</${listTag}>`;
      case 'html':
        return `<div class="html-preview">${block.content}</div>`;
      case 'video':
        return block.videoUrl
          ? `<div class="video-preview" style="background: #000; padding: 40px; text-align: center; color: #fff;">Video: ${block.videoUrl}</div>`
          : `<div class="placeholder video-placeholder">Click to add video</div>`;
      default:
        return `<div>Unknown block type</div>`;
    }
  }

  private attachCanvasEventListeners(canvas: HTMLElement): void {
    canvas.querySelectorAll('.block-wrapper').forEach(wrapper => {
      const blockId = (wrapper as HTMLElement).dataset.blockId;
      
      wrapper.addEventListener('click', (e) => {
        e.stopPropagation();
        if (blockId) {
          useEditorStore.getState().selectBlock(blockId);
          this.renderProperties();
        }
      });

      wrapper.addEventListener('dragstart', (e) => {
        if (blockId) {
          this.dragDrop.startDrag({ type: 'existing-block', blockId }, e as DragEvent);
        }
      });

      wrapper.querySelectorAll('.block-action').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const action = (btn as HTMLElement).dataset.action;
          if (blockId && action) {
            this.handleBlockAction(blockId, action);
          }
        });
      });

      wrapper.querySelectorAll('[contenteditable="true"]').forEach(editable => {
        editable.addEventListener('blur', () => {
          if (blockId) {
            const content = (editable as HTMLElement).innerHTML;
            useEditorStore.getState().updateBlock(blockId, { content } as Partial<Block>);
          }
        });
      });
    });

    canvas.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).closest('.block-wrapper')) return;
      useEditorStore.getState().selectBlock(null);
      this.renderProperties();
    });
  }

  private registerDropZones(canvas: HTMLElement): void {
    this.dragDrop.clearDropZones();
    
    canvas.querySelectorAll('.drop-zone').forEach(zone => {
      const index = parseInt((zone as HTMLElement).dataset.index || '0', 10);
      const rect = zone.getBoundingClientRect();
      
      this.dragDrop.registerDropZone({
        id: `drop-${index}`,
        index,
        rect,
      });
    });
  }

  private handleBlockAction(blockId: string, action: string): void {
    const store = useEditorStore.getState();
    
    switch (action) {
      case 'move-up': {
        const index = store.blocks.findIndex((b: Block) => b.id === blockId);
        if (index > 0) {
          store.moveBlock(blockId, index - 1);
        }
        break;
      }
      case 'move-down': {
        const index = store.blocks.findIndex((b: Block) => b.id === blockId);
        if (index < store.blocks.length - 1) {
          store.moveBlock(blockId, index + 2);
        }
        break;
      }
      case 'duplicate':
        store.duplicateBlock(blockId);
        break;
      case 'delete':
        store.deleteBlock(blockId);
        break;
    }
  }

  private renderProperties(): void {
    const properties = this.container.querySelector('#mailbuilder-properties');
    if (!properties) return;

    const state = useEditorStore.getState();
    const selectedBlock = state.selectedBlockId ? state.getBlockById(state.selectedBlockId) : null;

    if (!selectedBlock) {
      properties.innerHTML = `
        <div class="properties-section">
          <h3>Email Settings</h3>
          <div class="property-group">
            <label>Background Color</label>
            <input type="color" id="email-bg-color" value="${state.emailStyles.body.backgroundColor}" />
          </div>
          <div class="property-group">
            <label>Content Background</label>
            <input type="color" id="content-bg-color" value="${state.emailStyles.container.backgroundColor}" />
          </div>
          <div class="property-group">
            <label>Content Width</label>
            <input type="text" id="content-width" value="${state.emailStyles.container.maxWidth}" />
          </div>
          <div class="property-group">
            <label>Font Family</label>
            <select id="email-font-family">
              <option value="Arial, Helvetica, sans-serif">Arial</option>
              <option value="Georgia, serif">Georgia</option>
              <option value="Times New Roman, serif">Times New Roman</option>
              <option value="Verdana, sans-serif">Verdana</option>
            </select>
          </div>
        </div>
      `;

      this.attachEmailSettingsListeners(properties as HTMLElement);
    } else {
      properties.innerHTML = `
        <div class="properties-section">
          <h3>${selectedBlock.type.charAt(0).toUpperCase() + selectedBlock.type.slice(1)} Settings</h3>
          ${this.renderBlockProperties(selectedBlock)}
        </div>
        <div class="properties-section">
          <h3>Spacing</h3>
          ${this.renderSpacingProperties(selectedBlock)}
        </div>
        <div class="properties-section">
          <h3>Typography</h3>
          ${this.renderTypographyProperties(selectedBlock)}
        </div>
      `;

      this.attachBlockPropertyListeners(properties as HTMLElement, selectedBlock);
    }
  }

  private renderBlockProperties(block: Block): string {
    switch (block.type) {
      case 'button':
        return `
          <div class="property-group">
            <label>Button Text</label>
            <input type="text" id="btn-text" value="${block.text}" />
          </div>
          <div class="property-group">
            <label>Link URL</label>
            <input type="url" id="btn-link" value="${block.link}" />
          </div>
          <div class="property-group">
            <label>Background Color</label>
            <input type="color" id="btn-bg-color" value="${block.buttonStyles.backgroundColor}" />
          </div>
          <div class="property-group">
            <label>Text Color</label>
            <input type="color" id="btn-text-color" value="${block.buttonStyles.textColor}" />
          </div>
          <div class="property-group">
            <label>Border Radius</label>
            <input type="text" id="btn-radius" value="${block.buttonStyles.borderRadius}" />
          </div>
          <div class="property-group">
            <label>Full Width</label>
            <input type="checkbox" id="btn-full-width" ${block.buttonStyles.fullWidth ? 'checked' : ''} />
          </div>
        `;
      case 'image':
        return `
          <div class="property-group">
            <label>Image URL</label>
            <input type="url" id="img-src" value="${block.src}" />
            <button class="btn-upload" id="btn-upload-image">Upload</button>
          </div>
          <div class="property-group">
            <label>Alt Text</label>
            <input type="text" id="img-alt" value="${block.alt}" />
          </div>
          <div class="property-group">
            <label>Link URL</label>
            <input type="url" id="img-link" value="${block.link || ''}" />
          </div>
          <div class="property-group">
            <label>Width</label>
            <input type="text" id="img-width" value="${block.width || '100%'}" />
          </div>
        `;
      case 'divider':
        return `
          <div class="property-group">
            <label>Style</label>
            <select id="divider-style">
              <option value="solid" ${block.dividerStyles.style === 'solid' ? 'selected' : ''}>Solid</option>
              <option value="dashed" ${block.dividerStyles.style === 'dashed' ? 'selected' : ''}>Dashed</option>
              <option value="dotted" ${block.dividerStyles.style === 'dotted' ? 'selected' : ''}>Dotted</option>
            </select>
          </div>
          <div class="property-group">
            <label>Color</label>
            <input type="color" id="divider-color" value="${block.dividerStyles.color}" />
          </div>
          <div class="property-group">
            <label>Thickness</label>
            <input type="text" id="divider-thickness" value="${block.dividerStyles.thickness}" />
          </div>
          <div class="property-group">
            <label>Width</label>
            <input type="text" id="divider-width" value="${block.dividerStyles.width}" />
          </div>
        `;
      case 'spacer':
        return `
          <div class="property-group">
            <label>Height</label>
            <input type="text" id="spacer-height" value="${block.height}" />
          </div>
        `;
      default:
        return `<p>Select block properties will appear here.</p>`;
    }
  }

  private renderSpacingProperties(block: Block): string {
    return `
      <div class="spacing-grid">
        <div class="property-group">
          <label>Padding Top</label>
          <input type="text" id="padding-top" value="${block.styles.paddingTop || '0'}" />
        </div>
        <div class="property-group">
          <label>Padding Right</label>
          <input type="text" id="padding-right" value="${block.styles.paddingRight || '0'}" />
        </div>
        <div class="property-group">
          <label>Padding Bottom</label>
          <input type="text" id="padding-bottom" value="${block.styles.paddingBottom || '0'}" />
        </div>
        <div class="property-group">
          <label>Padding Left</label>
          <input type="text" id="padding-left" value="${block.styles.paddingLeft || '0'}" />
        </div>
      </div>
      <div class="property-group">
        <label>Background Color</label>
        <input type="color" id="block-bg-color" value="${block.styles.backgroundColor || '#ffffff'}" />
      </div>
    `;
  }

  private renderTypographyProperties(block: Block): string {
    return `
      <div class="property-group">
        <label>Text Align</label>
        <div class="btn-group">
          <button class="align-btn ${block.styles.textAlign === 'left' ? 'active' : ''}" data-align="left">←</button>
          <button class="align-btn ${block.styles.textAlign === 'center' ? 'active' : ''}" data-align="center">↔</button>
          <button class="align-btn ${block.styles.textAlign === 'right' ? 'active' : ''}" data-align="right">→</button>
        </div>
      </div>
      <div class="property-group">
        <label>Font Size</label>
        <input type="text" id="font-size" value="${block.styles.fontSize || '16px'}" />
      </div>
      <div class="property-group">
        <label>Text Color</label>
        <input type="color" id="text-color" value="${block.styles.color || '#333333'}" />
      </div>
      <div class="property-group">
        <label>Line Height</label>
        <input type="text" id="line-height" value="${block.styles.lineHeight || '1.5'}" />
      </div>
    `;
  }

  private attachEmailSettingsListeners(properties: HTMLElement): void {
    const bgColor = properties.querySelector('#email-bg-color') as HTMLInputElement;
    const contentBgColor = properties.querySelector('#content-bg-color') as HTMLInputElement;
    const contentWidth = properties.querySelector('#content-width') as HTMLInputElement;

    bgColor?.addEventListener('change', () => {
      useEditorStore.getState().setEmailStyles({
        body: { ...useEditorStore.getState().emailStyles.body, backgroundColor: bgColor.value }
      });
      this.renderCanvas();
    });

    contentBgColor?.addEventListener('change', () => {
      useEditorStore.getState().setEmailStyles({
        container: { ...useEditorStore.getState().emailStyles.container, backgroundColor: contentBgColor.value }
      });
      this.renderCanvas();
    });

    contentWidth?.addEventListener('change', () => {
      useEditorStore.getState().setEmailStyles({
        container: { ...useEditorStore.getState().emailStyles.container, maxWidth: contentWidth.value }
      });
      this.renderCanvas();
    });
  }

  private attachBlockPropertyListeners(properties: HTMLElement, block: Block): void {
    const store = useEditorStore.getState();

    properties.querySelectorAll('input, select').forEach(input => {
      input.addEventListener('change', () => {
        const id = (input as HTMLElement).id;
        const value = (input as HTMLInputElement).type === 'checkbox' 
          ? (input as HTMLInputElement).checked 
          : (input as HTMLInputElement).value;

        this.updateBlockProperty(block.id, id, value);
      });
    });

    properties.querySelectorAll('.align-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const align = (btn as HTMLElement).dataset.align as 'left' | 'center' | 'right';
        store.updateBlock(block.id, {
          styles: { ...block.styles, textAlign: align }
        } as Partial<Block>);
        this.renderProperties();
        this.renderCanvas();
      });
    });

    const uploadBtn = properties.querySelector('#btn-upload-image');
    if (uploadBtn) {
      uploadBtn.addEventListener('click', () => this.handleImageUpload(block.id));
    }
  }

  private updateBlockProperty(blockId: string, propertyId: string, value: string | boolean): void {
    const store = useEditorStore.getState();
    const block = store.getBlockById(blockId);
    if (!block) return;

    const updates: Partial<Block> = {};

    switch (propertyId) {
      case 'btn-text':
        (updates as any).text = value;
        break;
      case 'btn-link':
        (updates as any).link = value;
        break;
      case 'btn-bg-color':
        if (block.type === 'button') {
          (updates as any).buttonStyles = { ...block.buttonStyles, backgroundColor: value };
        }
        break;
      case 'btn-text-color':
        if (block.type === 'button') {
          (updates as any).buttonStyles = { ...block.buttonStyles, textColor: value };
        }
        break;
      case 'btn-radius':
        if (block.type === 'button') {
          (updates as any).buttonStyles = { ...block.buttonStyles, borderRadius: value };
        }
        break;
      case 'btn-full-width':
        if (block.type === 'button') {
          (updates as any).buttonStyles = { ...block.buttonStyles, fullWidth: value };
        }
        break;
      case 'img-src':
        (updates as any).src = value;
        break;
      case 'img-alt':
        (updates as any).alt = value;
        break;
      case 'img-link':
        (updates as any).link = value;
        break;
      case 'img-width':
        (updates as any).width = value;
        break;
      case 'spacer-height':
        (updates as any).height = value;
        break;
      case 'divider-style':
        if (block.type === 'divider') {
          (updates as any).dividerStyles = { ...block.dividerStyles, style: value };
        }
        break;
      case 'divider-color':
        if (block.type === 'divider') {
          (updates as any).dividerStyles = { ...block.dividerStyles, color: value };
        }
        break;
      case 'divider-thickness':
        if (block.type === 'divider') {
          (updates as any).dividerStyles = { ...block.dividerStyles, thickness: value };
        }
        break;
      case 'divider-width':
        if (block.type === 'divider') {
          (updates as any).dividerStyles = { ...block.dividerStyles, width: value };
        }
        break;
      case 'padding-top':
        updates.styles = { ...block.styles, paddingTop: value as string };
        break;
      case 'padding-right':
        updates.styles = { ...block.styles, paddingRight: value as string };
        break;
      case 'padding-bottom':
        updates.styles = { ...block.styles, paddingBottom: value as string };
        break;
      case 'padding-left':
        updates.styles = { ...block.styles, paddingLeft: value as string };
        break;
      case 'block-bg-color':
        updates.styles = { ...block.styles, backgroundColor: value as string };
        break;
      case 'font-size':
        updates.styles = { ...block.styles, fontSize: value as string };
        break;
      case 'text-color':
        updates.styles = { ...block.styles, color: value as string };
        break;
      case 'line-height':
        updates.styles = { ...block.styles, lineHeight: value as string };
        break;
    }

    if (Object.keys(updates).length > 0) {
      store.updateBlock(blockId, updates);
      this.renderCanvas();
    }
  }

  private async handleImageUpload(blockId: string): Promise<void> {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      try {
        let url: string;
        
        if (this.config.onAssetUpload) {
          url = await this.config.onAssetUpload(file);
        } else if (this.storageProvider) {
          const result = await this.storageProvider.upload(file);
          url = result.url;
        } else {
          url = URL.createObjectURL(file);
        }

        useEditorStore.getState().updateBlock(blockId, { src: url } as Partial<Block>);
        this.renderCanvas();
        this.renderProperties();
      } catch (error) {
        console.error('Failed to upload image:', error);
      }
    };

    input.click();
  }

  private getBlockIcon(type: string): string {
    const icons: Record<string, string> = {
      heading: 'H',
      text: 'T',
      image: '🖼',
      button: '▢',
      divider: '—',
      spacer: '⬜',
      columns: '▥',
      social: '🔗',
      video: '▶',
      menu: '☰',
      logo: '◎',
      header: '⬆',
      footer: '⬇',
      list: '☰',
      html: '</>',
    };
    return icons[type] || '?';
  }

  private getEditorStyles(): string {
    return `
      .mailbuilder-editor {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
        font-size: 14px;
        color: #333;
        height: 100%;
        min-height: 600px;
      }
      
      .mailbuilder-layout {
        display: grid;
        grid-template-columns: 260px 1fr 280px;
        height: 100%;
        background: #f5f5f5;
      }
      
      .mailbuilder-sidebar {
        background: #fff;
        border-right: 1px solid #e5e7eb;
        padding: 16px;
        overflow-y: auto;
      }
      
      .sidebar-title {
        font-size: 16px;
        font-weight: 600;
        margin: 0 0 16px 0;
        color: #111;
      }
      
      .category-title {
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        color: #6b7280;
        margin: 16px 0 8px 0;
      }
      
      .block-list {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 8px;
      }
      
      .block-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 12px 8px;
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        cursor: grab;
        transition: all 0.15s;
      }
      
      .block-item:hover {
        background: #f3f4f6;
        border-color: #d1d5db;
        transform: translateY(-1px);
      }
      
      .block-icon {
        font-size: 18px;
        margin-bottom: 4px;
      }
      
      .block-label {
        font-size: 11px;
        color: #6b7280;
      }
      
      .mailbuilder-canvas-container {
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      
      .mailbuilder-toolbar {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 8px 16px;
        background: #fff;
        border-bottom: 1px solid #e5e7eb;
      }
      
      .toolbar-group {
        display: flex;
        align-items: center;
        gap: 4px;
      }
      
      .toolbar-actions {
        margin-left: auto;
      }
      
      .toolbar-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border: none;
        background: none;
        border-radius: 4px;
        cursor: pointer;
        color: #6b7280;
        transition: all 0.15s;
      }
      
      .toolbar-btn:hover {
        background: #f3f4f6;
        color: #111;
      }
      
      .toolbar-btn.active {
        background: #e5e7eb;
        color: #111;
      }
      
      .toolbar-btn.btn-primary {
        width: auto;
        padding: 0 12px;
        background: #3b82f6;
        color: #fff;
      }
      
      .toolbar-btn.btn-primary:hover {
        background: #2563eb;
      }
      
      .toolbar-btn.btn-success {
        width: auto;
        padding: 0 12px;
        background: #10b981;
        color: #fff;
      }
      
      .toolbar-btn.btn-success:hover {
        background: #059669;
      }
      
      .zoom-level {
        font-size: 12px;
        color: #6b7280;
        min-width: 40px;
        text-align: center;
      }
      
      .mailbuilder-canvas-wrapper {
        flex: 1;
        overflow: auto;
        padding: 24px;
        background: #e5e7eb;
      }
      
      .mailbuilder-canvas {
        min-height: 100%;
      }
      
      .email-container {
        background: #fff;
        box-shadow: 0 4px 24px rgba(0,0,0,0.1);
      }
      
      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 80px 40px;
        text-align: center;
        color: #9ca3af;
      }
      
      .empty-state h3 {
        margin: 16px 0 8px;
        color: #6b7280;
      }
      
      .block-wrapper {
        position: relative;
        transition: all 0.15s;
      }
      
      .block-wrapper:hover {
        outline: 2px solid #93c5fd;
      }
      
      .block-wrapper.selected {
        outline: 2px solid #3b82f6;
      }
      
      .block-toolbar {
        position: absolute;
        top: -32px;
        right: 0;
        display: none;
        gap: 2px;
        background: #1f2937;
        border-radius: 4px;
        padding: 4px;
      }
      
      .block-wrapper:hover .block-toolbar,
      .block-wrapper.selected .block-toolbar {
        display: flex;
      }
      
      .block-action {
        width: 24px;
        height: 24px;
        border: none;
        background: none;
        color: #fff;
        cursor: pointer;
        border-radius: 2px;
        font-size: 14px;
      }
      
      .block-action:hover {
        background: #374151;
      }
      
      .drop-zone {
        height: 4px;
        transition: all 0.15s;
      }
      
      .drop-zone.active {
        height: 40px;
        background: #dbeafe;
        border: 2px dashed #3b82f6;
        border-radius: 4px;
      }
      
      .placeholder {
        background: #f9fafb;
        border: 2px dashed #d1d5db;
        border-radius: 4px;
        padding: 40px;
        text-align: center;
        color: #9ca3af;
        cursor: pointer;
      }
      
      .mailbuilder-properties {
        background: #fff;
        border-left: 1px solid #e5e7eb;
        padding: 16px;
        overflow-y: auto;
      }
      
      .properties-section {
        margin-bottom: 24px;
      }
      
      .properties-section h3 {
        font-size: 14px;
        font-weight: 600;
        margin: 0 0 16px 0;
        padding-bottom: 8px;
        border-bottom: 1px solid #e5e7eb;
      }
      
      .property-group {
        margin-bottom: 12px;
      }
      
      .property-group label {
        display: block;
        font-size: 12px;
        color: #6b7280;
        margin-bottom: 4px;
      }
      
      .property-group input[type="text"],
      .property-group input[type="url"],
      .property-group select {
        width: 100%;
        padding: 8px;
        border: 1px solid #d1d5db;
        border-radius: 4px;
        font-size: 14px;
      }
      
      .property-group input[type="color"] {
        width: 100%;
        height: 32px;
        padding: 2px;
        border: 1px solid #d1d5db;
        border-radius: 4px;
        cursor: pointer;
      }
      
      .btn-group {
        display: flex;
        gap: 2px;
      }
      
      .align-btn {
        flex: 1;
        padding: 8px;
        border: 1px solid #d1d5db;
        background: #fff;
        cursor: pointer;
      }
      
      .align-btn:first-child {
        border-radius: 4px 0 0 4px;
      }
      
      .align-btn:last-child {
        border-radius: 0 4px 4px 0;
      }
      
      .align-btn.active {
        background: #3b82f6;
        color: #fff;
        border-color: #3b82f6;
      }
      
      .btn-upload {
        margin-top: 8px;
        width: 100%;
        padding: 8px;
        background: #f3f4f6;
        border: 1px solid #d1d5db;
        border-radius: 4px;
        cursor: pointer;
      }
      
      .btn-upload:hover {
        background: #e5e7eb;
      }
      
      .editable-text,
      .editable-heading {
        outline: none;
        min-height: 1em;
      }
      
      .editable-text:focus,
      .editable-heading:focus {
        background: rgba(59, 130, 246, 0.05);
      }
    `;
  }

  addBlock(type: BlockType, index?: number): Block {
    const block = createBlock(type);
    useEditorStore.getState().addBlock(block, index);
    return block;
  }

  getBlocks(): Block[] {
    return useEditorStore.getState().blocks;
  }

  setBlocks(blocks: Block[]): void {
    useEditorStore.getState().setBlocks(blocks);
  }

  getEmailData(): EmailData {
    const state = useEditorStore.getState();
    return {
      blocks: state.blocks,
      styles: state.emailStyles,
      variables: state.variables,
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: '1.0.0',
      },
    };
  }

  exportHtml(): string {
    const state = useEditorStore.getState();
    const html = this.renderer.render(state.blocks);
    
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'email.html';
    a.click();
    URL.revokeObjectURL(url);
    
    return html;
  }

  showPreview(): void {
    const state = useEditorStore.getState();
    const html = this.renderer.render(state.blocks);
    
    const previewWindow = window.open('', '_blank');
    if (previewWindow) {
      previewWindow.document.write(html);
      previewWindow.document.close();
    }
  }

  getHtml(): string {
    const state = useEditorStore.getState();
    return this.renderer.render(state.blocks);
  }

  loadData(data: EmailData): void {
    const store = useEditorStore.getState();
    store.setBlocks(data.blocks);
    store.setEmailStyles(data.styles);
    store.setVariables(data.variables);
  }

  destroy(): void {
    this.stopAutosave();
    this.detachEventListeners();
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    useEditorStore.getState().reset();
    this.container.innerHTML = '';
  }
}

export function createMailBuilder(config: EditorConfig): MailBuilder {
  return new MailBuilder(config);
}
