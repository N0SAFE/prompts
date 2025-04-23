import * as fs from 'fs/promises';
import * as path from 'path';
import { PromptProcessor } from './lib/prompt/processor'; // Import the class
import { minifyPromptContent } from './lib/prompt/minifier'; // Updated path
import { glob } from 'glob';
import * as cliProgress from 'cli-progress';
import chalk from 'chalk';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { logger, setLogLevel, LogLevel, getLogLevel } from './lib/utils/logger'; // Import logger

// Define base directories
const baseDir = path.resolve(__dirname, '..'); // Project root
const promptsDir = path.join(baseDir, 'prompts');
const buildDir = path.join(baseDir, 'build');
const processedDir = path.join(buildDir, 'processed');
const minifiedDir = path.join(buildDir, 'minified');

/**
 * Ensures a directory exists, creating it if necessary.
 * @param dirPath The path of the directory to ensure exists.
 */
async function ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
        await fs.mkdir(dirPath, { recursive: true });
    } catch (error: any) {
        if (error.code !== 'EEXIST') {
            throw error; // Re-throw if it's not a "directory already exists" error
        }
    }
}

/**
 * Finds all prompt files (.md) in the prompts directory, excluding ai-generated.
 * @returns A promise that resolves to an array of absolute file paths.
 */
async function findPromptFiles(): Promise<string[]> {
    // Construct the pattern using path.join for OS compatibility
    let pattern = path.join(promptsDir, '**', '*.md');

    // Glob expects POSIX-style paths, even on Windows. Convert backslashes.
    pattern = pattern.replace(/\\/g, '/'); // Correctly escape backslash for regex within string

    return await glob(pattern, { ignore: [], absolute: true });
}

/**
 * Builds a single prompt file and updates the progress bar.
 * @param filePath Absolute path to the prompt file.
 * @param indent Current indentation level for logging.
 * @param progressBar The global progress bar instance.
 * @param promptProcessor Instance of PromptProcessor.
 */
async function buildPrompt(
    filePath: string,
    indent: number,
    promptProcessor: PromptProcessor, // Add promptProcessor parameter
    progressBar?: cliProgress.SingleBar
): Promise<void> {
    const currentIndent = indent; // Use a local const for clarity
    const relativeFilePath = path.relative(baseDir, filePath);
    logger.debug(currentIndent, `Starting processing: ${relativeFilePath}`);
    progressBar?.update({ filename: relativeFilePath });

    try {
        // Use the processor instance
        const processedContent = await promptProcessor.processFile(filePath, currentIndent + 1);

        // 2. Determine output paths
        const processedOutputPath = path.join(processedDir, relativeFilePath);
        const minifiedOutputPath = path.join(minifiedDir, relativeFilePath);

        // 3. Ensure output directories exist
        await ensureDirectoryExists(path.dirname(processedOutputPath));
        await ensureDirectoryExists(path.dirname(minifiedOutputPath));

        // 4. Write processed content
        await fs.writeFile(processedOutputPath, processedContent, 'utf-8');

        // 5. Minify and write minified content
        const minifiedContent = minifyPromptContent(processedContent);
        await fs.writeFile(minifiedOutputPath, minifiedContent, 'utf-8');

        progressBar?.increment();
        logger.debug(currentIndent, `Finished processing: ${relativeFilePath}`);

    } catch (error) {
        progressBar?.stop();
        // Error is logged within processPromptFile using the logger with its own indent
        throw error;
    }
}

/**
 * Main build function.
 */
async function build(): Promise<void> {
    const initialIndent = 0; // Define initial indent level

    // --- Argument Parsing --- (Moved inside async function)
    const argv = await yargs(hideBin(process.argv))
        .option('log-level', {
            alias: 'l',
            type: 'string',
            description: 'Set logging level',
            choices: ['none', 'error', 'warn', 'info', 'debug'],
            default: 'warn', // Default level
        })
        .help()
        .alias('help', 'h')
        .argv;

    // --- Set Log Level ---
    const logLevelKey = argv.logLevel.toUpperCase() as keyof typeof LogLevel;
    const selectedLogLevel = LogLevel[logLevelKey];
    setLogLevel(selectedLogLevel);
    logger.info(initialIndent, `Log level set to: ${argv.logLevel.toUpperCase()}`);
    // --- End Log Level Setting ---

    // Instantiate the PromptProcessor once
    const promptProcessor = new PromptProcessor(baseDir);

    logger.info(initialIndent, 'Starting prompt build process...'); // Use initialIndent

    // Clean/Create build directories
    await fs.rm(buildDir, { recursive: true, force: true });
    await ensureDirectoryExists(processedDir);
    await ensureDirectoryExists(minifiedDir);
    logger.info(initialIndent, 'Build directories cleaned/created.'); // Use initialIndent

    // Find prompt files
    const promptFiles = await findPromptFiles();
    logger.info(initialIndent, `Found ${promptFiles.length} prompt files to process.`); // Use initialIndent

    if (promptFiles.length === 0) {
        logger.warn(initialIndent, 'No prompt files found to build.'); // Use initialIndent
        return;
    }

    // Initialize the progress bar only if log level is INFO or lower
    let progressBar: cliProgress.SingleBar | undefined;
    if (getLogLevel() <= LogLevel.INFO) {
        progressBar = new cliProgress.SingleBar({
            format: `Building | ${chalk.cyan('{bar}')} | {percentage}% || {value}/{total} Files || Current: {filename}`,
            barCompleteChar: '\u2588',
            barIncompleteChar: '\u2591',
            hideCursor: true,
            etaBuffer: 100,
            clearOnComplete: getLogLevel() < LogLevel.INFO,
            stream: process.stderr
        });
        progressBar.start(promptFiles.length, 0, { filename: "N/A" });
    }

    try {
        // Process each file sequentially
        for (const file of promptFiles) {
            logger.debug(initialIndent, `Looping for file: ${path.relative(baseDir, file)}`); // Use initialIndent
            // Pass initialIndent + 1 for the buildPrompt level and the processor instance
            await buildPrompt(file, initialIndent + 1, promptProcessor, progressBar);
            logger.debug(initialIndent, `Completed await for: ${path.relative(baseDir, file)}`); // Use initialIndent
        }
        progressBar?.stop();
        logger.info(initialIndent, chalk.green('\nPrompt build process finished successfully.')); // Use initialIndent
    } catch (error) {
        progressBar?.stop();
        // Use initialIndent for the final failure message
        logger.error(initialIndent, chalk.red.bold('\nPrompt build process failed.'));
        process.exit(1);
    }
}

// Execute the build
build();
