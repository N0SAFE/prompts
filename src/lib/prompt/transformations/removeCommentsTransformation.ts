import { Transformation } from '../../styles/types';
import { TransformationPlugin } from './types';
import { logger } from '../../utils/logger';

export class RemoveCommentsTransformation implements TransformationPlugin {
    apply(content: string, params: Transformation): string {
        if (params.type !== 'removeComments') {
            logger.warn(0, 'Invalid params type for RemoveCommentsTransformation');
        }

        const commentTypes = params.commentTypes || ['html', 'js']; // Default types
        let result = content;

        if (commentTypes.includes('html')) {
            // Remove HTML comments <!-- ... -->
            result = result.replace(/<!--.*?-->/gs, '');
        }
        if (commentTypes.includes('js')) {
            // Remove single-line comments // ...
            result = result.replace(/\/\/.*$/gm, '');
            // Remove multi-line comments /* ... */
            result = result.replace(/\/\*[\s\S]*?\*\//g, '');
        }
        // Add more comment types here if needed (e.g., python #)
        // if (commentTypes.includes('python')) {
        //     result = result.replace(/#.*$/gm, '');
        // }

        // Optional: Trim lines that become empty after comment removal
        if (params.trimEmptyLines) {
            result = result.split('\n').filter(line => line.trim() !== '').join('\n');
        }

        return result;
    }
}
