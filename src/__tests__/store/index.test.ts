import { describe, it, expect, beforeEach } from 'vitest';
import { useEditorStore } from '../../store';
import { createTextBlock, createButtonBlock, createHeadingBlock } from '../../blocks/factory';

// Helper to get fresh state after mutations
const getState = () => useEditorStore.getState();

describe('Editor Store', () => {
  beforeEach(() => {
    // Reset store before each test
    getState().setBlocks([]);
    getState().selectBlock(null);
  });

  describe('Block Management', () => {
    it('should add a block', () => {
      const block = createTextBlock();
      
      getState().addBlock(block);
      
      expect(getState().blocks).toHaveLength(1);
      expect(getState().blocks[0].id).toBe(block.id);
    });

    it('should add a block at specific index', () => {
      const block1 = createTextBlock();
      const block2 = createButtonBlock();
      const block3 = createHeadingBlock();
      
      getState().addBlock(block1);
      getState().addBlock(block2);
      getState().addBlock(block3, 1); // Insert at index 1
      
      expect(getState().blocks[0].id).toBe(block1.id);
      expect(getState().blocks[1].id).toBe(block3.id);
      expect(getState().blocks[2].id).toBe(block2.id);
    });

    it('should update a block', () => {
      const block = createTextBlock({ content: 'Original' });
      
      getState().addBlock(block);
      getState().updateBlock(block.id, { content: 'Updated' });
      
      expect(getState().blocks[0].content).toBe('Updated');
    });

    it('should delete a block', () => {
      const block1 = createTextBlock();
      const block2 = createButtonBlock();
      
      getState().addBlock(block1);
      getState().addBlock(block2);
      getState().deleteBlock(block1.id);
      
      expect(getState().blocks).toHaveLength(1);
      expect(getState().blocks[0].id).toBe(block2.id);
    });

    it('should move a block', () => {
      const block1 = createTextBlock();
      const block2 = createButtonBlock();
      const block3 = createHeadingBlock();
      
      getState().addBlock(block1);
      getState().addBlock(block2);
      getState().addBlock(block3);
      
      getState().moveBlock(block3.id, 0); // Move to first position
      
      expect(getState().blocks[0].id).toBe(block3.id);
      expect(getState().blocks[1].id).toBe(block1.id);
      expect(getState().blocks[2].id).toBe(block2.id);
    });

    it('should duplicate a block', () => {
      const block = createTextBlock({ content: 'Duplicate me' });
      
      getState().addBlock(block);
      getState().duplicateBlock(block.id);
      
      expect(getState().blocks).toHaveLength(2);
      expect(getState().blocks[1].content).toBe('Duplicate me');
      expect(getState().blocks[1].id).not.toBe(block.id);
    });
  });

  describe('Selection', () => {
    it('should select a block', () => {
      const block = createTextBlock();
      
      getState().addBlock(block);
      getState().selectBlock(block.id);
      
      expect(getState().selectedBlockId).toBe(block.id);
    });

    it('should deselect a block', () => {
      const block = createTextBlock();
      
      getState().addBlock(block);
      getState().selectBlock(block.id);
      getState().selectBlock(null);
      
      expect(getState().selectedBlockId).toBeNull();
    });

    it('should get block by id', () => {
      const block = createTextBlock({ content: 'Find me' });
      
      getState().addBlock(block);
      
      const found = getState().getBlockById(block.id);
      expect(found).toBeDefined();
      expect(found?.content).toBe('Find me');
    });
  });

  describe('History (Undo/Redo)', () => {
    it('should undo an action', () => {
      const block = createTextBlock();
      
      getState().addBlock(block);
      expect(getState().blocks).toHaveLength(1);
      
      getState().undo();
      expect(getState().blocks).toHaveLength(0);
    });

    it('should redo an undone action', () => {
      const block = createTextBlock();
      
      getState().addBlock(block);
      getState().undo();
      expect(getState().blocks).toHaveLength(0);
      
      getState().redo();
      expect(getState().blocks).toHaveLength(1);
    });

    it('should support undo after adding blocks', () => {
      // Add a block and verify we can undo
      getState().addBlock(createTextBlock());
      expect(getState().blocks).toHaveLength(1);
      
      getState().undo();
      expect(getState().blocks).toHaveLength(0);
      
      // Redo should restore the block
      getState().redo();
      expect(getState().blocks).toHaveLength(1);
    });
  });

  describe('Email Styles', () => {
    it('should set email styles', () => {
      getState().setEmailStyles({
        body: {
          backgroundColor: '#ff0000',
          fontFamily: 'Arial',
          fontSize: '16px',
          lineHeight: '1.5',
          color: '#000000',
        },
        container: {
          backgroundColor: '#ffffff',
          maxWidth: '600px',
        },
        link: {
          color: '#0000ff',
          textDecoration: 'underline',
        },
      });
      
      expect(getState().emailStyles.body.backgroundColor).toBe('#ff0000');
    });
  });

  describe('Variables', () => {
    it('should set variables', () => {
      const variables = [
        { id: '1', name: 'First Name', key: 'first_name', defaultValue: 'there' },
        { id: '2', name: 'Email', key: 'email', defaultValue: '' },
      ];
      
      getState().setVariables(variables);
      
      expect(getState().variables).toHaveLength(2);
      expect(getState().variables[0].key).toBe('first_name');
    });
  });

  describe('Preview Mode', () => {
    it('should toggle preview mode', () => {
      expect(getState().previewMode).toBe('desktop');
      
      getState().setPreviewMode('mobile');
      expect(getState().previewMode).toBe('mobile');
    });
  });
});
