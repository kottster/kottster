import fs from 'fs';
import mock from 'mock-fs'
import { newProject } from '../../cli/actions/newProject.action'

const writeFileSpy = jest.spyOn(fs, 'writeFileSync');

describe('CLI integration test', () => {
  const projectDir = `${process.cwd()}/foo`;
  
  beforeEach(() => {
    mock({});
  });
  
  afterEach(() => {
    mock.restore();
  });

  it('kottster new <project-name>', async () => {
    await newProject('foo', { appId: 'bar', secretKey: '12345', skipInstall: true });

    expect(writeFileSpy).toHaveBeenCalledTimes(8);
    expect(writeFileSpy).toHaveBeenNthCalledWith(1, `${projectDir}/package.json`, expect.any(String));
    expect(writeFileSpy).toHaveBeenNthCalledWith(2, `${projectDir}/.env`, expect.any(String));
    expect(writeFileSpy).toHaveBeenNthCalledWith(3, `${projectDir}/.gitignore`, expect.any(String));
    expect(writeFileSpy).toHaveBeenNthCalledWith(4, `${projectDir}/src/main.js`, expect.any(String));
    expect(writeFileSpy).toHaveBeenNthCalledWith(5, `${projectDir}/src/app.js`, expect.any(String));
    expect(writeFileSpy).toHaveBeenNthCalledWith(6, `${projectDir}/src/adapters.js`, expect.any(String));
  });
});