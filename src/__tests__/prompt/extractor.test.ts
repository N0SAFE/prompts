import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fs from 'fs/promises';
import { extractContent } from '../../lib/prompt/extractor'; // Adjust path as needed
import { logger } from '../../lib/utils/logger';
import {
    FILE_ENCODING,
    NEWLINE,
    ERROR_LINES_OUT_OF_RANGE,
    ERROR_FILE_NOT_FOUND,
    WARN_START_REGEX_NOT_FOUND,
    WARN_END_REGEX_NOT_FOUND,
    WARN_REGEX_EMPTY_SELECTION
} from '../../lib/prompt/constants'; // Adjust path as needed
import { IncludeOptions } from '../../lib/prompt/types'; // Adjust path as needed

// Mock fs/promises and logger
vi.mock('fs/promises');
vi.mock('../../lib/utils/logger', () => ({
    logger: {
        warn: vi.fn(),
        error: vi.fn(), // Include error if needed
        debug: vi.fn(),
        info: vi.fn(),
        log: vi.fn(),
    }
}));

const mockFilePath = '/fake/path/to/file.txt';
const mockFileContent ='Line 1\nLine 2\nLine 3 with keyword\nLine 4\nLine 5 also with keyword\nLine 6';
const mockLines = mockFileContent.split(NEWLINE);

describe('Extractor - extractContent', () => {

    beforeEach(() => {
        vi.clearAllMocks();
        // Default mock implementation for readFile
        vi.mocked(fs.readFile).mockResolvedValue(mockFileContent);
    });

    it('should read the entire file content if no options are specified', async () => {
        const options: IncludeOptions = {};
        const result = await extractContent(mockFilePath, options, 0);
        expect(fs.readFile).toHaveBeenCalledWith(mockFilePath, FILE_ENCODING);
        expect(result).toBe(mockFileContent);
    });

    it('should extract content based on startLine and endLine', async () => {
        const options: IncludeOptions = { startLine: 2, endLine: 4 };
        const expectedContent = 'Line 2\nLine 3 with keyword\nLine 4';
        const result = await extractContent(mockFilePath, options, 0);
        expect(result).toBe(expectedContent);
    });

    it('should extract content based only on startLine (to the end)', async () => {
        const options: IncludeOptions = { startLine: 5 };
        const expectedContent = 'Line 5 also with keyword\nLine 6';
        const result = await extractContent(mockFilePath, options, 0);
        expect(result).toBe(expectedContent);
    });

    it('should throw error for invalid line numbers (out of range)', async () => {
        const options: IncludeOptions = { startLine: 0 }; // Invalid start line
        await expect(extractContent(mockFilePath, options, 0))
            .rejects.toThrow(ERROR_LINES_OUT_OF_RANGE(mockLines.length, mockFilePath, 'L0'));

        const options2: IncludeOptions = { startLine: 1, endLine: 10 }; // End line too high
        await expect(extractContent(mockFilePath, options2, 0))
            .rejects.toThrow(ERROR_LINES_OUT_OF_RANGE(mockLines.length, mockFilePath, 'L1-L10'));

         const options3: IncludeOptions = { startLine: 7 }; // Start line too high
        await expect(extractContent(mockFilePath, options3, 0))
            .rejects.toThrow(ERROR_LINES_OUT_OF_RANGE(mockLines.length, mockFilePath, 'L7'));
    });

    it('should extract content based on startRegex and endRegex', async () => {
        const options: IncludeOptions = {
            startRegex: /^Line 3/,
            endRegex: /^Line 5/
        };
        const expectedContent = 'Line 3 with keyword\nLine 4'; // endRegex line is exclusive
        const result = await extractContent(mockFilePath, options, 0);
        expect(result).toBe(expectedContent);
    });

    it('should extract content based only on startRegex (to the end)', async () => {
        const options: IncludeOptions = {
            startRegex: /^Line 4/
        };
        const expectedContent = 'Line 4\nLine 5 also with keyword\nLine 6';
        const result = await extractContent(mockFilePath, options, 0);
        expect(result).toBe(expectedContent);
    });

    it('should warn and return full content if startRegex is not found', async () => {
        const options: IncludeOptions = { startRegex: /NonExistentPattern/ };
        const result = await extractContent(mockFilePath, options, 1); // Indent 1
        expect(result).toBe(mockFileContent);
        if (options.startRegex) {
            expect(logger.warn).toHaveBeenCalledWith(1, WARN_START_REGEX_NOT_FOUND(options.startRegex, mockFilePath));
        } else {
            throw new Error('Test setup error: startRegex should be defined');
        }
    });

    it('should warn and extract to end if endRegex is not found after startRegex', async () => {
        const options: IncludeOptions = {
            startRegex: /^Line 5/,
            endRegex: /NonExistentPattern/
        };
        const expectedContent = 'Line 5 also with keyword\nLine 6';
        const result = await extractContent(mockFilePath, options, 1);
        expect(result).toBe(expectedContent);
        if (options.endRegex) {
            expect(logger.warn).toHaveBeenCalledWith(1, WARN_END_REGEX_NOT_FOUND(options.endRegex, mockFilePath));
        } else {
            throw new Error('Test setup error: endRegex should be defined');
        }
    });

    it('should handle startRegex and endRegex matching the same line', async () => {
        const options: IncludeOptions = {
            startRegex: /^Line 3/,
            endRegex: /^Line 3/ // Match same line
        };
        const expectedContent = 'Line 3 with keyword'; // Should include the line itself
        const result = await extractContent(mockFilePath, options, 0);
        expect(result).toBe(expectedContent);
    });

    it('should warn and return empty string if regex selection results in invalid range (start >= end)', async () => {
        // Mock findIndex to simulate start found after end
        const lines = ['A', 'End', 'B', 'Start', 'C'];
        vi.mocked(fs.readFile).mockResolvedValue(lines.join(NEWLINE));

        const options: IncludeOptions = {
            startRegex: /^Start/,
            endRegex: /^End/
        };
        const result = await extractContent(mockFilePath, options, 1);
        expect(result).toBe('');
        expect(logger.warn).toHaveBeenCalledWith(1, WARN_REGEX_EMPTY_SELECTION(mockFilePath));
    });

    it('should throw specific error if file is not found', async () => {
        const error = new Error('File not found') as NodeJS.ErrnoException;
        error.code = 'ENOENT';
        vi.mocked(fs.readFile).mockRejectedValue(error);

        const options: IncludeOptions = {};
        await expect(extractContent('/non/existent/file.txt', options, 0))
            .rejects.toThrow(ERROR_FILE_NOT_FOUND('/non/existent/file.txt'));
    });

    it('should re-throw other file read errors', async () => {
        const genericError = new Error('Some other read error');
        vi.mocked(fs.readFile).mockRejectedValue(genericError);

        const options: IncludeOptions = {};
        await expect(extractContent(mockFilePath, options, 0))
            .rejects.toThrow('Some other read error');
    });
});
