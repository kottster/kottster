import { generateRandomString, InternalApiBody, InternalApiResult } from "@kottster/common";
import { DevAction } from "../models/action.model";
import { FileWriter } from "../services/fileWriter.service";
import { randomUUID } from "crypto";
import { KottsterApi } from "../services/kottsterApi.service";

/**
 * Get the data source info
 */
export class InitApp extends DevAction {
  public async execute({ name, rootUsername, rootPassword }: InternalApiBody<'initApp'>): Promise<InternalApiResult<'initApp'>> {
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

    // First, write the app server file with the secret key to avoid 401 errors after writing the schema file
    const secretKey = generateRandomString(32);
    const jwtSecretSalt = generateRandomString(16);
    fileWrtier.writeAppServerFile(
      secretKey, 
      jwtSecretSalt,
      apiToken,
      rootUsername, 
      rootPassword
    );
    fileWrtier.writeSchemaJsonFile({
      id,
      meta: {
        name,
        icon: 'https://web.kottster.app/icon.png',
      },
    });

    const jwtSecret = `${id}${secretKey}${jwtSecretSalt}`;
    const rootUserJwtToken = await this.app.identityProvider.generateTokenForRootUser(86400, jwtSecret);

    return {
      rootUserJwtToken,
    };
  }
}