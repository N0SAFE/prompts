import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { processPromptFile } from '../lib/promptProcessor'; // Adjust if your compiled JS is elsewhere or use ts-node/tsx

// Directory for temporary test files, located within __tests__ to avoid cluttering src root
const TEST_DIR = path.resolve(__dirname, '__test_temp__');
const BASE_DIR = path.resolve(TEST_DIR); // Base directory for test files relative paths

// Helper function to create test files relative to BASE_DIR
async function createTestFile(relativePath: string, content: string) {
    const fullPath = path.resolve(BASE_DIR, relativePath);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, content, 'utf-8');
    return fullPath; // Return the absolute path
}

describe('processPromptFile', () => {
    // Create temporary directory and files before all tests run
    beforeAll(async () => {
        await fs.mkdir(BASE_DIR, { recursive: true });
        // Common files used by multiple tests
        await createTestFile('common/part1.md', 'This is part 1.');
        await createTestFile('common/part2.md', 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5');
        await createTestFile('common/regex_target.md', 'Header\n## START\nContent Line 1\nContent Line 2\n## END\nFooter');
        await createTestFile('common/empty.md', '');
        // Files for nested include tests
        await createTestFile('nested/level2.md', 'Final level content.');
        await createTestFile('nested/level1.md', 'Level 1 includes: {{include: ./level2.md}}');
        // File for relative path test
        await createTestFile('subdir/placeholder.md', ''); // Ensure subdir exists
    });

    // Clean up the temporary directory after all tests have run
    afterAll(async () => {
        await fs.rm(TEST_DIR, { recursive: true, force: true });
    });

     // Mock console methods before each test to check for warnings/errors
     beforeEach(() => {
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    // Restore original console methods after each test
    afterEach(() => {
        vi.restoreAllMocks();
    });


    it('should process a file with no includes', async () => {
        const filePath = await createTestFile('no_include.md', 'Simple content.');
        const result = await processPromptFile(filePath, BASE_DIR);
        expect(result).toBe('Simple content.');
    });

    it('should process a basic file include', async () => {
        const filePath = await createTestFile('basic_include.md', 'Include: {{include: common/part1.md}}');
        const result = await processPromptFile(filePath, BASE_DIR);
        expect(result).toBe('Include: This is part 1.');
    });

     it('should process multiple includes in the same file', async () => {
        const filePath = await createTestFile('multiple_includes.md', 'Part 1: {{include: common/part1.md}}\nPart 2: {{include: common/part2.md#L1-L2}}');
        const result = await processPromptFile(filePath, BASE_DIR);
        expect(result).toBe('Part 1: This is part 1.\nPart 2: Line 1\nLine 2');
    });

    // --- Line Range Tests ---
    it('should process line range include (Lstart-Lend)', async () => {
        const filePath = await createTestFile('line_range.md', 'Lines 2-4: {{include: common/part2.md#L2-L4}}');
        const result = await processPromptFile(filePath, BASE_DIR);
        expect(result).toBe('Lines 2-4: Line 2\nLine 3\nLine 4');
    });

    it('should process single line include (Lstart)', async () => {
        const filePath = await createTestFile('single_line.md', 'Line 3: {{include: common/part2.md#L3}}');
        const result = await processPromptFile(filePath, BASE_DIR);
        expect(result).toBe('Line 3: Line 3');
    });

     it('should return error comment for invalid line range (start > end)', async () => {
        const filePath = await createTestFile('invalid_line_range1.md', '{{include: common/part2.md#L4-L2}}');
        const result = await processPromptFile(filePath, BASE_DIR);
        expect(result).toContain('<!-- Error including common/part2.md#L4-L2: Start line cannot be greater than end line: L4-L2 -->');
        expect(console.error).toHaveBeenCalled();
    });

     it('should return error comment for out-of-bounds line range (start < 1)', async () => {
        const filePath = await createTestFile('invalid_line_range2.md', '{{include: common/part2.md#L0-L2}}');
        const result = await processPromptFile(filePath, BASE_DIR);
        expect(result).toContain('<!-- Error including common/part2.md#L0-L2: Invalid start line number (must be >= 1): L0-L2 -->');
         expect(console.error).toHaveBeenCalled();
    });

     it('should return error comment for out-of-bounds line range (end > length)', async () => {
        const filePath = await createTestFile('invalid_line_range3.md', '{{include: common/part2.md#L4-L6}}'); // part2.md only has 5 lines
        const result = await processPromptFile(filePath, BASE_DIR);
        expect(result).toContain('<!-- Error including common/part2.md#L4-L6: Line numbers out of range (1-5) for file');
        expect(result).toContain('common/part2.md: L4-L6 -->');
         expect(console.error).toHaveBeenCalled();
    });

    // --- Regex Range Tests ---
    it('should process regex range include (startRegex/endRegex)', async () => {
        const filePath = await createTestFile('regex_range.md', 'Regex Content: {{include: common/regex_target.md#startRegex=/^## START$/endRegex=/^## END$/}}');
        const result = await processPromptFile(filePath, BASE_DIR);
        expect(result).toBe('Regex Content: Content Line 1\nContent Line 2');
    });

     it('should handle regex range with only startRegex (includes till end)', async () => {
        const filePath = await createTestFile('regex_start_only.md', 'Regex Start Only: {{include: common/regex_target.md#startRegex=/^## START$/}}');
        const result = await processPromptFile(filePath, BASE_DIR);
        expect(result).toBe('Regex Start Only: Content Line 1\nContent Line 2\n## END\nFooter');
        expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('Only startRegex provided for startRegex=/^## START$/'));
    });

     it('should handle regex range where endRegex is not found (includes till end)', async () => {
        const filePath = await createTestFile('regex_end_not_found.md', 'Regex End Not Found: {{include: common/regex_target.md#startRegex=/^## START$/endRegex=/^## NOT_FOUND$/}}');
        const result = await processPromptFile(filePath, BASE_DIR);
        expect(result).toBe('Regex End Not Found: Content Line 1\nContent Line 2\n## END\nFooter');
        expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('End regex /^## NOT_FOUND$/ not found after start regex'));
    });

    it('should return error comment for non-matching startRegex', async () => {
        const filePath = await createTestFile('regex_start_not_found.md', '{{include: common/regex_target.md#startRegex=/^## NOT_FOUND$/endRegex=/^## END$/}}');
        const result = await processPromptFile(filePath, BASE_DIR);
        expect(result).toContain('<!-- Error including common/regex_target.md#startRegex=/^## NOT_FOUND$/endRegex=/^## END$/: Start regex /^## NOT_FOUND$/ not found in file');
        expect(result).toContain('common/regex_target.md -->');
        expect(console.error).toHaveBeenCalled();
    });

     it('should handle empty content selection between regexes', async () => {
        // This happens if startRegex matches line N and endRegex matches line N+1
        const filePath = await createTestFile('regex_empty_selection.md', '{{include: common/regex_target.md#startRegex=/^## START$/endRegex=/^Content Line 1$/}}');
        const result = await processPromptFile(filePath, BASE_DIR);
        // Expect empty string replacement because start is line *after* "## START", end is line *before* "Content Line 1"
        expect(result).toBe('');
        expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('Start and end regex resulted in empty content selection'));
    });

    // --- Edge Cases and Errors ---
    it('should handle nested includes correctly', async () => {
        // nested/level1.md includes nested/level2.md
        const filePath = await createTestFile('nested_include_main.md', 'Main includes: {{include: nested/level1.md}}');
        const result = await processPromptFile(filePath, BASE_DIR);
        // Expect full resolution: Main -> level1 -> level2
        expect(result).toBe('Main includes: Level 1 includes: Final level content.');
    });

    it('should return error comment for file not found', async () => {
        const filePath = await createTestFile('not_found.md', '{{include: non_existent_file.md}}');
        const result = await processPromptFile(filePath, BASE_DIR);
        expect(result).toContain('<!-- Error including non_existent_file.md: Included file not found');
        expect(console.error).toHaveBeenCalled();
    });

    it('should return warning comment and skip self-inclusion', async () => {
        const filePath = await createTestFile('self_include.md', 'Self: {{include: ./self_include.md}}');
        const result = await processPromptFile(filePath, BASE_DIR);
        expect(result).toBe('Self: <!-- Skipped self-inclusion: ./self_include.md -->');
        expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('Skipped self-inclusion in'));
        expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('self_include.md'));
    });

    it('should ignore escaped includes (preceded by ## )', async () => {
        const filePath = await createTestFile('escaped_include.md', 'This should not be included: ## {{include: common/part1.md}}\nThis should be: {{include: common/part1.md}}');
        const result = await processPromptFile(filePath, BASE_DIR);
        expect(result).toBe('This should not be included: ## {{include: common/part1.md}}\nThis should be: This is part 1.');
    });

     it('should handle includes with relative paths from a subdirectory', async () => {
        // Create the file within a subdirectory that includes files from ../common/
        const filePath = await createTestFile('subdir/relative_path.md', 'Part1: {{include: ../common/part1.md}}\nPart2: {{include: ../common/part2.md#L1}}');
        const result = await processPromptFile(filePath, BASE_DIR);
        expect(result).toBe('Part1: This is part 1.\nPart2: Line 1');
    });

    it('should handle including an empty file', async () => {
        const filePath = await createTestFile('include_empty.md', 'Include Empty: {{include: common/empty.md}}');
        const result = await processPromptFile(filePath, BASE_DIR);
        expect(result).toBe('Include Empty: ');
    });

     it('should handle processing an empty source file', async () => {
        const filePath = await createTestFile('empty_source.md', '');
        const result = await processPromptFile(filePath, BASE_DIR);
        expect(result).toBe('');
    });

     it('should return error comment for invalid include syntax (bad options)', async () => {
        const filePath = await createTestFile('invalid_syntax.md', '{{include: common/part1.md#InvalidOption=true}}');
        const result = await processPromptFile(filePath, BASE_DIR);
        expect(result).toContain('<!-- Error including common/part1.md#InvalidOption=true: Invalid include options format: InvalidOption=true -->');
        expect(console.error).toHaveBeenCalled();
    });

     it('should handle multiple escaped and non-escaped includes mixed together', async () => {
        const filePath = await createTestFile('mixed_escaped.md', 'Escaped: ## {{include: common/part1.md}}\nReal: {{include: common/part1.md}}\nEscaped Again: ## {{include: common/part2.md}}');
        const result = await processPromptFile(filePath, BASE_DIR);
        expect(result).toBe('Escaped: ## {{include: common/part1.md}}\nReal: This is part 1.\nEscaped Again: ## {{include: common/part2.md}}');
    });

     it('should handle include tag immediately following an escaped tag', async () => {
        const filePath = await createTestFile('escaped_then_real.md', '## {{include: common/part1.md}}{{include: common/part1.md}}');
        const result = await processPromptFile(filePath, BASE_DIR);
        expect(result).toBe('## {{include: common/part1.md}}This is part 1.');
     });

     it('should handle include tags with varying whitespace', async () => {
        const filePath = await createTestFile('whitespace_include.md', 'Include: {{ include : common/part1.md }}\nInclude2: {{include:common/part2.md#L1}}');
        const result = await processPromptFile(filePath, BASE_DIR);
        expect(result).toBe('Include: This is part 1.\nInclude2: Line 1');
     });

});