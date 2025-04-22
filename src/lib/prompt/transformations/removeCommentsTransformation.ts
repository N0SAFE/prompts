import { Transformation } from '../types';
import { TransformationPlugin, RemoveCommentsParams } from './types'; // Import specific params type
import { logger } from '../../utils/logger';

export class RemoveCommentsTransformation implements TransformationPlugin {
    // Use generic params here, cast inside
    apply(content: string, params: RemoveCommentsParams): string {
        // Cast and validate
        const specificParams = params;
        if (specificParams.type !== 'removeComments') {
            logger.warn(0, 'Invalid params type for RemoveCommentsTransformation', params);
            // Decide on behavior: return content or proceed with defaults?
            // Let's proceed with defaults for now.
        }

        // Use validated/defaulted params
        const commentTypes = specificParams.commentTypes || ['html', 'js']; // Default types
        let result = content;

        if (commentTypes.includes('html')) {
            // Remove HTML comments <!-- ... -->
            result = result.replace(/<!--.*?-->/gs, '');
        }
        if (commentTypes.includes('js')) {
            // Remove single-line comments // ...
            result = result.replace(/\/\/.*$/gm, '');
            // Remove multi-line comments /* ... */
            // Ensure non-greedy match for nested or adjacent comments
            result = result.replace(/\/\*[\s\S]*?\*\//g, '');
        }
        // Add more comment types here if needed (e.g., python #)
        if (commentTypes.includes('python')) {
             result = result.replace(/#.*$/gm, '');
        }

        // Optional: Trim lines that become empty after comment removal
        if (specificParams.trimEmptyLines) {
            result = result.split('\n').filter(line => line.trim() !== '').join('\n');
        }

        return result;
    }
}
