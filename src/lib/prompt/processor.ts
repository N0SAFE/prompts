import * as fs from 'fs/promises';
import * as path from 'path';
import chalk from 'chalk';
import { logger } from '../utils/logger';
import {
    INCLUDE_REGEX_SOURCE,
    ESCAPE_CHARACTER,
    FILE_ENCODING,
    ERROR_READING_FILE,
    ERROR_READING_INITIAL_FILE,
    COMMENT_WARN_SELF_INCLUSION,
    COMMENT_WARN_CIRCULAR_INCLUSION,
    COMMENT_ERROR_INCLUDING,
    COMMENT_ERROR_READING_FILE,
    ERROR_CANNOT_DETERMINE_FILE_PATH
} from './constants';
import { IncludeOptions } from './types';
import { parseOptions } from './parser';
import { extractContent } from './extractor';
import { applyStyleAndTransformations } from './styler';

export class PromptProcessor {
    private baseDir: string;

    constructor(baseDir: string) {
        this.baseDir = baseDir;
    }

    /**
     * Processes the main content, resolving includes recursively.
     * @param content The content string to process.
     * @param currentFilePath Absolute path of the file being processed.
     * @param indent Current indentation level for logging.
     * @param visitedPaths Set to track visited paths and prevent cycles.
     * @returns Processed content string.
     */
    private async processContentRecursive(
        content: string,
        currentFilePath: string,
        indent: number,
        visitedPaths: Set<string>
    ): Promise<string> {
        const currentIndent = indent;
        const nextIndent = currentIndent + 1;
        const relativeCurrentPath = path.relative(this.baseDir, currentFilePath);
        logger.debug(currentIndent, `[processContent] Enter: ${relativeCurrentPath}, Visited: ${JSON.stringify(Array.from(visitedPaths))}`);

        const localIncludeRegex = new RegExp(INCLUDE_REGEX_SOURCE, 'g');
        localIncludeRegex.lastIndex = 0;

        let processedOutput = '';
        let lastIndex = 0;
        let match;

        while ((match = localIncludeRegex.exec(content)) !== null) {
            const matchStartIndex = match.index;
            const matchEndIndex = localIncludeRegex.lastIndex;
            const [fullMatch, paramsStr] = match;

            // Append text segment before the match
            processedOutput += content.substring(lastIndex, matchStartIndex);

            // Calculate line and column for logging/errors
            const linesUpToMatch = content.substring(0, matchStartIndex).split('\n');
            const lineNumber = linesUpToMatch.length;
            const lastNewlineIndex = content.lastIndexOf('\n', matchStartIndex - 1);
            const columnNumber = matchStartIndex - (lastNewlineIndex === -1 ? -1 : lastNewlineIndex);
            const errorLocation = `${relativeCurrentPath}:${lineNumber}:${columnNumber}`;
            const directiveString = `{{include: ${paramsStr.trim()}}}`;

            // Handle escaped includes
            if (matchStartIndex > 0 && content[matchStartIndex - 1] === ESCAPE_CHARACTER) {
                logger.debug(currentIndent, `    Escaped include found at ${errorLocation}.`);
                processedOutput = processedOutput.slice(0, -1); // Remove the preceding escape character
                processedOutput += fullMatch; // Add the literal directive
                lastIndex = matchEndIndex;
                continue;
            }

            // Process normal include
            logger.debug(currentIndent, `    Processing include: ${directiveString} at ${errorLocation}`);
            let replacementText = '';
            try {
                // Pass the full trimmed parameter string to parseOptions
                const options = parseOptions(paramsStr.trim());
                logger.debug(currentIndent, `      Parsed options: ${JSON.stringify(options)}`);

                if (!options.filePath) {
                    throw new Error(ERROR_CANNOT_DETERMINE_FILE_PATH);
                }

                const currentFileDir = path.dirname(currentFilePath);
                const absoluteIncludePath = path.resolve(currentFileDir, options.filePath);
                const relativeIncludePath = path.relative(this.baseDir, absoluteIncludePath);
                logger.debug(currentIndent, `      Resolved absolute path: ${relativeIncludePath}`);

                // --- Cycle Detection ---
                if (absoluteIncludePath === currentFilePath) {
                    logger.warn(currentIndent, `Skipped self-inclusion: ${chalk.cyan(directiveString)}\n  in file: ${chalk.yellow(errorLocation)}`);
                    replacementText = COMMENT_WARN_SELF_INCLUSION(options.filePath, relativeCurrentPath);
                } else if (visitedPaths.has(absoluteIncludePath)) {
                    logger.warn(currentIndent, `Skipped circular inclusion: ${chalk.cyan(directiveString)}\n  in file: ${chalk.yellow(errorLocation)}`);
                    replacementText = COMMENT_WARN_CIRCULAR_INCLUSION(options.filePath, relativeCurrentPath);
                } else {
                    // --- Process Inclusion --- 
                    logger.debug(currentIndent, `      Adding to visited: ${relativeIncludePath}`);
                    visitedPaths.add(absoluteIncludePath);

                    logger.debug(currentIndent, `      Calling extractContent for: ${relativeIncludePath}`);
                    const includedContentRaw = await extractContent(absoluteIncludePath, options, nextIndent);
                    logger.debug(currentIndent, `      Raw included content length: ${includedContentRaw.length}`);

                    logger.debug(currentIndent, `      Calling processContent recursively for: ${relativeIncludePath}`);
                    const processedIncludedContent = await this.processContentRecursive(includedContentRaw, absoluteIncludePath, nextIndent, visitedPaths);
                    logger.debug(currentIndent, `      Processed included content length: ${processedIncludedContent.length}`);

                    logger.debug(currentIndent, `      Applying style and transformations for: ${relativeIncludePath}`);
                    // Pass indentation from the original directive line for styling
                    const directiveLine = linesUpToMatch[linesUpToMatch.length - 1];
                    options.indentation = directiveLine.match(/^(\s*)/)?.[1] || ''; 
                    replacementText = await applyStyleAndTransformations(processedIncludedContent, options, nextIndent);
                    logger.debug(currentIndent, `      Styled and transformed content length: ${replacementText.length}`);

                    logger.debug(currentIndent, `      Removing from visited: ${relativeIncludePath}`);
                    visitedPaths.delete(absoluteIncludePath);
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                logger.error(
                    currentIndent,
                    `Error processing include: ${chalk.cyan(directiveString)}\n` +
                    `  in file: ${chalk.yellow(errorLocation)}\n` +
                    `  Reason: ${chalk.white(errorMessage)}`
                );
                replacementText = COMMENT_ERROR_INCLUDING(paramsStr.trim(), errorMessage);
            }

            processedOutput += replacementText;
            lastIndex = matchEndIndex;

        }

        // Append the final segment of the content
        processedOutput += content.substring(lastIndex);

        logger.debug(currentIndent, `[processContent] Exit: ${relativeCurrentPath}, Final length: ${processedOutput.length}`);
        return processedOutput;
    }

    /**
     * Reads the initial prompt file and starts the recursive processing.
     * @param filePath Path to the initial prompt file (can be relative to baseDir).
     * @param initialIndent Starting indentation level for logging.
     * @returns The fully processed prompt content as a string.
     */
    public async processFile(filePath: string, initialIndent: number = 0): Promise<string> {
        const currentIndent = initialIndent;
        const nextIndent = currentIndent + 1;
        const absoluteFilePath = path.isAbsolute(filePath) ? filePath : path.resolve(this.baseDir, filePath);
        const relativeFilePath = path.relative(this.baseDir, absoluteFilePath);
        logger.info(currentIndent, `Starting processing for: ${relativeFilePath}`);

        try {
            const initialContent = await fs.readFile(absoluteFilePath, FILE_ENCODING);
            const visitedPaths = new Set<string>([absoluteFilePath]); // Add initial file
            return await this.processContentRecursive(initialContent, absoluteFilePath, nextIndent, visitedPaths);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger.error(currentIndent, ERROR_READING_INITIAL_FILE(relativeFilePath, errorMessage));
            if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
                return COMMENT_ERROR_READING_FILE(relativeFilePath, 'File not found');
            }
            return COMMENT_ERROR_READING_FILE(relativeFilePath, errorMessage);
        }
    }
}
