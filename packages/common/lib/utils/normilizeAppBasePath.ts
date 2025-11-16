/**
 * Normalize the application base path.
 * @param basePath The base path to normalize
 * @example normalizeAppBasePath('admin') // returns '/admin/'
 * @example normalizeAppBasePath('/admin') // returns '/admin/'
 * @example normalizeAppBasePath('admin/') // returns '/admin/'
 * @example normalizeAppBasePath('/admin/') // returns '/admin/'
 * @returns The normalized base path
 */
export function normalizeAppBasePath(basePath: string | undefined): string {
  if (!basePath || basePath === '/') {
    return '/';
  }

  if (!basePath.startsWith('/')) {
    basePath = `/${basePath}`;
  }

  if (!basePath.endsWith('/')) {
    basePath = `${basePath}/`;
  }

  return basePath;
}