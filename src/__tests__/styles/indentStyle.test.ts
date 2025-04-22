import { describe, it, expect } from 'vitest';
import { applyIndentStyle } from '../../lib/styles/indentStyle'; // Adjust path as needed

describe('Indent Style', () => {
  it('should add indentation to each non-empty line', () => {
    const content = 'Line 1\nLine 2\n\nLine 4';
    const indentation = '  '; // Two spaces
    const expected = '  Line 1\n  Line 2\n\n  Line 4';
    expect(applyIndentStyle(content, indentation)).toBe(expected);
  });

  it('should handle different indentation strings (tabs)', () => {
    const content = 'First line\nSecond line';
    const indentation = '\t'; // Tab
    const expected = '\tFirst line\n\tSecond line';
    expect(applyIndentStyle(content, indentation)).toBe(expected);
  });

  it('should handle empty content', () => {
    const content = '';
    const indentation = '  ';
    const expected = '';
    expect(applyIndentStyle(content, indentation)).toBe(expected);
  });

  it('should handle content with only newlines', () => {
    const content = '\n\n\n';
    const indentation = '  ';
    const expected = '\n\n\n'; // Empty lines are not indented
    expect(applyIndentStyle(content, indentation)).toBe(expected);
  });

  it('should handle content with leading/trailing newlines', () => {
    const content = '\nLine 1\nLine 2\n';
    const indentation = '  ';
    const expected = '\n  Line 1\n  Line 2\n';
    expect(applyIndentStyle(content, indentation)).toBe(expected);
  });

  it('should handle content with Windows-style newlines (CRLF)', () => {
    const content = 'Line A\r\nLine B';
    const indentation = '    '; // Four spaces
    const expected = '    Line A\n    Line B'; // Output uses LF
    expect(applyIndentStyle(content, indentation)).toBe(expected);
  });
});
