import { PageFileStructure } from '../models/page.model';

/**
 * Get the default page structure
 * @param pageId The page ID
 * @returns The default page structure
 */
export function getDefaultPage(pageId: string): PageFileStructure {
  const fileContent = `import React from 'react'; \nimport { Page } from '@kottster/react'; \n\nexport default () => {\n  \n  return (\n    <Page>\n      {/* Add content here */}\n    </Page>\n  );\n};\n`;

  return {
    pageId: pageId,
    dirPath: `src/client/pages/${pageId}`,
    entryFile: {
      fileName: 'index.jsx',
      filePath: `src/client/pages/${pageId}/index.jsx`,
      fileContent,
    },
    files: [],
  }
}