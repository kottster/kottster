/**
 * Removes leading whitespace from each line of a template string.
 * @param str The string
 * @returns The string with leading whitespace removed
 */
export function stripIndent(str: string): string {
  const match = str.match(/^[ \t]*(?=\S)/gm);
  if (!match) return str;

  const indent = Math.min(...match.map(x => x.length));
  const re = new RegExp(`^[ \\t]{${indent}}`, 'gm');
  return str.replace(re, '').trim();
}