import { applyIndentStyle } from './indentStyle';
import { applyInlineStyle } from './inlineStyle';
import { StyleFunction, StyleType } from './types';

export const styleHandlers: { [key in StyleType]?: StyleFunction } = {
    [StyleType.Indent]: applyIndentStyle,
    [StyleType.Inline]: applyInlineStyle,
    // StyleType.None will be handled directly in the processor (no transformation)
};

export { StyleType };
export * from './types';
export { applyInlineStyle } from './inlineStyle';
export { applyIndentStyle } from './indentStyle';
