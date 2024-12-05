import { Action, DSAction } from "../models/action.model";
import { GetDataSources } from "../actions/getDataSources.action";
import { GetDataSourceSchema } from "../actions/getDataSourceSchema.action";
import { UpdateFiles } from "../actions/updateFiles.action";
import { GetFiles } from "../actions/getFiles.action";
import { UpdateSchema } from "../actions/updateSchema.action";
import { CreatePage } from "../actions/createPage.action";
import { UpdatePage } from "../actions/updatePage.action";
import { DeletePage } from "../actions/deletePage.action";
import { DevSync } from "../core/devSync";
import { KottsterApp } from "../core/app";
import { InitApp } from "../actions/initApp.action";

/**
 * Service for working with actions
 */
export class ActionService {
  static getAction(app: KottsterApp, action: string): Action {
    switch (action) {
      case 'getDataSources':
        return new GetDataSources(app);
      case 'getDataSourceSchema':
        return new GetDataSourceSchema(app);
      default:
        throw new Error(`Action ${action} not found`);
    }
  }

  static getDSAction(ds: DevSync, action: string): DSAction {
    switch (action) {
      case 'initApp':
        return new InitApp(ds);
      case 'updateSchema':
        return new UpdateSchema(ds);
      case 'updateFiles':
        return new UpdateFiles(ds);
      case 'getFiles':
        return new GetFiles(ds);
      case 'createPage':
        return new CreatePage(ds);
      case 'updatePage':
        return new UpdatePage(ds);
      case 'deletePage':
        return new DeletePage(ds);
      default:
        throw new Error(`Action ${action} not found`);
    }
  }
}