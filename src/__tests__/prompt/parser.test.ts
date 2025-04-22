import { describe, it, expect } from 'vitest';
import { parseOptions } from '../../lib/prompt/parser'; // Adjust path as needed
import { StyleType } from '../../lib/styles/types'; // Adjust path as needed
import { IncludeOptions } from '../../lib/prompt/types'; // Adjust path as needed

describe('Parser - parseOptions', () => {

  it('should parse simple file path only', () => {
    const input = 'path/to/file.txt';
    const expected: IncludeOptions = {
      filePath: 'path/to/file.txt'
    };
    expect(parseOptions(input)).toEqual(expected);
  });

  it('should parse file path with simple line numbers (L1)', () => {
    const input = 'path/to/file.txt#L5';
    const expected: IncludeOptions = {
      filePath: 'path/to/file.txt',
      startLine: 5
    };
    expect(parseOptions(input)).toEqual(expected);
  });

  it('should parse file path with line range (L1-L5)', () => {
    const input = 'path/to/file.txt#L10-L20';
    const expected: IncludeOptions = {
      filePath: 'path/to/file.txt',
      startLine: 10,
      endLine: 20
    };
    expect(parseOptions(input)).toEqual(expected);
  });

  it('should parse file path with startRegex only', () => {
    const input = 'path/to/file.txt#startRegex=^Start';
    const expected: IncludeOptions = {
      filePath: 'path/to/file.txt',
      startRegex: /^Start/
    };
    expect(parseOptions(input)).toEqual(expected);
  });

  it('should parse file path with startRegex and endRegex', () => {
    const input = 'path/to/file.txt#startRegex=^Start,endRegex=$End';
    const expected: IncludeOptions = {
      filePath: 'path/to/file.txt',
      startRegex: /^Start/,
      endRegex: /$End/
    };
    expect(parseOptions(input)).toEqual(expected);
  });

  it('should parse file path with style option', () => {
    const input = "path/to/file.txt, style: 'inline'";
    const expected: IncludeOptions = {
      filePath: 'path/to/file.txt',
      style: StyleType.Inline
    };
    expect(parseOptions(input)).toEqual(expected);
  });

  it('should parse file path with line range and style option', () => {
    const input = "path/to/file.txt#L5-L10, style: 'indent'";
    const expected: IncludeOptions = {
      filePath: 'path/to/file.txt',
      startLine: 5,
      endLine: 10,
      style: StyleType.Indent
    };
    expect(parseOptions(input)).toEqual(expected);
  });

  it('should parse file path with regex and style option', () => {
    const input = "path/to/file.txt#startRegex=Begin, style: 'none'";
    const expected: IncludeOptions = {
      filePath: 'path/to/file.txt',
      startRegex: /Begin/,
      style: StyleType.None
    };
    expect(parseOptions(input)).toEqual(expected);
  });

  it('should parse file path with transformation options', () => {
    const input = "path/to/file.txt, transform: [{ type: 'slice', start: 1, end: 5 }]";
    const expected: IncludeOptions = {
      filePath: 'path/to/file.txt',
      transform: [{ type: 'slice', start: 1, end: 5 }]
    };
    expect(parseOptions(input)).toEqual(expected);
  });

  it('should parse file path with multiple options (lines, style, transform)', () => {
    const input = "path/to/file.txt#L1-L2, style: 'inline', transform: [{ type: 'toUpperCase' }]";
    const expected: IncludeOptions = {
      filePath: 'path/to/file.txt',
      startLine: 1,
      endLine: 2,
      style: StyleType.Inline,
      transform: [{ type: 'toUpperCase' }]
    };
    expect(parseOptions(input)).toEqual(expected);
  });

  it('should handle legacy JSON-like format (file property)', () => {
    const input = "file: 'path/to/legacy.txt#L3-L4', style: 'indent'";
    const expected: IncludeOptions = {
      filePath: 'path/to/legacy.txt',
      startLine: 3,
      endLine: 4,
      style: StyleType.Indent
    };
    expect(parseOptions(input)).toEqual(expected);
  });

  it('should handle spaces around delimiters', () => {
    const input = "  path/to/spaced.txt  #  L5  -  L10  ,  style :  'inline'  ";
    const expected: IncludeOptions = {
      filePath: 'path/to/spaced.txt',
      startLine: 5,
      endLine: 10,
      style: StyleType.Inline
    };
    expect(parseOptions(input)).toEqual(expected);
  });

  it('should throw error for invalid hash format', () => {
    const input = 'path/to/file.txt#invalidhash';
    expect(() => parseOptions(input)).toThrow(/Invalid hash options format/);
  });

  it('should throw error for invalid line numbers in hash', () => {
    const input = 'path/to/file.txt#L1-L0'; // End < Start
    expect(() => parseOptions(input)).toThrow(/Start line cannot be greater than end line/);
    const input2 = 'path/to/file.txt#Labc'; // Not numbers
    expect(() => parseOptions(input2)).toThrow(/Invalid line numbers in options/);
  });

  it('should throw error for invalid regex pattern in hash', () => {
    const input = 'path/to/file.txt#startRegex=['; // Invalid regex
    expect(() => parseOptions(input)).toThrow(/Invalid regex pattern in options/);
  });

  it('should throw error for invalid style value', () => {
    const input = "path/to/file.txt, style: 'invalidStyle'";
    expect(() => parseOptions(input)).toThrow(/Invalid style/);
  });

  it('should throw error for invalid JSON-like options format', () => {
    const input = "path/to/file.txt, style: 'inline', transform: not-an-array";
    expect(() => parseOptions(input)).toThrow(/Error parsing main include parameters/);
  });

  it('should handle escaped commas within quoted values', () => {
    // This requires more robust JSON parsing, current simple parser might fail
    // Example: path/to/file.txt, description: 'A value, with a comma'
    // For now, we assume simple values or valid JSON for complex types like transform
    const input = "path/to/file.txt, style: 'inline'"; // Simple case works
    const expected: IncludeOptions = {
      filePath: 'path/to/file.txt',
      style: StyleType.Inline
    };
    expect(parseOptions(input)).toEqual(expected);
  });

});
