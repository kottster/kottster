import { PageFileStructure } from '../models/page.model';

/**
 * Get the default page structure
 * @param pageId The page ID
 * @param usingTsc Whether to use TypeScript
 * @returns The default page structure
 */
export function getDefaultPage(pageId: string, usingTsc: boolean): PageFileStructure {
  const fileContent = `import React from 'react'; \nimport { Page } from '@kottster/react'; \n\nexport default () => {\n  \n  return (\n    <Page>\n      {/* Add content here */}\n    </Page>\n  );\n};\n`;
  const fileName = usingTsc ? 'index.tsx' : 'index.jsx';

  return {
    pageId: pageId,
    dirPath: `src/client/pages/${pageId}`,
    entryFile: {
      fileName,
      filePath: `src/client/pages/${pageId}/${fileName}`,
      fileContent,
    },
    files: [],
  }
}