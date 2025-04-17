// src/lib/styles/indentStyle.ts
import { StyleFunction } from './types';

/**
 * Applies the 'indent' style: adds the base indentation to each line of the content.
 * @param content The string content to style.
 * @param indentation The base indentation string (spaces or tabs).
 * @returns The indented string.
 */
export const applyIndentStyle: StyleFunction = (content: string, indentation: string): string => {
  // Split into lines, add indentation to each non-empty line, and join back
  return content
    .split(/\r?\n/)
    .map((line) => (line.trim() ? indentation + line : line)) // Add indent only to non-empty lines
    .join('\n');
};
