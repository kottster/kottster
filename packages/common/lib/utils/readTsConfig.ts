import path from 'path';
import fs from 'fs';

interface TsConfig {
  [key: string]: any;
  compilerOptions?: {
    [key: string]: any;
    paths?: {
      [key: string]: string[];
    };
  };
}

/**
 * Read and parse the tsconfig.json file in the specified project directory.
 * @returns The parsed TypeScript configuration object
 * @throws If the file does not exist or is not valid JSON
 */
export function readTsConfig(projectDir: string): TsConfig {
  const tsconfigFilePath = path.join(projectDir, 'tsconfig.json');
  if (!fs.existsSync(tsconfigFilePath)) {
    throw new Error(`File not found: ${tsconfigFilePath}`);
  }
  const content = fs.readFileSync(tsconfigFilePath, 'utf8');
  const tsconfig = JSON.parse(content) as TsConfig;
  return tsconfig;
}