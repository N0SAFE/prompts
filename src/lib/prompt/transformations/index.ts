import { TransformationPlugin } from './types';

// Import individual transformation classes
import { RemoveLinesTransformation } from './removeLinesTransformation';
import { RemoveRegexTransformation } from './removeRegexTransformation';
import { AddPrefixTransformation } from './addPrefixTransformation';
import { AddSuffixTransformation } from './addSuffixTransformation';
import { SliceTransformation } from './sliceTransformation';
import { ReplaceTransformation } from './replaceTransformation';
import { ToUpperCaseTransformation } from './toUpperCaseTransformation';
import { ToLowerCaseTransformation } from './toLowerCaseTransformation';
import { TrimTransformation } from './trimTransformation';
import { RemoveCommentsTransformation } from './removeCommentsTransformation';

// Registry to map transformation type strings to plugin instances
export const transformationRegistry: { [key: string]: TransformationPlugin } = {
    'removeLines': new RemoveLinesTransformation(),
    'removeRegex': new RemoveRegexTransformation(),
    'addPrefix': new AddPrefixTransformation(),
    'addSuffix': new AddSuffixTransformation(),
    'slice': new SliceTransformation(),
    'replace': new ReplaceTransformation(),
    'toUpperCase': new ToUpperCaseTransformation(),
    'toLowerCase': new ToLowerCaseTransformation(),
    'trim': new TrimTransformation(),
    'removeComments': new RemoveCommentsTransformation(),
    // Register other transformations here
};

// Export the interface and individual classes
export * from './types';
export {
    RemoveLinesTransformation,
    RemoveRegexTransformation,
    AddPrefixTransformation,
    AddSuffixTransformation,
    SliceTransformation,
    ReplaceTransformation,
    ToUpperCaseTransformation,
    ToLowerCaseTransformation,
    TrimTransformation,
    RemoveCommentsTransformation,
};
