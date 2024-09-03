/**
 * Transforms a string to camel case variable name.
 * @returns The camel case string (e.g. '123 hello world 234?' -> 'helloWorld234')
 */
export function transformToCamelCaseVarName(input: string): string {
  return input
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, char) => char.toUpperCase())
    .replace(/^[^a-zA-Z]+/, '')
    .replace(/^[A-Z]/, char => char.toLowerCase());
}