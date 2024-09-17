import { PackageManager } from "../models/packageManager"

/**
 * Get the command to run the dev script
 */
export function getRunDevCommand (packageManager: PackageManager): string {
  switch (packageManager) {
    case 'npm':
      return 'npm run dev'
    case 'yarn':
      return 'yarn dev'
    case 'pnpm':
      return 'pnpm dev'
    default:
      return 'npm run dev'
  }
}