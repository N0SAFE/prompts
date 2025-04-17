import * as fs from 'fs/promises';
import * as path from 'path';
import chalk from 'chalk';
import { logger } from '../utils/logger'; // Import logger
import { StyleType, StyleFunction, styleHandlers, Transformation } from '../styles';

// Updated regex to support both formats:
// {{include: path/to/file#L1-L5}}                      (legacy format)
// {{include: file: 'path/to/file', style: 'inline'}}   (new format)
const INCLUDE_REGEX_SOURCE = /{{\s*include\s*:\s*([^{}]+?)\s*}}/g.source;

interface IncludeParams {
    file: string; // The file to include
    style?: StyleType; // The style to apply
    transform?: Transformation[]; // Transformations to apply
}

interface IncludeOptions {
    startLine?: number;
    endLine?: number;
    startRegex?: RegExp;
    endRegex?: RegExp;
    style?: StyleType;
    transform?: Transformation[];
    indentation?: string;  // Stores the indentation of the include directive line
}

/**
 * Parses include parameters from different formats:
 * - Hash format: #L1-L5 or #startRegex=...endRegex=...
 * - New JSON-like format: file: path, style: 'inline', transform: [...]
 * 
 * @param includeParamsStr The whole parameter string for the include directive
 * @param hashOptionsStr Optional hash options (legacy format)
 * @returns Parsed options
 */
function parseOptions(includeParamsStr: string, hashOptionsStr?: string): IncludeOptions {
  const options: IncludeOptions = {}; // Initialize options object
  
  // Handle legacy hash format first if present
  if (hashOptionsStr) {
    // Line range: L10-L20
    const lineMatch = hashOptionsStr.match(/^L(\d+)(?:-L(\d+))?$/);
    if (lineMatch) {
      options.startLine = parseInt(lineMatch[1], 10);
      options.endLine = lineMatch[2] ? parseInt(lineMatch[2], 10) : undefined;
      if (isNaN(options.startLine) || (options.endLine !== undefined && isNaN(options.endLine))) {
          throw new Error(`Invalid line numbers in options: ${hashOptionsStr}`);
      }
      // Add check for startLine >= 1
      if (options.startLine < 1) {
           throw new Error(`Invalid start line number (must be >= 1): ${hashOptionsStr}`);
      }
      if (options.endLine !== undefined && options.startLine > options.endLine) {
          throw new Error(`Start line cannot be greater than end line: ${hashOptionsStr}`);
      }
    } else {
      // Regex range: startRegex=/.../endRegex=/.../
      const regexMatch = hashOptionsStr.match(/startRegex=(.+?)(?:endRegex=(.+))?$/);
      if (regexMatch) {
          try {
              // Need to decode potential URI encoding if regex comes from path
              const startPattern = decodeURIComponent(regexMatch[1].trim());
              // Ensure regex slashes are handled correctly
              options.startRegex = new RegExp(startPattern.startsWith('/') && startPattern.endsWith('/') 
                ? startPattern.slice(1, -1) : startPattern);

              if (regexMatch[2]) {
                   const endPattern = decodeURIComponent(regexMatch[2].trim());
                   options.endRegex = new RegExp(endPattern.startsWith('/') && endPattern.endsWith('/') 
                    ? endPattern.slice(1, -1) : endPattern);
              } else {
                   logger.warn(1, `Only startRegex provided for ${hashOptionsStr}. Content will be included until the end of the file or the next logical section if endRegex is missing.`);
              }
          } catch (e) {
              throw new Error(`Invalid regex pattern in options: ${hashOptionsStr}. Error: ${e instanceof Error ? e.message : String(e)}`);
          }
      } else {
        throw new Error(`Invalid hash options format: ${hashOptionsStr}`);
      }
    }
  }
  
  // Parse the main include parameters (includeParamsStr)
  try {
    // Extract file path, style, and transform parameters
    // Handle both old format (just a file path) and new JSON-like format
    let includeParams: Partial<IncludeParams> = {}; // Use Partial as file might not be set initially
    let filePathFromParams: string | undefined = undefined;

    // Check if it's potentially a JSON-like format (contains ':' and ',')
    // or just a simple file path.
    if (includeParamsStr.includes(':') && includeParamsStr.includes(',')) {
      // New format - attempt to parse the JSON-like structure
      const paramsString = `{${includeParamsStr}}`;
      try {
        // Try to parse as JSON after some preprocessing
        const jsonLikeStr = paramsString
          .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":') // Ensure property names are quoted
          .replace(/'/g, '"'); // Replace single quotes with double quotes
        
        includeParams = JSON.parse(jsonLikeStr);
        if (typeof includeParams.file !== 'string' || !includeParams.file) {
            throw new Error('Missing or invalid "file" property in parameters');
        }
        filePathFromParams = includeParams.file.trim();
      } catch (e) {
        // If JSON parsing fails, it might be a filename with unusual characters.
        // Treat it as a simple path, but log a warning.
        logger.warn(0, `Could not parse include parameters as JSON-like: "${includeParamsStr}". Treating as simple path. Error: ${e instanceof Error ? e.message : String(e)}`);
        filePathFromParams = includeParamsStr.trim(); // Fallback to treating the whole string as path
        // Reset includeParams to avoid carrying over partial parse results
        includeParams = {}; 
      }
    } else {
      // Old format or simple path - the whole string is the file path
      filePathFromParams = includeParamsStr.trim();
    }
    
    // File path is required
    if (!filePathFromParams) {
      throw new Error('File path could not be determined from parameters');
    }

    // Process style if present in the parsed params (only for new format)
    if (includeParams.style) {
      const styleStr = includeParams.style.toLowerCase();
      if (!Object.values(StyleType).includes(styleStr as StyleType)) {
        throw new Error(`Invalid style: ${includeParams.style}. Valid styles are: ${Object.values(StyleType).join(', ')}`);
      }
      options.style = styleStr as StyleType;
    }
    
    // Process transform if present in the parsed params (only for new format)
    if (includeParams.transform) {
      options.transform = includeParams.transform;
    }

    // Return the options derived from both hash and main parameters
    return options;
  } catch (e) {
    // Catch errors specifically from the main parameter parsing logic
    throw new Error(`Error parsing main include parameters "${includeParamsStr}": ${e instanceof Error ? e.message : String(e)}`);
  }
}

// ... extractContent function remains the same ...
async function extractContent(filePath: string, options: IncludeOptions, indent: number): Promise<string> { // Add indent
  const currentIndent = indent;
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n');

    let start = 0;
    let end = lines.length;

    if (options.startLine !== undefined) {
      start = options.startLine - 1; // Line numbers are 1-based
      end = (options.endLine !== undefined ? options.endLine : lines.length);
      // Check bounds against actual lines length
      if (start < 0 || start >= lines.length || end > lines.length) {
          throw new Error(`Line numbers out of range (1-${lines.length}) for file ${filePath}: L${options.startLine}${options.endLine && options.endLine !== options.startLine ? '-L'+options.endLine : ''}`);
      }
       return lines.slice(start, end).join('\n');
    }

    if (options.startRegex) {
        const startIndex = lines.findIndex(line => options.startRegex!.test(line));
        if (startIndex === -1) {
            // Use logger.warn with indent
            logger.warn(currentIndent, `Start regex ${options.startRegex} not found in ${filePath}. Including entire file.`);
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
                 logger.warn(currentIndent, `End regex ${options.endRegex} not found after start regex in ${filePath}. Including content until the end.`);
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
             logger.warn(currentIndent, `Start and end regex resulted in empty or invalid content selection for ${filePath}. Returning empty string.`);
             return "";
         }

         return lines.slice(start, end).join('\n');
    }

    // Default: include the whole file if no specific options are given
    return content;
  } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
          throw new Error(`Included file not found: ${filePath}`);
      }
      // Re-throw other errors (parsing, range errors, etc.)
      throw error;
  }
}


/**
 * Apply style and transformations to the content.
 * @param content The raw included content.
 * @param options The include options containing style and transformation information.
 * @param indent The current indentation level for logging.
 * @returns The styled and transformed content.
 */
async function applyStyleAndTransformations(
  content: string, 
  options: IncludeOptions, 
  indent: number
): Promise<string> {
  const currentIndent = indent;
  let processedContent = content;
  
  // Apply transformations first, if any
  if (options.transform && Array.isArray(options.transform) && options.transform.length > 0) {
    logger.debug(currentIndent, `Applying ${options.transform.length} transformations to content`);
    
    // Process each transformation in sequence
    for (const transform of options.transform) {
      switch (transform.type) {
        case 'removeLines':
          if (Array.isArray(transform.lines)) {
            const lines = processedContent.split('\n');
            processedContent = lines
              .filter((_, index) => !transform.lines.includes(index))
              .join('\n');
            logger.debug(currentIndent, `Applied removeLines transformation, removed lines: ${transform.lines.join(', ')}`);
          }
          break;
          
        case 'removeRegex':
          if (typeof transform.pattern === 'string') {
            try {
              const regex = new RegExp(transform.pattern, transform.flags || 'g');
              const before = processedContent.length;
              processedContent = processedContent.replace(regex, '');
              const after = processedContent.length;
              logger.debug(currentIndent, `Applied removeRegex transformation, pattern: ${transform.pattern}, removed ${before - after} characters`);
            } catch (e) {
              logger.warn(currentIndent, `Invalid regex pattern in transformation: ${transform.pattern}, skipping`);
            }
          }
          break;
          
        case 'addPrefix':
          if (typeof transform.text === 'string') {
            processedContent = transform.text + processedContent;
            logger.debug(currentIndent, `Applied addPrefix transformation, added ${transform.text.length} characters`);
          }
          break;
          
        case 'addSuffix':
          if (typeof transform.text === 'string') {
            processedContent = processedContent + transform.text;
            logger.debug(currentIndent, `Applied addSuffix transformation, added ${transform.text.length} characters`);
          }
          break;
      }
    }
  }
  
  // Apply style if specified
  if (options.style && options.indentation) {
    const styleFn = styleHandlers[options.style];
    
    if (styleFn) {
      logger.debug(currentIndent, `Applying style '${options.style}' to content`);
      processedContent = styleFn(processedContent, options.indentation);
    } else {
      logger.warn(currentIndent, `Unknown style '${options.style}', using default (none)`);
    }
  }
  
  return processedContent;
}


// Processes a single prompt file content, resolving includes recursively
async function processContent(
    content: string,
    currentFilePath: string, // Absolute path of the file whose content is being processed
    indent: number, // Add indent parameter
    visitedPaths: Set<string> = new Set() // Track visited paths to prevent infinite loops
): Promise<string> {
    const currentIndent = indent; // Use local const
    const nextIndent = currentIndent + 1; // Indent for recursive calls

    const relativeCurrentPath = path.relative(process.cwd(), currentFilePath);
    logger.debug(currentIndent, `[processContent] Enter: ${relativeCurrentPath}, Visited: ${JSON.stringify(Array.from(visitedPaths))}`); // Log visited paths on entry

    // Create a new regex instance with the global flag for this specific call
    const localIncludeRegex = new RegExp(INCLUDE_REGEX_SOURCE, 'g');
    localIncludeRegex.lastIndex = 0; // Ensure it starts at 0

    let processedContent = content; // Use a different variable name to avoid confusion
    let lastIndex = 0; // Keep track of where the next search should start
    const segments: string[] = []; // Store processed segments

    let match;
    let loopCount = 0; // Add loop counter for debugging
    // Use the local regex instance here
    while ((match = localIncludeRegex.exec(processedContent)) !== null) {
        loopCount++;
        const matchStartIndex = match.index;
        const matchEndIndex = localIncludeRegex.lastIndex;
        logger.debug(currentIndent, `  [processContent] Loop ${loopCount}, Match found: "${match[0]}" at index ${matchStartIndex}, lastIndex before processing: ${lastIndex}`); // Use currentIndent

        // Correctly capture the parameters string from the regex match
        const [fullMatch, paramsStr] = match; // paramsStr contains everything after "include:"

        // Calculate line and column number of the match
        const linesUpToMatch = processedContent.substring(0, matchStartIndex).split('\n');
        const lineNumber = linesUpToMatch.length; // Line numbers are 1-based
        const lastNewlineIndex = processedContent.lastIndexOf('\n', matchStartIndex - 1);
        const columnNumber = matchStartIndex - (lastNewlineIndex === -1 ? -1 : lastNewlineIndex); // Column numbers are 1-based

        // Check if the match is preceded by "!"
        if (matchStartIndex > 0 && processedContent[matchStartIndex - 1] === '!') {
            logger.debug(currentIndent, `    [processContent] Escaped include found.`); // Use currentIndent
            // It's an escaped include.
            // Add the text segment before the '!'
            const segmentBefore = processedContent.substring(lastIndex, matchStartIndex - 1);
            logger.debug(currentIndent, `      [processContent] Adding segment before escape: "${segmentBefore.substring(0, 50)}..."`);
            if (matchStartIndex - 1 > lastIndex) {
                segments.push(segmentBefore);
            }
            // Add the literal directive (e.g., "{{include: ...}}") WITHOUT the preceding '!'
            logger.debug(currentIndent, `      [processContent] Adding escaped literal: "${fullMatch}"`);
            segments.push(fullMatch);
            // Update lastIndex to be after the escaped directive using the local regex
            lastIndex = matchEndIndex;
            logger.debug(currentIndent, `      [processContent] Updated lastIndex after escape: ${lastIndex}`);
            continue; // Skip normal processing for this match
        }

        // --- Proceed with normal processing if not escaped ---
        logger.debug(currentIndent, `    [processContent] Processing normal include.`); // Use currentIndent

        // Add the segment before the current match (if not escaped)
        const segmentBefore = processedContent.substring(lastIndex, matchStartIndex);
        logger.debug(currentIndent, `      [processContent] Adding segment before match: "${segmentBefore.substring(0,50)}..."`);
        segments.push(segmentBefore);

        let replacementText = '';
        // Reconstruct directive for error messages using paramsStr
        const directiveString = `{{include: ${paramsStr.trim()}}}`; 

        try {
            // Separate legacy hash options (#...) from the main parameters string
            let mainParamsPart = paramsStr.trim();
            let hashOptionsPart: string | undefined = undefined;
            const hashIndex = mainParamsPart.indexOf('#');

            if (hashIndex !== -1) {
                hashOptionsPart = mainParamsPart.substring(hashIndex + 1);
                mainParamsPart = mainParamsPart.substring(0, hashIndex);
                logger.debug(currentIndent, `      [processContent] Found legacy hash options: #${hashOptionsPart}`);
            }
            
            // Now parse the options using the separated parts
            logger.debug(currentIndent, `      [processContent] Parsing options from main part: ${mainParamsPart}`); // Use currentIndent
            const options = parseOptions(mainParamsPart, hashOptionsPart); // Pass both parts
            logger.debug(currentIndent, `      [processContent] Parsed options: ${JSON.stringify(options)}`); // Use currentIndent

            let includePath: string;
            if (mainParamsPart.includes(':') && mainParamsPart.includes(',')) { // Likely new format
                 let tempPath = mainParamsPart;
                 try {
                     const jsonLikeStr = `{${mainParamsPart}}`
                       .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":')
                       .replace(/'/g, '"');
                     const parsedParams = JSON.parse(jsonLikeStr);
                     if (!parsedParams.file || typeof parsedParams.file !== 'string') {
                         throw new Error('Missing or invalid "file" property in include parameters');
                     }
                     includePath = parsedParams.file.trim();
                 } catch (e) {
                     throw new Error(`Failed to extract file path from complex parameters: ${mainParamsPart}. Error: ${e instanceof Error ? e.message : String(e)}`);
                 }
            } else { // Simple path format
                includePath = mainParamsPart; // Already trimmed
            }

            if (!includePath) {
                 throw new Error('Could not determine include file path');
            }

            const currentFileDir = path.dirname(currentFilePath);
            logger.debug(currentIndent, `      [processContent] Resolving path: ${includePath} relative to ${path.relative(process.cwd(), currentFileDir)}`); // Use currentIndent
            const absoluteIncludePath = path.resolve(currentFileDir, includePath);
            const relativeIncludePath = path.relative(process.cwd(), absoluteIncludePath);
            logger.debug(currentIndent, `      [processContent] Absolute include path: ${relativeIncludePath}`); // Use currentIndent

            // Prevent infinite loops: check self-inclusion and circular inclusion
            if (absoluteIncludePath === currentFilePath) {
                const relativeFilePath = path.relative(process.cwd(), currentFilePath);
                const warnLocation = `${relativeFilePath}:${lineNumber}:${columnNumber}`; // Add column
                logger.warn(
                    currentIndent,
                    `Skipped self-inclusion: ${chalk.cyan(directiveString)}\n` +
                    `  in file: ${chalk.yellow(warnLocation)}`
                );
                replacementText = `<!-- Warning: Skipped self-inclusion of ${includePath} in ${relativeFilePath} -->`;
            } else if (visitedPaths.has(absoluteIncludePath)) {
                const relativeFilePath = path.relative(process.cwd(), currentFilePath);
                const warnLocation = `${relativeFilePath}:${lineNumber}:${columnNumber}`; // Add column
                logger.warn(
                    currentIndent,
                    `Skipped circular inclusion: ${chalk.cyan(directiveString)}\n` +
                    `  in file: ${chalk.yellow(warnLocation)}`
                );
                replacementText = `<!-- Warning: Skipped circular inclusion of ${includePath} in ${relativeFilePath} -->`;
            } else {
                logger.debug(currentIndent, `      [processContent] Adding to visited: ${relativeIncludePath}`); // Use currentIndent
                visitedPaths.add(absoluteIncludePath);
                logger.debug(currentIndent, `      [processContent] Calling extractContent for: ${relativeIncludePath}`); // Use currentIndent
                const includedContentRaw = await extractContent(absoluteIncludePath, options, nextIndent);
                logger.debug(currentIndent, `      [processContent] Raw included content length: ${includedContentRaw.length}`);
                logger.debug(currentIndent, `      [processContent] Calling processContent recursively for: ${relativeIncludePath}`); // Use currentIndent
                const processedIncludedContent = await processContent(includedContentRaw, absoluteIncludePath, nextIndent, visitedPaths);
                logger.debug(currentIndent, `      [processContent] Processed included content length: ${processedIncludedContent.length}`);
                logger.debug(currentIndent, `      [processContent] Applying style and transformations for: ${relativeIncludePath}`); // Use currentIndent
                replacementText = await applyStyleAndTransformations(processedIncludedContent, options, nextIndent);
                logger.debug(currentIndent, `      [processContent] Styled and transformed content length: ${replacementText.length}`);
                logger.debug(currentIndent, `      [processContent] Removing from visited: ${relativeIncludePath}`); // Use currentIndent
                visitedPaths.delete(absoluteIncludePath);
            }

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const relativeFilePath = path.relative(process.cwd(), currentFilePath);
            const errorLocation = `${relativeFilePath}:${lineNumber}:${columnNumber}`; // Add column
            logger.error(
                currentIndent,
                `Error processing include: ${chalk.cyan(directiveString)}\n` +
                `  in file: ${chalk.yellow(errorLocation)}\n` +
                `  Reason: ${chalk.white(errorMessage)}`
            );
            // Keep the HTML comment format for the output file
            // Use the originally extracted paramsStr for the error message, as includePath might not be defined if path extraction failed
            replacementText = `<!-- Error including ${paramsStr.trim()}: ${errorMessage} -->`;
        }

        logger.debug(currentIndent, `      [processContent] Adding replacement text (length ${replacementText.length}): "${replacementText.substring(0,50)}..."`);
        segments.push(replacementText);
        lastIndex = matchEndIndex;
        logger.debug(currentIndent, `      [processContent] Updated lastIndex after processing: ${lastIndex}`);

    }
    logger.debug(currentIndent, `  [processContent] Loop finished after ${loopCount} iterations.`); // Use currentIndent

    const finalSegment = processedContent.substring(lastIndex);
    logger.debug(currentIndent, `  [processContent] Adding final segment (length ${finalSegment.length}): "${finalSegment.substring(0,50)}..."`);
    segments.push(finalSegment);

    const finalResult = segments.join('');
    logger.debug(currentIndent, `[processContent] Exit: ${relativeCurrentPath}, Final length: ${finalResult.length}`); // Use currentIndent
    return finalResult;
}

// Main exported function: reads the initial file and starts processing
export async function processPromptFile(
    filePath: string,
    baseDir: string,
    indent: number // Add indent parameter
): Promise<string> {
    const currentIndent = indent; // Use local const
    const nextIndent = currentIndent + 1; // Indent for processContent

    try {
        const absoluteFilePath = path.isAbsolute(filePath) ? filePath : path.resolve(baseDir, filePath);
        const initialContent = await fs.readFile(absoluteFilePath, 'utf-8');
        return await processContent(initialContent, absoluteFilePath, nextIndent, new Set([absoluteFilePath])); // Add initial file to visited
    } catch (error) {
         const errorMessage = error instanceof Error ? error.message : String(error);
         logger.error(currentIndent, `Error reading initial file ${filePath}: ${errorMessage}`);
         if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
             return `<!-- Error reading file ${filePath}: File not found -->`;
         }
         return `<!-- Error reading file ${filePath}: ${errorMessage} -->`;
    }
}