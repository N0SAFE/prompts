import { Transformation } from '../types';
import { TransformationPlugin, RemoveRegexParams } from './types'; // Import specific params type
import { logger } from '../../utils/logger';

export class RemoveRegexTransformation implements TransformationPlugin {
    // Use generic params here, cast inside
    apply(content: string, params: RemoveRegexParams): string {
        // Cast and validate
        const specificParams = params;
        if (specificParams.type !== 'removeRegex' || typeof specificParams.pattern !== 'string') {
            logger.warn(0, 'Invalid params for RemoveRegexTransformation', params);
            return content;
        }

        try {
            const regex = new RegExp(specificParams.pattern, specificParams.flags || 'g');
            return content.replace(regex, '');
        } catch (e) {
            const errorMsg = e instanceof Error ? e.message : String(e);
            logger.error(0, `Invalid regex pattern in RemoveRegexTransformation: ${specificParams.pattern}. Error: ${errorMsg}`);
            return content; // Return original content on invalid regex
        }
    }
}
