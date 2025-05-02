/**
 * Transforms a string to kebab case variable name.
 * @returns The kebab case string (e.g. '123 hello world 234?' -> 'hello-world-234')
 */
export function transformToKebabCase(input: string): string {
  return input
    .replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`)
    .replace(/[^a-zA-Z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    .trim();
}