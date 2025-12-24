import { describe, it, expect } from 'vitest';
import {
  parseVariables,
  replaceVariables,
  createVariableTag,
  isValidVariableKey,
  VARIABLE_PATTERN,
} from '../../types/variables';

describe('Variable Utilities', () => {
  describe('VARIABLE_PATTERN', () => {
    it('should match valid variable syntax', () => {
      expect('{{ name }}'.match(VARIABLE_PATTERN)).toBeTruthy();
      expect('{{name}}'.match(VARIABLE_PATTERN)).toBeTruthy();
      expect('{{ first_name }}'.match(VARIABLE_PATTERN)).toBeTruthy();
    });

    it('should not match invalid syntax', () => {
      expect('{ name }'.match(VARIABLE_PATTERN)).toBeFalsy();
      expect('name'.match(VARIABLE_PATTERN)).toBeFalsy();
    });
  });

  describe('parseVariables', () => {
    it('should extract variable keys from text', () => {
      const text = 'Hello {{ first_name }}, your email is {{ email }}';
      const vars = parseVariables(text);
      
      expect(vars).toContain('first_name');
      expect(vars).toContain('email');
      expect(vars).toHaveLength(2);
    });

    it('should return empty array for text without variables', () => {
      const vars = parseVariables('Hello World');
      expect(vars).toHaveLength(0);
    });

    it('should handle duplicate variables', () => {
      const text = '{{ name }} and {{ name }}';
      const vars = parseVariables(text);
      
      // Should return all matches (including duplicates)
      expect(vars.filter(v => v === 'name').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('replaceVariables', () => {
    it('should replace variables with values', () => {
      const text = 'Hello {{ first_name }}!';
      const values = new Map([['first_name', 'John']]);
      
      const result = replaceVariables(text, values);
      expect(result).toBe('Hello John!');
    });

    it('should handle multiple variables', () => {
      const text = '{{ greeting }}, {{ name }}!';
      const values = new Map([
        ['greeting', 'Hi'],
        ['name', 'Jane'],
      ]);
      
      const result = replaceVariables(text, values);
      expect(result).toBe('Hi, Jane!');
    });

    it('should keep unmatched variables unchanged', () => {
      const text = 'Hello {{ unknown_var }}';
      const values = new Map<string, string>();
      
      const result = replaceVariables(text, values);
      expect(result).toBe('Hello {{ unknown_var }}');
    });
  });

  describe('createVariableTag', () => {
    it('should create a properly formatted variable tag', () => {
      expect(createVariableTag('first_name')).toBe('{{ first_name }}');
      expect(createVariableTag('email')).toBe('{{ email }}');
    });
  });

  describe('isValidVariableKey', () => {
    it('should accept valid variable keys', () => {
      expect(isValidVariableKey('first_name')).toBe(true);
      expect(isValidVariableKey('email')).toBe(true);
      expect(isValidVariableKey('company_address')).toBe(true);
      expect(isValidVariableKey('var123')).toBe(true);
    });

    it('should reject invalid variable keys', () => {
      expect(isValidVariableKey('')).toBe(false);
      expect(isValidVariableKey('123start')).toBe(false);
      expect(isValidVariableKey('has space')).toBe(false);
      expect(isValidVariableKey('has-dash')).toBe(false);
    });
  });
});
