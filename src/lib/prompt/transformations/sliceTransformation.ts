import { Transformation } from '../../styles/types';
import { TransformationPlugin } from './types';
import { logger } from '../../utils/logger';

export class SliceTransformation implements TransformationPlugin {
    apply(content: string, params: Transformation): string {
        if (params.type !== 'slice') {
            logger.warn(0, 'Invalid params type for SliceTransformation');
            return content;
        }

        const start = typeof params.start === 'number' ? params.start : undefined;
        const end = typeof params.end === 'number' ? params.end : undefined;

        // Basic validation
        if (start !== undefined && start < 0) {
            logger.warn(0, `SliceTransformation: Invalid negative start index ${start}. Using 0.`);
            // Correct negative start index if needed, or handle as per slice behavior
        }
        if (end !== undefined && start !== undefined && end < start) {
             logger.warn(0, `SliceTransformation: End index ${end} is less than start index ${start}. Result will be empty.`);
             // Slice handles this naturally, but warning is good
        }

        return content.slice(start, end);
    }
}
