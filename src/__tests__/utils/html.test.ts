import { describe, it, expect } from 'vitest';
import {
  escapeHtml,
  unescapeHtml,
  sanitizeHtml,
  stripHtmlTags,
  wrapInTable,
  createEmailWrapper,
} from '../../utils/html';

describe('HTML Utilities', () => {
  describe('escapeHtml', () => {
    it('should escape HTML special characters', () => {
      expect(escapeHtml('<div>')).toBe('&lt;div&gt;');
      expect(escapeHtml('"test"')).toBe('&quot;test&quot;');
      expect(escapeHtml("'test'")).toContain('test');
      expect(escapeHtml('a & b')).toBe('a &amp; b');
    });

    it('should handle empty string', () => {
      expect(escapeHtml('')).toBe('');
    });

    it('should handle string without special characters', () => {
      expect(escapeHtml('hello world')).toBe('hello world');
    });
  });

  describe('unescapeHtml', () => {
    it('should unescape HTML entities', () => {
      expect(unescapeHtml('&lt;div&gt;')).toBe('<div>');
      expect(unescapeHtml('&quot;test&quot;')).toBe('"test"');
      expect(unescapeHtml('a &amp; b')).toBe('a & b');
    });

    it('should be inverse of escapeHtml', () => {
      const original = '<div class="test">Hello & World</div>';
      expect(unescapeHtml(escapeHtml(original))).toBe(original);
    });
  });

  describe('sanitizeHtml', () => {
    it('should remove script tags', () => {
      const result = sanitizeHtml('<p>Hello</p><script>alert("xss")</script>');
      expect(result).not.toContain('<script>');
      expect(result).toContain('<p>Hello</p>');
    });

    it('should remove event handlers', () => {
      const result = sanitizeHtml('<div onclick="alert(1)">Click</div>');
      expect(result).not.toContain('onclick');
    });

    it('should preserve safe HTML', () => {
      const result = sanitizeHtml('<p><strong>Bold</strong> and <em>italic</em></p>');
      expect(result).toContain('<strong>Bold</strong>');
      expect(result).toContain('<em>italic</em>');
    });
  });

  describe('stripHtmlTags', () => {
    it('should remove all HTML tags', () => {
      expect(stripHtmlTags('<p>Hello <strong>World</strong></p>')).toBe('Hello World');
    });

    it('should handle nested tags', () => {
      expect(stripHtmlTags('<div><p><span>Text</span></p></div>')).toBe('Text');
    });

    it('should handle empty string', () => {
      expect(stripHtmlTags('')).toBe('');
    });
  });

  describe('wrapInTable', () => {
    it('should wrap content in a table', () => {
      const result = wrapInTable('<p>Content</p>', '100%');
      expect(result).toContain('<table');
      expect(result).toContain('<p>Content</p>');
      expect(result).toContain('</table>');
    });

    it('should include width in style', () => {
      const result = wrapInTable('Content', '600px');
      expect(result).toContain('600px');
    });
  });

  describe('createEmailWrapper', () => {
    it('should create complete email HTML document', () => {
      const result = createEmailWrapper(
        '<tr><td style="border-collapse: collapse;">Email content</td></tr>',
        'background-color: #f5f5f5;',
        'background-color: #ffffff;',
        '600px'
      );
      
      expect(result).toContain('<!DOCTYPE html>');
      expect(result).toContain('<html');
      expect(result).toContain('<head>');
      expect(result).toContain('<body');
      expect(result).toContain('Email content');
      expect(result).toContain('</html>');
    });

    it('should include viewport meta tag', () => {
      const result = createEmailWrapper('<tr><td style="border-collapse: collapse;">Test</td></tr>', '', '', '600px');
      expect(result).toContain('viewport');
    });
  });
});
