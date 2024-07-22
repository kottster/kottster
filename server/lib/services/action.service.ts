import { Action } from "../models/action.model";
import { KottsterApp } from "../core/app";
import { GetDataForCodeGeneration } from "../actions/getDataForCodeGeneration.action";
import { GetSchema } from "../actions/getSchema.action";
import { WriteFiles } from "../actions/writeFiles.action";
import { ReadFiles } from "../actions/readFiles.action";
import { UpdateSchema } from "../actions/updateSchema.action";

export class ActionService {
  static getAction(app: KottsterApp, action: string): Action {
    switch (action) {
      case 'getDataForCodeGeneration':
        return new GetDataForCodeGeneration(app);
      case 'getSchema':
        return new GetSchema(app);
      case 'updateSchema':
        return new UpdateSchema(app);
      case 'writeFiles':
        return new WriteFiles(app);
      case 'readFiles':
        return new ReadFiles(app);
      default:
        throw new Error(`Action ${action} not found`);
    }
  }
}