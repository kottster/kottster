import { exec } from 'child_process'
import { createSpinner } from 'nanospinner';

type PackageManager = 'npm' | 'yarn'

// A map of package names to versions
type Packages = Record<string, string>

/**
 * Service for installing packages.
*/
class PackageInstaller {
  constructor (
    private readonly PACKAGE_MANAGER: PackageManager,
    private readonly PROJECT_DIR: string = process.cwd()
  ) {}

  /**
   * Install the given packages.
   * @param packages A map of package names to versions.
   * @returns A promise that resolves when the installation is complete.
   */
  public installPackages (packages?: Packages): Promise<void> {
    return new Promise((resolve, reject) => {
      const spinner = createSpinner(packages ? `Installing packages: ${Object.keys(packages).join(', ')}` : 'Installing packages...').start()
      const command = this.getInstallCommand(packages)

      exec(command, { cwd: this.PROJECT_DIR }, error => {
        if (error) {
          spinner.error({ text: 'An error occurred during package installation' });
          console.error(error);
          reject(error);
        } else {
          spinner.success({ text: 'Packages installed successfully' });
          resolve();
        }
      });
    });
  }

  private getInstallCommand (packages?: Packages): string {
    switch (this.PACKAGE_MANAGER) {
      case 'npm':
        return `npm install ${packages ? this.getPackageList(packages) : ''} --no-fund --no-audit`;
      case 'yarn':
        return `yarn add ${packages ? this.getPackageList(packages) : ''}`;
      default:
        throw new Error('Unsupported package manager')
    }
  }

  private getPackageList (packages?: Packages): string {
    return packages ? Object.keys(packages).map(pkg => `${pkg}@${packages[pkg]}`).join(' ') : ''
  }
}

export default PackageInstaller