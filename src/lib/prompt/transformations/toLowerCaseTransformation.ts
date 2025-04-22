import { Transformation } from '../types';
import { TransformationPlugin, ToLowerCaseParams } from './types'; // Import specific params type
import { logger } from '../../utils/logger';

export class ToLowerCaseTransformation implements TransformationPlugin {
    // Use generic params here, cast inside
    apply(content: string, params: ToLowerCaseParams): string {
        // Cast and validate (even if params are simple)
        const specificParams = params;
        if (specificParams.type !== 'toLowerCase') {
            logger.warn(0, 'Invalid params type for ToLowerCaseTransformation', params);
            // Still proceed, as no specific params are strictly needed for the core logic
        }
        return content.toLowerCase();
    }
}
