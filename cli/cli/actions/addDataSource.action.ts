import chalk from 'chalk'
import { FileCreator } from '../services/fileCreator.service'
import PackageInstaller from '../services/packageInstaller.service'
import { DataSourceType } from '@kottster/common';
import { DataSourceClientManager } from '../services/dataSourceClientManager.service';

interface Options { 
  appId: string;
  secretKey: string;
  database: string;
  skipInstall?: boolean;
}

/**
 * Add a new data source to the project.
 */
export async function addDataSource (dataSourceType: DataSourceType, options: Options): Promise<void> {
  const projectDir = process.cwd();
  const packageInstaller = new PackageInstaller('npm', projectDir)
  const fileCreator = new FileCreator(options.appId, projectDir);
  const { packages } = DataSourceClientManager.get(dataSourceType);

  console.log('Adding data source:', chalk.green(dataSourceType))

  // Install the required packages
  packageInstaller.installPackages(packages);

  // Add the data source to the project
  fileCreator.addDataSource(dataSourceType);
  
  console.log(chalk.green(`Data source ${dataSourceType} added successfully.`));
}
