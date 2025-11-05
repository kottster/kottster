/**
 * Extracts the page key from a given pathname.
 * @param pathname The current pathname (e.g., from window.location.pathname).
 * @example "/dashboard/home" -> "home"
 * @example "/table/users/"" -> "users"
 * @example "/-/data-sources" -> undefined
 * @returns The extracted page key.
 */
export function getPageKeyFromPathname(pathname: string): string | undefined {
  let cleanPathname = pathname;
  if (cleanPathname.endsWith('/') && cleanPathname.length > 1) {
    cleanPathname = cleanPathname.slice(0, -1);
  }
  if (cleanPathname.startsWith('/') && cleanPathname.length > 1) {
    cleanPathname = cleanPathname.slice(1);
  }
  const cleanPartnameParts = cleanPathname.split('/');
  
  // If page is special
  if (cleanPartnameParts[0] === '-') {
    return undefined;
  }
  
  return cleanPartnameParts[0];
}