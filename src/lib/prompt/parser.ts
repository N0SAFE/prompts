// filepath: /home/sebille/Bureau/projects/tests/prompts/src/lib/promptProcessor/parser.ts
import { logger } from '../utils/logger';
import { StyleType } from '../styles'; // Assuming styles exports this
import { IncludeOptions, IncludeParams, Transformation } from './types';
import {
    LEGACY_LINE_REGEX,
    LEGACY_REGEX_REGEX,
    ERROR_INVALID_LINE_NUMBERS,
    ERROR_INVALID_START_LINE,
    ERROR_START_END_LINE_ORDER,
    ERROR_INVALID_REGEX_PATTERN,
    ERROR_INVALID_HASH_FORMAT,
    ERROR_CANNOT_DETERMINE_FILE_PATH, // Keep this, maybe adapt message
    ERROR_INVALID_STYLE,
    ERROR_PARSING_PARAMS,
    WARN_JSON_PARSE_FAILED, // Keep if used in parseJsonLike or elsewhere
    WARN_ONLY_START_REGEX
} from './constants'; // Ensure ERROR_CANNOT_DETERMINE_FILE_PATH is defined appropriately

/**
 * Parses a JSON-like string into key-value pairs for include parameters.
 * Handles simple key: 'value' pairs, respecting quotes.
 * Used for parsing options *after* the file path.
 * @param str The JSON-like string (e.g., "style: 'inline', transform: [...]")
 * @returns A partial IncludeParams object.
 */
function parseJsonLike(str: string): Partial<IncludeParams> {
    const params: Partial<IncludeParams> = {};
    // Remove surrounding braces if they exist from any previous logic attempt
    const cleanStr = str.startsWith('{') && str.endsWith('}') ? str.slice(1, -1) : str;

    // Split by comma, but respect quotes. Handles simple cases.
    // Regex breakdown:
    // (?:...) - non-capturing group
    // (['"]) - capture quote type (single or double)
    // (.*?) - capture content inside quotes (non-greedy)
    // \1 - match the same quote type captured earlier
    // | - OR
    // ([^,]+) - capture characters that are not commas (for unquoted values/keys)
    // (?=...) - positive lookahead
    // \s*,\s* - match comma surrounded by optional whitespace
    // | - OR
    // \s*$ - match end of string surrounded by optional whitespace
    const pairs = cleanStr.match(/(?:(['"])(.*?)\1|([^,]+))(?=\s*,\s*|\s*$)/g) || [];

    pairs.forEach(pair => {
        const parts = pair.split(':');
        if (parts.length >= 2) {
            // Key: trim whitespace and remove potential quotes
            const key = parts[0].trim().replace(/^['"]|['"]$/g, '');
            // Value: join the rest (in case value had colons), trim whitespace, remove surrounding quotes
            const value = parts.slice(1).join(':').trim().replace(/^['"]|['"]$/g, '');

            // Assign to known keys (excluding 'file' as it's handled positionally now)
            if (key === 'style') {
                 params[key as 'style'] = value;
            } else if (key === 'transform') {
                 // Attempt to parse transform as JSON array if it looks like one
                 if (value.startsWith('[') && value.endsWith(']')) {
                     try {
                         // Replace single quotes inside for JSON validity if needed, though proper JSON should use double
                         params[key] = JSON.parse(value.replace(/'/g, '"'));
                     } catch (e) {
                         logger.warn(0, `Failed to parse transform value as JSON array: ${value}`);
                         params[key] = []; // Default to empty array on failure
                     }
                 } else {
                     logger.warn(0, `Transform value is not a valid JSON array string: ${value}`);
                     params[key] = []; // Default to empty array if not array-like
                 }
            } else if (key === 'file') {
                // Log a warning if 'file' key is found here, as it's now positional
                logger.warn(0, `Redundant 'file' key found in options part: "${pair}". File path should be the first argument before any comma.`);
                // Optionally store it anyway, but it won't be used by the main logic
                // params[key] = value;
            }
            // Add other potential keys here if needed in the future
        }
    });
    return params;
}


/**
 * Parses include parameters from the new standard format and legacy formats.
 * - New Standard: path/to/file[#options][, key: 'value', ...]
 *   - Example: ../common/code.js#L5-L10, style: 'indent'
 *   - Example: ./my-snippet.txt, transform: [{ type: 'slice', start: 1, end: 5 }]
 * - Legacy Simple: path/to/file[#options]
 *   - Example: path/to/file#L1-L5
 * - Legacy JSON-like: file: 'path/to/file[#options]', style: 'inline', ... (Still supported for backward compatibility)
 *
 * Hash options (#L1-L5 or #startRegex=...) are parsed from the file path string.
 * Other options (style, transform) are parsed from the key-value pairs after the first comma.
 *
 * @param includeParamsStr The whole parameter string for the include directive
 * @returns Parsed options
 */
export function parseOptions(includeParamsStr: string): IncludeOptions {
    const options: IncludeOptions = {};
    const trimmedInput = includeParamsStr.trim();

    let filePathPart = "";
    let optionsPartStr = "";
    let isLegacyJsonLike = false;

    // --- Check for Legacy JSON-like format first ---
    // A simple check: does it contain "file:" AND a comma?
    if (trimmedInput.includes('file:') && trimmedInput.includes(',')) {
        try {
            const legacyParams = parseJsonLike(trimmedInput); // Use the same helper
            if (typeof legacyParams.file === 'string' && legacyParams.file) {
                filePathPart = legacyParams.file.trim();
                // Reconstruct options string excluding the file part for consistency
                optionsPartStr = Object.entries(legacyParams)
                    .filter(([key]) => key !== 'file')
                    .map(([key, value]) => `${key}: ${JSON.stringify(value)}`) // Re-stringify for parsing below
                    .join(', ');
                isLegacyJsonLike = true;
                logger.debug(1, `  Detected and parsed legacy JSON-like format. File path: ${filePathPart}`);
            } else {
                 // Looks like JSON but 'file' is missing/invalid, treat as new format
                 logger.warn(0, `Potentially legacy JSON-like format detected, but 'file' property missing or invalid in "${trimmedInput}". Treating as new format.`);
            }
        } catch (e) {
            // Failed to parse as legacy JSON, proceed to new format parsing
            logger.warn(0, `Failed to parse as legacy JSON-like: "${trimmedInput}". Error: ${e instanceof Error ? e.message : String(e)}. Treating as new format.`);
        }
    }

    // --- Parse New Standard Format (or if legacy parsing failed/not detected) ---
    if (!isLegacyJsonLike) {
        const firstCommaIndex = trimmedInput.indexOf(',');
        if (firstCommaIndex !== -1) {
            filePathPart = trimmedInput.substring(0, firstCommaIndex).trim();
            optionsPartStr = trimmedInput.substring(firstCommaIndex + 1).trim();
        } else {
            // No comma, the whole string is the file path part
            filePathPart = trimmedInput;
            optionsPartStr = "";
        }
        // Handle potential quotes around the file path part in the new format
        filePathPart = filePathPart.replace(/^['"]|['"]$/g, '');
        logger.debug(1, `  Parsing as new format. File path part: ${filePathPart}, Options part: ${optionsPartStr}`);
    }

    // --- Process File Path Part (Common Logic) ---
    if (!filePathPart) {
        // This should only happen if includeParamsStr was empty or whitespace, or legacy parse failed badly
        // Corrected: Construct the error message string directly
        throw new Error(`${ERROR_CANNOT_DETERMINE_FILE_PATH}: "${includeParamsStr}"`);
    }

    let finalFilePath = filePathPart;
    let hashOptionsPart: string | undefined = undefined;
    const hashIndex = filePathPart.indexOf('#');

    if (hashIndex !== -1) {
        hashOptionsPart = filePathPart.substring(hashIndex + 1);
        finalFilePath = filePathPart.substring(0, hashIndex);
        logger.debug(1, `  Extracted hash options: #${hashOptionsPart} from ${filePathPart}`);

        // --- Parse Hash Options ---
        const lineMatch = hashOptionsPart.match(LEGACY_LINE_REGEX);
        if (lineMatch) {
            options.startLine = parseInt(lineMatch[1], 10);
            options.endLine = lineMatch[2] ? parseInt(lineMatch[2], 10) : undefined;
            if (isNaN(options.startLine) || (options.endLine !== undefined && isNaN(options.endLine))) {
                throw new Error(ERROR_INVALID_LINE_NUMBERS(hashOptionsPart));
            }
            if (options.startLine < 1) {
                throw new Error(ERROR_INVALID_START_LINE(hashOptionsPart));
            }
            if (options.endLine !== undefined && options.startLine > options.endLine) {
                throw new Error(ERROR_START_END_LINE_ORDER(hashOptionsPart));
            }
            logger.debug(1, `    Parsed line options: start=${options.startLine}, end=${options.endLine}`);
        } else {
            const regexMatch = hashOptionsPart.match(LEGACY_REGEX_REGEX);
            if (regexMatch) {
                try {
                    const startPattern = decodeURIComponent(regexMatch[1].trim());
                    options.startRegex = new RegExp(startPattern.startsWith('/') && startPattern.endsWith('/')
                        ? startPattern.slice(1, -1) : startPattern);

                    if (regexMatch[2]) {
                        const endPattern = decodeURIComponent(regexMatch[2].trim());
                        options.endRegex = new RegExp(endPattern.startsWith('/') && endPattern.endsWith('/')
                            ? endPattern.slice(1, -1) : endPattern);
                    } else {
                        logger.warn(1, WARN_ONLY_START_REGEX(hashOptionsPart));
                    }
                     logger.debug(1, `    Parsed regex options: start=${options.startRegex}, end=${options.endRegex}`);
                } catch (e) {
                    const errorMsg = e instanceof Error ? e.message : String(e);
                    throw new Error(ERROR_INVALID_REGEX_PATTERN(hashOptionsPart, errorMsg));
                }
            } else {
                // If it's not line or regex format, it's invalid *as hash options*
                throw new Error(ERROR_INVALID_HASH_FORMAT(hashOptionsPart));
            }
        }
        // --- End Parse Hash Options ---
    }

    options.filePath = finalFilePath; // Store the path *without* the hash

    // --- Process Options Part (Common Logic) ---
    if (optionsPartStr) {
        try {
            const parsedOtherOptions = parseJsonLike(optionsPartStr); // Use helper

            // Process style if present
            if (parsedOtherOptions.style) {
                const styleStr = String(parsedOtherOptions.style).toLowerCase();
                const validStyles = Object.values(StyleType).join(', ');
                if (!Object.values(StyleType).includes(styleStr as StyleType)) {
                    throw new Error(ERROR_INVALID_STYLE(String(parsedOtherOptions.style), validStyles));
                }
                options.style = styleStr as StyleType;
                logger.debug(1, `  Parsed style option: ${options.style}`);
            }

            // Process transform if present
            if (parsedOtherOptions.transform) {
                if (Array.isArray(parsedOtherOptions.transform)) {
                    options.transform = parsedOtherOptions.transform as Transformation[];
                    logger.debug(1, `  Parsed transform option: ${JSON.stringify(options.transform)}`);
                } else {
                    logger.warn(0, `Parsed 'transform' is not an array: ${JSON.stringify(parsedOtherOptions.transform)}`);
                }
            }
             // Note: 'file' key warning is handled within parseJsonLike now

        } catch (e) {
            const errorMsg = e instanceof Error ? e.message : String(e);
            logger.warn(0, `Failed to parse options part "${optionsPartStr}". Error: ${errorMsg}`);
            // Decide if this should throw or just ignore options
            throw new Error(ERROR_PARSING_PARAMS(includeParamsStr, `Failed to parse options part: ${errorMsg}`));
        }
    }
    // --- End Process Options Part ---

    // Final check
    if (!options.filePath) {
         // This check might be redundant now, but keep for safety
         // Corrected: Construct the error message string directly
        throw new Error(`${ERROR_CANNOT_DETERMINE_FILE_PATH}: "${includeParamsStr}"`);
    }

    logger.debug(1, `  Final parsed options: ${JSON.stringify(options)}`);
    return options;
}
