import { describe, it, expect } from 'vitest';
import { applyInlineStyle } from '../../lib/styles/inlineStyle'; // Adjust path as needed

describe('Inline Style', () => {
  it('should replace newlines (LF) with spaces', () => {
    const content = 'Line 1\nLine 2\nLine 3';
    const expected = 'Line 1 Line 2 Line 3';
    // Indentation argument is ignored by inline style, but required by the type
    expect(applyInlineStyle(content, '')).toBe(expected);
  });

  it('should replace Windows newlines (CRLF) with spaces', () => {
    const content = 'Line A\r\nLine B\r\nLine C';
    const expected = 'Line A Line B Line C';
    expect(applyInlineStyle(content, '')).toBe(expected);
  });

  it('should trim leading and trailing whitespace resulting from replacements', () => {
    const content = '\n  Content with spaces  \n';
    const expected = 'Content with spaces';
    expect(applyInlineStyle(content, '')).toBe(expected);
  });

  it('should handle content with multiple spaces between lines', () => {
    const content = 'Word1\n   \nWord2';
    const expected = 'Word1 Word2';
    expect(applyInlineStyle(content, '')).toBe(expected);
  });

  it('should handle empty content', () => {
    const content = '';
    const expected = '';
    expect(applyInlineStyle(content, '')).toBe(expected);
  });

  it('should handle content with only newlines', () => {
    const content = '\n\n\n';
    const expected = ''; // Collapses to single space then trimmed
    expect(applyInlineStyle(content, '')).toBe(expected);
  });

  it('should handle content with no newlines', () => {
    const content = 'Single line content.';
    const expected = 'Single line content.';
    expect(applyInlineStyle(content, '')).toBe(expected);
  });
});
