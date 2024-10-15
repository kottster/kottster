import inquirer from 'inquirer';
import { PackageManager } from '../models/packageManager';

interface ProjectSetup {
  packageManager: PackageManager;
  skipPackageInstallation: boolean;
  useTypeScript: boolean;
}

/**
 * Collect the setup for a new project
 */
export async function collectNewProjectData(): Promise<ProjectSetup> {
  const result = await inquirer.prompt([
    {
      type: 'list',
      name: 'language',
      message: 'Will you be using TypeScript or JavaScript?',
      choices: ['TypeScript', 'JavaScript'],
    },
    {
      type: 'list',
      name: 'packageManager',
      message: 'Which package manager would you like to use?',
      choices: ['npm', 'yarn', 'pnpm', 'skip installation'],
    },
  ]);

  return {
    packageManager: result.packageManager === 'skip installation' ? 'npm' : result.packageManager,
    skipPackageInstallation: result.packageManager === 'skip installation',
    useTypeScript: result.language === 'TypeScript'
  }
}