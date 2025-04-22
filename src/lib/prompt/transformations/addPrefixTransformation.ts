import { Transformation } from '../types';
import { TransformationPlugin, AddPrefixParams } from './types'; // Import specific params type
import { logger } from '../../utils/logger';

export class AddPrefixTransformation implements TransformationPlugin {
    // Use generic params here, cast inside
    apply(content: string, params: AddPrefixParams): string {
        // Cast and validate
        const specificParams = params;
        if (specificParams.type !== 'addPrefix' || typeof specificParams.text !== 'string') {
            logger.warn(0, 'Invalid params for AddPrefixTransformation', params);
            return content;
        }
        return specificParams.text + content;
    }
}
