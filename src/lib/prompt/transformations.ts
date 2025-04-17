import { Transformation } from '../styles/types'; // Keep this for the input type
import { transformationRegistry } from './transformations/index'; // Import the registry
import { logger } from '../utils/logger';

/**
 * Applies the specified transformations to the included content using a plugin system.
 *
 * @param content The content to transform
 * @param transforms Array of transformation operations to apply
 * @returns The transformed content
 */
export function applyTransformations(content: string, transforms: Transformation[] | null | undefined): string {
    if (!transforms || transforms.length === 0) {
        return content; // No transformations to apply
    }

    let result = content;

    // Apply each transformation in sequence using the registry
    for (const transform of transforms) {
        const plugin = transformationRegistry[transform.type];

        if (plugin) {
            try {
                result = plugin.apply(result, transform);
            } catch (e) {
                const errorMsg = e instanceof Error ? e.message : String(e);
                logger.error(0, `Error applying transformation type '${transform.type}': ${errorMsg}`);
                // Optionally decide whether to stop processing or continue with next transform
                // For now, we continue processing subsequent transformations
            }
        } else {
            logger.warn(0, `Unknown transformation type encountered: '${transform.type}'. Skipping.`);
        }
    }

    return result;
}
