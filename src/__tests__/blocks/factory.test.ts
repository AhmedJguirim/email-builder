import { describe, it, expect } from 'vitest';
import {
  createBlock,
  createTextBlock,
  createHeadingBlock,
  createImageBlock,
  createButtonBlock,
  createDividerBlock,
  createSpacerBlock,
  createColumnsBlock,
  createSocialBlock,
  createFooterBlock,
  createHeaderBlock,
  createListBlock,
  BLOCK_DEFINITIONS,
} from '../../blocks/factory';

describe('Block Factory', () => {
  describe('createTextBlock', () => {
    it('should create a text block with default values', () => {
      const block = createTextBlock();
      
      expect(block.type).toBe('text');
      expect(block.id).toMatch(/^text_/);
      expect(block.content).toBeDefined();
      expect(block.styles).toBeDefined();
    });

    it('should allow overriding default values', () => {
      const block = createTextBlock({
        content: '<p>Custom content</p>',
      });
      
      expect(block.content).toBe('<p>Custom content</p>');
    });
  });

  describe('createHeadingBlock', () => {
    it('should create a heading block with default level', () => {
      const block = createHeadingBlock();
      
      expect(block.type).toBe('heading');
      expect(block.level).toBe(2);
      expect(block.content).toBeDefined();
    });

    it('should allow setting heading level', () => {
      const block = createHeadingBlock({ level: 1 });
      expect(block.level).toBe(1);
    });
  });

  describe('createImageBlock', () => {
    it('should create an image block with empty src', () => {
      const block = createImageBlock();
      
      expect(block.type).toBe('image');
      expect(block.src).toBe('');
      expect(block.alt).toBeDefined();
    });

    it('should allow setting image properties', () => {
      const block = createImageBlock({
        src: 'https://example.com/image.jpg',
        alt: 'Test image',
      });
      
      expect(block.src).toBe('https://example.com/image.jpg');
      expect(block.alt).toBe('Test image');
    });
  });

  describe('createButtonBlock', () => {
    it('should create a button block with default styles', () => {
      const block = createButtonBlock();
      
      expect(block.type).toBe('button');
      expect(block.text).toBeDefined();
      expect(block.link).toBeDefined();
      expect(block.buttonStyles).toBeDefined();
      expect(block.buttonStyles.backgroundColor).toBeDefined();
      expect(block.buttonStyles.textColor).toBeDefined();
    });

    it('should allow customizing button text and link', () => {
      const block = createButtonBlock({
        text: 'Click Me',
        link: 'https://example.com',
      });
      
      expect(block.text).toBe('Click Me');
      expect(block.link).toBe('https://example.com');
    });
  });

  describe('createDividerBlock', () => {
    it('should create a divider block', () => {
      const block = createDividerBlock();
      
      expect(block.type).toBe('divider');
      expect(block.dividerStyles).toBeDefined();
      expect(block.dividerStyles.style).toBeDefined();
      expect(block.dividerStyles.color).toBeDefined();
    });
  });

  describe('createSpacerBlock', () => {
    it('should create a spacer block with default height', () => {
      const block = createSpacerBlock();
      
      expect(block.type).toBe('spacer');
      expect(block.height).toBeDefined();
    });

    it('should allow setting custom height', () => {
      const block = createSpacerBlock({ height: '50px' });
      expect(block.height).toBe('50px');
    });
  });

  describe('createColumnsBlock', () => {
    it('should create a 2-column layout by default', () => {
      const block = createColumnsBlock();
      
      expect(block.type).toBe('columns');
      expect(block.columns).toHaveLength(2);
    });

    it('should create specified number of columns', () => {
      const block = createColumnsBlock(3);
      expect(block.columns).toHaveLength(3);
    });

    it('should set equal widths for columns', () => {
      const block = createColumnsBlock(4);
      block.columns.forEach(col => {
        expect(col.width).toBe('25%');
      });
    });
  });

  describe('createSocialBlock', () => {
    it('should create a social block with default links', () => {
      const block = createSocialBlock();
      
      expect(block.type).toBe('social');
      expect(block.links).toBeDefined();
      expect(Array.isArray(block.links)).toBe(true);
    });
  });

  describe('createFooterBlock', () => {
    it('should create a footer block with unsubscribe option', () => {
      const block = createFooterBlock();
      
      expect(block.type).toBe('footer');
      expect(block.showUnsubscribe).toBeDefined();
      expect(block.content).toBeDefined();
    });
  });

  describe('createHeaderBlock', () => {
    it('should create a header block', () => {
      const block = createHeaderBlock();
      
      expect(block.type).toBe('header');
      expect(block.showWebVersion).toBeDefined();
    });
  });

  describe('createListBlock', () => {
    it('should create an unordered list by default', () => {
      const block = createListBlock();
      
      expect(block.type).toBe('list');
      expect(block.listType).toBe('unordered');
      expect(block.items).toBeDefined();
    });

    it('should allow creating ordered list', () => {
      const block = createListBlock({ listType: 'ordered' });
      expect(block.listType).toBe('ordered');
    });
  });

  describe('createBlock', () => {
    it('should create any block type dynamically', () => {
      const textBlock = createBlock('text');
      expect(textBlock.type).toBe('text');

      const buttonBlock = createBlock('button');
      expect(buttonBlock.type).toBe('button');

      const imageBlock = createBlock('image');
      expect(imageBlock.type).toBe('image');
    });

    it('should throw error for unknown block type', () => {
      expect(() => createBlock('unknown' as any)).toThrow();
    });
  });

  describe('BLOCK_DEFINITIONS', () => {
    it('should contain all block types', () => {
      const types = BLOCK_DEFINITIONS.map(def => def.type);
      
      expect(types).toContain('text');
      expect(types).toContain('heading');
      expect(types).toContain('image');
      expect(types).toContain('button');
      expect(types).toContain('divider');
      expect(types).toContain('spacer');
      expect(types).toContain('columns');
      expect(types).toContain('social');
    });

    it('should have labels for all blocks', () => {
      BLOCK_DEFINITIONS.forEach(def => {
        expect(def.label).toBeDefined();
        expect(def.label.length).toBeGreaterThan(0);
      });
    });

    it('should have categories for all blocks', () => {
      const validCategories = ['content', 'layout', 'media', 'social', 'structure'];
      
      BLOCK_DEFINITIONS.forEach(def => {
        expect(validCategories).toContain(def.category);
      });
    });
  });
});
