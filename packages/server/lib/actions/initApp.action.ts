import { DevAction } from "../models/action.model";
import { FileWriter } from "../services/fileWriter.service";

interface Data {
  id: number;
  name: string;
  secretKey: string;
}

interface Result {}

/**
 * Get the data source info
 */
export class InitApp extends DevAction {
  public async executeDevAction({ id, name, secretKey }: Data): Promise<Result> {
    const fileWrtier = new FileWriter({ usingTsc: this.app.usingTsc });
    
    // First, write the app server file with the secret key to avoid 401 errors after writing the schema file
    fileWrtier.writeAppServerFileWithSecretKey(secretKey);

    fileWrtier.writeSchemaJsonFile({
      id: id.toString(),
      meta: {
        name,
        icon: 'https://web.kottster.app/icon.png',
      },
    });

    return {};
  }
}