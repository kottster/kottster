import { exec } from 'child_process'
import { createSpinner } from 'nanospinner';
import { PackageManager } from '../models/packageManager';
import { detectPackageManager } from '../utils/detectPackageManager';

// A map of package names to versions
type Packages = Record<string, string>

/**
 * Service for installing packages.
*/
class PackageInstaller {
  constructor (
    private readonly PACKAGE_MANAGER: PackageManager = detectPackageManager(),
    private readonly PROJECT_DIR: string = process.cwd()
  ) {}

  /**
   * Install the given packages.
   * @param packages A map of package names to versions.
   * @returns A promise that resolves when the installation is complete.
   */
  public installPackages (packages?: Packages): Promise<void> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const spinner = createSpinner(packages ? `Installing packages (${this.PACKAGE_MANAGER}): ${Object.keys(packages).join(', ')}` : 'Installing packages...').start()
      const command = this.getInstallCommand(packages)

      exec(command, { cwd: this.PROJECT_DIR }, error => {
        const endTime = Date.now();
        const elapsedTime = (endTime - startTime) / 1000;

        if (error) {
          spinner.error({ text: 'An error occurred during package installation' });
          console.error(error);
          reject(error);
        } else {
          spinner.success({ text: `Packages installed successfully (${Math.round(elapsedTime)}s)` });
          resolve();
        }
      });
    });
  }

  private getInstallCommand (packages?: Packages): string {
    switch (this.PACKAGE_MANAGER) {
      case 'npm':
        return packages ? `npm install ${packages ? this.getPackageList(packages) : ''} --save --no-fund --no-audit` : `npm install --no-fund --no-audit`;
      case 'yarn':
        return packages ? `yarn add ${packages ? this.getPackageList(packages) : ''}` : `yarn --silent`;
      case 'pnpm':
        return packages ? `pnpm add ${packages ? this.getPackageList(packages) : ''}` : `pnpm install`;
      default:
        throw new Error('Unsupported package manager')
    }
  }

  private getPackageList (packages?: Packages): string {
    return packages ? Object.keys(packages).map(pkg => `${pkg}@${packages[pkg]}`).join(' ') : ''
  }
}

export default PackageInstaller