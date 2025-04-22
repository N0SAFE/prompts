import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger, setLogLevel, getLogLevel, LogLevel } from '../../lib/utils/logger';
import chalk from 'chalk';

// Mock console methods
const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

// Disable chalk for testing to compare plain strings
chalk.level = 0;

describe('Logger', () => {
  beforeEach(() => {
    // Reset mocks and log level before each test
    vi.clearAllMocks();
    setLogLevel(LogLevel.DEBUG); // Default to highest level for testing all outputs
  });

  afterEach(() => {
    // Restore default log level if needed, though beforeEach handles it
  });

  it('should set and get log level correctly', () => {
    setLogLevel(LogLevel.WARN);
    expect(getLogLevel()).toBe(LogLevel.WARN);
    setLogLevel(LogLevel.INFO);
    expect(getLogLevel()).toBe(LogLevel.INFO);
  });

  describe('Logging Methods', () => {
    it('should log errors when level is ERROR or higher', () => {
      setLogLevel(LogLevel.ERROR);
      logger.error(0, 'Test error message');
      expect(consoleErrorSpy).toHaveBeenCalledWith('ERROR:', 'Test error message');
      logger.warn(0, 'Test warn message');
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('should log warnings when level is WARN or higher', () => {
      setLogLevel(LogLevel.WARN);
      logger.warn(1, 'Test warn', 'message');
      expect(consoleWarnSpy).toHaveBeenCalledWith('WARN:', 'Test warn message');
      logger.info(0, 'Test info message');
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should log info when level is INFO or higher', () => {
      setLogLevel(LogLevel.INFO);
      logger.info(2, 'Test info');
      expect(consoleLogSpy).toHaveBeenCalledWith('INFO:', 'Test info');
      logger.debug(0, 'Test debug message');
      // console.log is used for info and debug, so check it wasn't called again
      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    });

    it('should log debug when level is DEBUG', () => {
      setLogLevel(LogLevel.DEBUG);
      logger.debug(0, 'Test debug');
      expect(consoleLogSpy).toHaveBeenCalledWith('DEBUG:', 'Test debug');
    });

    it('should not log anything when level is NONE', () => {
      setLogLevel(LogLevel.NONE);
      logger.error(0, 'error');
      logger.warn(0, 'warn');
      logger.info(0, 'info');
      logger.debug(0, 'debug');
      logger.log(0, 'log');
      expect(consoleErrorSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should handle multiple arguments', () => {
      logger.info(0, 'Arg1', 'Arg2', 123);
      expect(consoleLogSpy).toHaveBeenCalledWith('INFO:', 'Arg1 Arg2 123');
    });

    // Indentation tests are implicitly covered by the logger implementation detail
    // but we can add a specific check if needed, though it requires inspecting the string format.
    // Testing indentation directly is brittle as it depends on internal formatting.

    it('should handle multi-line messages correctly (mocked console)', () => {
      // Note: The actual indentation logic happens *before* console.x is called.
      // We test the arguments passed to the mocked console.
      const multiLineMsg = 'Line 1\nLine 2';
      logger.info(1, multiLineMsg);
      // The logger internally joins lines with indentation before calling console.log
      // So the mocked console receives a single string argument (plus the prefix)
      expect(consoleLogSpy).toHaveBeenCalledWith('INFO:', 'Line 1\n    Line 2'); // Assuming 2 spaces + prefix space
    });

     it('logger.log should respect INFO level', () => {
      setLogLevel(LogLevel.WARN); // Set level below INFO
      logger.log(0, 'General log message');
      expect(consoleLogSpy).not.toHaveBeenCalled();

      setLogLevel(LogLevel.INFO);
      logger.log(0, 'General log message');
      expect(consoleLogSpy).toHaveBeenCalledWith('General log message');
    });
  });
});
