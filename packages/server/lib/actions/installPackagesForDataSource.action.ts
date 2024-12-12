import { DSAction } from "../models/action.model";
import { DataSourceType } from "@kottster/common";
import { exec } from "child_process";
import { PROJECT_DIR } from "../constants/projectDir";

interface Data {
  type: DataSourceType;
}

/**
 * Install the required packages for the data source
 */
export class InstallPackagesForDataSource extends DSAction {
  public async execute(data: Data) {
    return new Promise((resolve, reject) => {
      const { type } = data;

      const command = this.getCommand(type);
      exec(command, { cwd: PROJECT_DIR }, (error) => {
        if (error) {
          console.error(`Error executing command: ${error}`);
          reject(error);
          return;
        }

        resolve({});
      });
    });
  }

  private getCommand(type: DataSourceType) {
    return `npm run dev:add-data-source ${type} -- --skipFileGeneration`;
  }
}