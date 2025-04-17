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

/**
 * Represents a single transformation step.
 */
export type Transformation = 
  | { type: 'removeLines'; lines: number[] } // 0-based line indices to remove
  | { type: 'removeRegex'; pattern: string; flags?: string } // Regex pattern to remove matches
  | { type: 'addPrefix'; text: string } // Text to add at the beginning
  | { type: 'addSuffix'; text: string }; // Text to add at the end

/**
 * Represents the parameters for the include directive.
 */
export interface IncludeParams {
  file: string;
  style?: string;
  transform?: Transformation[];
}
