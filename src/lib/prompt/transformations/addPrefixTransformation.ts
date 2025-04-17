import { Transformation } from '../../styles/types';
import { TransformationPlugin } from './types';
import { logger } from '../../utils/logger';

export class AddPrefixTransformation implements TransformationPlugin {
    apply(content: string, params: Transformation): string {
        if (params.type !== 'addPrefix' || typeof params.text !== 'string') {
            logger.warn(0, 'Invalid params for AddPrefixTransformation');
            return content;
        }
        return params.text + content;
    }
}
