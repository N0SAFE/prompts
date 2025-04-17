import { Transformation } from '../../styles/types';
import { TransformationPlugin } from './types';
import { logger } from '../../utils/logger';

export class ToLowerCaseTransformation implements TransformationPlugin {
    apply(content: string, params: Transformation): string {
        if (params.type !== 'toLowerCase') {
            logger.warn(0, 'Invalid params type for ToLowerCaseTransformation');
        }
        return content.toLowerCase();
    }
}
