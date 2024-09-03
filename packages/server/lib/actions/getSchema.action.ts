import { Action } from "../models/action.model";
import { DataSourceAdapter } from "../models/dataSourceAdapter.model";
import { FileReader } from "../services/fileReader.service";
import { FullAppSchema, PublicDataSource } from "@kottster/common";
import os from 'os';

interface Result extends FullAppSchema {};

/**
 * Get the app schema.
 * @description Returns combined schema.json and additional data.
 */
export class GetSchema extends Action {
  private fileReader: FileReader = new FileReader();

  public async execute(): Promise<Result> {
    const { appId, dataSources } = this.app;
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    const appSchema = this.fileReader.readSchemaJson();
    const absoluteDirPath = isDevelopment ? this.getAbsoluteDirPath() : undefined;
    const [dependencies, devDependencies] = isDevelopment ? this.getDependencies() : [];

    return {
      ...appSchema,
      id: appId,
      usingTsc: this.app.usingTsc,
      dataSources: dataSources.map(ds => ({ 
        type: ds.type,
        ctxPropName: ds.ctxPropName,
        adapterType: (ds.adapter as DataSourceAdapter).type
      } as PublicDataSource)),
      sandbox: {
        developmentServerUrl: process.env.VITE_DEV_SERVER_URL
      },
      
      // Development only
      devSyncServerUrl: process.env.DEV_SYNC_SERVER_URL,
      absoluteDirPath,
      dependencies,
      devDependencies,
      os: isDevelopment ? {
        platform: os.platform(),
        type: os.type(),
        release: os.release()
      } : undefined,
    };
  }

  /**
   * Get the project's directory absolute path.
   * @returns The absolute directory path.
   */
  private getAbsoluteDirPath() {
    return process.cwd();
  }

  /**
   * Get the dependencies from the package.json file.
   * @returns The dependencies and devDependencies.
   */
  private getDependencies() {
    const packageJsonContent = this.fileReader.readPackageJson() as any;
    const dependencies = packageJsonContent.dependencies ?? {};
    const devDependencies = packageJsonContent.devDependencies ?? {};

    return [
      dependencies,
      devDependencies
    ];
  }
}