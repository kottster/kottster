/**
 * Transforms a camelCase or snake_case string to a readable string.
 * @example transformToReadable('camelCase') => 'Camel case'
 * @example transformToReadable('snake_case') => 'Snake case'
 */
export function transformToReadable(text: string, capitalizeFirst: boolean = true): string {
  let result = text.replace(/([A-Z])/g, (match) => ' ' + match.toLowerCase()).trim();
  result = result.replace(/_/g, ' ').replace(/(\d+)/g, ' $1 ');
  result = result.replace(/\s+/g, ' ').trim();
  
  return capitalizeFirst ? result.charAt(0).toUpperCase() + result.slice(1) : result;
}