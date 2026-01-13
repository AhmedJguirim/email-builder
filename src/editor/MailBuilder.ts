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
      </div>
    `;

    // Set canvas for drag-drop manager
    this.dragDrop.setCanvas(canvas as HTMLElement);
    this.attachCanvasEventListeners(canvas as HTMLElement);
  }

  private renderEmptyState(): string {
    return `
      <div class="empty-drop-zone">
        <div style="margin-bottom: 16px;">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <line x1="12" y1="8" x2="12" y2="16"/>
            <line x1="8" y1="12" x2="16" y2="12"/>
          </svg>
        </div>
        <h3 style="margin: 0 0 8px; font-size: 18px; font-weight: 600; color: #374151;">Start Building Your Email</h3>
        <p style="margin: 0; color: #6b7280; font-size: 14px;">Drag blocks from the sidebar or click to add them</p>
      </div>
    `;
  }

  private renderBlockEditor(block: Block, index: number, selectedBlockId: string | null): string {
    const isSelected = block.id === selectedBlockId;
    const blockStyles = stylesToCss(block.styles);
    
    return `
      <div class="block-wrapper ${isSelected ? 'selected' : ''}" 
           data-block-id="${block.id}" 
           data-index="${index}"
           draggable="true">
        <div class="block-content" style="${blockStyles}">
          ${this.renderBlockContent(block)}
        </div>
        <div class="block-toolbar">
          <button class="block-toolbar-btn drag-handle" data-action="drag" title="Drag to reorder">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="9" cy="6" r="2"/><circle cx="15" cy="6" r="2"/>
              <circle cx="9" cy="12" r="2"/><circle cx="15" cy="12" r="2"/>
              <circle cx="9" cy="18" r="2"/><circle cx="15" cy="18" r="2"/>
            </svg>
          </button>
          <button class="block-toolbar-btn" data-action="duplicate" title="Duplicate">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2"/>
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
            </svg>
          </button>
          <button class="block-toolbar-btn danger" data-action="delete" title="Delete">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
            </svg>
          </button>
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
          ? `<img src="${block.src}" alt="${block.alt}" style="width: ${block.width || '100%'}; max-width: 100%; height: auto; display: block; margin: 0 auto;" />`
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
                  <div class="column-drop-zone" data-column-id="${col.id}" data-parent-block-id="${block.id}">
                    ${col.children.length === 0 
                      ? '<div class="placeholder column-placeholder">Drop blocks here</div>'
                      : col.children.map((child, idx) => this.renderBlockEditor(child, idx, useEditorStore.getState().selectedBlockId)).join('')
                    }
                  </div>
                </td>
              `).join('')}
            </tr>
          </table>
        `;
      case 'social':
        return `
          <div style="text-align: ${block.alignment};">
            ${block.links.map(link => `
              <a href="${link.url}" style="display: inline-block; margin: 0 ${block.spacing}; text-decoration: none;">
                ${this.getSocialIcon(link.platform, block.iconSize, block.iconStyle)}
              </a>
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
        if (block.videoUrl) {
          const videoId = this.extractYouTubeId(block.videoUrl);
          const thumbnailUrl = block.thumbnailUrl || (videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : '');
          return `
            <div class="video-preview" style="position: relative; cursor: pointer;">
              ${thumbnailUrl 
                ? `<img src="${thumbnailUrl}" alt="Video thumbnail" style="width: 100%; height: auto; display: block;" onerror="this.src='https://img.youtube.com/vi/${videoId}/hqdefault.jpg'" />`
                : `<div style="background: #000; padding: 80px; text-align: center; color: #fff;">Video: ${block.videoUrl}</div>`
              }
              <div class="play-button-overlay" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 68px; height: 48px; background: ${block.playButtonColor}; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
            </div>
          `;
        }
        return `<div class="placeholder video-placeholder">Click to add video URL</div>`;
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

      wrapper.querySelectorAll('.block-toolbar-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const action = (btn as HTMLElement).dataset.action;
          if (blockId && action && action !== 'drag') {
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
          <h3>Global Page Styles</h3>
          
          <h4 style="margin-top: 20px; margin-bottom: 10px; font-size: 13px; font-weight: 600; color: #6b7280;">Body Styles</h4>
          <div class="property-group">
            <label>Background Color</label>
            <input type="color" id="email-bg-color" value="${state.emailStyles.body.backgroundColor}" />
          </div>
          <div class="property-group">
            <label>Font Family</label>
            <select id="email-font-family">
              <option value="Arial, Helvetica, sans-serif" ${state.emailStyles.body.fontFamily === 'Arial, Helvetica, sans-serif' ? 'selected' : ''}>Arial</option>
              <option value="Georgia, serif" ${state.emailStyles.body.fontFamily === 'Georgia, serif' ? 'selected' : ''}>Georgia</option>
              <option value='"Times New Roman", Times, serif' ${state.emailStyles.body.fontFamily.includes('Times') ? 'selected' : ''}>Times New Roman</option>
              <option value="Verdana, Geneva, sans-serif" ${state.emailStyles.body.fontFamily.includes('Verdana') ? 'selected' : ''}>Verdana</option>
              <option value='"Trebuchet MS", Helvetica, sans-serif' ${state.emailStyles.body.fontFamily.includes('Trebuchet') ? 'selected' : ''}>Trebuchet MS</option>
            </select>
          </div>
          <div class="property-group">
            <label>Font Size</label>
            <input type="text" id="email-font-size" value="${state.emailStyles.body.fontSize}" />
          </div>
          <div class="property-group">
            <label>Line Height</label>
            <input type="text" id="email-line-height" value="${state.emailStyles.body.lineHeight}" />
          </div>
          <div class="property-group">
            <label>Text Color</label>
            <input type="color" id="email-text-color" value="${state.emailStyles.body.color}" />
          </div>

          <h4 style="margin-top: 20px; margin-bottom: 10px; font-size: 13px; font-weight: 600; color: #6b7280;">Container Styles</h4>
          <div class="property-group">
            <label>Background Color</label>
            <input type="color" id="content-bg-color" value="${state.emailStyles.container.backgroundColor}" />
          </div>
          <div class="property-group">
            <label>Max Width</label>
            <input type="text" id="content-width" value="${state.emailStyles.container.maxWidth}" />
          </div>
          <div class="property-group">
            <label>Border Radius</label>
            <input type="text" id="content-border-radius" value="${state.emailStyles.container.borderRadius || '0'}" />
          </div>
          <div class="property-group">
            <label>Border Width</label>
            <input type="text" id="content-border-width" value="${state.emailStyles.container.borderWidth || '0'}" />
          </div>
          <div class="property-group">
            <label>Border Color</label>
            <input type="color" id="content-border-color" value="${state.emailStyles.container.borderColor || '#e5e7eb'}" />
          </div>
          <div class="property-group">
            <label>Border Style</label>
            <select id="content-border-style">
              <option value="solid" ${state.emailStyles.container.borderStyle === 'solid' ? 'selected' : ''}>Solid</option>
              <option value="dashed" ${state.emailStyles.container.borderStyle === 'dashed' ? 'selected' : ''}>Dashed</option>
              <option value="dotted" ${state.emailStyles.container.borderStyle === 'dotted' ? 'selected' : ''}>Dotted</option>
              <option value="none" ${state.emailStyles.container.borderStyle === 'none' ? 'selected' : ''}>None</option>
            </select>
          </div>

          <h4 style="margin-top: 20px; margin-bottom: 10px; font-size: 13px; font-weight: 600; color: #6b7280;">Link Styles</h4>
          <div class="property-group">
            <label>Link Color</label>
            <input type="color" id="link-color" value="${state.emailStyles.link.color}" />
          </div>
          <div class="property-group">
            <label>Link Hover Color</label>
            <input type="color" id="link-hover-color" value="${state.emailStyles.link.hoverColor || '#2563eb'}" />
          </div>
          <div class="property-group">
            <label>Text Decoration</label>
            <select id="link-decoration">
              <option value="underline" ${state.emailStyles.link.textDecoration === 'underline' ? 'selected' : ''}>Underline</option>
              <option value="none" ${state.emailStyles.link.textDecoration === 'none' ? 'selected' : ''}>None</option>
            </select>
          </div>

          <h4 style="margin-top: 20px; margin-bottom: 10px; font-size: 13px; font-weight: 600; color: #6b7280;">Heading Styles</h4>
          <div class="property-group">
            <label>Font Family</label>
            <select id="heading-font-family">
              <option value="Arial, Helvetica, sans-serif" ${state.emailStyles.heading.fontFamily === 'Arial, Helvetica, sans-serif' ? 'selected' : ''}>Arial</option>
              <option value="Georgia, serif" ${state.emailStyles.heading.fontFamily === 'Georgia, serif' ? 'selected' : ''}>Georgia</option>
              <option value='"Times New Roman", Times, serif' ${state.emailStyles.heading.fontFamily?.includes('Times') ? 'selected' : ''}>Times New Roman</option>
              <option value="Verdana, Geneva, sans-serif" ${state.emailStyles.heading.fontFamily?.includes('Verdana') ? 'selected' : ''}>Verdana</option>
            </select>
          </div>
          <div class="property-group">
            <label>Color</label>
            <input type="color" id="heading-color" value="${state.emailStyles.heading.color || '#111827'}" />
          </div>
          <div class="property-group">
            <label>Font Weight</label>
            <select id="heading-font-weight">
              <option value="400" ${state.emailStyles.heading.fontWeight === '400' ? 'selected' : ''}>Normal</option>
              <option value="500" ${state.emailStyles.heading.fontWeight === '500' ? 'selected' : ''}>Medium</option>
              <option value="600" ${state.emailStyles.heading.fontWeight === '600' ? 'selected' : ''}>Semi Bold</option>
              <option value="700" ${state.emailStyles.heading.fontWeight === '700' ? 'selected' : ''}>Bold</option>
              <option value="800" ${state.emailStyles.heading.fontWeight === '800' ? 'selected' : ''}>Extra Bold</option>
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
        const currentWidth = parseInt(block.width || '100') || 100;
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
            <label>Width: <span id="img-width-value">${block.width || '100%'}</span></label>
            <input type="range" id="img-width-slider" min="10" max="100" value="${currentWidth}" style="width: 100%;" />
            <input type="text" id="img-width" value="${block.width || '100%'}" style="margin-top: 4px;" />
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
      case 'list':
        return `
          <div class="property-group">
            <label>List Type</label>
            <select id="list-type">
              <option value="unordered" ${block.listType === 'unordered' ? 'selected' : ''}>Bulleted</option>
              <option value="ordered" ${block.listType === 'ordered' ? 'selected' : ''}>Numbered</option>
            </select>
          </div>
          <div class="property-group">
            <label>List Items</label>
            <div class="list-items-editor">
              ${block.items.map((item, idx) => `
                <div class="list-item-row" data-item-id="${item.id}">
                  <input type="text" class="list-item-input" data-index="${idx}" value="${item.content}" />
                  <button class="btn-small btn-danger remove-list-item" data-index="${idx}">×</button>
                </div>
              `).join('')}
            </div>
            <button class="btn-upload add-list-item" id="add-list-item">+ Add Item</button>
          </div>
        `;
      case 'video':
        return `
          <div class="property-group">
            <label>YouTube URL</label>
            <input type="url" id="video-url" value="${block.videoUrl}" placeholder="https://youtube.com/watch?v=..." />
          </div>
          <div class="property-group">
            <label>Custom Thumbnail URL (optional)</label>
            <input type="url" id="video-thumbnail" value="${block.thumbnailUrl || ''}" placeholder="Leave empty for auto-generated" />
          </div>
          <div class="property-group">
            <label>Play Button Color</label>
            <input type="color" id="video-play-color" value="${block.playButtonColor}" />
          </div>
        `;
      case 'social':
        return `
          <div class="property-group">
            <label>Alignment</label>
            <select id="social-alignment">
              <option value="left" ${block.alignment === 'left' ? 'selected' : ''}>Left</option>
              <option value="center" ${block.alignment === 'center' ? 'selected' : ''}>Center</option>
              <option value="right" ${block.alignment === 'right' ? 'selected' : ''}>Right</option>
            </select>
          </div>
          <div class="property-group">
            <label>Icon Size</label>
            <input type="text" id="social-icon-size" value="${block.iconSize}" />
          </div>
          <div class="property-group">
            <label>Spacing</label>
            <input type="text" id="social-spacing" value="${block.spacing}" />
          </div>
          <div class="property-group">
            <label>Social Links</label>
            <div class="social-links-editor">
              ${block.links.map((link, idx) => `
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
      case 'menu':
        return `
          <div class="property-group">
            <label>Layout</label>
            <select id="menu-layout">
              <option value="horizontal" ${block.layout === 'horizontal' ? 'selected' : ''}>Horizontal</option>
              <option value="vertical" ${block.layout === 'vertical' ? 'selected' : ''}>Vertical</option>
            </select>
          </div>
          <div class="property-group">
            <label>Separator</label>
            <input type="text" id="menu-separator" value="${block.separator}" />
          </div>
          <div class="property-group">
            <label>Menu Items</label>
            <div class="menu-items-editor">
              ${block.items.map((item, idx) => `
                <div class="menu-item-row" data-item-id="${item.id}">
                  <input type="text" class="menu-item-text" data-index="${idx}" value="${item.text}" placeholder="Text" />
                  <input type="url" class="menu-item-link" data-index="${idx}" value="${item.link}" placeholder="Link URL" />
                  <button class="btn-small btn-danger remove-menu-item" data-index="${idx}">×</button>
                </div>
              `).join('')}
            </div>
            <button class="btn-upload add-menu-item" id="add-menu-item">+ Add Item</button>
          </div>
        `;
      case 'logo':
        return `
          <div class="property-group">
            <label>Logo URL</label>
            <input type="url" id="logo-src" value="${block.src}" />
            <button class="btn-upload" id="btn-upload-logo">Upload Logo</button>
          </div>
          <div class="property-group">
            <label>Alt Text</label>
            <input type="text" id="logo-alt" value="${block.alt}" />
          </div>
          <div class="property-group">
            <label>Link URL</label>
            <input type="url" id="logo-link" value="${block.link || ''}" />
          </div>
          <div class="property-group">
            <label>Width</label>
            <input type="text" id="logo-width" value="${block.width}" />
          </div>
          <div class="property-group">
            <label>Alignment</label>
            <select id="logo-alignment">
              <option value="left" ${block.alignment === 'left' ? 'selected' : ''}>Left</option>
              <option value="center" ${block.alignment === 'center' ? 'selected' : ''}>Center</option>
              <option value="right" ${block.alignment === 'right' ? 'selected' : ''}>Right</option>
            </select>
          </div>
        `;
      case 'header':
        return `
          <div class="property-group">
            <label>Preheader Text</label>
            <input type="text" id="header-preheader" value="${block.preheaderText || ''}" placeholder="Preview text shown in inbox" />
          </div>
          <div class="property-group">
            <label>
              <input type="checkbox" id="header-show-web" ${block.showWebVersion ? 'checked' : ''} />
              Show "View in Browser" Link
            </label>
          </div>
          <div class="property-group">
            <label>Web Version Text</label>
            <input type="text" id="header-web-text" value="${block.webVersionText || 'View in browser'}" />
          </div>
        `;
      case 'footer':
        return `
          <div class="property-group">
            <label>Footer Content</label>
            <textarea id="footer-content" rows="3">${block.content}</textarea>
          </div>
          <div class="property-group">
            <label>
              <input type="checkbox" id="footer-show-unsubscribe" ${block.showUnsubscribe ? 'checked' : ''} />
              Show Unsubscribe Link
            </label>
          </div>
          <div class="property-group">
            <label>
              <input type="checkbox" id="footer-show-address" ${block.showAddress ? 'checked' : ''} />
              Show Company Address
            </label>
          </div>
          <div class="property-group">
            <label>Company Address</label>
            <input type="text" id="footer-address" value="${block.address || ''}" />
          </div>
        `;
      case 'html':
        return `
          <div class="property-group">
            <label>Custom HTML</label>
            <textarea id="html-content" rows="8" style="font-family: monospace;">${block.content}</textarea>
          </div>
        `;
      case 'columns':
        return `
          <div class="property-group">
            <label>Gap</label>
            <input type="text" id="columns-gap" value="${block.gap}" />
          </div>
          <div class="property-group">
            <label>
              <input type="checkbox" id="columns-stack-mobile" ${block.stackOnMobile ? 'checked' : ''} />
              Stack on Mobile
            </label>
          </div>
          <div class="property-group">
            <label>
              <input type="checkbox" id="columns-reverse-mobile" ${block.mobileReverse ? 'checked' : ''} />
              Reverse Order on Mobile
            </label>
          </div>
          <div class="property-group">
            <label>Column Widths</label>
            ${block.columns.map((col, idx) => `
              <div style="margin-bottom: 4px;">
                <label style="font-size: 11px;">Column ${idx + 1}</label>
                <input type="text" class="column-width-input" data-index="${idx}" value="${col.width}" style="width: 100%;" />
              </div>
            `).join('')}
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
    const store = useEditorStore.getState();
    
    // Body styles
    const bgColor = properties.querySelector('#email-bg-color') as HTMLInputElement;
    const fontFamily = properties.querySelector('#email-font-family') as HTMLSelectElement;
    const fontSize = properties.querySelector('#email-font-size') as HTMLInputElement;
    const lineHeight = properties.querySelector('#email-line-height') as HTMLInputElement;
    const textColor = properties.querySelector('#email-text-color') as HTMLInputElement;

    bgColor?.addEventListener('change', () => {
      store.setEmailStyles({ body: { ...store.emailStyles.body, backgroundColor: bgColor.value } });
      this.renderCanvas();
    });

    fontFamily?.addEventListener('change', () => {
      store.setEmailStyles({ body: { ...store.emailStyles.body, fontFamily: fontFamily.value } });
      this.renderCanvas();
    });

    fontSize?.addEventListener('change', () => {
      store.setEmailStyles({ body: { ...store.emailStyles.body, fontSize: fontSize.value } });
      this.renderCanvas();
    });

    lineHeight?.addEventListener('change', () => {
      store.setEmailStyles({ body: { ...store.emailStyles.body, lineHeight: lineHeight.value } });
      this.renderCanvas();
    });

    textColor?.addEventListener('change', () => {
      store.setEmailStyles({ body: { ...store.emailStyles.body, color: textColor.value } });
      this.renderCanvas();
    });

    // Container styles
    const contentBgColor = properties.querySelector('#content-bg-color') as HTMLInputElement;
    const contentWidth = properties.querySelector('#content-width') as HTMLInputElement;
    const borderRadius = properties.querySelector('#content-border-radius') as HTMLInputElement;
    const borderWidth = properties.querySelector('#content-border-width') as HTMLInputElement;
    const borderColor = properties.querySelector('#content-border-color') as HTMLInputElement;
    const borderStyle = properties.querySelector('#content-border-style') as HTMLSelectElement;

    contentBgColor?.addEventListener('change', () => {
      store.setEmailStyles({ container: { ...store.emailStyles.container, backgroundColor: contentBgColor.value } });
      this.renderCanvas();
    });

    contentWidth?.addEventListener('change', () => {
      store.setEmailStyles({ container: { ...store.emailStyles.container, maxWidth: contentWidth.value } });
      this.renderCanvas();
    });

    borderRadius?.addEventListener('change', () => {
      store.setEmailStyles({ container: { ...store.emailStyles.container, borderRadius: borderRadius.value } });
      this.renderCanvas();
    });

    borderWidth?.addEventListener('change', () => {
      store.setEmailStyles({ container: { ...store.emailStyles.container, borderWidth: borderWidth.value } });
      this.renderCanvas();
    });

    borderColor?.addEventListener('change', () => {
      store.setEmailStyles({ container: { ...store.emailStyles.container, borderColor: borderColor.value } });
      this.renderCanvas();
    });

    borderStyle?.addEventListener('change', () => {
      store.setEmailStyles({ container: { ...store.emailStyles.container, borderStyle: borderStyle.value } });
      this.renderCanvas();
    });

    // Link styles
    const linkColor = properties.querySelector('#link-color') as HTMLInputElement;
    const linkHoverColor = properties.querySelector('#link-hover-color') as HTMLInputElement;
    const linkDecoration = properties.querySelector('#link-decoration') as HTMLSelectElement;

    linkColor?.addEventListener('change', () => {
      store.setEmailStyles({ link: { ...store.emailStyles.link, color: linkColor.value } });
      this.renderCanvas();
    });

    linkHoverColor?.addEventListener('change', () => {
      store.setEmailStyles({ link: { ...store.emailStyles.link, hoverColor: linkHoverColor.value } });
      this.renderCanvas();
    });

    linkDecoration?.addEventListener('change', () => {
      store.setEmailStyles({ link: { ...store.emailStyles.link, textDecoration: linkDecoration.value } });
      this.renderCanvas();
    });

    // Heading styles
    const headingFontFamily = properties.querySelector('#heading-font-family') as HTMLSelectElement;
    const headingColor = properties.querySelector('#heading-color') as HTMLInputElement;
    const headingFontWeight = properties.querySelector('#heading-font-weight') as HTMLSelectElement;

    headingFontFamily?.addEventListener('change', () => {
      store.setEmailStyles({ heading: { ...store.emailStyles.heading, fontFamily: headingFontFamily.value } });
      this.renderCanvas();
    });

    headingColor?.addEventListener('change', () => {
      store.setEmailStyles({ heading: { ...store.emailStyles.heading, color: headingColor.value } });
      this.renderCanvas();
    });

    headingFontWeight?.addEventListener('change', () => {
      store.setEmailStyles({ heading: { ...store.emailStyles.heading, fontWeight: headingFontWeight.value } });
      this.renderCanvas();
    });
  }

  private attachBlockPropertyListeners(properties: HTMLElement, block: Block): void {
    const store = useEditorStore.getState();

    properties.querySelectorAll('input, select, textarea').forEach(input => {
      input.addEventListener('change', () => {
        const id = (input as HTMLElement).id;
        const value = (input as HTMLInputElement).type === 'checkbox' 
          ? (input as HTMLInputElement).checked 
          : (input as HTMLInputElement | HTMLTextAreaElement).value;

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

    const imgWidthSlider = properties.querySelector('#img-width-slider') as HTMLInputElement;
    const imgWidthInput = properties.querySelector('#img-width') as HTMLInputElement;
    const imgWidthValue = properties.querySelector('#img-width-value');
    if (imgWidthSlider && imgWidthInput) {
      imgWidthSlider.addEventListener('input', () => {
        const value = `${imgWidthSlider.value}%`;
        imgWidthInput.value = value;
        if (imgWidthValue) imgWidthValue.textContent = value;
        store.updateBlock(block.id, { width: value } as Partial<Block>);
        this.renderCanvas();
      });
    }

    const uploadLogoBtn = properties.querySelector('#btn-upload-logo');
    if (uploadLogoBtn) {
      uploadLogoBtn.addEventListener('click', () => this.handleLogoUpload(block.id));
    }

    if (block.type === 'list') {
      this.attachListItemListeners(properties as HTMLElement, block);
    }

    if (block.type === 'social') {
      this.attachSocialLinkListeners(properties as HTMLElement, block);
    }

    if (block.type === 'menu') {
      this.attachMenuItemListeners(properties as HTMLElement, block);
    }

    if (block.type === 'columns') {
      this.attachColumnsListeners(properties as HTMLElement, block);
    }
  }

  private attachListItemListeners(properties: HTMLElement, block: Block): void {
    if (block.type !== 'list') return;
    const store = useEditorStore.getState();

    properties.querySelectorAll('.list-item-input').forEach(input => {
      const updateItem = () => {
        const index = parseInt((input as HTMLElement).dataset.index || '0');
        const newItems = [...block.items];
        newItems[index] = { ...newItems[index], content: (input as HTMLInputElement).value };
        store.updateBlock(block.id, { items: newItems } as Partial<Block>);
        this.renderCanvas();
      };
      
      input.addEventListener('change', updateItem);
      input.addEventListener('blur', updateItem);
    });

    properties.querySelectorAll('.remove-list-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = parseInt((btn as HTMLElement).dataset.index || '0');
        const newItems = block.items.filter((_, i) => i !== index);
        store.updateBlock(block.id, { items: newItems } as Partial<Block>);
        this.renderProperties();
        this.renderCanvas();
      });
    });

    const addBtn = properties.querySelector('#add-list-item');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        const newItems = [...block.items, { id: `list-item-${Date.now()}`, content: 'New item' }];
        store.updateBlock(block.id, { items: newItems } as Partial<Block>);
        this.renderProperties();
        this.renderCanvas();
      });
    }
  }

  private attachSocialLinkListeners(properties: HTMLElement, block: Block): void {
    if (block.type !== 'social') return;
    const store = useEditorStore.getState();

    properties.querySelectorAll('.social-platform-select').forEach(select => {
      select.addEventListener('change', () => {
        const index = parseInt((select as HTMLElement).dataset.index || '0');
        const newLinks = [...block.links];
        newLinks[index] = { ...newLinks[index], platform: (select as HTMLSelectElement).value as any };
        store.updateBlock(block.id, { links: newLinks } as Partial<Block>);
        this.renderCanvas();
      });
    });

    properties.querySelectorAll('.social-url-input').forEach(input => {
      input.addEventListener('change', () => {
        const index = parseInt((input as HTMLElement).dataset.index || '0');
        const newLinks = [...block.links];
        newLinks[index] = { ...newLinks[index], url: (input as HTMLInputElement).value };
        store.updateBlock(block.id, { links: newLinks } as Partial<Block>);
        this.renderCanvas();
      });
    });

    properties.querySelectorAll('.remove-social-link').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = parseInt((btn as HTMLElement).dataset.index || '0');
        const newLinks = block.links.filter((_, i) => i !== index);
        store.updateBlock(block.id, { links: newLinks } as Partial<Block>);
        this.renderProperties();
        this.renderCanvas();
      });
    });

    const addBtn = properties.querySelector('#add-social-link');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        const newLinks = [...block.links, { id: `social-link-${Date.now()}`, platform: 'facebook' as const, url: '#' }];
        store.updateBlock(block.id, { links: newLinks } as Partial<Block>);
        this.renderProperties();
        this.renderCanvas();
      });
    }
  }

  private attachMenuItemListeners(properties: HTMLElement, block: Block): void {
    if (block.type !== 'menu') return;
    const store = useEditorStore.getState();

    properties.querySelectorAll('.menu-item-text').forEach(input => {
      const updateText = () => {
        const index = parseInt((input as HTMLElement).dataset.index || '0');
        const newItems = [...block.items];
        newItems[index] = { ...newItems[index], text: (input as HTMLInputElement).value };
        store.updateBlock(block.id, { items: newItems } as Partial<Block>);
        this.renderCanvas();
      };
      
      input.addEventListener('change', updateText);
      input.addEventListener('blur', updateText);
    });

    properties.querySelectorAll('.menu-item-link').forEach(input => {
      const updateLink = () => {
        const index = parseInt((input as HTMLElement).dataset.index || '0');
        const newItems = [...block.items];
        newItems[index] = { ...newItems[index], link: (input as HTMLInputElement).value };
        store.updateBlock(block.id, { items: newItems } as Partial<Block>);
        this.renderCanvas();
      };
      
      input.addEventListener('change', updateLink);
      input.addEventListener('blur', updateLink);
    });

    properties.querySelectorAll('.remove-menu-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = parseInt((btn as HTMLElement).dataset.index || '0');
        const newItems = block.items.filter((_, i) => i !== index);
        store.updateBlock(block.id, { items: newItems } as Partial<Block>);
        this.renderProperties();
        this.renderCanvas();
      });
    });

    const addBtn = properties.querySelector('#add-menu-item');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        const newItems = [...block.items, { id: `menu-item-${Date.now()}`, text: 'New Link', link: '#' }];
        store.updateBlock(block.id, { items: newItems } as Partial<Block>);
        this.renderProperties();
        this.renderCanvas();
      });
    }
  }

  private attachColumnsListeners(properties: HTMLElement, block: Block): void {
    if (block.type !== 'columns') return;
    const store = useEditorStore.getState();

    const gapInput = properties.querySelector('#columns-gap') as HTMLInputElement;
    if (gapInput) {
      gapInput.addEventListener('change', () => {
        store.updateBlock(block.id, { gap: gapInput.value } as Partial<Block>);
        this.renderCanvas();
      });
    }

    const stackCheckbox = properties.querySelector('#columns-stack-mobile') as HTMLInputElement;
    if (stackCheckbox) {
      stackCheckbox.addEventListener('change', () => {
        store.updateBlock(block.id, { stackOnMobile: stackCheckbox.checked } as Partial<Block>);
        this.renderCanvas();
      });
    }

    const reverseCheckbox = properties.querySelector('#columns-reverse-mobile') as HTMLInputElement;
    if (reverseCheckbox) {
      reverseCheckbox.addEventListener('change', () => {
        store.updateBlock(block.id, { mobileReverse: reverseCheckbox.checked } as Partial<Block>);
        this.renderCanvas();
      });
    }

    properties.querySelectorAll('.column-width-input').forEach(input => {
      input.addEventListener('change', () => {
        const index = parseInt((input as HTMLElement).dataset.index || '0');
        const newColumns = [...block.columns];
        newColumns[index] = { ...newColumns[index], width: (input as HTMLInputElement).value };
        store.updateBlock(block.id, { columns: newColumns } as Partial<Block>);
        this.renderCanvas();
      });
    });
  }

  private getSocialIcon(platform: string, size: string, style: string): string {
    const colors: Record<string, string> = {
      facebook: '#1877f2',
      twitter: '#1da1f2',
      instagram: '#e4405f',
      linkedin: '#0a66c2',
      youtube: '#ff0000',
      tiktok: '#000000',
      pinterest: '#bd081c',
    };
    const color = style === 'color' ? (colors[platform] || '#333') : (style === 'light' ? '#fff' : '#333');
    const bgColor = style === 'outline' ? 'transparent' : (style === 'light' ? '#333' : 'transparent');
    const border = style === 'outline' ? `2px solid ${color}` : 'none';
    
    const icons: Record<string, string> = {
      facebook: `<svg viewBox="0 0 24 24" fill="${color}"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`,
      twitter: `<svg viewBox="0 0 24 24" fill="${color}"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`,
      instagram: `<svg viewBox="0 0 24 24" fill="${color}"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>`,
      linkedin: `<svg viewBox="0 0 24 24" fill="${color}"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>`,
      youtube: `<svg viewBox="0 0 24 24" fill="${color}"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`,
      tiktok: `<svg viewBox="0 0 24 24" fill="${color}"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>`,
      pinterest: `<svg viewBox="0 0 24 24" fill="${color}"><path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z"/></svg>`,
    };
    
    const sizeNum = parseInt(size) || 32;
    return `<span style="display: inline-block; width: ${sizeNum}px; height: ${sizeNum}px; background: ${bgColor}; border: ${border}; border-radius: 50%; padding: 6px; box-sizing: border-box;">${icons[platform] || icons.facebook}</span>`;
  }

  private extractYouTubeId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  }

  private async handleLogoUpload(blockId: string): Promise<void> {
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
        console.error('Failed to upload logo:', error);
      }
    };

    input.click();
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
      case 'list-type':
        if (block.type === 'list') {
          (updates as any).listType = value;
        }
        break;
      case 'video-url':
        if (block.type === 'video') {
          (updates as any).videoUrl = value;
        }
        break;
      case 'video-thumbnail':
        if (block.type === 'video') {
          (updates as any).thumbnailUrl = value;
        }
        break;
      case 'video-play-color':
        if (block.type === 'video') {
          (updates as any).playButtonColor = value;
        }
        break;
      case 'social-alignment':
        if (block.type === 'social') {
          (updates as any).alignment = value;
        }
        break;
      case 'social-icon-size':
        if (block.type === 'social') {
          (updates as any).iconSize = value;
        }
        break;
      case 'social-spacing':
        if (block.type === 'social') {
          (updates as any).spacing = value;
        }
        break;
      case 'menu-layout':
        if (block.type === 'menu') {
          (updates as any).layout = value;
        }
        break;
      case 'menu-separator':
        if (block.type === 'menu') {
          (updates as any).separator = value;
        }
        break;
      case 'logo-src':
        if (block.type === 'logo') {
          (updates as any).src = value;
        }
        break;
      case 'logo-alt':
        if (block.type === 'logo') {
          (updates as any).alt = value;
        }
        break;
      case 'logo-link':
        if (block.type === 'logo') {
          (updates as any).link = value;
        }
        break;
      case 'logo-width':
        if (block.type === 'logo') {
          (updates as any).width = value;
        }
        break;
      case 'logo-alignment':
        if (block.type === 'logo') {
          (updates as any).alignment = value;
        }
        break;
      case 'header-preheader':
        if (block.type === 'header') {
          (updates as any).preheaderText = value;
        }
        break;
      case 'header-show-web':
        if (block.type === 'header') {
          (updates as any).showWebVersion = value;
        }
        break;
      case 'header-web-text':
        if (block.type === 'header') {
          (updates as any).webVersionText = value;
        }
        break;
      case 'footer-content':
        if (block.type === 'footer') {
          (updates as any).content = value;
        }
        break;
      case 'footer-show-unsubscribe':
        if (block.type === 'footer') {
          (updates as any).showUnsubscribe = value;
        }
        break;
      case 'footer-show-address':
        if (block.type === 'footer') {
          (updates as any).showAddress = value;
        }
        break;
      case 'footer-address':
        if (block.type === 'footer') {
          (updates as any).address = value;
        }
        break;
      case 'html-content':
        if (block.type === 'html') {
          (updates as any).content = value;
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

      .property-group textarea {
        width: 100%;
        padding: 8px;
        border: 1px solid #d1d5db;
        border-radius: 4px;
        font-size: 14px;
        resize: vertical;
      }

      .list-items-editor,
      .social-links-editor,
      .menu-items-editor {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-bottom: 8px;
      }

      .list-item-row,
      .social-link-row,
      .menu-item-row {
        display: flex;
        gap: 4px;
        align-items: center;
      }

      .list-item-row input,
      .social-link-row input,
      .menu-item-row input {
        flex: 1;
        padding: 6px 8px;
        border: 1px solid #d1d5db;
        border-radius: 4px;
        font-size: 13px;
      }

      .social-link-row select {
        width: 100px;
        padding: 6px;
        border: 1px solid #d1d5db;
        border-radius: 4px;
        font-size: 12px;
      }

      .menu-item-row input:first-of-type {
        flex: 0 0 80px;
      }

      .btn-small {
        padding: 4px 8px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        line-height: 1;
      }

      .btn-danger {
        background: #fee2e2;
        color: #dc2626;
      }

      .btn-danger:hover {
        background: #fecaca;
      }

      .empty-drop-zone {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 80px 40px;
        text-align: center;
        color: #9ca3af;
        border: 2px dashed #d1d5db;
        border-radius: 8px;
        margin: 20px;
      }

      .block-toolbar-btn {
        width: 24px;
        height: 24px;
        border: none;
        background: none;
        color: #fff;
        cursor: pointer;
        border-radius: 2px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .block-toolbar-btn:hover {
        background: #374151;
      }

      .block-toolbar-btn.danger:hover {
        background: #dc2626;
      }

      .column-drop-zone {
        min-height: 60px;
        border: 2px dashed transparent;
        border-radius: 4px;
        transition: all 0.2s ease;
      }

      .column-drop-zone.drag-over {
        border-color: #3b82f6;
        background: rgba(59, 130, 246, 0.1);
      }

      .column-drop-zone .placeholder {
        padding: 20px;
        text-align: center;
        color: #9ca3af;
        font-size: 13px;
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
