import { describe, it, expect } from 'vitest';
import { minifyPromptContent } from '../../lib/prompt/minifier'; // Corrected path

describe('Minifier', () => {
  it('should remove HTML comments', () => {
    const content = 'Hello <!-- this is a comment --> world';
    const expected = 'Hello world';
    expect(minifyPromptContent(content)).toBe(expected);
  });

  it('should remove multi-line HTML comments', () => {
    const content = `Line 1
<!--
  Multi-line comment
-->
Line 2`;
    const expected = 'Line 1 Line 2';
    expect(minifyPromptContent(content)).toBe(expected);
  });

  it('should collapse multiple whitespace characters to a single space', () => {
    const content = `Too   much 	
 space`;
    const expected = 'Too much space';
    expect(minifyPromptContent(content)).toBe(expected);
  });

  it('should trim leading and trailing whitespace', () => {
    const content = '  Content with spaces  ';
    const expected = 'Content with spaces';
    expect(minifyPromptContent(content)).toBe(expected);
  });

  it('should handle content with no comments or extra whitespace', () => {
    const content = 'Simple content.';
    const expected = 'Simple content.';
    expect(minifyPromptContent(content)).toBe(expected);
  });

  it('should handle empty string', () => {
    const content = '';
    const expected = '';
    expect(minifyPromptContent(content)).toBe(expected);
  });

  it('should handle content with only comments', () => {
    const content = '<!-- comment 1 --><!-- comment 2 -->';
    const expected = '';
    expect(minifyPromptContent(content)).toBe(expected);
  });

  it('should combine comment removal, whitespace collapsing, and trimming', () => {
    const content = `
      Start <!-- comment --> middle   
	 end.
    `;
    const expected = 'Start middle end.';
    expect(minifyPromptContent(content)).toBe(expected);
  });
});
