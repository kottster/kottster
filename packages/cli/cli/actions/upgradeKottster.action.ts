import inquirer from 'inquirer';
import chalk from 'chalk'
import PackageInstaller from '../services/packageInstaller.service'
import { KottsterApi } from '../services/kottsterApi.service';
import { detectPackageManager } from '../utils/detectPackageManager';

const corePackages = [
  '@kottster/common',
  '@kottster/cli',
  '@kottster/server',
  '@kottster/react'
];

/**
 * Upgrade Kottster core packages in the current project.
 */
export async function upgradeKottster (version: string | undefined): Promise<void> {
  const versions: string[] = await KottsterApi.getAvailableVersions();
  
  let selectedVersion: string;
  if (version) {
    // Validate that the provided version exists
    if (!versions.includes(version)) {
      console.log(chalk.red(`Error: Version ${version} is not available.`));
      console.log(chalk.yellow(`Available versions: ${versions.join(', ')}`));
      return;
    }
    selectedVersion = version;
    console.log(chalk.cyan(`Upgrading to version ${selectedVersion}...`));
  } else {
    // Prompt user to select a version
    const { chosenVersion } = await inquirer.prompt([
      {
        type: 'list',
        name: 'chosenVersion',
        message: 'Select the version to upgrade to:',
        choices: versions.map(v => ({
          name: v,
          value: v
        })),
        default: versions[0]
      }
    ]);
    selectedVersion = chosenVersion;
  }

  console.log(chalk.cyan(`\nUpgrading Kottster packages to version ${selectedVersion}...\n`));

  const packagesToInstall: Record<string, string> = {};
  corePackages.forEach(pkg => {
    packagesToInstall[pkg] = selectedVersion;
  });

  const projectDir = process.cwd();
  const packageManager = detectPackageManager(projectDir);
  const packageInstaller = new PackageInstaller(packageManager, projectDir);

  try {
    await packageInstaller.installPackages(packagesToInstall, true);
    
    console.log(chalk.green('\n✓ Successfully upgraded Kottster packages:'));
    corePackages.forEach(pkg => {
      console.log(chalk.gray(`  - ${pkg}@${selectedVersion}`));
    });
  } catch (error) {
    console.log(chalk.red('\n✗ Failed to upgrade packages.'));
    console.error(error);
    throw error;
  }
}