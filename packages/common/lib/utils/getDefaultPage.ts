import { PageFileStructure } from '../models/page.model';

/**
 * Get the default page structure.
 * @param pageId The page ID.
 * @param usingTsc Whether to use TypeScript.
 * @returns The default page structure.
 */
export function getDefaultPage(pageId: string, usingTsc: boolean): PageFileStructure {
  const fileContent = `import { Page } from '@kottster/react'; \n\nexport default () => {\n  return (\n    <Page>\n      {/* Add content here */}\n    </Page>\n  );\n};\n`;
  const fileName = `index.${usingTsc ? 'tsx' : 'jsx'}`;

  return {
    pageId: pageId,
    dirPath: `app/routes/${pageId}`,
    entryFile: {
      fileName,
      filePath: `app/routes/${pageId}/${fileName}`,
      fileContent,
    },
  }
}