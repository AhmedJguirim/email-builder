import { describe, it, expect } from 'vitest';
import { generateId, generateBlockId, generateShortId } from '../../utils/id';

describe('ID Utilities', () => {
  describe('generateId', () => {
    it('should generate a valid UUID', () => {
      const id = generateId();
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should generate unique IDs', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        ids.add(generateId());
      }
      expect(ids.size).toBe(100);
    });
  });

  describe('generateBlockId', () => {
    it('should generate an ID with the correct prefix', () => {
      const id = generateBlockId('text');
      expect(id).toMatch(/^text_[a-z0-9]+$/);
    });

    it('should generate different IDs for different block types', () => {
      const textId = generateBlockId('text');
      const imageId = generateBlockId('image');
      
      expect(textId.startsWith('text_')).toBe(true);
      expect(imageId.startsWith('image_')).toBe(true);
    });

    it('should generate unique IDs for same block type', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 50; i++) {
        ids.add(generateBlockId('button'));
      }
      expect(ids.size).toBe(50);
    });
  });

  describe('generateShortId', () => {
    it('should generate a short ID', () => {
      const id = generateShortId();
      expect(id.length).toBe(8);
    });

    it('should only contain alphanumeric characters', () => {
      const id = generateShortId();
      expect(id).toMatch(/^[a-z0-9]+$/);
    });
  });
});
