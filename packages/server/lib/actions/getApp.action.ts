import { IdentityProviderUserWithRoles, InternalApiInput, InternalApiResult, Page, Stage } from "@kottster/common";
import { Action } from "../models/action.model";
import { FileReader } from "../services/fileReader.service";
import { NO_IDP_ERROR_MSG } from "../constants/errors";
import { prepareUserForClient } from "../utils/prepareUserForClient";

/**
 * Get the app data
 */
export class GetApp extends Action {
  private cachedPages: Page[] | null = null;

  public async execute(_: InternalApiInput<'getApp'>, user?: IdentityProviderUserWithRoles): Promise<InternalApiResult<'getApp'>> {
    const isProduction = this.app.stage === Stage.production;
    const fileReader = new FileReader(!isProduction);

    // Cache pages in production to avoid reading files every time
    const pages = isProduction && this.cachedPages
      ? this.cachedPages
      : this.app.loadedPageConfigs;
    
    if (isProduction && !this.cachedPages) {
      this.cachedPages = pages;
    }

    // In production, use the in-memory schema; in development, read from file
    const appSchema = isProduction ? this.app.schema : fileReader.readAppSchema();

    const schema = {
      main: appSchema.main,
      sidebar: appSchema.sidebar,
      pages,
      dataSources: this.app.getDataSources().map(ds => ({
        name: ds.name,
        type: ds.type,
      })),
    };

    const baseResult = {
      schema,
      loginFormEnabled: !!this.app.identityProvider,
      user: user ? prepareUserForClient(user) : undefined,
      licensePublicToken: this.app.licenseData?.['publicToken'],
    };

    if (this.app.externalIdentityProvider) {
      const { roles } = await this.app.externalIdentityProvider.getClientRoles({});
      return {
        ...baseResult,
        externalIdentityProvider: { type: this.app.externalIdentityProvider.type },
        roles: roles.map(r => ({ id: r.id, name: r.name ?? r.id })),
        userPermissions: [],
      };
    }

    if (!this.app.identityProvider) {
      throw new Error(NO_IDP_ERROR_MSG);
    }

    const roles = user ? await this.app.identityProvider.getRoles() : [];
    const userPermissions = user ? await this.app.identityProvider.getUserPermissions(user.id) : [];

    return {
      ...baseResult,
      roles,
      userPermissions,
    };
  }
}