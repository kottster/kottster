import chalk from 'chalk';
import { FileCreator } from '../services/fileCreator.service';
import PackageInstaller from '../services/packageInstaller.service';
import { checkTsUsage, DataSourceType, dataSourceTypes } from '@kottster/common';
import dataSourcesTypeData from '../constants/dataSourceTypeData';

/**
 * Add a new data source to the project.
 */
export async function addDataSource (dataSourceType: DataSourceType): Promise<void> {
  const usingTsc = checkTsUsage();
  const packageInstaller = new PackageInstaller()
  const fileCreator = new FileCreator({ usingTsc });
  const dataSourceTypeData = dataSourcesTypeData[dataSourceType];
  const dataSourceTypeInfo = dataSourceTypes.find((type) => type.type === dataSourceType);

  // Install the required packages
  await packageInstaller.installPackages(dataSourceTypeData.packages);

  // Add the data source to the project
  const pathToFile = fileCreator.addDataSource(dataSourceType);
  
  console.log(chalk.green(`${dataSourceTypeInfo?.name} data source added successfully.`));
  console.log(`Update the connection details in the generated file: \n${chalk.blue(pathToFile)}`);
}
