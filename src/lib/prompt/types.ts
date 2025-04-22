// src/lib/promptProcessor/types.ts
// Re-export relevant types from styles and potentially add processor-specific types later

import { StyleType, StyleFunction } from "../styles/types";
// Import the new union type
import { AnyTransformationParams } from "./transformations/types";

/**
 * Represents a single transformation step.
 * Use the union type that includes all possible parameters.
 */
export type Transformation = AnyTransformationParams;

// Options derived after parsing, used for extraction and styling
export interface IncludeOptions {
  filePath?: string; // Added filePath property
  startLine?: number;
  endLine?: number;
  startRegex?: RegExp;
  endRegex?: RegExp;
  style?: StyleType;
  transform?: Transformation[]; // Use the union type here
  indentation?: string; // Stores the indentation of the include directive line
}

/**
 * Represents the parameters for the include directive.
 */
export interface IncludeParams {
  file: string;
  style?: string;
  transform?: Transformation[]; // Use the union type here
}

export { StyleType, StyleFunction };
