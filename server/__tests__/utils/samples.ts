export function getSampleProceduresFileContent(): string {
  return `// This file was generated by the Kottster App Builder
// PLEASE AVOID EDITING THIS FILE MANUALLY

import { app } from '../../../dev/app';

const STAGE = 'dev';
const PAGE_ID = 'p1';
const COMPONENT_TYPE = 'metric';
const COMPONENT_ID = 'm1';

app.registerProceduresForComponent(STAGE, PAGE_ID, COMPONENT_TYPE, COMPONENT_ID, {
  'getUserCount': async function () {return { userCount: 123 };},
});

`;
}

// Get sample src/dev/adapter.js file content
export function getSampleAdapterFileContent(): string {
  return `import { app } from './app.js';
import { createAdapter } from '@kottster/server';

export const adapter = createAdapter('postgresql', {
  "connectionOptions": {
    "connection": {
      "host": "localhost",
      "port": 5432,
      "user": "root",
      "password": "password123",
      "database": "postgres"
    },
    "searchPath": [
      "public"
    ]
  }
});

app.setAdapter(adapter);

`;
}

// Get sample src/__generated__/index.js file content
export function getSampleAutoImportFileContent(): string {
  return `// This file was generated by the Kottster App Builder
// PLEASE AVOID EDITING THIS FILE MANUALLY

import '../dev/adapter';
import './dev/procedures/page_p1_metric_m1';
`;
}

