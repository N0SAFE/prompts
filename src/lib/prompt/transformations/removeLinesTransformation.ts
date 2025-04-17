import { Transformation } from '../../styles/types'; // Keep for base type reference if needed
import { TransformationPlugin } from './types';
import { logger } from '../../utils/logger';

/**
 * Defines the specific options expected by the RemoveLinesTransformation.
 */
export interface RemoveLinesOptions {
    type: 'removeLines';
    lines: number[]; // Array of 0-based line indices to remove
}

export class RemoveLinesTransformation implements TransformationPlugin {
    apply(content: string, options: RemoveLinesOptions): string {
        if (options.type !== 'removeLines' || !Array.isArray(options.lines)) {
            logger.warn(0, 'Invalid options for RemoveLinesTransformation', options);
            return content;
        }
        // Ensure all elements in lines are numbers (basic check)
        if (!options.lines.every(l => typeof l === 'number' && l >= 0)) {
             logger.warn(0, 'Invalid line numbers in options for RemoveLinesTransformation. Must be non-negative numbers.', options);
             return content;
        }

        const linesToRemove = new Set(options.lines);
        const lines = content.split('\n');
        // Filter out the lines whose 0-based index is in the set
        return lines
            .filter((_, index) => !linesToRemove.has(index))
            .join('\n');
    }
}
