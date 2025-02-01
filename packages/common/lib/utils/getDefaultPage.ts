import { PageFileStructure } from '../models/page.model';

/**
 * Get the default page structure.
 * @param pageId The page ID.
 * @param usingTsc Whether to use TypeScript.
 * @returns The default page structure.
 */
export function getDefaultPage(pageId: string, usingTsc: boolean): PageFileStructure {
  const fileContent = `import { Page, usePage } from '@kottster/react'; \n\nexport default () => {\n  const { navItem } = usePage();\n\n  return (\n    <Page title={navItem.name}>\n      {/* Add content here */}\n    </Page>\n  );\n};`;
  const fileName = `${pageId}.${usingTsc ? 'tsx' : 'jsx'}`;

  return {
    pageId: pageId,
    entryFile: {
      fileName,
      filePath: `app/routes/${fileName}`,
      fileContent,
    },
  }
}