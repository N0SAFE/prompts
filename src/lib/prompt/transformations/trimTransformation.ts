import { Transformation } from '../types';
import { TransformationPlugin, TrimParams } from './types'; // Import specific params type
import { logger } from '../../utils/logger';

export class TrimTransformation implements TransformationPlugin {
    // Use generic params here, cast inside
    apply(content: string, params: TrimParams): string {
        // Cast and validate
        const specificParams = params;
        if (specificParams.type !== 'trim') {
            logger.warn(0, 'Invalid params type for TrimTransformation', params);
            // Fallback to default trim maybe? Or return content? Let's return content for safety.
            // return content; // Or default to trim()
        }

        const side = specificParams.side || 'both'; // Default to trimming both sides

        switch (side) {
            case 'start':
                return content.trimStart();
            case 'end':
                return content.trimEnd();
            case 'both':
            default:
                return content.trim();
        }
    }
}
