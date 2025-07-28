import { Action, DevAction } from "../models/action.model";
import { GetDataSources } from "../actions/getDataSources.action";
import { GetDataSourceSchema } from "../actions/getDataSourceSchema.action";
import { GetFiles } from "../actions/getFiles.action";
import { CreatePage } from "../actions/createPage.action";
import { UpdatePage } from "../actions/updatePage.action";
import { DeletePage } from "../actions/deletePage.action";
import { KottsterApp } from "../core/app";
import { InitApp } from "../actions/initApp.action";
import { AddDataSource } from "../actions/addDataSource.action";
import { InstallPackagesForDataSource } from "../actions/installPackagesForDataSource.action";
import { GetProjectSettings } from "../actions/getProjectSettings.action";
import { GetAppSchema } from "../actions/getAppSchema";
import { RemoveDataSource } from "../actions/removeDataSource.action";
import { UpdateAppSchema } from "../actions/updateAppSchema.action";

/**
 * Service for working with actions.
 */
export class ActionService {
  static getAction(app: KottsterApp, action: string): Action | DevAction {
    switch (action) {
      case 'getAppSchema':
        return new GetAppSchema(app);
      case 'getDataSources':
        return new GetDataSources(app);
      case 'getDataSourceSchema':
        return new GetDataSourceSchema(app);
      case 'initApp':
        return new InitApp(app);
      case 'updateAppSchema':
        return new UpdateAppSchema(app);
      case 'getFiles':
        return new GetFiles(app);
      case 'createPage':
        return new CreatePage(app);
      case 'updatePage':
        return new UpdatePage(app);
      case 'deletePage':
        return new DeletePage(app);
      case 'addDataSource':
        return new AddDataSource(app);
      case 'removeDataSource':
        return new RemoveDataSource(app);
      case 'installPackagesForDataSource':
        return new InstallPackagesForDataSource(app);
      case 'getProjectSettings':
        return new GetProjectSettings(app);
      default:
        throw new Error(`Action ${action} not found`);
    }
  }
}