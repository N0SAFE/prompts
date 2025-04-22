import { Transformation } from '../types';
import { TransformationPlugin, AddSuffixParams } from './types'; // Import specific params type
import { logger } from '../../utils/logger';

export class AddSuffixTransformation implements TransformationPlugin {
    // Use generic params here, cast inside
    apply(content: string, params: AddSuffixParams): string {
         // Cast and validate
        const specificParams = params;
        if (specificParams.type !== 'addSuffix' || typeof specificParams.text !== 'string') {
            logger.warn(0, 'Invalid params for AddSuffixTransformation', params);
            return content;
        }
        return content + specificParams.text;
    }
}
