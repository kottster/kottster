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
    await newProject('foo', { appId: 'bar', secretKey: '12345' });

    expect(writeFileSpy).toHaveBeenCalledTimes(11);
    expect(writeFileSpy).toHaveBeenCalledWith(`${projectDir}/package.json`, expect.any(String));
    expect(writeFileSpy).toHaveBeenCalledWith(`${projectDir}/.env`, expect.any(String));
    expect(writeFileSpy).toHaveBeenCalledWith(`${projectDir}/.gitignore`, expect.any(String));
    expect(writeFileSpy).toHaveBeenCalledWith(`${projectDir}/src/server/main.js`, expect.any(String));
    expect(writeFileSpy).toHaveBeenCalledWith(`${projectDir}/src/server/app.js`, expect.any(String));
    expect(writeFileSpy).toHaveBeenCalledWith(`${projectDir}/src/client/index.jsx`, expect.any(String));
  });
});