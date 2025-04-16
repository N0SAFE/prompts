import * as fs from 'fs/promises';
import * as path from 'path';
import { glob } from 'glob';
import { processPromptFile } from './lib/promptProcessor';

const PROMPTS_DIR = path.resolve(__dirname, '../prompts'); // Input directory
const OUTPUT_DIR = path.resolve(__dirname, '../dist/prompts'); // Output directory

async function main() {
    try {
        // Ensure the output directory exists
        await fs.mkdir(OUTPUT_DIR, { recursive: true });
        console.log(`Output directory created or already exists: ${OUTPUT_DIR}`);

        // Find all markdown files in the prompts directory and its subdirectories
        const files = await glob('**/*.md', { cwd: PROMPTS_DIR, absolute: true });
        console.log(`Found ${files.length} prompt files to process.`);

        if (files.length === 0) {
            console.log(`No markdown files found in ${PROMPTS_DIR}. Exiting.`);
            return;
        }

        // Process each file
        for (const filePath of files) {
            console.log(`Processing: ${path.relative(PROMPTS_DIR, filePath)}`);
            try {
                const processedContent = await processPromptFile(filePath, PROMPTS_DIR);

                // Determine the output path, preserving the subdirectory structure
                const relativePath = path.relative(PROMPTS_DIR, filePath);
                const outputPath = path.join(OUTPUT_DIR, relativePath);

                // Ensure the subdirectory exists in the output directory
                await fs.mkdir(path.dirname(outputPath), { recursive: true });

                // Write the processed content to the output file
                await fs.writeFile(outputPath, processedContent, 'utf-8');
                console.log(` -> Output written to: ${path.relative(path.resolve(__dirname, '..'), outputPath)}`);

            } catch (error) {
                console.error(`Error processing file ${filePath}:`, error instanceof Error ? error.message : String(error));
                // Optionally, decide if you want to stop on error or continue
                // continue;
            }
        }

        console.log('\nPrompt processing finished.');

    } catch (error) {
        console.error('An unexpected error occurred during processing:', error);
        process.exit(1); // Exit with error code
    }
}

main();