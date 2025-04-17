import { Transformation } from '../../styles/types';
import { TransformationPlugin } from './types';
import { logger } from '../../utils/logger';

export class ToUpperCaseTransformation implements TransformationPlugin {
    apply(content: string, params: Transformation): string {
        if (params.type !== 'toUpperCase') {
            // This check might seem redundant if called via registry,
            // but good practice for direct use or testing.
            logger.warn(0, 'Invalid params type for ToUpperCaseTransformation');
            // No specific params needed for this type, so we proceed.
        }
        return content.toUpperCase();
    }
}
