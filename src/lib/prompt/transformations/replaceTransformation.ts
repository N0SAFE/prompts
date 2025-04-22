import { Transformation } from '../types';
import { TransformationPlugin, ReplaceParams } from './types'; // Import specific params type
import { logger } from '../../utils/logger'; // Import logger

export class ReplaceTransformation implements TransformationPlugin {
    // Use generic params here, cast inside
    apply(content: string, params: ReplaceParams): string {
        // Cast and validate
        const specificParams = params;
        if (
            specificParams.type !== 'replace' ||
            typeof specificParams.pattern !== 'string' ||
            typeof specificParams.replacement !== 'string'
        ) {
            logger.warn(0, 'Invalid params for ReplaceTransformation', params);
            return content;
        }

        try {
            // If pattern looks like /regex/flags, parse it
            const regexMatch = specificParams.pattern.match(/^\/(.+)\/([gimyus]*)$/);
            if (regexMatch) {
                const regex = new RegExp(regexMatch[1], regexMatch[2] || specificParams.flags);
                return content.replace(regex, specificParams.replacement);
            } else {
                // Treat as a simple string replacement (only first occurrence by default)
                // Or use flags if provided (e.g., 'g' for global)
                if (specificParams.flags?.includes('g')) {
                     // Need to escape special regex characters if treating as literal string for global replace
                     const escapedPattern = specificParams.pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                     const regex = new RegExp(escapedPattern, specificParams.flags);
                     return content.replace(regex, specificParams.replacement);
                } else {
                    // Default: replace only first occurrence of the literal string
                    return content.replace(specificParams.pattern, specificParams.replacement);
                }
            }
        } catch (e) {
            const errorMsg = e instanceof Error ? e.message : String(e);
            logger.error(0, `Invalid pattern/regex in ReplaceTransformation: ${specificParams.pattern}. Error: ${errorMsg}`);
            return content;
        }
    }
}
