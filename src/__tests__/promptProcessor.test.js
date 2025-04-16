"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const promptProcessor_1 = require("../lib/promptProcessor"); // Adjust if your compiled JS is elsewhere or use ts-node/tsx
// Directory for temporary test files, located within __tests__ to avoid cluttering src root
const TEST_DIR = path.resolve(__dirname, '__test_temp__');
const BASE_DIR = path.resolve(TEST_DIR); // Base directory for test files relative paths
// Helper function to create test files relative to BASE_DIR
function createTestFile(relativePath, content) {
    return __awaiter(this, void 0, void 0, function* () {
        const fullPath = path.resolve(BASE_DIR, relativePath);
        yield fs.mkdir(path.dirname(fullPath), { recursive: true });
        yield fs.writeFile(fullPath, content, 'utf-8');
        return fullPath; // Return the absolute path
    });
}
(0, vitest_1.describe)('processPromptFile', () => {
    // Create temporary directory and files before all tests run
    (0, vitest_1.beforeAll)(() => __awaiter(void 0, void 0, void 0, function* () {
        yield fs.mkdir(BASE_DIR, { recursive: true });
        // Common files used by multiple tests
        yield createTestFile('common/part1.md', 'This is part 1.');
        yield createTestFile('common/part2.md', 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5');
        yield createTestFile('common/regex_target.md', 'Header\n## START\nContent Line 1\nContent Line 2\n## END\nFooter');
        yield createTestFile('common/empty.md', '');
        // Files for nested include tests
        yield createTestFile('nested/level2.md', 'Final level content.');
        yield createTestFile('nested/level1.md', 'Level 1 includes: {{include: ./level2.md}}');
        // File for relative path test
        yield createTestFile('subdir/placeholder.md', ''); // Ensure subdir exists
    }));
    // Clean up the temporary directory after all tests have run
    (0, vitest_1.afterAll)(() => __awaiter(void 0, void 0, void 0, function* () {
        yield fs.rm(TEST_DIR, { recursive: true, force: true });
    }));
    // Mock console methods before each test to check for warnings/errors
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.spyOn(console, 'warn').mockImplementation(() => { });
        vitest_1.vi.spyOn(console, 'error').mockImplementation(() => { });
    });
    // Restore original console methods after each test
    (0, vitest_1.afterEach)(() => {
        vitest_1.vi.restoreAllMocks();
    });
    (0, vitest_1.it)('should process a file with no includes', () => __awaiter(void 0, void 0, void 0, function* () {
        const filePath = yield createTestFile('no_include.md', 'Simple content.');
        const result = yield (0, promptProcessor_1.processPromptFile)(filePath, BASE_DIR);
        (0, vitest_1.expect)(result).toBe('Simple content.');
    }));
    (0, vitest_1.it)('should process a basic file include', () => __awaiter(void 0, void 0, void 0, function* () {
        const filePath = yield createTestFile('basic_include.md', 'Include: {{include: common/part1.md}}');
        const result = yield (0, promptProcessor_1.processPromptFile)(filePath, BASE_DIR);
        (0, vitest_1.expect)(result).toBe('Include: This is part 1.');
    }));
    (0, vitest_1.it)('should process multiple includes in the same file', () => __awaiter(void 0, void 0, void 0, function* () {
        const filePath = yield createTestFile('multiple_includes.md', 'Part 1: {{include: common/part1.md}}\nPart 2: {{include: common/part2.md#L1-L2}}');
        const result = yield (0, promptProcessor_1.processPromptFile)(filePath, BASE_DIR);
        (0, vitest_1.expect)(result).toBe('Part 1: This is part 1.\nPart 2: Line 1\nLine 2');
    }));
    // --- Line Range Tests ---
    (0, vitest_1.it)('should process line range include (Lstart-Lend)', () => __awaiter(void 0, void 0, void 0, function* () {
        const filePath = yield createTestFile('line_range.md', 'Lines 2-4: {{include: common/part2.md#L2-L4}}');
        const result = yield (0, promptProcessor_1.processPromptFile)(filePath, BASE_DIR);
        (0, vitest_1.expect)(result).toBe('Lines 2-4: Line 2\nLine 3\nLine 4');
    }));
    (0, vitest_1.it)('should process single line include (Lstart)', () => __awaiter(void 0, void 0, void 0, function* () {
        const filePath = yield createTestFile('single_line.md', 'Line 3: {{include: common/part2.md#L3}}');
        const result = yield (0, promptProcessor_1.processPromptFile)(filePath, BASE_DIR);
        (0, vitest_1.expect)(result).toBe('Line 3: Line 3');
    }));
    (0, vitest_1.it)('should return error comment for invalid line range (start > end)', () => __awaiter(void 0, void 0, void 0, function* () {
        const filePath = yield createTestFile('invalid_line_range1.md', '{{include: common/part2.md#L4-L2}}');
        const result = yield (0, promptProcessor_1.processPromptFile)(filePath, BASE_DIR);
        (0, vitest_1.expect)(result).toContain('<!-- Error including common/part2.md#L4-L2: Start line cannot be greater than end line: L4-L2 -->');
        (0, vitest_1.expect)(console.error).toHaveBeenCalled();
    }));
    (0, vitest_1.it)('should return error comment for out-of-bounds line range (start < 1)', () => __awaiter(void 0, void 0, void 0, function* () {
        const filePath = yield createTestFile('invalid_line_range2.md', '{{include: common/part2.md#L0-L2}}');
        const result = yield (0, promptProcessor_1.processPromptFile)(filePath, BASE_DIR);
        (0, vitest_1.expect)(result).toContain('<!-- Error including common/part2.md#L0-L2: Invalid start line number (must be >= 1): L0-L2 -->');
        (0, vitest_1.expect)(console.error).toHaveBeenCalled();
    }));
    (0, vitest_1.it)('should return error comment for out-of-bounds line range (end > length)', () => __awaiter(void 0, void 0, void 0, function* () {
        const filePath = yield createTestFile('invalid_line_range3.md', '{{include: common/part2.md#L4-L6}}'); // part2.md only has 5 lines
        const result = yield (0, promptProcessor_1.processPromptFile)(filePath, BASE_DIR);
        (0, vitest_1.expect)(result).toContain('<!-- Error including common/part2.md#L4-L6: Line numbers out of range (1-5) for file');
        (0, vitest_1.expect)(result).toContain('common/part2.md: L4-L6 -->');
        (0, vitest_1.expect)(console.error).toHaveBeenCalled();
    }));
    // --- Regex Range Tests ---
    (0, vitest_1.it)('should process regex range include (startRegex/endRegex)', () => __awaiter(void 0, void 0, void 0, function* () {
        const filePath = yield createTestFile('regex_range.md', 'Regex Content: {{include: common/regex_target.md#startRegex=/^## START$/endRegex=/^## END$/}}');
        const result = yield (0, promptProcessor_1.processPromptFile)(filePath, BASE_DIR);
        (0, vitest_1.expect)(result).toBe('Regex Content: Content Line 1\nContent Line 2');
    }));
    (0, vitest_1.it)('should handle regex range with only startRegex (includes till end)', () => __awaiter(void 0, void 0, void 0, function* () {
        const filePath = yield createTestFile('regex_start_only.md', 'Regex Start Only: {{include: common/regex_target.md#startRegex=/^## START$/}}');
        const result = yield (0, promptProcessor_1.processPromptFile)(filePath, BASE_DIR);
        (0, vitest_1.expect)(result).toBe('Regex Start Only: Content Line 1\nContent Line 2\n## END\nFooter');
        (0, vitest_1.expect)(console.warn).toHaveBeenCalledWith(vitest_1.expect.stringContaining('Only startRegex provided for startRegex=/^## START$/'));
    }));
    (0, vitest_1.it)('should handle regex range where endRegex is not found (includes till end)', () => __awaiter(void 0, void 0, void 0, function* () {
        const filePath = yield createTestFile('regex_end_not_found.md', 'Regex End Not Found: {{include: common/regex_target.md#startRegex=/^## START$/endRegex=/^## NOT_FOUND$/}}');
        const result = yield (0, promptProcessor_1.processPromptFile)(filePath, BASE_DIR);
        (0, vitest_1.expect)(result).toBe('Regex End Not Found: Content Line 1\nContent Line 2\n## END\nFooter');
        (0, vitest_1.expect)(console.warn).toHaveBeenCalledWith(vitest_1.expect.stringContaining('End regex /^## NOT_FOUND$/ not found after start regex'));
    }));
    (0, vitest_1.it)('should return error comment for non-matching startRegex', () => __awaiter(void 0, void 0, void 0, function* () {
        const filePath = yield createTestFile('regex_start_not_found.md', '{{include: common/regex_target.md#startRegex=/^## NOT_FOUND$/endRegex=/^## END$/}}');
        const result = yield (0, promptProcessor_1.processPromptFile)(filePath, BASE_DIR);
        (0, vitest_1.expect)(result).toContain('<!-- Error including common/regex_target.md#startRegex=/^## NOT_FOUND$/endRegex=/^## END$/: Start regex /^## NOT_FOUND$/ not found in file');
        (0, vitest_1.expect)(result).toContain('common/regex_target.md -->');
        (0, vitest_1.expect)(console.error).toHaveBeenCalled();
    }));
    (0, vitest_1.it)('should handle empty content selection between regexes', () => __awaiter(void 0, void 0, void 0, function* () {
        // This happens if startRegex matches line N and endRegex matches line N+1
        const filePath = yield createTestFile('regex_empty_selection.md', '{{include: common/regex_target.md#startRegex=/^## START$/endRegex=/^Content Line 1$/}}');
        const result = yield (0, promptProcessor_1.processPromptFile)(filePath, BASE_DIR);
        // Expect empty string replacement because start is line *after* "## START", end is line *before* "Content Line 1"
        (0, vitest_1.expect)(result).toBe('');
        (0, vitest_1.expect)(console.warn).toHaveBeenCalledWith(vitest_1.expect.stringContaining('Start and end regex resulted in empty content selection'));
    }));
    // --- Edge Cases and Errors ---
    (0, vitest_1.it)('should handle nested includes correctly', () => __awaiter(void 0, void 0, void 0, function* () {
        // nested/level1.md includes nested/level2.md
        const filePath = yield createTestFile('nested_include_main.md', 'Main includes: {{include: nested/level1.md}}');
        const result = yield (0, promptProcessor_1.processPromptFile)(filePath, BASE_DIR);
        // Expect full resolution: Main -> level1 -> level2
        (0, vitest_1.expect)(result).toBe('Main includes: Level 1 includes: Final level content.');
    }));
    (0, vitest_1.it)('should return error comment for file not found', () => __awaiter(void 0, void 0, void 0, function* () {
        const filePath = yield createTestFile('not_found.md', '{{include: non_existent_file.md}}');
        const result = yield (0, promptProcessor_1.processPromptFile)(filePath, BASE_DIR);
        (0, vitest_1.expect)(result).toContain('<!-- Error including non_existent_file.md: Included file not found');
        (0, vitest_1.expect)(console.error).toHaveBeenCalled();
    }));
    (0, vitest_1.it)('should return warning comment and skip self-inclusion', () => __awaiter(void 0, void 0, void 0, function* () {
        const filePath = yield createTestFile('self_include.md', 'Self: {{include: ./self_include.md}}');
        const result = yield (0, promptProcessor_1.processPromptFile)(filePath, BASE_DIR);
        (0, vitest_1.expect)(result).toBe('Self: <!-- Skipped self-inclusion: ./self_include.md -->');
        (0, vitest_1.expect)(console.warn).toHaveBeenCalledWith(vitest_1.expect.stringContaining('Skipped self-inclusion in'));
        (0, vitest_1.expect)(console.warn).toHaveBeenCalledWith(vitest_1.expect.stringContaining('self_include.md'));
    }));
    (0, vitest_1.it)('should ignore escaped includes (preceded by ## )', () => __awaiter(void 0, void 0, void 0, function* () {
        const filePath = yield createTestFile('escaped_include.md', 'This should not be included: ## {{include: common/part1.md}}\nThis should be: {{include: common/part1.md}}');
        const result = yield (0, promptProcessor_1.processPromptFile)(filePath, BASE_DIR);
        (0, vitest_1.expect)(result).toBe('This should not be included: ## {{include: common/part1.md}}\nThis should be: This is part 1.');
    }));
    (0, vitest_1.it)('should handle includes with relative paths from a subdirectory', () => __awaiter(void 0, void 0, void 0, function* () {
        // Create the file within a subdirectory that includes files from ../common/
        const filePath = yield createTestFile('subdir/relative_path.md', 'Part1: {{include: ../common/part1.md}}\nPart2: {{include: ../common/part2.md#L1}}');
        const result = yield (0, promptProcessor_1.processPromptFile)(filePath, BASE_DIR);
        (0, vitest_1.expect)(result).toBe('Part1: This is part 1.\nPart2: Line 1');
    }));
    (0, vitest_1.it)('should handle including an empty file', () => __awaiter(void 0, void 0, void 0, function* () {
        const filePath = yield createTestFile('include_empty.md', 'Include Empty: {{include: common/empty.md}}');
        const result = yield (0, promptProcessor_1.processPromptFile)(filePath, BASE_DIR);
        (0, vitest_1.expect)(result).toBe('Include Empty: ');
    }));
    (0, vitest_1.it)('should handle processing an empty source file', () => __awaiter(void 0, void 0, void 0, function* () {
        const filePath = yield createTestFile('empty_source.md', '');
        const result = yield (0, promptProcessor_1.processPromptFile)(filePath, BASE_DIR);
        (0, vitest_1.expect)(result).toBe('');
    }));
    (0, vitest_1.it)('should return error comment for invalid include syntax (bad options)', () => __awaiter(void 0, void 0, void 0, function* () {
        const filePath = yield createTestFile('invalid_syntax.md', '{{include: common/part1.md#InvalidOption=true}}');
        const result = yield (0, promptProcessor_1.processPromptFile)(filePath, BASE_DIR);
        (0, vitest_1.expect)(result).toContain('<!-- Error including common/part1.md#InvalidOption=true: Invalid include options format: InvalidOption=true -->');
        (0, vitest_1.expect)(console.error).toHaveBeenCalled();
    }));
    (0, vitest_1.it)('should handle multiple escaped and non-escaped includes mixed together', () => __awaiter(void 0, void 0, void 0, function* () {
        const filePath = yield createTestFile('mixed_escaped.md', 'Escaped: ## {{include: common/part1.md}}\nReal: {{include: common/part1.md}}\nEscaped Again: ## {{include: common/part2.md}}');
        const result = yield (0, promptProcessor_1.processPromptFile)(filePath, BASE_DIR);
        (0, vitest_1.expect)(result).toBe('Escaped: ## {{include: common/part1.md}}\nReal: This is part 1.\nEscaped Again: ## {{include: common/part2.md}}');
    }));
    (0, vitest_1.it)('should handle include tag immediately following an escaped tag', () => __awaiter(void 0, void 0, void 0, function* () {
        const filePath = yield createTestFile('escaped_then_real.md', '## {{include: common/part1.md}}{{include: common/part1.md}}');
        const result = yield (0, promptProcessor_1.processPromptFile)(filePath, BASE_DIR);
        (0, vitest_1.expect)(result).toBe('## {{include: common/part1.md}}This is part 1.');
    }));
    (0, vitest_1.it)('should handle include tags with varying whitespace', () => __awaiter(void 0, void 0, void 0, function* () {
        const filePath = yield createTestFile('whitespace_include.md', 'Include: {{ include : common/part1.md }}\nInclude2: {{include:common/part2.md#L1}}');
        const result = yield (0, promptProcessor_1.processPromptFile)(filePath, BASE_DIR);
        (0, vitest_1.expect)(result).toBe('Include: This is part 1.\nInclude2: Line 1');
    }));
});
