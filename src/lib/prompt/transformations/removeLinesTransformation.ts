import { Transformation } from '../types'; // Keep for base type reference if needed
import { TransformationPlugin, RemoveLinesParams } from './types'; // Use RemoveLinesParams
import { logger } from '../../utils/logger';

export class RemoveLinesTransformation implements TransformationPlugin {
    // Use generic params here, cast inside
    apply(content: string, params: RemoveLinesParams): string {
        // Cast and validate
        const specificParams = params;
        if (specificParams.type !== 'removeLines' || !Array.isArray(specificParams.lines)) {
            logger.warn(0, 'Invalid params for RemoveLinesTransformation', params);
            return content;
        }
        // Ensure all elements in lines are numbers (basic check)
        if (!specificParams.lines.every(l => typeof l === 'number' && l >= 0)) {
             logger.warn(0, 'Invalid line numbers in params for RemoveLinesTransformation. Must be non-negative numbers.', params);
             return content;
        }

        const linesToRemove = new Set(specificParams.lines);
        const lines = content.split('\n');
        // Filter out the lines whose 0-based index is in the set
        return lines
            .filter((_, index) => !linesToRemove.has(index))
            .join('\n');
    }
}
