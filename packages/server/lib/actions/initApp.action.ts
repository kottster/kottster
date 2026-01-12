import { generateRandomString, InternalApiInput, InternalApiResult, isAppSchemaEmpty } from "@kottster/common";
import { DevAction } from "../models/action.model";
import { FileWriter } from "../services/fileWriter.service";
import { randomUUID } from "crypto";
import { KottsterApi } from "../services/kottsterApi.service";

/**
 * Initialize the Kottster app
 */
export class InitApp extends DevAction {
  public async execute({ name, rootUsername, rootPassword }: InternalApiInput<'initApp'>): Promise<InternalApiResult<'initApp'>> {
    if (!isAppSchemaEmpty(this.app.schema)) {
      throw new Error('The app has already been initialized.');
    }

    const fileWrtier = new FileWriter({ usingTsc: this.app.usingTsc });
    const id = randomUUID();

    // Get API token from Kottster API
    let apiToken: string | undefined = undefined;
    try {
      const kottsterApi = new KottsterApi();
      const res = await kottsterApi.createApp();
      apiToken = res?.apiToken;
    } catch (error) {
      console.error('Failed to obtain API token from Kottster API. Some features that require Kottster API access will not work.', error);
    }

    const secretKey = generateRandomString(32);
    const jwtSecretSalt = generateRandomString(16);
    fileWrtier.writeAppServerFile(
      secretKey, 
      jwtSecretSalt,
      apiToken,
      rootUsername, 
      rootPassword
    );
    fileWrtier.writeMainSchemaJsonFile({
      id,
      meta: {
        name,
        icon: 'https://web.kottster.app/icon.png',
      },
    });
    fileWrtier.writeSidebarSchemaJsonFile({});

    // We have to build a jwt secret here because identity provider is not yet initialized when this action runs
    const jwtSecret = `${id}${secretKey}${jwtSecretSalt}`;
    const rootUserJwtToken = await this.app.identityProvider?.generateTokenForRootUser(86400, jwtSecret) ?? '';

    return {
      rootUserJwtToken,
    };
  }
}