import fs from 'fs';
import path from 'path';
import { PackageManager } from "../models/packageManager";

/**
 * Detect the package manager used in a project
 */
export function detectPackageManager(projectPath: string = process.cwd()): PackageManager {
  const lockFiles: Record<string, PackageManager> = {
    'yarn.lock': 'yarn',
    'pnpm-lock.yaml': 'pnpm',
    'package-lock.json': 'npm',
  };

  for (const [lockFile, manager] of Object.entries(lockFiles)) {
    if (fs.existsSync(path.join(projectPath, lockFile))) {
      return manager;
    }
  }

  return 'npm';
}