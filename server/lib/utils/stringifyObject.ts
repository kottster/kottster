/**
 * Stringifies an object with single quotes and no double quotes.
 * @param obj The object to stringify
 * @param indent The indentation to use
 */
export function stringifyObject(obj: any, indent: string = ''): string {
  try {
    const replacer = (key: string, value: any) => {
      if (typeof value === 'string') {
        return `'${value.replace(/'/g, "\\'")}'`;
      }
      return value;
    };

    const lines = JSON.stringify(obj, replacer, 2).split('\n');
    const indentedLines = lines.map((line, index) => {
      if (index === 0) {
        return line;
      }
      return indent + line;
    });

    return indentedLines.join('\n').replace(/"([^"]+)":/g, '$1:').replace(/"'/g, "'").replace(/'"/g, "'");
  } catch (error) {
    console.error('Error stringifying object:', error);
    return '';
  }
}