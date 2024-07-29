import { FileWriter } from "../../../lib/services/fileWriter.service";
import fs from 'fs';
import mock from 'mock-fs';
import { getSampleProceduresFileContent, getSampleMetricFileProcedure, getSampleAdapterFileContent, getSampleAutoImportFileContent } from "../../utils/samples";
import { createAdapter } from "../../../lib";
import { AdapterType } from "../../../lib/models/adapter.model";
import { PROJECT_DIR } from "../../../lib/constants/projectDir";
import { Stage } from "../../../lib/models/stage.model";

const writeFileSyncSpy = jest.spyOn(fs, 'writeFileSync');

describe('services/fileWriter', () => {
  beforeEach(() => {
    mock({
      [`${PROJECT_DIR}/src/dev`]: {},
      [`${PROJECT_DIR}/src/prod`]: {},
      [`${PROJECT_DIR}/src/__generated__/dev/procedures`]: {},
      [`${PROJECT_DIR}/src/__generated__/prod/procedures`]: {},
      [`${PROJECT_DIR}/src/dev/adapter.js`]: 'export {};',
    });
  });
  
  afterEach(() => {
    mock.restore();
  });

  it(`should create file with adapter`, async () => {
    const adapter = createAdapter(AdapterType.postgresql, {
      connectionOptions: {
        connection: {
          host: "localhost",
          port: 5432,
          user: "root",
          password: "password123",
          database: "postgres"
        },
        searchPath: ['public']
      },
    });
    
    const fileWriter = new FileWriter();
    await fileWriter.writeAdapterToFile(adapter);

    const calledWithArgs = writeFileSyncSpy.mock.calls[0];
    expect(calledWithArgs[1]).toMatchSnapshot();
  });

  it(`should create file with procedures`, async () => {
    const filePath = `${PROJECT_DIR}/src/__generated__/dev/procedures/page_p1_metric_m1.js`;
    
    const fileWriter = new FileWriter();
    await fileWriter.writeProceduresToFile(Stage.development, [
      getSampleMetricFileProcedure()
    ]);

    const calledWithArgs = writeFileSyncSpy.mock.calls[2];
    expect(calledWithArgs[1]).toMatchSnapshot();
  });

  it(`should generate autoimports`, async () => {
    const fileWriter = new FileWriter();
    await fileWriter.generateAutoImports();

    const calledWithArgs = writeFileSyncSpy.mock.calls[3];
    expect(calledWithArgs[1]).toMatchSnapshot();
  });
});