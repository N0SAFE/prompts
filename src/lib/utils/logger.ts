import chalk from 'chalk';

export enum LogLevel {
    NONE = 0,
    ERROR = 1,
    WARN = 2,
    INFO = 3,
    DEBUG = 4,
}

let currentLevel = LogLevel.WARN; // Default level
const INDENT_STRING = '  '; // Two spaces per indent level

export function setLogLevel(level: LogLevel): void {
    currentLevel = level;
}

export function getLogLevel(): LogLevel {
    return currentLevel;
}

// Helper to generate indentation string
function getIndentPrefix(indent: number): string {
    return INDENT_STRING.repeat(Math.max(0, indent));
}

export const logger = {
    error: (indent: number, ...args: any[]) => {
        if (currentLevel >= LogLevel.ERROR) {
            // Ensure multi-line messages are indented correctly
            const message = args.map(arg => 
                typeof arg === 'string' ? arg.split('\n').join('\n' + getIndentPrefix(indent) + '  ') : arg
            ).join(' ');
            console.error(chalk.red.bold('ERROR:'), message);
        }
    },
    warn: (indent: number, ...args: any[]) => {
        if (currentLevel >= LogLevel.WARN) {
            const message = args.map(arg => 
                typeof arg === 'string' ? arg.split('\n').join('\n' + getIndentPrefix(indent) + '  ') : arg
            ).join(' ');
            console.warn(chalk.yellow.bold('WARN:'), message);
        }
    },
    info: (indent: number, ...args: any[]) => {
        if (currentLevel >= LogLevel.INFO) {
            const message = args.map(arg => 
                typeof arg === 'string' ? arg.split('\n').join('\n' + getIndentPrefix(indent) + '  ') : arg
            ).join(' ');
            // Use console.log for info to avoid potential stderr/stdout mixing issues with progress bar
            console.log(chalk.blue.bold('INFO:'), message);
        }
    },
    debug: (indent: number, ...args: any[]) => {
        if (currentLevel >= LogLevel.DEBUG) {
            const message = args.map(arg => 
                typeof arg === 'string' ? arg.split('\n').join('\n' + getIndentPrefix(indent) + '  ') : arg
            ).join(' ');
            // Use console.log for debug to avoid potential stderr/stdout mixing issues with progress bar
            console.log(chalk.magenta.bold('DEBUG:'), message);
        }
    },
    log: (indent: number, ...args: any[]) => { // General log, respects INFO level
        if (currentLevel >= LogLevel.INFO) {
            const message = args.map(arg => 
                typeof arg === 'string' ? arg.split('\n').join('\n' + getIndentPrefix(indent) + '  ') : arg
            ).join(' ');
            console.log(message);
        }
    }
};
