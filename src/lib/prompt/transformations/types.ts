import { Transformation as BaseTransformationType } from '../types'; // Import base Transformation type union

/**
 * Interface for transformation plugins.
 * Each transformation logic will be implemented as a class adhering to this interface.
 */
export interface TransformationPlugin {
    /**
     * Applies the transformation logic to the content.
     * @param content The content string to transform.
     * @param params A dictionary containing the specific parameters for this transformation instance,
     *                derived from the object in the 'transform' array (e.g., { type: 'removeLines', lines: [1, 2] }).
     *                Implementations should cast and validate this object to a specific parameter interface.
     * @returns The transformed content string.
     */
    apply(content: string, params: AnyTransformationParams): string; // Use the union type here
}

// --- Specific Parameter Interfaces ---
// Note: These do NOT extend the base Transformation union type directly.
// The base Transformation type in ../types.ts is the union *of* these types.

export interface AddPrefixParams {
    type: 'addPrefix';
    text: string;
}

export interface AddSuffixParams {
    type: 'addSuffix';
    text: string;
}

export interface RemoveLinesParams {
    type: 'removeLines';
    lines: number[];
}

export interface RemoveRegexParams {
    type: 'removeRegex';
    pattern: string;
    flags?: string;
}

export interface ReplaceParams {
    type: 'replace';
    pattern: string;
    replacement: string;
    flags?: string;
}

export interface SliceParams {
    type: 'slice';
    start?: number;
    end?: number;
}

export interface ToUpperCaseParams {
    type: 'toUpperCase';
    // No specific params needed
}

export interface ToLowerCaseParams {
    type: 'toLowerCase';
    // No specific params needed
}

export interface TrimParams {
    type: 'trim';
    side?: 'start' | 'end' | 'both';
}

export interface RemoveCommentsParams {
    type: 'removeComments';
    commentTypes?: ('html' | 'js' | 'python')[]; // Define allowed types
    trimEmptyLines?: boolean;
}

// --- Union Type for All Transformation Parameters ---
export type AnyTransformationParams =
    | AddPrefixParams
    | AddSuffixParams
    | RemoveLinesParams
    | RemoveRegexParams
    | ReplaceParams
    | SliceParams
    | ToUpperCaseParams
    | ToLowerCaseParams
    | TrimParams
    | RemoveCommentsParams;
