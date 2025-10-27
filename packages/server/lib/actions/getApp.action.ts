import { IdentityProviderUserWithRoles, InternalApiInput, InternalApiResult, Page, Stage } from "@kottster/common";
import { Action } from "../models/action.model";
import { FileReader } from "../services/fileReader.service";

/**
 * Get the app data
 */
export class GetApp extends Action {
  private cachedPages: Page[] | null = null;

  public async execute(_: InternalApiInput<'getApp'>, user?: IdentityProviderUserWithRoles): Promise<InternalApiResult<'getApp'>> {
    
    const roles = user ? await this.app.identityProvider.getRoles() : [];
    const userPermissions = user ? await this.app.identityProvider.getUserPermissions(user.id) : [];
    const fileReader = new FileReader(this.app.stage === Stage.development);

    // Cache pages in production to avoid reading files every time
    const pages = this.app.stage === Stage.production && this.cachedPages
      ? this.cachedPages
      : this.app.loadedPageConfigs;
    
    if (this.app.stage === Stage.production && !this.cachedPages) {
      this.cachedPages = pages;
    }
    
    // In production, use the in-memory schema; in development, read from file
    const appSchema = this.app.stage === Stage.production ? this.app.schema : fileReader.readAppSchema();

    return {
      schema: {
        main: appSchema.main,
        sidebar: appSchema.sidebar,
        pages,
        dataSources: this.app.dataSources.map((dataSource) => {
          return {
            name: dataSource.name,
            type: dataSource.type,
          };
        }),
      },
      user: user ? this.app.identityProvider.prepareUserForClient(user) : undefined,
      roles,
      userPermissions,
    };
  }
}