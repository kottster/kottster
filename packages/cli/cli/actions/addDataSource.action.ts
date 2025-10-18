import chalk from 'chalk';
import { FileCreator } from '../services/fileCreator.service';
import PackageInstaller from '../services/packageInstaller.service';
import { checkTsUsage, dataSourcesTypeData, DataSourceType, dataSourceTypes } from '@kottster/common';

interface Options {
  skipFileGeneration?: boolean;
  skipInstall?: boolean;

  /** The stringified JSON data with connection details */
  data?: string;

  /** The name of the data source, if not provided, it will be generated based on the type */
  name?: string;
}

/**
 * Add a new data source to the project.
 */
export async function addDataSource (dataSourceType: DataSourceType, options: Options): Promise<void> {
  const usingTsc = checkTsUsage();
  const packageInstaller = new PackageInstaller()
  const fileCreator = new FileCreator({ usingTsc });
  const dataSourceTypeData = dataSourcesTypeData[dataSourceType];
  const dataSourceTypeInfo = dataSourceTypes.find((type) => type.type === dataSourceType);

  if (!options.skipInstall) {
    // Install the required packages
    await packageInstaller.installPackages(dataSourceTypeData.packages);
  }

  if (!options.skipFileGeneration) {
    let data: Record<string, unknown> = {}; 
    try {
      // Replace escaped quotes and parse the JSON data
      data = options.data ? JSON.parse(options.data.replace(/\\"/g, '"')) : {};
    } catch (error) {
      console.error('Invalid JSON data provided:', error);
    }

    // Add the data source to the project
    const pathToFile = fileCreator.addDataSource(dataSourceType, options.name, data);

    console.log(chalk.green(`${dataSourceTypeInfo?.name} data source added successfully.`));
    console.log(`Update the connection details in the generated file: \n${chalk.cyan(pathToFile)}`);
  }
}
