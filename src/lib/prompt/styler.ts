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
