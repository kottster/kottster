import { Action, DevAction } from "../models/action.model";
import { GetDataSources } from "../actions/getDataSources.action";
import { GetDataSourceSchema } from "../actions/getDataSourceSchema.action";
import { CreatePage } from "../actions/createPage.action";
import { UpdatePage } from "../actions/updatePage.action";
import { DeletePage } from "../actions/deletePage.action";
import { KottsterApp } from "../core/app";
import { InitApp } from "../actions/initApp.action";
import { AddDataSource } from "../actions/addDataSource.action";
import { InstallPackagesForDataSource } from "../actions/installPackagesForDataSource.action";
import { GetProjectSettings } from "../actions/getProjectSettings.action";
import { GetApp } from "../actions/getApp.action";
import { RemoveDataSource } from "../actions/removeDataSource.action";
import { UpdateAppSchema } from "../actions/updateAppSchema.action";
import { Login } from "../actions/login.action";
import { GetUsers } from "../actions/getUsers.action";
import { CreateUser } from "../actions/createUser.action";
import { UpdateUser } from "../actions/updateUser.action";
import { DeleteUser } from "../actions/deleteUser.action";
import { CreateRole } from "../actions/createRole.action";
import { UpdateRole } from "../actions/updateRole.action";
import { DeleteRole } from "../actions/deleteRole.action";
import { ChangePassword } from "../actions/changePassword.action";
import { LogOutAllSessions } from "../actions/logOutAllSessions.action";
import { GenerateSql } from "../actions/generateSql.action";
import { GetKottsterContext } from "../actions/getKottsterContext.action";
import { GetStorageValue } from "../actions/getStorageValue.action";

/**
 * Service for working with actions.
 */
export class ActionService {
  static getAction(app: KottsterApp, action: string): Action | DevAction {
    switch (action) {
      case 'getApp':
        return new GetApp(app);
      case 'login':
        return new Login(app);
      case 'getDataSources':
        return new GetDataSources(app);
      case 'getDataSourceSchema':
        return new GetDataSourceSchema(app);
      case 'initApp':
        return new InitApp(app);
      case 'updateAppSchema':
        return new UpdateAppSchema(app);
      case 'createPage':
        return new CreatePage(app);
      case 'generateSql':
        return new GenerateSql(app);
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
      case 'getUsers':
        return new GetUsers(app);
      case 'createUser':
        return new CreateUser(app);
      case 'updateUser':
        return new UpdateUser(app);
      case 'deleteUser':
        return new DeleteUser(app);
      case 'createRole':
        return new CreateRole(app);
      case 'updateRole':
        return new UpdateRole(app);
      case 'deleteRole':
        return new DeleteRole(app);
      case 'changePassword':
        return new ChangePassword(app);
      case 'logOutAllSessions':
        return new LogOutAllSessions(app);
      case 'getKottsterContext':
        return new GetKottsterContext(app);
      case 'getStorageValue':
        return new GetStorageValue(app);
      default:
        throw new Error(`Action ${action} not found`);
    }
  }
}