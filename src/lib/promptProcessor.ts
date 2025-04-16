import * as fs from 'fs/promises';
import * as path from 'path';

// Allow more whitespace around path and options
const INCLUDE_REGEX = /{{\s*include\s*:\s*([^#]+?)\s*(?:#(.+?))?\s*}}/g;

interface IncludeOptions {
    startLine?: number;
    endLine?: number;
    startRegex?: RegExp;
    endRegex?: RegExp;
}

// ... parseOptions function remains the same ...
function parseOptions(optionsStr: string | undefined): IncludeOptions {
  const options: IncludeOptions = {};
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
    // Add check for startLine >= 1
    if (options.startLine < 1) {
         throw new Error(`Invalid start line number (must be >= 1): ${optionsStr}`);
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
            } else {
                 console.warn(`Warning: Only startRegex provided for ${optionsStr}. Content will be included until the end of the file or the next logical section if endRegex is missing.`);
            }
        } catch (e) {
            throw new Error(`Invalid regex pattern in options: ${optionsStr}. Error: ${e instanceof Error ? e.message : String(e)}`);
        }
        return options;
    }


  throw new Error(`Invalid include options format: ${optionsStr}`);
}


// ... extractContent function remains the same ...
async function extractContent(filePath: string, options: IncludeOptions): Promise<string> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n');

    let start = 0;
    let end = lines.length;

    if (options.startLine !== undefined) {
      start = options.startLine - 1; // Line numbers are 1-based
      end = (options.endLine !== undefined ? options.endLine : start + 1);
      // Check bounds against actual lines length
      if (start < 0 || start >= lines.length || end > lines.length) {
          throw new Error(`Line numbers out of range (1-${lines.length}) for file ${filePath}: L${options.startLine}${options.endLine && options.endLine !== options.startLine ? '-L'+options.endLine : ''}`);
      }
       return lines.slice(start, end).join('\n');
    }

    if (options.startRegex) {
        const startIndex = lines.findIndex(line => options.startRegex!.test(line));
        if (startIndex === -1) {
            throw new Error(`Start regex ${options.startRegex} not found in file ${filePath}`);
        }
        start = startIndex + 1; // Exclude the line matching startRegex

        if (options.endRegex) {
            // Search for endRegex *after* the startRegex match
            const endIndex = lines.slice(start).findIndex(line => options.endRegex!.test(line));
            if (endIndex === -1) {
                 console.warn(`Warning: End regex ${options.endRegex} not found after start regex in ${filePath}. Including content until the end.`);
                 end = lines.length; // Include until the end if endRegex is not found
            } else {
                end = start + endIndex; // Exclude the line matching endRegex
            }
        } else {
             end = lines.length; // Include until the end if no endRegex is provided
        }

         if (start > end) { // Allow start == end for empty selection
             console.warn(`Warning: Start and end regex resulted in empty content selection for ${filePath}.`);
             return ""; // Return empty string if the range is invalid or empty
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


// Processes a single prompt file content, resolving includes recursively
async function processContent(
    content: string,
    currentFilePath: string, // Absolute path of the file whose content is being processed
    visitedPaths: Set<string> = new Set() // Track visited paths to prevent infinite loops
): Promise<string> {
    let processedContent = content;
    let lastIndex = 0; // Keep track of where the next search should start
    const segments: string[] = []; // Store processed segments

    INCLUDE_REGEX.lastIndex = 0; // Reset regex state initially

    let match;
    while ((match = INCLUDE_REGEX.exec(processedContent)) !== null) {
        const [fullMatch, includePathStr, optionsStr] = match;
        const matchIndex = match.index;

        // Add the segment before the current match
        segments.push(processedContent.substring(lastIndex, matchIndex));

        // Check if the match is preceded by "## "
        if (matchIndex >= 3 && processedContent.substring(matchIndex - 3, matchIndex) === '## ') {
            // It's an escaped/commented-out include. Add the literal match text.
            segments.push(fullMatch);
            lastIndex = INCLUDE_REGEX.lastIndex; // Advance lastIndex past this literal match
            continue; // Skip to the next potential match
        }

        // --- Proceed with normal processing if not escaped ---
        let replacementText = '';
        const directiveString = `{{include: ${includePathStr.trim()}${optionsStr ? '#' + optionsStr.trim() : ''}}}`; // Reconstruct directive for error messages

        try {
            const includePath = includePathStr.trim();
            // --- Moved parseOptions inside try block ---
            const options = parseOptions(optionsStr?.trim());

            const currentFileDir = path.dirname(currentFilePath);
            // --- Ensure nested path resolution is relative to the CURRENT file's directory ---
            const absoluteIncludePath = path.resolve(currentFileDir, includePath);

            // Prevent infinite loops: check self-inclusion and circular inclusion
            if (absoluteIncludePath === currentFilePath) {
                console.warn(`Warning: Skipped self-inclusion in ${currentFilePath}`);
                replacementText = `<!-- Skipped self-inclusion: ${includePath} -->`;
            } else if (visitedPaths.has(absoluteIncludePath)) {
                 console.warn(`Warning: Skipped circular inclusion of ${absoluteIncludePath} in ${currentFilePath}`);
                 replacementText = `<!-- Skipped circular inclusion: ${includePath} -->`;
            } else {
                // Read and extract content
                const includedRawContent = await extractContent(absoluteIncludePath, options);

                // Recursively process the included content
                const newVisitedPaths = new Set(visitedPaths);
                newVisitedPaths.add(currentFilePath); // Add current file before recursing
                replacementText = await processContent(includedRawContent, absoluteIncludePath, newVisitedPaths);
            }

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`Error processing include "${directiveString}" in ${currentFilePath}: ${errorMessage}`);
            // Format error message consistently using the reconstructed directive string
            replacementText = `<!-- Error including ${includePathStr.trim()}${optionsStr ? '#' + optionsStr.trim() : ''}: ${errorMessage} -->`;
        }

        // Add the replacement text (processed content or error/warning)
        segments.push(replacementText);
        lastIndex = INCLUDE_REGEX.lastIndex; // Advance lastIndex past the processed match
    }

    // Add the remaining part of the string after the last match
    segments.push(processedContent.substring(lastIndex));

    return segments.join(''); // Join all segments to get the final processed content
}

// Main exported function: reads the initial file and starts processing
export async function processPromptFile(filePath: string, baseDir: string): Promise<string> {
    try {
        // Ensure filePath is absolute for consistency
        const absoluteFilePath = path.isAbsolute(filePath) ? filePath : path.resolve(baseDir, filePath);
        const initialContent = await fs.readFile(absoluteFilePath, 'utf-8');
        return await processContent(initialContent, absoluteFilePath, new Set([absoluteFilePath])); // Add initial file to visited
    } catch (error) {
         // Handle error reading the initial file
         const errorMessage = error instanceof Error ? error.message : String(error);
         console.error(`Error reading initial file ${filePath}: ${errorMessage}`);
         if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
             return `<!-- Error reading file ${filePath}: File not found -->`;
         }
         return `<!-- Error reading file ${filePath}: ${errorMessage} -->`;
    }
}