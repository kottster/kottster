/**
 * Extracts the page key from a given pathname.
 * @param pathname The current pathname (e.g., from window.location.pathname).
 * @param basePathToRemove Optional base path to remove before extracting the page key.
 * @example "/users/" -> "users"
 * @example "/admin/users/" with basePathToRemove "/admin" -> "users"
 * @example "/dashboard/home" -> "home"
 * @example "/table/users/"" -> "users"
 * @example "/-/data-sources" -> undefined
 * @returns The extracted page key.
 */
export function getPageKeyFromPathname(
  pathname: string,
  basePathToRemove?: string
): string | undefined {
  let cleanPathname = pathname;
  
  // Remove base path if provided
  if (basePathToRemove) {
    let normalizedBasePath = basePathToRemove;
    if (normalizedBasePath.endsWith('/')) {
      normalizedBasePath = normalizedBasePath.slice(0, -1);
    }
    if (!normalizedBasePath.startsWith('/')) {
      normalizedBasePath = '/' + normalizedBasePath;
    }
    
    // Remove base path from pathname if it starts with it
    if (cleanPathname.startsWith(normalizedBasePath)) {
      cleanPathname = cleanPathname.slice(normalizedBasePath.length);
      if (!cleanPathname.startsWith('/')) {
        cleanPathname = '/' + cleanPathname;
      }
    }
  }
  
  // Remove trailing slash
  if (cleanPathname.endsWith('/') && cleanPathname.length > 1) {
    cleanPathname = cleanPathname.slice(0, -1);
  }
  
  // Remove leading slash
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