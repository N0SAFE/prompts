import { Transformation } from '../types';
import { TransformationPlugin, ToUpperCaseParams } from './types'; // Import specific params type
import { logger } from '../../utils/logger';

export class ToUpperCaseTransformation implements TransformationPlugin {
    // Use generic params here, cast inside
    apply(content: string, params: ToUpperCaseParams): string {
        // Cast and validate (even if params are simple)
        const specificParams = params;
        if (specificParams.type !== 'toUpperCase') {
            logger.warn(0, 'Invalid params type for ToUpperCaseTransformation', params);
             // Still proceed, as no specific params are strictly needed for the core logic
        }
        return content.toUpperCase();
    }
}
