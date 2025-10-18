import { Command } from 'commander'
import dotenv from 'dotenv';
import { newProject } from './actions/newProject.action';
import { addDataSource } from './actions/addDataSource.action';
import { startProjectDev } from './actions/startProjectDev.action';
import { buildServer } from './actions/buildServer.action';
import { upgradeKottster } from './actions/upgradeKottster.action';

// Load environment variables from .env file
dotenv.config();

export const program = new Command()

// Command to start the project in development mode
program
  .command('dev')
  .description('Start a Next app in development mode')
  .option('--debug', 'Start the server in debug mode')
  .allowUnknownOption()
  .action(startProjectDev);

// Command to create a new project
program
  .command('new [project-name]')
  .description('Create a new project')
  .option('--skipInstall', 'Skip installing dependencies')
  .action(newProject)

// Command to add a new data source
program
  .command('add-data-source <data-source-type>')
  .description('Add a new data source to the project')
  .option('--skipInstall', 'Skip installing dependencies')
  .option('--skipFileGeneration', 'Do not create a file for the data source')
  .option('--data <json>', 'The stringified JSON data with the connection details', String)
  .option('--name <name>', 'The name of the data source to replace')
  .allowUnknownOption()
  .action(addDataSource)

// Command to upgrade Kottster core packages
program
  .command('upgrade [version]')
  .description('Upgrade Kottster core packages in the current project')
  .allowUnknownOption()
  .action(upgradeKottster)
  
// Command to build the server
program
  .command('build:server')
  .action(buildServer)