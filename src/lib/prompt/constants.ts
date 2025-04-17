// filepath: /home/sebille/Bureau/projects/tests/prompts/src/lib/promptProcessor/constants.ts

// Regex source for matching include directives
export const INCLUDE_REGEX_SOURCE = /{{\s*include\s*:\s*([^{}]+?)\s*}}/g.source;

// Regex for parsing legacy line number hash options (e.g., #L10-L20)
export const LEGACY_LINE_REGEX = /^L(\d+)(?:-L(\d+))?$/;

// Regex for parsing legacy regex hash options (e.g., #startRegex=...endRegex=...)
export const LEGACY_REGEX_REGEX = /startRegex=(.+?)(?:endRegex=(.+))?$/;

// Character encoding
export const FILE_ENCODING = 'utf-8';

// Newline character
export const NEWLINE = '\n';

// Escape character for include directives
export const ESCAPE_CHARACTER = '!';

// Error and Warning Messages
export const ERROR_INVALID_LINE_NUMBERS = (hash: string) => `Invalid line numbers in options: ${hash}`;
export const ERROR_INVALID_START_LINE = (hash: string) => `Invalid start line number (must be >= 1): ${hash}`;
export const ERROR_START_END_LINE_ORDER = (hash: string) => `Start line cannot be greater than end line: ${hash}`;
export const ERROR_INVALID_REGEX_PATTERN = (hash: string, errorMsg: string) => `Invalid regex pattern in options: ${hash}. Error: ${errorMsg}`;
export const ERROR_INVALID_HASH_FORMAT = (hash: string) => `Invalid hash options format: ${hash}`;
export const ERROR_MISSING_FILE_PROP = 'Missing or invalid "file" property in parameters';
export const ERROR_CANNOT_DETERMINE_FILE_PATH = 'File path could not be determined from parameters';
export const ERROR_INVALID_STYLE = (style: string, validStyles: string) => `Invalid style: ${style}. Valid styles are: ${validStyles}`;
export const ERROR_PARSING_PARAMS = (params: string, errorMsg: string) => `Error parsing main include parameters "${params}": ${errorMsg}`;
export const ERROR_LINES_OUT_OF_RANGE = (maxLines: number, filePath: string, range: string) => `Line numbers out of range (1-${maxLines}) for file ${filePath}: ${range}`;
export const ERROR_FILE_NOT_FOUND = (filePath: string) => `Included file not found: ${filePath}`;
export const ERROR_READING_FILE = (filePath: string, errorMsg: string) => `Error reading file ${filePath}: ${errorMsg}`;
export const ERROR_READING_INITIAL_FILE = (filePath: string, errorMsg: string) => `Error reading initial file ${filePath}: ${errorMsg}`;

export const WARN_JSON_PARSE_FAILED = (params: string, errorMsg: string) => `Could not parse include parameters as JSON-like: "${params}". Treating as simple path. Error: ${errorMsg}`;
export const WARN_ONLY_START_REGEX = (hash: string) => `Only startRegex provided for ${hash}. Content will be included until the end of the file or the next logical section if endRegex is missing.`;
export const WARN_START_REGEX_NOT_FOUND = (regex: RegExp, filePath: string) => `Start regex ${regex} not found in ${filePath}. Including entire file.`;
export const WARN_END_REGEX_NOT_FOUND = (regex: RegExp, filePath: string) => `End regex ${regex} not found after start regex in ${filePath}. Including content until the end.`;
export const WARN_REGEX_EMPTY_SELECTION = (filePath: string) => `Start and end regex resulted in empty or invalid content selection for ${filePath}. Returning empty string.`;
export const WARN_UNKNOWN_STYLE = (style: string) => `Unknown style '${style}', using default (none)`;

// HTML Comment Templates for Errors/Warnings
export const COMMENT_WARN_SELF_INCLUSION = (filePath: string, sourcePath: string) => `<!-- Warning: Skipped self-inclusion of ${filePath} in ${sourcePath} -->`;
export const COMMENT_WARN_CIRCULAR_INCLUSION = (filePath: string, sourcePath: string) => `<!-- Warning: Skipped circular inclusion of ${filePath} in ${sourcePath} -->`;
export const COMMENT_ERROR_INCLUDING = (params: string, errorMsg: string) => `<!-- Error including ${params}: ${errorMsg} -->`;
export const COMMENT_ERROR_READING_FILE = (filePath: string, errorMsg: string) => `<!-- Error reading file ${filePath}: ${errorMsg} -->`;
