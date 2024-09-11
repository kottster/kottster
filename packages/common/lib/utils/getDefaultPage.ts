import { PageFileStructure } from '../models/page.model';

/**
 * Get the default page structure.
 * @param pageId The page ID.
 * @param usingTsc Whether to use TypeScript.
 * @returns The default page structure.
 */
export function getDefaultPage(pageId: string, usingTsc: boolean): PageFileStructure {
  const fileContent = `import React from 'react'; \nimport { Page, usePage } from '@kottster/react'; \n\nexport default () => {\n  const { navItem } = usePage();\n\n  return (\n    <Page title={navItem.name}>\n      {/* Add content here */}\n    </Page>\n  );\n};`;
  const fileName = usingTsc ? 'index.tsx' : 'index.jsx';

  const routerFileName = usingTsc ? 'api.server.ts' : 'api.server.js';
  const routerFileContent = `import { t } from '@/.server/trpc';\n\nexport default t.router({});`;

  return {
    pageId: pageId,
    dirPath: `app/routes/${pageId}`,
    entryFile: {
      fileName,
      filePath: `app/routes/${pageId}/${fileName}`,
      fileContent,
    },
    files: [
      {
        fileName: routerFileName,
        filePath: `app/routes/${pageId}/${routerFileName}`,
        fileContent: routerFileContent,
      }
    ],
  }
}