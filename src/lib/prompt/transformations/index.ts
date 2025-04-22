import { TransformationPlugin } from './types';

// Import individual transformation classes
import { RemoveLinesTransformation } from './removeLinesTransformation';
import { RemoveRegexTransformation } from './removeRegexTransformation';
import { AddPrefixTransformation } from './addPrefixTransformation';
import { AddSuffixTransformation } from './addSuffixTransformation';
import { SliceTransformation } from './sliceTransformation'; // Import Slice
import { ReplaceTransformation } from './replaceTransformation'; // Import Replace
import { ToUpperCaseTransformation } from './toUpperCaseTransformation'; // Import ToUpper
import { ToLowerCaseTransformation } from './toLowerCaseTransformation'; // Import ToLower
import { TrimTransformation } from './trimTransformation'; // Import Trim
import { RemoveCommentsTransformation } from './removeCommentsTransformation'; // Import RemoveComments

// Registry to map transformation type strings to plugin instances
export const transformationRegistry: { [key: string]: TransformationPlugin } = {
    'removeLines': new RemoveLinesTransformation(),
    'removeRegex': new RemoveRegexTransformation(),
    'addPrefix': new AddPrefixTransformation(),
    'addSuffix': new AddSuffixTransformation(),
    'slice': new SliceTransformation(), // Register Slice
    'replace': new ReplaceTransformation(), // Register Replace
    'toUpperCase': new ToUpperCaseTransformation(), // Register ToUpper
    'toLowerCase': new ToLowerCaseTransformation(), // Register ToLower
    'trim': new TrimTransformation(), // Register Trim
    'removeComments': new RemoveCommentsTransformation(), // Register RemoveComments
    // Register other transformations here
};

// Export the interface and individual classes
export * from './types'; // Export all types from types.ts
export {
    RemoveLinesTransformation,
    RemoveRegexTransformation,
    AddPrefixTransformation,
    AddSuffixTransformation,
    SliceTransformation, // Export Slice
    ReplaceTransformation, // Export Replace
    ToUpperCaseTransformation, // Export ToUpper
    ToLowerCaseTransformation, // Export ToLower
    TrimTransformation, // Export Trim
    RemoveCommentsTransformation, // Export RemoveComments
};
