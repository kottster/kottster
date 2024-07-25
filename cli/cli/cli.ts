import { Command } from 'commander'
import dotenv from 'dotenv';
import { newProject } from './actions/newProject.action'
import { startProject } from './actions/startProject.action'
import { addDataSource } from './actions/addDataSource.action';

// Load environment variables from .env file
dotenv.config();

export const program = new Command()

// Command to start the project
program
  .command('start <script>')
  .description('Start a Kottster server')
  .option('--development', 'Run the server in development mode')
  .action(startProject);

// Command to create a new project
program
  .command('new <project-name>')
  .description('Create a new project')
  .requiredOption('-id, --appId <appId>', 'The ID of the app')
  .requiredOption('-sk, --secretKey <secretKey>', 'The secret key of the app')
  .option('--skipInstall', 'Skip installing dependencies')
  .action(newProject)

// Command to add a new data source
program
  .command('add-data-source <data-source-type>')
  .description('Add a new data source to the project')
  .allowUnknownOption()
  .action(addDataSource)
