// filepath: /home/sebille/Bureau/projects/tests/prompts/src/lib/promptProcessor/extractor.ts
import * as fs from 'fs/promises';
import { logger } from '../utils/logger';
import { IncludeOptions } from './types';
import {
    FILE_ENCODING,
    NEWLINE,
    ERROR_LINES_OUT_OF_RANGE,
    ERROR_FILE_NOT_FOUND,
    WARN_START_REGEX_NOT_FOUND,
    WARN_END_REGEX_NOT_FOUND,
    WARN_REGEX_EMPTY_SELECTION
} from './constants';

/**
 * Extracts content from a file based on the provided options (line numbers or regex).
 * @param filePath Absolute path to the file.
 * @param options Include options specifying ranges or patterns.
 * @param indent Indentation level for logging.
 * @returns The extracted content as a string.
 */
export async function extractContent(filePath: string, options: IncludeOptions, indent: number): Promise<string> {
  const currentIndent = indent;
  try {
    const content = await fs.readFile(filePath, FILE_ENCODING);
    const lines = content.split(NEWLINE);

    let start = 0;
    let end = lines.length;

    if (options.startLine !== undefined) {
      start = options.startLine - 1; // Line numbers are 1-based
      end = (options.endLine !== undefined ? options.endLine : lines.length);
      // Check bounds against actual lines length
      if (start < 0 || start >= lines.length || end > lines.length) {
          const rangeStr = `L${options.startLine}${options.endLine && options.endLine !== options.startLine ? '-L'+options.endLine : ''}`;
          throw new Error(ERROR_LINES_OUT_OF_RANGE(lines.length, filePath, rangeStr));
      }
       return lines.slice(start, end).join(NEWLINE);
    }

    if (options.startRegex) {
        const startIndex = lines.findIndex(line => options.startRegex!.test(line));
        if (startIndex === -1) {
            // Use logger.warn with indent
            logger.warn(currentIndent, WARN_START_REGEX_NOT_FOUND(options.startRegex, filePath));
            start = 0;
        } else {
            start = startIndex;
        }

        if (options.endRegex) {
            // Search *after* the start index
            const searchLines = lines.slice(start + 1);
            const endIndexRelative = searchLines.findIndex(line => options.endRegex!.test(line));
            if (endIndexRelative === -1) {
                 // Use logger.warn with indent
                 logger.warn(currentIndent, WARN_END_REGEX_NOT_FOUND(options.endRegex, filePath));
                 end = lines.length;
            } else {
                // Adjust index to be relative to the original lines array
                end = start + 1 + endIndexRelative;
            }
        } else {
             // If only startRegex is provided, include from start line to the end
             end = lines.length;
        }

         // Adjust end line to be inclusive if start and end are the same line from regex
         if (start === end && startIndex !== -1) {
             end = start + 1;
         }

         if (start >= end) { // Use >= to handle cases where start is after end
             // Use logger.warn with indent
             logger.warn(currentIndent, WARN_REGEX_EMPTY_SELECTION(filePath));
             return "";
         }

         return lines.slice(start, end).join(NEWLINE);
    }

    // Default: include the whole file if no specific options are given
    return content;
  } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
          throw new Error(ERROR_FILE_NOT_FOUND(filePath));
      }
      // Re-throw other errors (parsing, range errors, etc.)
      throw error;
  }
}
