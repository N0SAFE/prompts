// src/lib/promptProcessor/types.ts
// Re-export relevant types from styles and potentially add processor-specific types later

import { 
    StyleType, 
    StyleFunction, 
    Transformation, 
    IncludeParams // Keep IncludeParams if needed internally or for parsing structure
} from '../styles/types';

// Options derived after parsing, used for extraction and styling
export interface IncludeOptions {
    filePath?: string; // Added filePath property
    startLine?: number;
    endLine?: number;
    startRegex?: RegExp;
    endRegex?: RegExp;
    style?: StyleType;
    transform?: Transformation[];
    indentation?: string; // Stores the indentation of the include directive line
}

export {
    StyleType,
    StyleFunction,
    Transformation,
    IncludeParams
}