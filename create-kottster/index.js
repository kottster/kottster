#!/usr/bin/env node

const { Command } = require('commander');
const { program: kottsterCLI } = require('@kottster/cli/dist/cli.js');

const program = new Command();

program
  .name('create-kottster-app')
  .description('CLI tool to create a new Kottster project')
  .argument('<project-name>', 'Name of the project')
  .requiredOption('-id, --appId <appId>', 'The ID of the app')
  .requiredOption('-sk, --secretKey <secretKey>', 'The secret key of the app')
  .option('--skipInstall', 'Skip installing dependencies')
  .option('--typescript', 'Use TypeScript')
  .action((projectName, options) => {
    const { appId, secretKey, skipInstall, typescript } = options;

    kottsterCLI.parse([
      'new', projectName, 
      '-id', appId, 
      '-sk', secretKey, 
      skipInstall ? '--skip-install' : '', 
      typescript ? '--typescript' : ''
    ], { from: 'user' });
  });

program.parse(process.argv);
