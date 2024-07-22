/**
 * Convert a string to human readable format
 * @example 'fooBarBaz' => 'Foo bar baz'
 * @example 'foo_bar_baz' => 'Foo bar baz'
 * @param name The name to convert
 */
export function convertName(name: string): string {
  return name
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .toLowerCase()
    .split(' ')
    .map((word, i) => i > 0 ? word : word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}