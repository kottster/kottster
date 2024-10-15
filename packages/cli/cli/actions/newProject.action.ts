import path from 'path'
import chalk from 'chalk'
import { FileCreator } from '../services/fileCreator.service'
import PackageInstaller from '../services/packageInstaller.service'
import { API } from '../services/api.service';
import { getRunDevCommand } from '../utils/getRunDevCommand';
import { collectNewProjectData } from '../utils/collectNewProjectData';

interface Options { 
  appId: string;
  secretKey: string;
  skipInstall?: boolean;
}

/**
 * Create a new project with the given name.
 */
export async function newProject (projectName: string, options: Options): Promise<void> {
  const projectSetupData = await collectNewProjectData();
  
  const startTime = Date.now();
  const appId = options.appId?.trim()
  const secretKey = options.secretKey?.trim()
  const projectDir = projectName === '.' ? process.cwd() : path.join(process.cwd(), projectName);
  const runDevCommand = getRunDevCommand(projectSetupData.packageManager);
  const usageDataOptions = {
    packageManager: projectSetupData.packageManager,
    usingTypescript: projectSetupData.useTypeScript,
  };

  API.sendNewProjectCommandUsageData(options.appId, 'start', usageDataOptions);

  try {
    // Create project files
    const fileCreator = new FileCreator({
      projectDir,
      usingTsc: true,
    })
    fileCreator.createProject({
      projectName,
      appId,
      secretKey,
    })

    if (options.skipInstall || projectSetupData.skipPackageInstallation) {
      // Skip package installation
      console.log(chalk.yellow('Skipping package installation'))
    } else {
      // Install packages
      const packageInstaller = new PackageInstaller(projectSetupData.packageManager, projectDir)
      await packageInstaller.installPackages()
    }

    // Show success message
    console.log('\n')
    console.log(`🚀 Project ${chalk.green(projectName)} created!`)
    console.log('👉 Start the project with these commands:\n')
    console.log(chalk.grey(`   cd ${projectName}`))
    console.log(chalk.grey(`   ${runDevCommand}`))
    console.log('\n')

    await API.sendNewProjectCommandUsageData(options.appId, 'finish', usageDataOptions, startTime);
  } catch (error) {
    console.error(chalk.red('Error creating project:', error))
    await API.sendNewProjectCommandUsageData(options.appId, 'error', usageDataOptions);
  }
}