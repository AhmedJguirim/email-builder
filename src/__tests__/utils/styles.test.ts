import { describe, it, expect } from 'vitest';
import {
  stylesToCss,
  stylesToInlineStyle,
  parseInlineStyles,
  mergeStyles,
  getPaddingShorthand,
  getMarginShorthand,
} from '../../utils/styles';

describe('Style Utilities', () => {
  describe('stylesToCss', () => {
    it('should convert camelCase to kebab-case', () => {
      const result = stylesToCss({ backgroundColor: '#fff' });
      expect(result).toBe('background-color: #fff');
    });

    it('should handle multiple properties', () => {
      const result = stylesToCss({
        backgroundColor: '#fff',
        fontSize: '16px',
        color: '#333',
      });
      expect(result).toContain('background-color: #fff');
      expect(result).toContain('font-size: 16px');
      expect(result).toContain('color: #333');
    });

    it('should skip undefined values', () => {
      const result = stylesToCss({
        backgroundColor: '#fff',
        color: undefined,
      });
      expect(result).toBe('background-color: #fff');
    });

    it('should return empty string for empty object', () => {
      const result = stylesToCss({});
      expect(result).toBe('');
    });
  });

  describe('stylesToInlineStyle', () => {
    it('should create inline style string', () => {
      const result = stylesToInlineStyle({ color: 'red', fontSize: '14px' });
      expect(result).toContain('color: red');
      expect(result).toContain('font-size: 14px');
    });
  });

  describe('parseInlineStyles', () => {
    it('should parse CSS string to object', () => {
      const result = parseInlineStyles('color: red; font-size: 14px');
      expect(result).toEqual({
        color: 'red',
        fontSize: '14px',
      });
    });

    it('should handle empty string', () => {
      const result = parseInlineStyles('');
      expect(result).toEqual({});
    });

    it('should trim whitespace', () => {
      const result = parseInlineStyles('  color:   red  ;   font-size: 14px  ');
      expect(result.color).toBe('red');
      expect(result.fontSize).toBe('14px');
    });
  });

  describe('mergeStyles', () => {
    it('should merge two style objects', () => {
      const base = { color: 'red', fontSize: '14px' };
      const override = { color: 'blue', fontWeight: 'bold' };
      const result = mergeStyles(base, override);
      
      expect(result).toEqual({
        color: 'blue',
        fontSize: '14px',
        fontWeight: 'bold',
      });
    });

    it('should not mutate original objects', () => {
      const base = { color: 'red' };
      const override = { color: 'blue' };
      mergeStyles(base, override);
      
      expect(base.color).toBe('red');
    });
  });

  describe('getPaddingShorthand', () => {
    it('should return shorthand for equal padding', () => {
      const result = getPaddingShorthand({
        paddingTop: '10px',
        paddingRight: '10px',
        paddingBottom: '10px',
        paddingLeft: '10px',
      });
      expect(result).toBe('10px');
    });

    it('should return two values for vertical/horizontal', () => {
      const result = getPaddingShorthand({
        paddingTop: '10px',
        paddingRight: '20px',
        paddingBottom: '10px',
        paddingLeft: '20px',
      });
      expect(result).toBe('10px 20px');
    });

    it('should return four values when all different', () => {
      const result = getPaddingShorthand({
        paddingTop: '10px',
        paddingRight: '20px',
        paddingBottom: '30px',
        paddingLeft: '40px',
      });
      expect(result).toBe('10px 20px 30px 40px');
    });
  });

  describe('getMarginShorthand', () => {
    it('should return shorthand for equal margin', () => {
      const result = getMarginShorthand({
        marginTop: '5px',
        marginRight: '5px',
        marginBottom: '5px',
        marginLeft: '5px',
      });
      expect(result).toBe('5px');
    });
  });
});
