import { PageFileStructure } from '../models/page.model';

/**
 * Get the default page structure.
 * @param pageId The page ID.
 * @param usingTsc Whether to use TypeScript.
 * @returns The default page structure.
 */
export function getDefaultPage(pageId: string, usingTsc: boolean): PageFileStructure {
  const fileContent = `'use client';\n\nimport React from 'react'; \nimport { Page, usePage } from '@kottster/react'; \n\nexport default () => {\n  const { navItem } = usePage();\n\n  return (\n    <Page title={navItem.name}>\n      {/* Add content here */}\n    </Page>\n  );\n};`;
  const fileName = usingTsc ? 'page.tsx' : 'page.jsx';

  const routerFileName = usingTsc ? 'page-api.ts' : 'page-api.js';
  const routerFileContent = `import 'server-only';\nimport { t } from '@/server/trpc';\n\nexport default t.router({});`;

  return {
    pageId: pageId,
    dirPath: `src/app/pages/${pageId}`,
    entryFile: {
      fileName,
      filePath: `src/app/pages/${pageId}/${fileName}`,
      fileContent,
    },
    files: [
      {
        fileName: routerFileName,
        filePath: `src/app/pages/${pageId}/${routerFileName}`,
        fileContent: routerFileContent,
      }
    ],
  }
}