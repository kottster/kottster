import { DSAction } from "../models/action.model";
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
export class InitApp extends DSAction {
  public async execute({ id, name, secretKey }: Data): Promise<Result> {
    const fileWrtier = new FileWriter({ usingTsc: this.ds.usingTsc });
    fileWrtier.writeSchemaJsonFile({
      id: id.toString(),
      meta: {
        name,
        icon: 'https://web.kottster.app/icon.png',
      },
      navItems: []
    });

    fileWrtier.writeAppServerFileWithSecretKey(secretKey);

    return {};
  }
}