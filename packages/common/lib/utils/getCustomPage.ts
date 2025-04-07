import { PageFileStructure } from '../models/page.model';

interface GetCustomPageParams {
  pageId: string;
  usingTsc: boolean;
}

/**
 * Get the custom page structure.
 * @param pageId The page ID.
 * @returns The default page structure.
 */
export function getCustomPage({ pageId, usingTsc }: GetCustomPageParams): PageFileStructure {
  // TODO: add <br /> to the fileContent
  const fileContent = `import { executeCustomAction, Page, usePage } from '@kottster/react';\nimport { app } from '${usingTsc ? '@' : '../..'}/.server/app';\nimport { useEffect, useState } from 'react';\n\nexport const action = app.defineCustomController({\n  getMessage: async ({ clientTimestamp }) => {\n    const clientDate = new Date(clientTimestamp);\n    const hours = clientDate.getHours();\n    \n    if (hours >= 5 && hours < 12) {\n      return 'Good morning!';\n    } else if (hours >= 12 && hours < 17) {\n      return 'Good day!';\n    } else {\n      return 'Good evening!';\n    }\n  },\n});\n\nexport default () => {\n  const { navItem } = usePage();\n  const [message, setMessage] = useState${usingTsc ? '<string>' : ''}();\n\n  const fetchMessage = async () => {\n    const res = await executeCustomAction('getMessage', {\n      clientTimestamp: Date.now(),\n    });\n\n    setMessage(res);\n  };\n\n  useEffect(() => {\n    fetchMessage();\n  }, []);\n\n  return (\n    <Page title={navItem?.name}>\n      <p className='text-gray-600 mb-5'>\n        This is sample custom page. It uses a custom controller to get the message based on the client's time. <br />\n        Replace it with your own content.\n      </p>\n\n      <br />\n\n      <b>Message</b>: {message}\n    </Page>\n  );\n};`;
  const fileName = `index.${usingTsc ? 'tsx' : 'jsx'}`;

  return {
    pageId,
    dirPath: `app/routes/${pageId}`,
    entryFile: {
      fileName,
      filePath: `app/routes/${pageId}/${fileName}`,
      fileContent,
    }
  }
}