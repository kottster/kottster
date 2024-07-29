import chalk from 'chalk'
import { FileCreator } from '../services/fileCreator.service'
import PackageInstaller from '../services/packageInstaller.service'
import { DataSourceType } from '@kottster/common';
import dataSourcesTypeData from '../constants/dataSourceTypeData';

/**
 * Add a new data source to the project.
 */
export async function addDataSource (dataSourceType: DataSourceType): Promise<void> {
  const packageInstaller = new PackageInstaller('npm')
  const fileCreator = new FileCreator();
  const dataSourceTypeData = dataSourcesTypeData[dataSourceType];

  console.log('Adding data source:', chalk.green(dataSourceType));

  // Install the required packages
  packageInstaller.installPackages(dataSourceTypeData.packages);

  // Add the data source to the project
  fileCreator.addDataSource(dataSourceType);
  
  console.log(chalk.green(`Data source ${dataSourceType} added successfully.`));
  console.log(`Edit the ${chalk.blue(`src/server/data-sources/${dataSourceType}/index.js`)} file to connect to your database.`);
}
