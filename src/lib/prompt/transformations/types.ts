import { Transformation } from '../../styles/types'; // Keep for reference if needed, but options are now primary

/**
 * Interface for transformation plugins.
 * Each transformation logic will be implemented as a class adhering to this interface.
 */
export interface TransformationPlugin {
    /**
     * Applies the transformation logic to the content.
     * @param content The content string to transform.
     * @param options A dictionary containing the specific parameters for this transformation instance,
     *                derived from the object in the 'transform' array (e.g., { type: 'removeLines', lines: [1, 2] }).
     *                Implementations should cast and validate this object.
     * @returns The transformed content string.
     */
    apply(content: string, options: Record<string, any>): string;
}


export interface TransformationArguments {
    
}