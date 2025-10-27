import { DevAction } from "../models/action.model";
import { DataSourceType, InternalApiInput, InternalApiResult } from "@kottster/common";
import { exec } from "child_process";
import { PROJECT_DIR } from "../constants/projectDir";

/**
 * Install the required packages for the data source
 */
export class InstallPackagesForDataSource extends DevAction {
  public async execute(data: InternalApiInput<'installPackagesForDataSource'>): Promise<InternalApiResult<'installPackagesForDataSource'>> {
    return new Promise((resolve, reject) => {
      const { type } = data;
      if (!Object.values(DataSourceType).includes(type)) {
        reject(new Error(`Unsupported data source type: ${type}`));
        return;
      }

      const command = this.getCommand(type);
      exec(command, { cwd: PROJECT_DIR }, (error) => {
        if (error) {
          console.error(`Error executing command: ${error}`);
          reject(error);
          return;
        }

        resolve();
      });
    });
  }

  private getCommand(type: DataSourceType) {
    return `npm run dev:add-data-source ${type} -- --skipFileGeneration`;
  }
}