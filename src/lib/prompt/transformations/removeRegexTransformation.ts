import { Transformation } from '../../styles/types';
import { TransformationPlugin } from './types';
import { logger } from '../../utils/logger';

export class RemoveRegexTransformation implements TransformationPlugin {
    apply(content: string, params: Transformation): string {
        if (params.type !== 'removeRegex' || typeof params.pattern !== 'string') {
            logger.warn(0, 'Invalid params for RemoveRegexTransformation');
            return content;
        }

        try {
            const regex = new RegExp(params.pattern, params.flags || 'g');
            return content.replace(regex, '');
        } catch (e) {
            const errorMsg = e instanceof Error ? e.message : String(e);
            logger.error(0, `Invalid regex pattern in RemoveRegexTransformation: ${params.pattern}. Error: ${errorMsg}`);
            return content; // Return original content on invalid regex
        }
    }
}
