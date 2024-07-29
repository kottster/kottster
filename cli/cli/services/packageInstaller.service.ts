import { execSync } from 'child_process'

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
   */
  public installPackages (packages?: Packages): void {
    const command = this.getInstallCommand(packages)

    try {
      console.log(packages ? `Installing packages: ${Object.keys(packages).join(', ')}` : 'Installing packages...')
      execSync(command, { cwd: this.PROJECT_DIR, stdio: 'ignore' });
      console.log('Packages installed successfully.')
    } catch (error) {
      console.error('Error installing packages:', error)
    }
  }

  private getInstallCommand (packages?: Packages): string {
    switch (this.PACKAGE_MANAGER) {
      case 'npm':
        return `npm install ${packages ? this.getPackageList(packages) : ''}`;
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
