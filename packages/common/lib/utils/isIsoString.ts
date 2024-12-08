const isoPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:?\d{2})?$/;

export function isIsoString(value: string): boolean {
  return isoPattern.test(value);
}