import path from 'path';
import fs from 'fs';

/**
 * Check if tsconfig.json exists in the given directory
 * @description Used to check if the project is a typescript project
 * @param dir The directory to check
 * @returns True if tsconfig.json exists in the directory
 */
export function checkTsUsage(dir: string = process.cwd()): boolean {
  return fs.existsSync(path.join(dir, 'tsconfig.json'));
}