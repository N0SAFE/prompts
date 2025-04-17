// src/lib/styles/inlineStyle.ts
import { StyleFunction } from './types';

/**
 * Applies the 'inline' style: removes all line breaks and replaces them with a space.
 * Ignores indentation.
 * @param content The string content to style.
 * @returns The inlined string.
 */
export const applyInlineStyle: StyleFunction = (content: string): string => {
  return content.replace(/\r?\n/g, ' ').trim(); // Replace newlines with space and trim
};
