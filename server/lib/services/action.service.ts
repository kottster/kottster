import { Action } from "../models/action.model";
import { KottsterApp } from "../core/app";
import { GetDataSource } from "../actions/getDataSource.action";
import { GetSchema } from "../actions/getSchema.action";
import { UpdateFiles } from "../actions/updateFiles.action";
import { GetFiles } from "../actions/getFiles.action";
import { UpdateSchema } from "../actions/updateSchema.action";
import { CreatePage } from "../actions/createPage.action";
import { UpdatePage } from "../actions/updatePage.action";
import { DeletePage } from "../actions/deletePage.action";

/**
 * Service for working with actions
 */
export class ActionService {
  static getAction(app: KottsterApp, action: string): Action {
    switch (action) {
      case 'getDataSource':
        return new GetDataSource(app);
      case 'getSchema':
        return new GetSchema(app);
      case 'updateSchema':
        return new UpdateSchema(app);
      case 'updateFiles':
        return new UpdateFiles(app);
      case 'getFiles':
        return new GetFiles(app);
      case 'createPage':
        return new CreatePage(app);
      case 'updatePage':
        return new UpdatePage(app);
      case 'deletePage':
        return new DeletePage(app);
      default:
        throw new Error(`Action ${action} not found`);
    }
  }
}