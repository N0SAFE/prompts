import { describe, it, expect, vi, beforeEach } from 'vitest';
import { applyStyleAndTransformations } from '../../lib/prompt/styler'; // Adjust path as needed
import { IncludeOptions } from '../../lib/prompt/types';
import { StyleType } from '../../lib/styles/types';
import { logger } from '../../lib/utils/logger';
import * as styleHandlers from '../../lib/styles/index'; // To mock specific handlers
import { WARN_UNKNOWN_STYLE } from '../../lib/prompt/constants';

// Mock logger and style handlers
vi.mock('../../lib/utils/logger', () => ({
    logger: {
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
        info: vi.fn(),
        log: vi.fn(),
    }
}));

// Mock the actual style functions we want to test indirectly
const mockIndentStyle = vi.fn((content, indent) => `${indent}${content.replace(/\n/g, `\n${indent}`)}`);
const mockInlineStyle = vi.fn(content => content.replace(/\r?\n/g, ' ').trim());

vi.mock('../../lib/styles/index', async (importOriginal) => {
    const original = await importOriginal<typeof styleHandlers>();
    return {
        ...original,
        styleHandlers: {
            [StyleType.Indent]: mockIndentStyle,
            [StyleType.Inline]: mockInlineStyle,
            // None is handled directly, no handler needed
        }
    };
});

describe('Styler - applyStyleAndTransformations', () => {
    const baseIndent = '  ';
    const content = 'Line 1\nLine 2';
    const indent = 1;

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should apply indent style correctly', async () => {
        const options: IncludeOptions = {
            style: StyleType.Indent,
            indentation: baseIndent
        };
        const expectedOutput = `${baseIndent}Line 1\n${baseIndent}Line 2`;
        mockIndentStyle.mockReturnValueOnce(expectedOutput); // Mock return value for this specific call

        const result = await applyStyleAndTransformations(content, options, indent);

        expect(styleHandlers.styleHandlers[StyleType.Indent]).toHaveBeenCalledWith(content, baseIndent);
        expect(result).toBe(expectedOutput);
        expect(logger.debug).toHaveBeenCalledWith(indent, `Applying style '${StyleType.Indent}' to content`);
    });

    it('should apply inline style correctly', async () => {
        const options: IncludeOptions = {
            style: StyleType.Inline,
            indentation: baseIndent // Indentation is ignored by inline
        };
        const expectedOutput = 'Line 1 Line 2';
        mockInlineStyle.mockReturnValueOnce(expectedOutput);

        const result = await applyStyleAndTransformations(content, options, indent);

        expect(styleHandlers.styleHandlers[StyleType.Inline]).toHaveBeenCalledWith(content, baseIndent);
        expect(result).toBe(expectedOutput);
        expect(logger.debug).toHaveBeenCalledWith(indent, `Applying style '${StyleType.Inline}' to content`);
    });

    it(`should return original content for style 'none'`, async () => {
        const options: IncludeOptions = {
            style: StyleType.None,
            indentation: baseIndent
        };
        const result = await applyStyleAndTransformations(content, options, indent);
        expect(result).toBe(content);
        // Ensure no style handler was called
        expect(mockIndentStyle).not.toHaveBeenCalled();
        expect(mockInlineStyle).not.toHaveBeenCalled();
        expect(logger.debug).not.toHaveBeenCalled(); // No debug log for 'none'
    });

    it('should return original content and warn if style is unknown', async () => {
        const unknownStyle = 'unknown' as StyleType;
        const options: IncludeOptions = {
            style: unknownStyle,
            indentation: baseIndent
        };
        const result = await applyStyleAndTransformations(content, options, indent);
        expect(result).toBe(content);
        expect(logger.warn).toHaveBeenCalledWith(indent, WARN_UNKNOWN_STYLE(unknownStyle));
        expect(mockIndentStyle).not.toHaveBeenCalled();
        expect(mockInlineStyle).not.toHaveBeenCalled();
    });

    it('should return original content if no style is specified', async () => {
        const options: IncludeOptions = {
            // No style property
            indentation: baseIndent
        };
        const result = await applyStyleAndTransformations(content, options, indent);
        expect(result).toBe(content);
        expect(logger.warn).not.toHaveBeenCalled();
        expect(logger.debug).not.toHaveBeenCalled();
    });

    it('should return original content if no indentation is provided (when style needs it)', async () => {
        // Although applyStyleAndTransformations checks for indentation, the style function itself might rely on it.
        // This test ensures the main function doesn't call the handler if indentation is missing.
        const options: IncludeOptions = {
            style: StyleType.Indent,
            // No indentation property
        };
        const result = await applyStyleAndTransformations(content, options, indent);
        expect(result).toBe(content); // Should not apply style if indentation missing
        expect(mockIndentStyle).not.toHaveBeenCalled();
        expect(logger.debug).not.toHaveBeenCalled();
    });

    // Note: Transformations are tested separately in transformations.test.ts
    // This suite focuses only on the styling logic within applyStyleAndTransformations.
});
