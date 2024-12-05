import inquirer from 'inquirer';
import { PackageManager } from '../models/packageManager';
import { Answers } from 'inquirer/dist/cjs/types/types';

interface ProjectSetup {
  projectName?: string;
  packageManager: PackageManager;
  skipPackageInstallation: boolean;
  useTypeScript: boolean;
}

/**
 * Collect the setup for a new project
 */
export async function collectNewProjectData(askProjectName: boolean = false): Promise<ProjectSetup> {
  const questions: Answers = [
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
  ];

  if (askProjectName) {
    questions.unshift({
      type: 'input',
      name: 'projectName',
      message: 'What is the name of your project?',
      default: 'my-app',
      validate: (input: string) => {
        if (input.trim() === '') {
          return 'Project name cannot be empty';
        }
        return true;
      }
    });
  }
  
  const result = await inquirer.prompt(questions);

  return {
    projectName: result.projectName || 'my-app',
    packageManager: result.packageManager === 'skip installation' ? 'npm' : result.packageManager,
    skipPackageInstallation: result.packageManager === 'skip installation',
    useTypeScript: result.language === 'TypeScript'
  }
}