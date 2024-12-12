/**
 * Removes trailing zeros from a number string.
 * @example removeTrailingZeros('123.45000000') // '123.45'
 * @param numStr - The number string to remove trailing zeros from.
 * @returns The number string without trailing zeros.
 */
export function removeTrailingZeros(numStr: string): string {
  // If there's no decimal point, return as is
  if (!numStr.includes('.')) {
      return numStr;
  }

  // Split into integer and decimal parts
  const [integerPart, decimalPart] = numStr.split('.');

  // If there's no decimal part, return just the integer
  if (!decimalPart) {
      return integerPart;
  }

  // Remove trailing zeros
  const trimmedDecimal = decimalPart.replace(/0+$/g, '');

  // If all decimal places were zeros, remove decimal point
  if (trimmedDecimal === '') {
    return integerPart;
  }

  // Reconstruct the number with decimal point
  return `${integerPart}.${trimmedDecimal}`;
}