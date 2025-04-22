import { Transformation } from '../types';
import { TransformationPlugin, SliceParams } from './types'; // Import specific params type
import { logger } from '../../utils/logger';

export class SliceTransformation implements TransformationPlugin {
    // Use generic params here, cast inside
    apply(content: string, params: SliceParams): string {
        // Cast and validate
        const specificParams = params;
        if (specificParams.type !== 'slice') {
            logger.warn(0, 'Invalid params type for SliceTransformation', params);
            return content;
        }

        // Use validated params
        const start = typeof specificParams.start === 'number' ? specificParams.start : undefined;
        const end = typeof specificParams.end === 'number' ? specificParams.end : undefined;

        // Basic validation (optional, as .slice handles many cases)
        if (start !== undefined && start < 0) {
            logger.warn(0, `SliceTransformation: Start index ${start} is negative. Behavior depends on JS slice implementation.`);
            // JS slice handles negative start index correctly (counts from end)
        }
        if (end !== undefined && start !== undefined && end < start) {
             logger.warn(0, `SliceTransformation: End index ${end} is less than start index ${start}. Result will be empty.`);
             // Slice handles this naturally, but warning is good
        }

        return content.slice(start, end);
    }
}
