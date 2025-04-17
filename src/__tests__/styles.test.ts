import { describe, it, expect } from 'vitest';
import { applyInlineStyle } from '../lib/styles/inlineStyle';
import { applyIndentStyle } from '../lib/styles/indentStyle';
import { StyleType, styleHandlers } from '../lib/styles';
import { applyTransformations } from '../lib/transformations';

describe('Include Directive Style Features', () => {
  describe('inlineStyle', () => {
    it('should replace newlines with spaces', () => {
      const input = 'Line 1\nLine 2\nLine 3';
      const expected = 'Line 1 Line 2 Line 3';
      expect(applyInlineStyle(input, '')).toBe(expected);
    });

    it('should handle empty content', () => {
      expect(applyInlineStyle('', '')).toBe('');
    });

    it('should trim leading and trailing whitespace', () => {
      const input = '  Line 1\nLine 2  \n  Line 3  ';
      const expected = 'Line 1 Line 2 Line 3';
      expect(applyInlineStyle(input, '')).toBe(expected);
    });
  });

  describe('indentStyle', () => {
    it('should add indentation to each non-empty line', () => {
      const input = 'Line 1\nLine 2\nLine 3';
      const indentation = '  ';
      const expected = '  Line 1\n  Line 2\n  Line 3';
      expect(applyIndentStyle(input, indentation)).toBe(expected);
    });

    it('should not add indentation to empty lines', () => {
      const input = 'Line 1\n\nLine 3';
      const indentation = '  ';
      const expected = '  Line 1\n\n  Line 3';
      expect(applyIndentStyle(input, indentation)).toBe(expected);
    });

    it('should handle content with existing indentation', () => {
      const input = '  Line 1\n  Line 2';
      const indentation = '    ';
      const expected = '    Line 1\n    Line 2';
      expect(applyIndentStyle(input, indentation)).toBe(expected);
    });
  });

  describe('styleHandlers', () => {
    it('should have handlers for each style type', () => {
      expect(styleHandlers[StyleType.Inline]).toBe(applyInlineStyle);
      expect(styleHandlers[StyleType.Indent]).toBe(applyIndentStyle);
    });
  });
});

describe('Include Directive Transformation Features', () => {
  describe('applyTransformations', () => {
    it('should handle removeLines transformation', () => {
      const content = 'Line 0\nLine 1\nLine 2\nLine 3\nLine 4';
      const transforms = [{ type: 'removeLines', lines: [1, 3] }]; // Remove lines 1 and 3 (0-based index)
      const expected = 'Line 0\nLine 2\nLine 4';
      const result = applyTransformations(content, transforms);
      expect(result).toBe(expected);
    });

    it('should handle removeRegex transformation', () => {
      const content = 'Hello world! This is a test.';
      const transforms = [{ type: 'removeRegex', pattern: 'world!?\\s*', flags: 'g' }];
      const expected = 'Hello This is a test.';
      const result = applyTransformations(content, transforms);
      expect(result).toBe(expected);
    });

    it('should handle addPrefix transformation', () => {
      const content = 'Content';
      const transforms = [{ type: 'addPrefix', text: 'Prefix: ' }];
      const expected = 'Prefix: Content';
      const result = applyTransformations(content, transforms);
      expect(result).toBe(expected);
    });

    it('should handle addSuffix transformation', () => {
      const content = 'Content';
      const transforms = [{ type: 'addSuffix', text: ' (end)' }];
      const expected = 'Content (end)';
      const result = applyTransformations(content, transforms);
      expect(result).toBe(expected);
    });

    it('should apply multiple transformations in sequence', () => {
      const content = 'Line 0\nLine 1\nLine 2\nLine 3\nLine 4';
      const transforms = [
        { type: 'removeLines', lines: [1, 3] },           // Remove lines 1 and 3
        { type: 'addPrefix', text: '# ' },               // Add a prefix
        { type: 'removeRegex', pattern: 'Line', flags: 'g' }, // Remove "Line" text
        { type: 'addSuffix', text: '\nEnd of content' }  // Add a suffix
      ];
      const expected = '# 0\n2\n4\nEnd of content';
      const result = applyTransformations(content, transforms);
      expect(result).toBe(expected);
    });

    it('should return original content when no transformations are provided', () => {
      const content = 'Original content';
      expect(applyTransformations(content, [])).toBe(content);
      expect(applyTransformations(content, null as any)).toBe(content);
      expect(applyTransformations(content, undefined as any)).toBe(content);
    });
  });
});
