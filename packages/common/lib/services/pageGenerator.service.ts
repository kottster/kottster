import { Page, PageFileStructure, PublicPage } from '../models/page.model';
import { Template } from '../models/template.model';
import { stripIndent } from '../utils/stripIndent';

export class PageGeneratorService {
  public static templates: Template[] = [
    {
      key: 'empty',
      name: 'Empty Page',
      description: 'A blank slate for your ideas. Start from scratch and build your custom page as you like.',
      pictureUrl: 'https://web.kottster.app/templates/empty.png',
      requiredDependencies: [],
      availableInCommunityPlan: true,
    },
    {
      key: 'dashboard_1',
      name: 'Simple Dashboard',
      description: 'A dashboard with stats, charts, and a table. Useful for tracking key metrics, trends, and reports.',
      pictureUrl: 'https://web.kottster.app/templates/dashboard.png',
      requiredDependencies: [
        '@mantine/core',
        '@mantine/hooks',
        '@mantine/modals',
        '@mantine/notifications',
        '@mantine/dates',
        '@mantine/dates',
        '@mantine/charts',
        'dayjs',
        'recharts',
      ],
      previewUrl: 'https://demo.kottster.app/analyticsDashboard',
      availableInCommunityPlan: false,
    },
    {
      key: 'area_chart_page',
      name: 'Area Chart Page',
      description: 'An area chart for tracking the growth of key metrics over time. Good for showing totals and trends.',
      pictureUrl: 'https://web.kottster.app/templates/area-chart-page.png',
      requiredDependencies: [
        '@mantine/core',
        '@mantine/hooks',
        '@mantine/modals',
        '@mantine/notifications',
        '@mantine/dates',
        '@mantine/charts',
        'dayjs',
        'recharts',
      ],
      previewUrl: 'https://demo.kottster.app/',
      availableInCommunityPlan: false,
    },
    {
      key: 'line_chart_page',
      name: 'Line Chart Page',
      description: 'A line chart for showing daily changes in key metrics. Helps track day-to-day progress.',
      pictureUrl: 'https://web.kottster.app/templates/line-chart-page.png',
      requiredDependencies: [
        '@mantine/core',
        '@mantine/hooks',
        '@mantine/modals',
        '@mantine/notifications',
        '@mantine/dates',
        '@mantine/charts',
        'dayjs',
        'recharts',
      ],
      previewUrl: 'https://demo.kottster.app/growthChart',
      availableInCommunityPlan: false,
    },
    {
      key: 'bar_chart_page',
      name: 'Bar Chart Page',
      description: 'A bar chart for comparing key metrics by location or other categories. Useful for grouped data.',
      pictureUrl: 'https://web.kottster.app/templates/bar-chart-page.png',
      requiredDependencies: [
        '@mantine/core',
        '@mantine/hooks',
        '@mantine/modals',
        '@mantine/notifications',
        '@mantine/dates',
        '@mantine/charts',
        'dayjs',
        'recharts',
      ],
      previewUrl: 'https://demo.kottster.app/locationsOverview',
      availableInCommunityPlan: false,
    },
    {
      key: 'settings_page',
      name: 'Settings Page',
      description: 'A basic page for updating settings and running custom actions.',
      pictureUrl: 'https://web.kottster.app/templates/settings-page.png',
      requiredDependencies: [
        '@mantine/core',
        '@mantine/hooks',
        '@mantine/modals',
        '@mantine/notifications',
      ],
      previewUrl: 'https://demo.kottster.app/controlPanel',
      availableInCommunityPlan: false,
    }
  ];

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static async generateDashboardPage(page: Page & { type: 'dashboard' }, _: boolean): Promise<PageFileStructure> {
    return {
      pageKey: page.key,
      dirPath: `app/pages/${page.key}`,
      files: [
        {
          fileName: 'page.json',
          filePath: `app/pages/${page.key}/page.json`,
          fileContent: JSON.stringify({ ...page, key: undefined } as Omit<PublicPage & { type: 'dashboard' }, 'key'>, null, 2),
        },
      ]
    };
  }
  
  static async generateEmptyPage(page: Page & { type: 'custom' }, usingTsc: boolean): Promise<PageFileStructure> {
    const fileName = `index.${usingTsc ? 'tsx' : 'jsx'}`;

    return {
      pageKey: page.key,
      dirPath: `app/pages/${page.key}`,
      files: [
        {
          fileName,
          filePath: `app/pages/${page.key}/${fileName}`,
          fileContent: stripIndent(`
            import { useEffect, useState } from 'react';
            import { Page, usePage, useCallProcedure } from '@kottster/react';
            import { notifications } from '@mantine/notifications';
            import { Center, Stack, Text, Code, Loader } from '@mantine/core';
            ${usingTsc ? `import { type Procedures } from './api.server';\n` : ''}
            // Learn more about building custom pages:
            // https://kottster.app/docs/custom-pages/introduction

            export default () => {
              const callProcedure = useCallProcedure${usingTsc ? `<Procedures>` : ''}();
              const { pageId } = usePage();
              const [filePath, setFilePath] = useState${usingTsc ? `<string>` : ''}();
              const [loading, setLoading] = useState(true);
              
              const fetchFilePath = async () => {
                try {
                  const data = await callProcedure('getFilePath', { id: pageId });
                  setFilePath(data);
                } catch (error) {
                  notifications.show({
                    title: 'Error',
                    message: 'Failed to fetch file path.',
                    color: 'red',
                  });
                } finally {
                  setLoading(false);
                }
              };

              useEffect(() => {
                fetchFilePath();
              }, [pageId]);

              return (
                <Page>
                  <Center h='80vh'>
                    <Stack align='center' gap='md'>
                      <Text size='xl' fw={600}>
                        🎉 Your page is ready! Edit this file to get started:
                      </Text>
                      
                      {loading ? (
                        <Loader size='sm' />
                      ) : (
                        <Code block>{filePath}</Code>
                      )}
                    </Stack>
                  </Center>
                </Page>
              );
            };
          `)
        },
        {
          fileName: 'page.json',
          filePath: `app/pages/${page.key}/page.json`,
          fileContent: JSON.stringify({ ...page, key: undefined } as Omit<PublicPage & { type: 'custom' }, 'key'>, null, 2),
        },
        {
          fileName: `api.server.${usingTsc ? 'ts' : 'js'}`,
          filePath: `app/pages/${page.key}/api.server.${usingTsc ? 'ts' : 'js'}`,
          fileContent: stripIndent(`
            import { app } from '${usingTsc ? '@' : '../..'}/_server/app';

            /*
             * Custom server procedures for your page
             * 
             * These functions run on the server and can be called from your React components
             * using callProcedure('procedureName', input)
             * 
             * Learn more: https://kottster.app/docs/custom-pages/api
             */

            const controller = app.defineCustomController({
              getFilePath: async (data${usingTsc ? `: { id: string }` : ''}) => {
                return \`\${process.cwd()}/app/pages/\${data.id}/index.${usingTsc ? 'tsx' : 'jsx'}\`;
              },
            });

            export default controller;
            ${usingTsc ? `export type Procedures = typeof controller.procedures;` : ''}
          `)
        }
      ]
    };
  }

  static async generateTablePage(page: Page & { type: 'table' }, usingTsc: boolean): Promise<PageFileStructure> {
    const apiFileName = `api.server.${usingTsc ? 'ts' : 'js'}`;

    return {
      pageKey: page.key,
      dirPath: `app/pages/${page.key}`,
      files: [
        {
          fileName: 'page.json',
          filePath: `app/pages/${page.key}/page.json`,
          fileContent: JSON.stringify({ ...page, key: undefined } as Omit<PublicPage & { type: 'table' }, 'key'>, null, 2),
        },

        ...(page.config.fetchStrategy === 'customFetch' ? [
          {
            fileName: apiFileName,
            filePath: `app/pages/${page.key}/${apiFileName}`,
            fileContent: page.config.fetchStrategy === 'customFetch' ? stripIndent(`
              import { app } from '${usingTsc ? '@' : '../..'}/_server/app';
  
              const controller = app.defineTableController({
                // Add your customizations for the table here.
                // Learn more: https://kottster.app/docs/table/configuration/api
  
                customDataFetcher: async () => {
                  // Fetch data for the table using custom logic
                  return {
                    records: [],
                    total: 0
                  };
                },
              });
  
              export default controller;
            `) : stripIndent(`
              import { app } from '${usingTsc ? '@' : '../..'}/_server/app';
  
              const controller = app.defineTableController({
                // Add your customizations for the table here.
                // Learn more: https://kottster.app/docs/table/configuration/api
              });
  
              export default controller;
            `)
          }
        ] : [])
      ]
    }
  }

  static async generateCustomPage(page: Page & { type: 'custom' }, template: string, usingTsc: boolean): Promise<PageFileStructure> {
    let entryFileContent = '';
    let filesContent: Record<string, string> = {};

    switch (template as typeof PageGeneratorService.templates[number]['key']) {
      case 'empty': {
        const result = this.getEmptyPage(usingTsc, page.key);
        entryFileContent = result[0];
        filesContent = result[1];
        break;
      };
      default:
        throw new Error(`Template ${template} not found`);
    }
    
    const fileName = `index.${usingTsc ? 'tsx' : 'jsx'}`;
    const finalEntryFileContent = entryFileContent;

    return {
      pageKey: page.key,
      dirPath: `app/pages/${page.key}`,
      files: [
         {
          fileName: 'page.json',
          filePath: `app/pages/${page.key}/page.json`,
          fileContent: JSON.stringify({ ...page, key: undefined } as Omit<PublicPage & { type: 'custom' }, 'key'>, null, 2),
        },
        {
          fileName,
          filePath: `app/pages/${page.key}/${fileName}`,
          fileContent: finalEntryFileContent,
        },
        ...(await Promise.all(Object.entries(filesContent).map(async ([filePath, fileContent]) => {
          return {
            fileName: filePath.split('/').pop()!,
            filePath: `app/pages/${page.key}/${filePath}`,
            fileContent,
          };
        }))),
      ],
    };
  }

  static getEmptyPage(usingTsc: boolean, pageKey: string): [string, Record<string, string>] {
    const entryFileContent = stripIndent(`
      import { Page, useCallProcedure } from '@kottster/react';
      ${usingTsc ? `import { type Procedures } from './api.server';\n` : ''}
      // Learn more about building custom pages:
      // https://kottster.app/docs/custom-pages/introduction

      export default () => {
        // const callProcedure = useCallProcedure${usingTsc ? `<Procedures>` : ''}();

        return (
          <Page>
            <b>This is an empty page.</b> <br />
            Edit file <b>app/pages/${pageKey}/index.${usingTsc ? 'tsx' : 'jsx'}</b> to add content.
          </Page>
        );
      };
    `);

    const filesContent = {
      [usingTsc ? 'api.server.ts' : 'api.server.js']: stripIndent(`
        import { app } from '${usingTsc ? '@' : '../..'}/_server/app';

        /*
         * Custom server procedures for your page
         * 
         * These functions run on the server and can be called from your React components
         * using callProcedure('procedureName', input)
         * 
         * Learn more: https://kottster.app/docs/custom-pages/api
         */

        const controller = app.defineCustomController({
          // Define your procedures here
          // For example:
          // getMessage: async (input${usingTsc ? `: { name: string; }` : ''}) => {
          //   return { message: \`Hello, \${input.name}!\` };
          // },
        });

        export default controller;
        ${usingTsc ? `export type Procedures = typeof controller.procedures;` : ''}
      `),
    };

    return [entryFileContent, filesContent];
  }
}
