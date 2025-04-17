import { Transformation } from '../../styles/types';
import { TransformationPlugin } from './types';
import { logger } from '../../utils/logger';

export class AddSuffixTransformation implements TransformationPlugin {
    apply(content: string, params: Transformation): string {
        if (params.type !== 'addSuffix' || typeof params.text !== 'string') {
            logger.warn(0, 'Invalid params for AddSuffixTransformation');
            return content;
        }
        return content + params.text;
    }
}
