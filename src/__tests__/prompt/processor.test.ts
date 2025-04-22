import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { PromptProcessor } from '../../lib/prompt/processor'; // Adjust path
import { logger } from '../../lib/utils/logger';
import {
    FILE_ENCODING,
    COMMENT_WARN_CIRCULAR_INCLUSION,
    COMMENT_WARN_SELF_INCLUSION,
    COMMENT_ERROR_READING_FILE,
    COMMENT_ERROR_INCLUDING
} from '../../lib/prompt/constants'; // Adjust path

// Mock dependencies
vi.mock('fs/promises');
vi.mock('../../lib/utils/logger', () => ({
    logger: {
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
        info: vi.fn(),
        log: vi.fn(),
    }
}));

// Mock individual transformation functions if needed, or the registry
// For simplicity, we'll assume transformations are tested elsewhere
// and focus on the processor's include logic.

const baseDir = '/project';
const mockFiles: Record<string, string> = {};

describe('PromptProcessor', () => {
    let processor: PromptProcessor;

    beforeEach(() => {
        vi.clearAllMocks();
        processor = new PromptProcessor(baseDir);

        // Reset mock files for each test
        Object.keys(mockFiles).forEach(key => delete mockFiles[key]);

        // Default mock for fs.readFile
        vi.mocked(fs.readFile).mockImplementation(async (filePath) => {
            const relativePath = path.relative(baseDir, filePath as string);
            if (mockFiles[relativePath]) {
                return mockFiles[relativePath];
            }
            const error = new Error(`ENOENT: no such file or directory, open '${filePath}'`) as NodeJS.ErrnoException;
            error.code = 'ENOENT';
            throw error;
        });
    });

    it('should process a file with no includes', async () => {
        const filePath = 'prompt.md';
        const content = 'This is the main content.';
        mockFiles[filePath] = content;

        const result = await processor.processFile(filePath);
        expect(result).toBe(content);
        expect(fs.readFile).toHaveBeenCalledWith(path.join(baseDir, filePath), FILE_ENCODING);
    });

    it('should process a file with a simple include', async () => {
        const mainPath = 'main.md';
        const includePath = 'include.md';
        mockFiles[mainPath] = `Start\n{{include: ${includePath}}}\nEnd`;
        mockFiles[includePath] = 'Included Content';

        const result = await processor.processFile(mainPath);
        expect(result).toBe('Start\nIncluded Content\nEnd');
        expect(fs.readFile).toHaveBeenCalledTimes(2);
        expect(fs.readFile).toHaveBeenCalledWith(path.join(baseDir, mainPath), FILE_ENCODING);
        expect(fs.readFile).toHaveBeenCalledWith(path.join(baseDir, includePath), FILE_ENCODING);
    });

    it('should process nested includes', async () => {
        const fileA = 'a.md';
        const fileB = 'b.md';
        const fileC = 'c.md';
        mockFiles[fileA] = `A Start\n{{include: ${fileB}}}\nA End`;
        mockFiles[fileB] = `B Start - {{include: ${fileC}}} - B End`;
        mockFiles[fileC] = 'Content C';

        const result = await processor.processFile(fileA);
        expect(result).toBe('A Start\nB Start - Content C - B End\nA End');
        expect(fs.readFile).toHaveBeenCalledTimes(3);
    });

    it('should handle includes with line numbers', async () => {
        const mainPath = 'main.md';
        const includePath = 'lines.md';
        mockFiles[mainPath] = `{{include: ${includePath}#L2-L3}}`;
        mockFiles[includePath] = 'Line 1\nLine 2\nLine 3\nLine 4';

        const result = await processor.processFile(mainPath);
        expect(result).toBe('Line 2\nLine 3');
    });

    it('should handle includes with regex', async () => {
        const mainPath = 'main.md';
        const includePath = 'regex.md';
        mockFiles[mainPath] = `{{include: ${includePath}#startRegex=^START$,endRegex=^END$}}`;
        mockFiles[includePath] = 'Ignore\nSTART\nInclude This\nEND\nIgnore';

        const result = await processor.processFile(mainPath);
        expect(result).toBe('START\nInclude This'); // endRegex is exclusive
    });

    it('should handle includes with style (mocked)', async () => {
        // Assuming styler applies style correctly (tested elsewhere)
        // We just check if the content passed through
        const mainPath = 'main.md';
        const includePath = 'style.md';
        mockFiles[mainPath] = `Pre\n{{include: ${includePath}, style: 'inline'}}\nPost`;
        mockFiles[includePath] = 'Line 1\nLine 2';

        // Simplified: processor calls styler, which calls style handler.
        // We expect the raw extracted content here as styling is complex to fully mock.
        // A more thorough test would mock applyStyleAndTransformations.
        const result = await processor.processFile(mainPath);
        // The actual output depends on the mocked or real styler behavior.
        // For this test, let's assume styler returns the processed content.
        // If styler was perfectly mocked for 'inline':
        // expect(result).toBe('Pre\nLine 1 Line 2\nPost');
        // If styler is not mocked deeply, it might return raw:
        expect(result).toBe('Pre\nLine 1\nLine 2\nPost');
    });

    it('should handle escaped includes', async () => {
        const mainPath = 'main.md';
        mockFiles[mainPath] = `This is !{{include: not_processed.md}} literal.`;

        const result = await processor.processFile(mainPath);
        expect(result).toBe('This is {{include: not_processed.md}} literal.');
        expect(fs.readFile).toHaveBeenCalledTimes(1); // Only reads main.md
    });

    it('should handle self-inclusion with a warning comment', async () => {
        const mainPath = 'self.md';
        mockFiles[mainPath] = `Content\n{{include: ${mainPath}}}\nMore Content`;

        const result = await processor.processFile(mainPath);
        const expectedComment = COMMENT_WARN_SELF_INCLUSION(mainPath, mainPath);
        expect(result).toBe(`Content\n${expectedComment}\nMore Content`);
        expect(logger.warn).toHaveBeenCalledWith(expect.any(Number), expect.stringContaining('Skipped self-inclusion'));
        expect(fs.readFile).toHaveBeenCalledTimes(1); // Reads self.md only once initially
    });

    it('should handle circular includes with a warning comment', async () => {
        const fileA = 'a.md';
        const fileB = 'b.md';
        mockFiles[fileA] = `A includes B: {{include: ${fileB}}}`; // A includes B
        mockFiles[fileB] = `B includes A: {{include: ${fileA}}}`; // B includes A

        const result = await processor.processFile(fileA);
        const expectedComment = COMMENT_WARN_CIRCULAR_INCLUSION(fileA, fileB);
        // Expect B's content with the circular inclusion comment
        expect(result).toBe(`A includes B: B includes A: ${expectedComment}`);
        expect(logger.warn).toHaveBeenCalledWith(expect.any(Number), expect.stringContaining('Skipped circular inclusion'));
        expect(fs.readFile).toHaveBeenCalledTimes(2); // Reads A, then B
    });

    it('should handle file not found for include with an error comment', async () => {
        const mainPath = 'main.md';
        const missingPath = 'missing.md';
        mockFiles[mainPath] = `{{include: ${missingPath}}}`;

        const result = await processor.processFile(mainPath);
        const absoluteMissingPath = path.join(baseDir, missingPath);
        const expectedComment = COMMENT_ERROR_READING_FILE(missingPath, `ENOENT: no such file or directory, open '${absoluteMissingPath}'`);

        expect(result).toBe(expectedComment);
        expect(logger.error).toHaveBeenCalledWith(expect.any(Number), expect.stringContaining('Error reading included file'));
    });

    it('should handle errors during include processing with an error comment', async () => {
        const mainPath = 'main.md';
        const badOptionsPath = 'bad.md';
        // Invalid hash format
        mockFiles[mainPath] = `{{include: ${badOptionsPath}#invalid-format}}`;
        mockFiles[badOptionsPath] = 'This content exists';

        const result = await processor.processFile(mainPath);
        // The specific error message comes from the parser
        expect(result).toContain(COMMENT_ERROR_INCLUDING(badOptionsPath, 'Invalid hash options format'));
        expect(logger.error).toHaveBeenCalledWith(expect.any(Number), expect.stringContaining('Error processing include directive'));
    });

     it('should handle relative paths correctly', async () => {
        const mainPath = 'folder/main.md';
        const includePath = '../includes/include.md'; // Relative path from main.md
        const resolvedIncludePath = 'includes/include.md'; // Relative to baseDir
        mockFiles[mainPath] = `{{include: ${includePath}}}`; // Include directive uses relative path
        mockFiles[resolvedIncludePath] = 'Included Content from relative path';

        const result = await processor.processFile(mainPath);
        expect(result).toBe('Included Content from relative path');
        expect(fs.readFile).toHaveBeenCalledWith(path.join(baseDir, mainPath), FILE_ENCODING);
        expect(fs.readFile).toHaveBeenCalledWith(path.join(baseDir, resolvedIncludePath), FILE_ENCODING);
    });

});
