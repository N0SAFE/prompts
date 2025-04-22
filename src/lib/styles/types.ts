// src/lib/styles/types.ts

/**
 * Defines the signature for a style application function.
 * @param content The string content to apply the style to.
 * @param indentation The base indentation level of the directive line.
 * @returns The styled string.
 */
export type StyleFunction = (content: string, indentation: string) => string;

/**
 * Enum for the built-in style types.
 */
export enum StyleType {
  None = 'none',
  Inline = 'inline',
  Indent = 'indent',
}