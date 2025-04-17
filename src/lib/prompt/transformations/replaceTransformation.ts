import { Transformation } from '../../styles/types';
import { TransformationPlugin } from './types';
import { logger } from '../../utils/logger';

export class ReplaceTransformation implements TransformationPlugin {
    apply(content: string, params: Transformation): string {
        if (
            params.type !== 'replace' ||
            typeof params.pattern !== 'string' ||
            typeof params.replacement !== 'string'
        ) {
            logger.warn(0, 'Invalid params for ReplaceTransformation');
            return content;
        }

        try {
            // If pattern looks like /regex/flags, parse it
            const regexMatch = params.pattern.match(/^\/(.+)\/([gimyus]*)$/);
            if (regexMatch) {
                const regex = new RegExp(regexMatch[1], regexMatch[2] || params.flags);
                return content.replace(regex, params.replacement);
            } else {
                // Treat as a simple string replacement (only first occurrence by default)
                // Or use flags if provided (e.g., 'g' for global)
                if (params.flags?.includes('g')) {
                     // Need to escape special regex characters if treating as literal string for global replace
                     const escapedPattern = params.pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                     const regex = new RegExp(escapedPattern, params.flags);
                     return content.replace(regex, params.replacement);
                } else {
                    return content.replace(params.pattern, params.replacement);
                }
            }
        } catch (e) {
            const errorMsg = e instanceof Error ? e.message : String(e);
            logger.error(0, `Invalid pattern/regex in ReplaceTransformation: ${params.pattern}. Error: ${errorMsg}`);
            return content;
        }
    }
}
