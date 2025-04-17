import { Transformation } from '../../styles/types';
import { TransformationPlugin } from './types';
import { logger } from '../../utils/logger';

export class TrimTransformation implements TransformationPlugin {
    apply(content: string, params: Transformation): string {
        if (params.type !== 'trim') {
            logger.warn(0, 'Invalid params type for TrimTransformation');
        }

        const side = params.side || 'both'; // Default to trimming both sides

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
