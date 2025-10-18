/**
 * Extracts the page key from a given pathname.
 * @param pathname The current pathname (e.g., from window.location.pathname).
 * @example /dashboard/home -> home
 * @example /table/users/ -> users
 * @returns The extracted page key.
 */
export function getPageKeyFromPathname(pathname: string): string {
  const cleanPathname = pathname.endsWith('/') && pathname.length > 1 ? pathname.slice(0, -1) : pathname;
  return cleanPathname.split('/').reverse()[0];
}