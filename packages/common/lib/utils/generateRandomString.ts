export function generateRandomString(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_';
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  
  return Array.from(bytes)
    .map(byte => chars[byte % chars.length])
    .join('');
}