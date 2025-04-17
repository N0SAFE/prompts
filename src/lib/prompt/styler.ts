// filepath: /home/sebille/Bureau/projects/tests/prompts/src/lib/promptProcessor/styler.ts
import { logger } from '../utils/logger';
import { styleHandlers } from '../styles'; // Assuming styles exports this
import { IncludeOptions } from './types';
import { NEWLINE, WARN_UNKNOWN_STYLE } from './constants';

/**
 * Apply style and transformations to the content.
 * @param content The raw included content.
 * @param options The include options containing style and transformation information.
 * @param indent The current indentation level for logging.
 * @returns The styled and transformed content.
 */
export async function applyStyleAndTransformations(
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
            const lines = processedContent.split(NEWLINE);
            processedContent = lines
              .filter((_, index) => !transform.lines.includes(index))
              .join(NEWLINE);
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
      logger.warn(currentIndent, WARN_UNKNOWN_STYLE(options.style));
    }
  }

  return processedContent;
}
