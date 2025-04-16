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
exports.processPromptFile = processPromptFile;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const INCLUDE_REGEX = /{{include:\s*([^#]+?)(?:#(.+?))?\s*}}/g;
// Parses the options string (e.g., L10-L20 or startRegex=...endRegex=...)
function parseOptions(optionsStr) {
    const options = {};
    if (!optionsStr) {
        return options;
    }
    // Line range: L10-L20
    const lineMatch = optionsStr.match(/^L(\d+)(?:-L(\d+))?$/);
    if (lineMatch) {
        options.startLine = parseInt(lineMatch[1], 10);
        options.endLine = lineMatch[2] ? parseInt(lineMatch[2], 10) : options.startLine;
        if (isNaN(options.startLine) || (options.endLine !== undefined && isNaN(options.endLine))) {
            throw new Error(`Invalid line numbers in options: ${optionsStr}`);
        }
        if (options.endLine !== undefined && options.startLine > options.endLine) {
            throw new Error(`Start line cannot be greater than end line: ${optionsStr}`);
        }
        return options;
    }
    // Regex range: startRegex=/.../endRegex=/.../
    const regexMatch = optionsStr.match(/startRegex=(.+?)(?:endRegex=(.+))?$/);
    if (regexMatch) {
        try {
            // Need to decode potential URI encoding if regex comes from path
            const startPattern = decodeURIComponent(regexMatch[1].trim());
            // Ensure regex slashes are handled correctly
            options.startRegex = new RegExp(startPattern.startsWith('/') && startPattern.endsWith('/') ? startPattern.slice(1, -1) : startPattern);
            if (regexMatch[2]) {
                const endPattern = decodeURIComponent(regexMatch[2].trim());
                options.endRegex = new RegExp(endPattern.startsWith('/') && endPattern.endsWith('/') ? endPattern.slice(1, -1) : endPattern);
            }
            else {
                // If only startRegex is provided, implicitly match until the end of the file or next section
                console.warn(`Warning: Only startRegex provided for ${optionsStr}. Content will be included until the end of the file or the next logical section if endRegex is missing.`);
                // Or throw an error if endRegex is mandatory:
                // throw new Error(`Missing endRegex in options: ${optionsStr}`);
            }
        }
        catch (e) {
            throw new Error(`Invalid regex pattern in options: ${optionsStr}. Error: ${e instanceof Error ? e.message : String(e)}`);
        }
        return options;
    }
    throw new Error(`Invalid include options format: ${optionsStr}`);
}
// Extracts content based on the parsed options
function extractContent(filePath, options) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const content = yield fs.readFile(filePath, 'utf-8');
            const lines = content.split('\n');
            let start = 0;
            let end = lines.length;
            if (options.startLine !== undefined) {
                start = options.startLine - 1; // Line numbers are 1-based
                end = (options.endLine !== undefined ? options.endLine : start + 1);
                if (start < 0 || end > lines.length || start >= end) {
                    throw new Error(`Line numbers out of range for file ${filePath}: L${options.startLine}-L${options.endLine}`);
                }
                return lines.slice(start, end).join('\n');
            }
            if (options.startRegex) {
                const startIndex = lines.findIndex(line => options.startRegex.test(line));
                if (startIndex === -1) {
                    throw new Error(`Start regex ${options.startRegex} not found in file ${filePath}`);
                }
                start = startIndex + 1; // Exclude the line matching startRegex
                if (options.endRegex) {
                    // Search for endRegex *after* the startRegex match
                    const endIndex = lines.slice(start).findIndex(line => options.endRegex.test(line));
                    if (endIndex === -1) {
                        console.warn(`Warning: End regex ${options.endRegex} not found after start regex in ${filePath}. Including content until the end.`);
                        // Or throw an error:
                        // throw new Error(`End regex ${options.endRegex} not found after start regex in file ${filePath}`);
                        end = lines.length; // Include until the end if endRegex is not found
                    }
                    else {
                        end = start + endIndex; // Exclude the line matching endRegex
                    }
                }
                else {
                    end = lines.length; // Include until the end if no endRegex is provided
                }
                if (start >= end) {
                    // This can happen if start and end regex match consecutive lines or the same line,
                    // or if start is found but end is immediately after or not found.
                    console.warn(`Warning: Start and end regex resulted in empty content selection for ${filePath}.`);
                    return ""; // Return empty string if the range is invalid or empty
                }
                return lines.slice(start, end).join('\n');
            }
            // Default: include the whole file if no specific options are given
            return content;
        }
        catch (error) {
            if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
                throw new Error(`Included file not found: ${filePath}`);
            }
            // Re-throw other errors (parsing, range errors, etc.)
            throw error;
        }
    });
}
// Processes a single prompt file, resolving includes
function processPromptFile(filePath, baseDir) {
    return __awaiter(this, void 0, void 0, function* () {
        let content = yield fs.readFile(filePath, 'utf-8');
        let match;
        // Use a loop to handle multiple includes and potential nested includes (basic level)
        // Note: This handles one level of nesting. For deep nesting, a more robust recursive approach might be needed.
        while ((match = INCLUDE_REGEX.exec(content)) !== null) {
            const [fullMatch, includePathStr, optionsStr] = match;
            const includePath = includePathStr.trim();
            const options = parseOptions(optionsStr === null || optionsStr === void 0 ? void 0 : optionsStr.trim());
            // Resolve the absolute path of the included file relative to the *current* file's directory
            const currentFileDir = path.dirname(filePath);
            const absoluteIncludePath = path.resolve(currentFileDir, includePath);
            // Prevent including the file itself, causing infinite loops
            if (absoluteIncludePath === path.resolve(filePath)) {
                console.warn(`Warning: Skipped self-inclusion in ${filePath}`);
                // Replace the tag with an empty string or a warning message
                content = content.replace(fullMatch, `<!-- Skipped self-inclusion: ${includePath} -->`);
                // Reset regex index to re-scan from the beginning after replacement
                INCLUDE_REGEX.lastIndex = 0;
                continue; // Move to the next match
            }
            try {
                const includedContent = yield extractContent(absoluteIncludePath, options);
                content = content.replace(fullMatch, includedContent);
                // Reset regex index because the content length changed
                INCLUDE_REGEX.lastIndex = 0;
            }
            catch (error) {
                console.error(`Error processing include "${fullMatch}" in ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
                // Replace the tag with an error message in the output
                content = content.replace(fullMatch, `<!-- Error including ${includePath}: ${error instanceof Error ? error.message : 'Unknown error'} -->`);
                INCLUDE_REGEX.lastIndex = 0; // Reset index after replacement
            }
        }
        return content;
    });
}
