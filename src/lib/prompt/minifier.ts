/**
 * Minifies prompt content by removing comments and collapsing whitespace.
 * @param content The prompt content string.
 * @returns The minified content string.
 */
export function minifyPromptContent(content: string): string {
  // Remove HTML-style comments
  let minified = content.replace(/<!--.*?-->/gs, '');
  // replace all line returns with a \n character
  minified = minified.replace(/\r?\n/g, '\\n');
  // Replace multiple whitespace characters (including newlines) with a single space
  minified = minified.replace(/\s+/g, ' ');
  // Trim leading/trailing whitespace
  return minified.trim();
}
