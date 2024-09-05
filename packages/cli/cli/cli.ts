import { Command } from 'commander'
import dotenv from 'dotenv';
import { newProject } from './actions/newProject.action';
import { addDataSource } from './actions/addDataSource.action';
import { startProjectDev } from './actions/startProjectDev.action';

// Load environment variables from .env file
dotenv.config();

export const program = new Command()

// Command to start the project in development mode
program
  .command('dev')
  .description('Start a Next app in development mode')
  .action(startProjectDev);

// Command to create a new project
program
  .command('new <project-name>')
  .description('Create a new project')
  .requiredOption('-id, --appId <appId>', 'The ID of the app')
  .requiredOption('-sk, --secretKey <secretKey>', 'The secret key of the app')
  .option('--skipInstall', 'Skip installing dependencies')
  .option('--typescript', 'Use TypeScript')
  .action(newProject)

// Command to add a new data source
program
  .command('add-data-source <data-source-type>')
  .description('Add a new data source to the project')
  .allowUnknownOption()
  .action(addDataSource)