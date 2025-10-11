import { Page, PageFileStructure, PublicPage } from '../models/page.model';
import { Template } from '../models/template.model';
import { stripIndent } from '../utils/stripIndent';

export class PageGeneratorService {

  // Info for making the picture:
  // Picture resolution: 1480x800
  // Picture background color: #f7f7f8
  // Final picture size: 960x560

  public static templates: Template[] = [
    {
      key: 'empty',
      name: 'Empty Page',
      description: 'A blank slate for your ideas. Start from scratch and build your custom page as you like.',
      pictureUrl: 'https://web.kottster.app/templates/empty.png',
      requiredDependencies: [],
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
    }
  ];

  static async generateDashboardPage(page: Page & { type: 'dashboard' }, usingTsc: boolean): Promise<PageFileStructure> {
    const indexFileName = `index.${usingTsc ? 'tsx' : 'jsx'}`;
    const apiFileName = `api.server.${usingTsc ? 'ts' : 'js'}`;
    
    return {
      pageKey: page.key,
      dirPath: `app/pages/${page.key}`,
      files: [
        {
          fileName: 'page.json',
          filePath: `app/pages/${page.key}/page.json`,
          fileContent: JSON.stringify({ ...page, key: undefined } as Omit<PublicPage & { type: 'dashboard' }, 'key'>, null, 2),
        },
        {
          fileName: indexFileName,
          filePath: `app/pages/${page.key}/${indexFileName}`,
          fileContent: stripIndent(`
            import { DashboardPage } from '@kottster/react';

            export default () => (
              <DashboardPage
                // Add your customizations for the dashboard component here.
                // Learn more: https://kottster.app/docs/ui/dashboard-page-component
              />
            );
          `)
        },
        {
          fileName: apiFileName,
          filePath: `app/pages/${page.key}/${apiFileName}`,
          fileContent: stripIndent(`
            import { app } from '${usingTsc ? '@' : '../..'}/_server/app';

            const controller = app.defineDashboardController({
              // Add your customizations for the dashboard here.
              // Learn more: https://kottster.app/docs/dashboard/configuration/api
            });

            export default controller;
          `)
        }
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
    const indexFileName = `index.${usingTsc ? 'tsx' : 'jsx'}`;
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
        {
          fileName: indexFileName,
          filePath: `app/pages/${page.key}/${indexFileName}`,
          fileContent: stripIndent(`
            import { TablePage } from '@kottster/react';

            export default () => (
              <TablePage
                // Add your customizations for the table component here.
                // Learn more: https://kottster.app/docs/ui/table-page-component
              />
            );
          `)
        },
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
      case 'dashboard_1': {
        const result = this.getDashboardPage(usingTsc);
        entryFileContent = result[0];
        filesContent = result[1];
        break;
      };
      case 'area_chart_page': {
        const result2 = this.getChartPage(usingTsc, 'AreaChart');
        entryFileContent = result2[0];
        filesContent = result2[1];
        break;
      };
      case 'line_chart_page': {
        const result2b = this.getChartPage(usingTsc, 'LineChart');
        entryFileContent = result2b[0];
        filesContent = result2b[1];
        break;
      };
      case 'bar_chart_page': {
        const result2c = this.getChartPage(usingTsc, 'BarChart');
        entryFileContent = result2c[0];
        filesContent = result2c[1];
        break;
      };
      case 'settings_page': {
        const result3 = this.getSettingsPage(usingTsc);
        entryFileContent = result3[0];
        filesContent = result3[1];
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

  static getDashboardPage(usingTsc: boolean): [string, Record<string, string>] {
    const entryFileContent = stripIndent(`
      import { useEffect, useState } from 'react';
      import { Page, useCallProcedure } from '@kottster/react';
      import { Grid, Space } from '@mantine/core';
      import '@mantine/charts/styles.css';
      import { GrowthChart } from './ui/growthChart';
      import { SourcesChart } from './ui/sourcesChart';
      import { DailyReportsTable } from './ui/dailyReportsTable';
      import { PeriodPicker } from './ui/periodPicker';
      import { Stat } from './ui/stat';
      ${usingTsc ? `import { type DailyReportsDataItem, type GrowthChartDataItem, type Metrics, type SourcesChartDataItem } from './mockup';\n import { type Procedures } from './api.server';\n` : ''}
      // Learn more about building custom pages:
      // https://kottster.app/docs/custom-pages/introduction
      
      export default () => {
        const callProcedure = useCallProcedure${usingTsc ? `<Procedures>` : ''}();
        const [periodDates, setPeriodDates] = useState${usingTsc ? `<[string | null, string | null]>` : ''}([null, null]);

        const [metricsLoading, setMetricsLoading] = useState(false);
        const [metrics, setMetrics] = useState${usingTsc ? `<Metrics>` : ''}({
          totalRevenue: 0,
          totalRevenueChange: 0,
          newUsers: 0,
          newUsersChange: 0,
          growthRate: 0,
          purchasedItems: 0,
        });

        const [growthChartLoading, setGrowthChartLoading] = useState(false);
        const [growthChartData, setGrowthChartData] = useState${usingTsc ? `<GrowthChartDataItem[]>` : ''}([]);

        const [sourceChartLoading, setSourceChartLoading] = useState(false);
        const [sourceChartData, setSourceChartData] = useState${usingTsc ? `<SourcesChartDataItem[]>` : ''}([]);

        const [dailyReportsLoading, setDailyReportsLoading] = useState(false);
        const [dailyReportsData, setDailyReportsData] = useState${usingTsc ? `<DailyReportsDataItem[]>` : ''}([]);

        const fetchMetrics = async () => {
          if (!periodDates[0] || !periodDates[1]) {
            return;
          }
          
          setMetricsLoading(true);
          try {
            const data = await callProcedure('getMetrics', {
              startDate: periodDates[0],
              endDate: periodDates[1],
            });
            setMetrics(data);
          } catch (error) {
            console.error('Error fetching metrics:', error);
          } finally {
            setMetricsLoading(false);
          }
        };

        const fetchGrowthChartData = async () => {
          if (!periodDates[0] || !periodDates[1]) {
            return;
          }

          setGrowthChartLoading(true);
          try {
            const data = await callProcedure('getGrowthChartData', {
              startDate: periodDates[0],
              endDate: periodDates[1],
            });
            setGrowthChartData(data);
          } catch (error) {
            console.error('Error fetching growth chart data:', error);
          } finally {
            setGrowthChartLoading(false);
          }
        };

        const fetchSourceChartData = async () => {
          if (!periodDates[0] || !periodDates[1]) {
            return;
          }

          setSourceChartLoading(true);
          try {
            const data = await callProcedure('getSourceChartData', {
              startDate: periodDates[0],
              endDate: periodDates[1],
            });
            setSourceChartData(data);
          } catch (error) {
            console.error('Error fetching sources data:', error);
          } finally {
            setSourceChartLoading(false);
          }
        };

        const fetchDailyReportsData = async () => {
          if (!periodDates[0] || !periodDates[1]) {
            return;
          }
          
          setDailyReportsLoading(true);
          try {
            const data = await callProcedure('getDailyReportsData', {
              startDate: periodDates[0],
              endDate: periodDates[1],
            });
            setDailyReportsData(data);
          } catch (error) {
            console.error('Error fetching daily reports data:', error);
          } finally {
            setDailyReportsLoading(false);
          }
        };

        useEffect(() => {
          fetchMetrics();
          fetchGrowthChartData();
          fetchSourceChartData();
          fetchDailyReportsData();
        }, [periodDates]);

        return (
          <Page
            headerRightSection={
              <PeriodPicker
                value={periodDates}
                onChange={setPeriodDates}
              />
            }
          >
            <Space h='sm' />

            <Grid gutter='md'>
              <Grid.Col span={3}>
                <Stat
                  label='Total Revenue'
                  value={metrics.totalRevenue.toLocaleString('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                  change={
                    metrics.totalRevenueChange
                      ? {
                          direction: metrics.totalRevenueChange > 0 ? 'up' : 'down',
                          value: metrics.totalRevenueChange.toLocaleString('en-US', {
                            style: 'percent',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 1,
                          }),
                        }
                      : undefined
                  }
                  loading={metricsLoading}
                />
              </Grid.Col>
              <Grid.Col span={3}>
                <Stat
                  label='New Users'
                  value={metrics.newUsers.toLocaleString('en-US')}
                  change={
                    metrics.newUsersChange
                      ? {
                          direction: metrics.newUsersChange > 0 ? 'up' : 'down',
                          value: metrics.newUsersChange.toLocaleString('en-US', {
                            style: 'percent',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 1,
                          }),
                        }
                      : undefined
                  }
                  loading={metricsLoading}
                />
              </Grid.Col>
              <Grid.Col span={3}>
                <Stat
                  label='Growth Rate'
                  value={metrics.growthRate.toLocaleString('en-US', {
                    style: 'percent',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 1,
                  })}
                  loading={metricsLoading}
                />
              </Grid.Col>
              <Grid.Col span={3}>
                <Stat
                  label='Purchased Items'
                  value={metrics.purchasedItems.toLocaleString('en-US')}
                  loading={metricsLoading}
                />
              </Grid.Col>
            </Grid>

            <Space h='xl' />

            <Grid>
              <Grid.Col span={8}>
                <GrowthChart data={growthChartData} loading={growthChartLoading} />
              </Grid.Col>

              <Grid.Col span={4}>
                <SourcesChart data={sourceChartData} loading={sourceChartLoading} />
              </Grid.Col>
            </Grid>

            <Space h='xl' />

            <Grid>
              <Grid.Col span={12}>
                <DailyReportsTable
                  data={dailyReportsData}
                  loading={dailyReportsLoading}
                />
              </Grid.Col>
            </Grid>
          </Page>
        );
      };
    `);

    const filesContent = {
      [usingTsc ? 'api.server.ts' : 'api.server.js']: stripIndent(`
        import { app } from '${usingTsc ? '@' : '../..'}/_server/app';
        import {
          generateMetricsMockupData,
          generateGrowthChartMockupData,
          generateSourceChartMockupData,
          generateDailyReportsMockupData,
        } from './mockup';

        /*
         * Custom server procedures for your page
         * 
         * These functions run on the server and can be called from your React components
         * using callProcedure('procedureName', input)
         * 
         * Learn more: https://kottster.app/docs/custom-pages/api
         */

        const controller = app.defineCustomController({
          getMetrics: async ({ startDate, endDate }) => {
            return generateMetricsMockupData(startDate, endDate);
          },
          getGrowthChartData: async ({ startDate, endDate }) => {
            return generateGrowthChartMockupData(startDate, endDate);
          },
          getSourceChartData: async ({ startDate, endDate }) => {
            return generateSourceChartMockupData(startDate, endDate);
          },
          getDailyReportsData: async ({ startDate, endDate }) => {
            return generateDailyReportsMockupData(startDate, endDate);
          },
        });

        export default controller;
        ${usingTsc ? `export type Procedures = typeof controller.procedures;` : ''}
      `),

      [usingTsc ? 'mockup.ts' : 'mockup.js']: stripIndent(`
        import dayjs from 'dayjs';

        ${usingTsc ? `
          
        export interface Metrics {
          totalRevenue: number;
          totalRevenueChange: number;
          newUsers: number;
          newUsersChange: number;
          growthRate: number;
          purchasedItems: number;
        }

        export interface GrowthChartDataItem {
          date: string; // YYYY-MM-DD
          users: number;
          purchasedItems: number;
        }

        export interface SourcesChartDataItem {
          name: string;
          visitors: number;
          newUsers: number;
        }

        export interface DailyReportsDataItem {
          date: string; // YYYY-MM-DD
          newUsers: number;
          conversionRate: number;
          purchases: number;
          visitors: number;
          dau: number;
          revenue: number;
          activationRate: number;
        }
        ` : ''}

        export function generateMetricsMockupData(
          startDate${usingTsc ? `: string` : ''}, 
          endDate ${usingTsc ? `: string` : ''}
        ) ${usingTsc ? `: Metrics` : ''} {
          const start = dayjs(startDate);
          const end = dayjs(endDate);
          const days = end.diff(start, 'day') + 1;

          const newUsers = Math.round(days * 100 * (0.95 + Math.random() * 0.1));
          const purchasedItems = Math.round(days * 25 * (0.95 + Math.random() * 0.1));
          const totalRevenue = Math.round(purchasedItems * 100 * (0.97 + Math.random() * 0.06));
          const growthRate = +(0.04 + Math.random() * 0.03).toFixed(3);
          const totalRevenueChange = +(0.09 + Math.random() * 0.05).toFixed(3);
          const newUsersChange = +(0.06 + Math.random() * 0.06).toFixed(3);

          return {
            totalRevenue: Math.round(totalRevenue),
            totalRevenueChange: +totalRevenueChange.toFixed(3),
            newUsers,
            newUsersChange: +newUsersChange.toFixed(3),
            growthRate: +growthRate.toFixed(3),
            purchasedItems,
          };
        }

        export function generateGrowthChartMockupData(
          startDate ${usingTsc ? `: string` : ''},
          endDate ${usingTsc ? `: string` : ''},
        ) ${usingTsc ? `: GrowthChartDataItem[]` : ''} {
          const start = dayjs(startDate);
          const end = dayjs(endDate);
          const days = end.diff(start, 'day') + 1;

          let users = 300;
          let purchasedItems = 100;

          const data${usingTsc ? `: GrowthChartDataItem[]` : ''} = [];

          for (let i = 0; i < days; i++) {
            const usersGrowth = Math.round(Math.random() * 40 * (0.95 + Math.random() * 0.4));
            const purchasedItemsGrowth = Math.round(Math.random() * 18);

            users += usersGrowth;
            purchasedItems += purchasedItemsGrowth;

            data.push({
              date: start.add(i, 'day').format('YYYY-MM-DD'),
              users,
              purchasedItems,
            });
          }

          return data;
        }

        export function generateSourceChartMockupData(
          startDate${usingTsc ? `: string` : ''},
          endDate${usingTsc ? `: string` : ''},
        )${usingTsc ? `: SourcesChartDataItem[]` : ''} {
          const sources = ['Google', 'LinkedIn', 'Instagram', 'YouTube'];
          const start = dayjs(startDate);
          const end = dayjs(endDate);
          const days = end.diff(start, 'day') + 1;

          return sources.map(name => {
            const dailyVisitors =
              name === 'Google' ? 120 :
              name === 'Facebook' ? 60 :
              40 + Math.random() * 40;

            const visitors = Math.round(dailyVisitors * days * (0.95 + Math.random() * 0.1));
            const newUsers = Math.round(visitors * (0.18 + Math.random() * 0.12));

            return { name, visitors, newUsers };
          });
        }

        export function generateDailyReportsMockupData(
          startDate${usingTsc ? `: string` : ''},
          endDate${usingTsc ? `: string` : ''},
        )${usingTsc ? `: DailyReportsDataItem[]` : ''} {
          const start = dayjs(startDate);
          const end = dayjs(endDate);
          const days = end.diff(start, 'day') + 1;

          const result${usingTsc ? `: DailyReportsDataItem[]` : ''} = [];

          for (let i = 0; i < days; i++) {
            const visitors = Math.round(800 * (0.95 + Math.random() * 0.1));
            const newUsers = Math.round(600 * (0.95 + Math.random() * 0.1));
            const purchases = Math.round(120 * (0.95 + Math.random() * 0.1));
            const revenue = Math.round(purchases * 320 * (0.97 + Math.random() * 0.06));
            const dau = Math.round(1000 * (0.95 + Math.random() * 0.1));
            const conversionRate = +(purchases / visitors).toFixed(2);
            const activationRate = +(0.20 + Math.random() * 0.25).toFixed(2);

            result.push({
              date: start.add(i, 'day').format('YYYY-MM-DD'),
              conversionRate,
              newUsers,
              purchases,
              revenue,
              activationRate,
              dau,
              visitors,
            });
          }

          return result;
        }
      `),

      [usingTsc ? 'ui/dailyReportsTable.tsx' : 'ui/dailyReportsTable.jsx']: stripIndent(`
        import {
          Card,
          Group,
          Text,
          Title,
          Table,
          Progress,
          LoadingOverlay,
          RingProgress,
        } from '@mantine/core';
        import dayjs from 'dayjs';
        ${usingTsc ? `
        import { type DailyReportsDataItem } from '../mockup';
        ` : ''}

        // Learn more about Table component:
        // https://mantine.dev/core/table/
        ${usingTsc ? `
        interface DailyReportsTableProps {
          data: DailyReportsDataItem[];
          loading?: boolean;
        }
        ` : ''}

        export function DailyReportsTable({ data, loading }${usingTsc ? `: DailyReportsTableProps` : ''}) {
          return (
            <Card withBorder radius='md' padding='lg'>
              <Title order={4} mb='md'>
                Daily Reports
              </Title>

              <Table.ScrollContainer minWidth={800}>
                <Table verticalSpacing='xs' horizontalSpacing='xs' highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Date</Table.Th>
                      <Table.Th>Visitors</Table.Th>
                      <Table.Th>New Users</Table.Th>
                      <Table.Th>Conversion Rate</Table.Th>
                      <Table.Th>DAU</Table.Th>
                      <Table.Th>Purchases</Table.Th>
                      <Table.Th>Revenue</Table.Th>
                      <Table.Th>Activation Rate</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {data.map((row) => (
                      <Table.Tr key={row.date}>
                        <Table.Td>{dayjs(row.date).format('DD MMMM (dddd)')}</Table.Td>
                        <Table.Td>{row.visitors.toLocaleString('en-US')}</Table.Td>
                        <Table.Td>{row.newUsers.toLocaleString('en-US')}</Table.Td>
                        <Table.Td>
                          <Group gap='xs' align='center'>
                            <RingProgress
                              size={24}
                              roundCaps
                              thickness={3}
                              sections={[
                                { value: row.conversionRate * 100, color: 'blue' },
                              ]}
                            />
                            <Text fw='500'>
                              {row.conversionRate.toLocaleString('en-US', {
                                style: 'percent',
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 2,
                              })}
                            </Text>
                          </Group>
                        </Table.Td>
                        <Table.Td>{row.dau.toLocaleString('en-US')}</Table.Td>
                        <Table.Td>{row.purchases.toLocaleString('en-US')}</Table.Td>
                        <Table.Td fw='500'>
                          {row.revenue.toLocaleString('en-US', {
                            style: 'currency',
                            currency: 'USD',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          })}
                        </Table.Td>
                        <Table.Td>
                          <Group justify='space-between'>
                            <Text fz='xs' c='teal' fw={700}>
                              {row.activationRate.toLocaleString('en-US', {
                                style: 'percent',
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 2,
                              })}
                            </Text>
                          </Group>
                          <Progress.Root>
                            <Progress.Section
                              value={row.activationRate * 100}
                              color='teal'
                            />

                            <Progress.Section
                              value={(1 - row.activationRate) * 100}
                              color='gray.2'
                            />
                          </Progress.Root>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>

              <LoadingOverlay
                visible={loading}
                loaderProps={{ size: 'sm', color: 'gray' }}
              />
            </Card>
          );
        }
      `),
      [usingTsc ? 'ui/growthChart.tsx' : 'ui/growthChart.jsx']: stripIndent(`
        import { Card, Title, Box, LoadingOverlay } from '@mantine/core';
        import { LineChart } from '@mantine/charts';
        import dayjs from 'dayjs';
        ${usingTsc ? `
        import { type GrowthChartDataItem } from '../mockup';
        ` : ''}

        // Learn more about LineChart component:
        // https://mantine.dev/charts/line-chart/

        ${usingTsc ? `
        interface GrowthChartProps {
          data: GrowthChartDataItem[];
          loading?: boolean;
        }
        ` : ''}

        export function GrowthChart({ data, loading }${usingTsc ? `: GrowthChartProps` : ''}) {
          const formattedData = data.map((item) => ({
            ...item,

            // Convert YYYY-MM-DD to human-friendly format
            date: dayjs(item.date).format('DD MMM'),
          }));

          return (
            <Card withBorder radius='md' padding='lg' pos='relative'>
              <Title order={4} mb='md'>
                Growth Chart
              </Title>
              <Box h={400} pr='sm'>
                <LineChart
                  h='100%'
                  data={formattedData}
                  dataKey='date'
                  curveType='linear'
                  withDots={true}
                  series={[
                    {
                      name: 'users',
                      label: 'Users',
                      color: 'blue.6',
                    },
                    {
                      name: 'purchasedItems',
                      label: 'Purchased Items',
                      color: 'teal.6',
                    },
                  ]}
                />
              </Box>

              <LoadingOverlay
                visible={loading}
                loaderProps={{ size: 'sm', color: 'gray' }}
              />
            </Card>
          );
        }
      `),

      [usingTsc ? 'ui/periodPicker.tsx' : 'ui/periodPicker.jsx']: this.getDashboardPeriodPickerComponentFileContent(usingTsc),

      [usingTsc ? 'ui/sourcesChart.tsx' : 'ui/sourcesChart.jsx']: stripIndent(`
        import { Card, Title, Box, LoadingOverlay } from '@mantine/core';
        import { BarChart } from '@mantine/charts';
        ${usingTsc ? `
        import { type SourcesChartDataItem } from '../mockup';
        ` : ''}

        // Learn more about BarChart component:
        // https://mantine.dev/charts/bar-chart/

        ${usingTsc ? `
        interface SourcesChartProps {
          data: SourcesChartDataItem[];
          loading?: boolean;
        }
        ` : ''}

        export function SourcesChart({ data, loading }${usingTsc ? `: SourcesChartProps` : ''}) {
          return (
            <Card withBorder radius='md' padding='lg' pos='relative'>
              <Title order={4} mb='md'>
                Sources
              </Title>
              <Box h={400}>
                <BarChart
                  h='100%'
                  data={data}
                  dataKey='name'
                  series={[
                    {
                      name: 'visitors',
                      label: 'Visitors',
                      color: 'blue.6',
                    },
                    {
                      name: 'newUsers',
                      label: 'New Users',
                      color: 'teal.6',
                    },
                  ]}
                />
              </Box>

              <LoadingOverlay
                visible={loading}
                loaderProps={{ size: 'sm', color: 'gray' }}
              />
            </Card>
          );
        }
      `),

      [usingTsc ? 'ui/stat.tsx' : 'ui/stat.jsx']: this.getDashboardStatComponentFileContent(usingTsc),
    };

    return [entryFileContent, filesContent];
  }

  static getChartPage(usingTsc: boolean, component: 'AreaChart' | 'LineChart' | 'BarChart'): [string, Record<string, string>] {
    const entryFileContent = stripIndent(`
      import { useEffect, useState } from 'react';
      import { Page, useCallProcedure } from '@kottster/react';
      import { Box, Card, Grid, LoadingOverlay, Space } from '@mantine/core';
      import { ${component} } from '@mantine/charts';
      import '@mantine/charts/styles.css';
      ${component !== 'BarChart' ? `import dayjs from 'dayjs';\n` : ''}      import { PeriodPicker } from './ui/periodPicker';
      import { Stat } from './ui/stat';
      ${usingTsc ? `import { type ChartDataItem } from './mockup';      import { type Procedures } from './api.server';\n` : ''}
      // Learn more about building custom pages:
      // https://kottster.app/docs/custom-pages/introduction

      export default () => {
        const callProcedure = useCallProcedure${usingTsc ? `<Procedures>` : ''}();
        const [periodDates, setPeriodDates] = useState${usingTsc ? `<[string | null, string | null]>` : ''}([null, null]);

        const [loading, setLoading] = useState(false);
        const [data, setData] = useState${usingTsc ? `<ChartDataItem[]>` : ''}([]);
        ${component === 'AreaChart' ? `
        const usersChangePercentage =
          ((data[data.length - 1]?.users - data[0]?.users) / data[0]?.users) * 100;
        ` : ''}

        const fetchGrowthChartData = async () => {
          if (!periodDates[0] || !periodDates[1]) {
            return;
          }

          setLoading(true);
          try {
            const data = await callProcedure('getGrowthChartData', {
              startDate: periodDates[0],
              endDate: periodDates[1],
            });
            setData(data);
          } catch (error) {
            console.error('Error fetching growth chart data:', error);
          } finally {
            setLoading(false);
          }
        };

        useEffect(() => {
          fetchGrowthChartData();
        }, [periodDates]);

        ${component !== 'BarChart' ? `
        const formattedData = data.map((item) => ({
          ...item,

          // Convert YYYY-MM-DD to human-friendly format
          date: dayjs(item.date).format('DD MMM'),
        }));
        ` : ''}

        return (
          <Page
            headerRightSection={
              <PeriodPicker value={periodDates} onChange={setPeriodDates} />
            }
          >
            <Space h='sm' />

            <Card withBorder radius='md' padding='lg' pos='relative'>
              <Grid mb='xl' p='md' pb='xs'>
                <Grid.Col span={3}>
                  <Stat
                    label='${component === 'LineChart' ? 'New Users' : 'Users'}'
                    ${component === 'AreaChart' ? `
                      value={data[data.length - 1]?.users.toLocaleString('en-US')}
                    ` : `
                      value={data.reduce((acc, item) => acc + item.users, 0).toLocaleString('en-US')}
                    `}
                    ${component === 'AreaChart' ? `
                    change={{
                      direction: usersChangePercentage >= 0 ? 'up' : 'down',
                      value:
                        usersChangePercentage.toLocaleString('en-US', {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 1,
                        }) + '%',
                    }}
                    ` : ''}
                  />
                </Grid.Col>
                <Grid.Col span={3}>
                  <Stat
                    label='${component === 'LineChart' ? 'New Visitors' : 'Visitors'}'
                    ${component === 'AreaChart' ? `
                      value={data[data.length - 1]?.visitors.toLocaleString('en-US')}
                    ` : `
                      value={data.reduce((acc, item) => acc + item.visitors, 0).toLocaleString('en-US')}
                    `}
                  />
                </Grid.Col>
                <Grid.Col span={3}>
                  <Stat
                    label='Purchased Items'
                    ${component === 'AreaChart' ? `
                      value={data[data.length - 1]?.purchasedItems.toLocaleString('en-US')}
                    ` : `
                      value={data.reduce((acc, item) => acc + item.purchasedItems, 0).toLocaleString('en-US')}
                    `}
                  />
                </Grid.Col>
                <Grid.Col span={3}>
                  <Stat
                    label='${component === 'LineChart' ? 'New Subscriptions' : 'Active Subscriptions'}'
                    ${component === 'AreaChart' ? `
                      value={data[data.length - 1]?.subscriptions.toLocaleString('en-US')}
                    ` : `
                      value={data.reduce((acc, item) => acc + item.subscriptions, 0).toLocaleString('en-US')}
                    `}
                  />
                </Grid.Col>
              </Grid>

              <Box h='60vh' mah='700px' pr='lg' mb='sm'>
                <${component}
                  h='100%'
                  data={${component === 'BarChart' ? 'data' : 'formattedData'}}
                  dataKey='${component === 'BarChart' ? 'location' : 'date'}'
                  ${component !== 'BarChart' ? `
                  curveType='linear'
                  withDots={${component === 'AreaChart' ? 'false' : 'true'}}
                  ` : ''}
                  series={[
                    {
                      name: 'users',
                      label: 'Users',
                      color: 'blue.6',
                    },
                    {
                      name: 'visitors',
                      label: 'Visitors',
                      color: 'grape.5',
                    },
                    {
                      name: 'purchasedItems',
                      label: 'Purchased Items',
                      color: 'lime.6',
                    },
                    {
                      name: 'subscriptions',
                      label: 'Active Subscriptions',
                      color: 'teal.6',
                    },
                  ]}
                />
              </Box>

              <LoadingOverlay
                visible={loading}
                loaderProps={{ size: 'sm', color: 'gray' }}
              />
            </Card>
          </Page>
        );
      };
    `);

    const filesContent = {
      [usingTsc ? 'api.server.ts' : 'api.server.js']: stripIndent(`
        import { app } from '${usingTsc ? '@' : '../..'}/_server/app';
        import { generateChartMockupData } from './mockup';

        /*
         * Custom server procedures for your page
         * 
         * These functions run on the server and can be called from your React components
         * using callProcedure('procedureName', input)
         * 
         * Learn more: https://kottster.app/docs/custom-pages/api
         */

        const controller = app.defineCustomController({
          getGrowthChartData: async ({ startDate, endDate }) => {
            return generateChartMockupData(startDate, endDate);
          },
        });

        export default controller;
        ${usingTsc ? `export type Procedures = typeof controller.procedures;` : ''}
      `),

      [usingTsc ? 'mockup.ts' : 'mockup.js']: {
        'LineChart': stripIndent(`
          import dayjs from 'dayjs';

          ${usingTsc ? `
          export interface ChartDataItem {
            date: string; // YYYY-MM-DD
            users: number;
            visitors: number;
            purchasedItems: number;
            subscriptions: number;
          }
          ` : ''}

          export function generateChartMockupData(
            startDate${usingTsc ? `: string` : ''},
            endDate${usingTsc ? `: string` : ''},
          )${usingTsc ? `: ChartDataItem[]` : ''} {
            const start = dayjs(startDate);
            const end = dayjs(endDate);
            const days = end.diff(start, 'day') + 1;

            const data${usingTsc ? `: ChartDataItem[]` : ''} = [];

            for (let i = 0; i < days; i++) {
              data.push({
                date: start.add(i, 'day').format('YYYY-MM-DD'),
                visitors: Math.floor(Math.random() * (300 - 200 + 1)) + 200,
                users: Math.floor(Math.random() * (200 - 150 + 1)) + 150,
                purchasedItems: Math.floor(Math.random() * (170 - 100 + 1)) + 100,
                subscriptions: Math.floor(Math.random() * (90 - 10 + 1)) + 10,
              });
            }

            return data;
          }
        `),
        'AreaChart': stripIndent(`
          import dayjs from 'dayjs';

          ${usingTsc ? `
          export interface ChartDataItem {
            date: string; // YYYY-MM-DD
            users: number;
            visitors: number;
            purchasedItems: number;
            subscriptions: number;
          }
          ` : ''}

          export function generateChartMockupData(
            startDate${usingTsc ? `: string` : ''},
            endDate${usingTsc ? `: string` : ''},
          )${usingTsc ? `: ChartDataItem[]` : ''} {
            const start = dayjs(startDate);
            const end = dayjs(endDate);
            const days = end.diff(start, 'day') + 1;

            let visitors = 1200;
            let users = 500;
            let purchasedItems = 100;
            let subscriptions = 40;

            const data${usingTsc ? `: ChartDataItem[]` : ''} = [];

            for (let i = 0; i < days; i++) {
              const visitorsGrowth = Math.round(Math.random() * 50);
              const usersGrowth = Math.round(Math.random() * 20);
              const purchasedItemsGrowth = Math.round(Math.random() * 8);
              const subscriptionsGrowth = Math.round(Math.random() * 4);

              visitors += visitorsGrowth;
              users += usersGrowth;
              purchasedItems += purchasedItemsGrowth;
              subscriptions += subscriptionsGrowth;

              data.push({
                date: start.add(i, 'day').format('YYYY-MM-DD'),
                users,
                purchasedItems,
                visitors,
                subscriptions,
              });
            }

            return data;
          }
        `),
        'BarChart': stripIndent(`
          import dayjs from 'dayjs';

          ${usingTsc ? `
          export interface ChartDataItem {
            location: string;
            users: number;
            visitors: number;
            purchasedItems: number;
            subscriptions: number;
          }
          ` : ''}

          const COUNTRIES = [
            'United States',
            'United Kingdom',
            'Germany',
            'France',
            'Japan',
            'Australia',
            'Canada',
            'Spain',
            'India',
            'Brazil',
          ];

          export function generateChartMockupData(
            startDate${usingTsc ? `: string` : ''},
            endDate${usingTsc ? `: string` : ''},
          )${usingTsc ? `: ChartDataItem[]` : ''} {
            const start = dayjs(startDate);
            const end = dayjs(endDate);
            const days = end.diff(start, 'day') + 1;

            const data = COUNTRIES.map((country, index) => {
              const countryMultiplier = 0.3 + index * 0.2 + Math.random() * 1.5;

              const users = Math.round(
                (200 + days * (10 + Math.random() * 5)) * countryMultiplier
              );
              const visitors = Math.round(
                (400 + days * (12 + Math.random() * 6)) * countryMultiplier
              );
              const purchasedItems = Math.round(
                (70 + days * (4 + Math.random() * 2)) * countryMultiplier
              );
              const subscriptions = Math.round(
                (30 + days * (0.7 + Math.random() * 0.5)) * countryMultiplier
              );

              return {
                location: country,
                users,
                visitors,
                purchasedItems,
                subscriptions,
              };
            });

            return data.sort((a, b) => b.users - a.users);
          }
        `),
      }[component],

      [usingTsc ? 'ui/periodPicker.tsx' : 'ui/periodPicker.jsx']: this.getDashboardPeriodPickerComponentFileContent(usingTsc, component === 'AreaChart' ? 'Last30Days' : 'Last7Days'),

      [usingTsc ? 'ui/stat.tsx' : 'ui/stat.jsx']: this.getDashboardStatComponentFileContent(usingTsc),
    };

    return [entryFileContent, filesContent];
  }

  static getSettingsPage(usingTsc: boolean): [string, Record<string, string>] {
    const entryFileContent = stripIndent(`
      import { useEffect, useState } from 'react';
      import { Page, useCallProcedure } from '@kottster/react';
      import {
        Button,
        Card,
        Divider,
        Group,
        Input,
        SegmentedControl,
        Select,
        Switch,
      } from '@mantine/core';
      import { SettingsBlock } from './ui/settingsBlock';
      import { modals } from '@mantine/modals';
      import { notifications } from '@mantine/notifications';
      import {
        ${usingTsc ? `
        type Settings,
        InvoicePaymentDeadline,
        SitemapUpdateFrequency,
        ` : `
        InvoicePaymentDeadline,
        SitemapUpdateFrequency,
        `}
      } from './mockup';
      ${usingTsc ? `import { type Procedures } from './api.server';\n` : ''}
      // Learn more about building custom pages:
      // https://kottster.app/docs/custom-pages/introduction

      export default () => {
        const callProcedure = useCallProcedure${usingTsc ? `<Procedures>` : ''}();
        const [settings, setSettings] = useState${usingTsc ? `<Settings>` : ''}();
        const fetchSettings = async () => {
          try {
            const data = await callProcedure('getSettings', {});
            setSettings(data);
          } catch (error) {
            console.error('Error fetching settings:', error);
          }
        };

        const updateMaintainanceMode = async (value${usingTsc ? `: boolean` : ''}) => {
          try {
            await callProcedure('updateMaintainanceMode', value);
            notifications.show({
              title: 'Success',
              message: 'Maintainance mode has been updated successfully.',
              color: 'green',
            });
            fetchSettings();
          } catch (error) {
            console.error('Error updating maintainance mode:', error);
          }
        };

        const updateSitemapUpdateFrequency = async (
          value${usingTsc ? `: SitemapUpdateFrequency` : ''}
        ) => {
          try {
            await callProcedure('updateSitemapUpdateFrequency', value);
            notifications.show({
              title: 'Success',
              message: 'Sitemap update frequency has been updated successfully.',
              color: 'green',
            });
            fetchSettings();
          } catch (error) {
            console.error('Error updating sitemap update frequency:', error);
          }
        };

        const [exportDataLoading, setExportDataLoading] = useState(false);
        const exportData = async (email${usingTsc ? `: string` : ''}) => {
          setExportDataLoading(true);
          try {
            await callProcedure('exportData', { email });
            notifications.show({
              title: 'Success',
              message: 'The data export has been initiated successfully.',
              color: 'green',
            });
            fetchSettings();
          } catch (error) {
            console.error('Error exporting data:', error);
          } finally {
            setExportDataLoading(false);
          }
        };

        const updateInvoicePaymentDeadline = async (
          value${usingTsc ? `: InvoicePaymentDeadline` : ''}
        ) => {
          try {
            await callProcedure('updateInvoicePaymentDeadline', value);
            notifications.show({
              title: 'Success',
              message: 'The deadline has been updated successfully.',
              color: 'green',
            });
            fetchSettings();
          } catch (error) {
            console.error('Error updating invoice payment deadline:', error);
          }
        };

        const [resetAllApiKeysLoading, setResetAllApiKeysLoading] = useState(false);
        const resetAllApiKeys = async () => {
          modals.openConfirmModal({
            title: 'Are you sure?',
            children: 'This action will revoke and regenerate all API keys. Are you sure you want to proceed?',
            labels: { confirm: 'Yes, reset', cancel: 'No, cancel' },
            confirmProps: { color: 'red' },
            onConfirm: async () => {
              setResetAllApiKeysLoading(true);
              try {
                await callProcedure('resetAllApiKeys', {});
                fetchSettings();
              } catch (error) {
                console.error('Error resetting all API keys:', error);
              } finally {
                setResetAllApiKeysLoading(false);
                notifications.show({
                  title: 'Success',
                  message: 'All API keys have been reset successfully.',
                  color: 'green',
                });
              }
            },
          });
        };

        useEffect(() => {
          fetchSettings();
        }, []);

        if (!settings) {
          return null;
        }

        return (
          <Page maxContentWidth={800}>
            <Card withBorder radius='md' p='md'>
              <SettingsBlock
                title='Maintainance Mode'
                description='All users will be logged out and redirected to a custom page.'
              >
                <Switch
                  defaultChecked={settings?.maintainanceMode}
                  onChange={(event) => {
                    updateMaintainanceMode(event.currentTarget.checked);
                  }}
                  size='sm'
                  label='Enabled'
                  fw={600}
                />
              </SettingsBlock>

              <Divider my='lg' />

              <SettingsBlock
                title='Sitemap Update Frequency'
                description='Set how often the sitemap should be updated.'
              >
                <Select
                  defaultValue={settings?.sitemapUpdateFrequency}
                  onChange={(value) =>
                    value &&
                    updateSitemapUpdateFrequency(value${usingTsc ? ` as SitemapUpdateFrequency` : ''})
                  }
                  checkIconPosition='right'
                  allowDeselect={false}
                  data={[
                    { value: SitemapUpdateFrequency.EveryHour, label: 'Every Hour' },
                    { value: SitemapUpdateFrequency.EveryDay, label: 'Every Day' },
                    { value: SitemapUpdateFrequency.EveryWeek, label: 'Every Week' },
                    {
                      value: SitemapUpdateFrequency.EveryMonth,
                      label: 'Every Month',
                    },
                  ]}
                />
              </SettingsBlock>

              <Divider my='lg' />

              <SettingsBlock
                title='Request Data Export'
                description='Export all user and company data as a downloadable file.'
              >
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    const formData = new FormData(event.currentTarget);
                    const email = formData.get('email')${usingTsc ? ` as string` : ''};
                    if (email) {
                      exportData(email);
                    }
                    event.currentTarget.reset();
                  }}
                >
                  <Group gap='xs'>
                    <Input
                      placeholder='Enter email address'
                      type='email'
                      size='sm'
                      w={250}
                      name='email'
                      required
                    />
                    <Button variant='light' type='submit' loading={exportDataLoading}>
                      Send
                    </Button>
                  </Group>
                </form>
              </SettingsBlock>

              <Divider my='lg' />

              <SettingsBlock
                title='Invoice Payment Deadline'
                description='Define the default period before an invoice is considered overdue.'
              >
                <SegmentedControl
                  defaultValue={settings?.invoicePaymentDeadline}
                  onChange={(value) =>
                    value &&
                    updateInvoicePaymentDeadline(value${usingTsc ? ` as InvoicePaymentDeadline` : ''})
                  }
                  data={[
                    { value: InvoicePaymentDeadline.SevenDays, label: '7 Days' },
                    { value: InvoicePaymentDeadline.FourteenDays, label: '14 Days' },
                    { value: InvoicePaymentDeadline.None, label: 'No Deadline' },
                  ]}
                />
              </SettingsBlock>

              <Divider my='lg' />

              <SettingsBlock
                title='Reset All API Keys'
                description='Revoke and regenerate API keys for all users and integrations.'
              >
                <Button
                  variant='filled'
                  color='red'
                  onClick={() => resetAllApiKeys()}
                  loading={resetAllApiKeysLoading}
                >
                  Reset API Keys
                </Button>
              </SettingsBlock>
            </Card>
          </Page>
        );
      };
    `);

    const filesContent = {
      [usingTsc ? 'api.server.ts' : 'api.server.js']: stripIndent(`
        import { app } from '${usingTsc ? '@' : '../..'}/_server/app';
        import {
          settings,
          ${usingTsc ? `
          InvoicePaymentDeadline,
          SitemapUpdateFrequency,
          ` : ''}
        } from './mockup';

        const controller = app.defineCustomController({
          getSettings: async () => {
            return settings;
          },

          updateMaintainanceMode: async (value${usingTsc ? `: boolean` : ''}) => {
            settings.maintainanceMode = value;
            return true;
          },

          updateSitemapUpdateFrequency: async (value${usingTsc ? `: SitemapUpdateFrequency` : ''}) => {
            settings.sitemapUpdateFrequency = value;
            return true;
          },

          exportData: async ({ email }) => {
            console.log('[mockup] Exporting data to:', email);
            return true;
          },

          updateInvoicePaymentDeadline: async (value${usingTsc ? `: InvoicePaymentDeadline` : ''}) => {
            settings.invoicePaymentDeadline = value;
            return true;
          },

          resetAllApiKeys: async () => {
            console.log('[mockup] Resetting all API keys');
            return true;
          },
        });

        export default controller;
        ${usingTsc ? `export type Procedures = typeof controller.procedures;` : ''}
      `),

      [usingTsc ? 'mockup.ts' : 'mockup.js']: stripIndent(`
        ${usingTsc ? `
        export enum SitemapUpdateFrequency {
          EveryHour = 'everyHour',
          EveryDay = 'everyDay',
          EveryWeek = 'everyWeek',
          EveryMonth = 'everyMonth',
        }

        export enum InvoicePaymentDeadline {
          SevenDays = '7days',
          FourteenDays = '14days',
          None = 'none',
        }

        export interface Settings {
          maintainanceMode: boolean;
          sitemapUpdateFrequency: SitemapUpdateFrequency;
          apiRequestLimit: number;
          invoicePaymentDeadline: InvoicePaymentDeadline;
        }
        ` : `
        export const SitemapUpdateFrequency = Object.freeze({
          EveryHour: "everyHour",
          EveryDay: "everyDay",
          EveryWeek: "everyWeek",
          EveryMonth: "everyMonth",
        });

        export const InvoicePaymentDeadline = Object.freeze({
          SevenDays: "7days",
          FourteenDays: "14days",
          None: "none",
        });
        `}

        export const settings = {
          maintainanceMode: false,
          sitemapUpdateFrequency: SitemapUpdateFrequency.EveryDay,
          apiRequestLimit: 100,
          invoicePaymentDeadline: InvoicePaymentDeadline.SevenDays,
        };
      `),

      [usingTsc ? 'ui/settingsBlock.tsx' : 'ui/settingsBlock.jsx']: stripIndent(`
        import { Group, Text } from '@mantine/core';
        ${usingTsc ? `
        import { ReactNode } from 'react';
        ` : ''}

        ${usingTsc ? `
        interface SettingsBlockProps {
          title: string;
          description: string;
          children: ReactNode;
        }
        ` : ''}

        export function SettingsBlock({
          title,
          description,
          children,
        }${usingTsc ? `: SettingsBlockProps` : ''}) {
          return (
            <Group justify='space-between' wrap='nowrap' gap='xl'>
              <div>
                <Text mb={4} fw={600}>
                  {title}
                </Text>
                <Text size='xs' c='dimmed'>
                  {description}
                </Text>
              </div>
              {children}
            </Group>
          );
        }
      `),
    };

    return [entryFileContent, filesContent];
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

  private static getDashboardStatComponentFileContent(usingTsc: boolean): string {
    return stripIndent(`
      import { Card, Text, Title, Badge, Group, LoadingOverlay } from '@mantine/core';

      ${usingTsc ? `
      interface StatProps {
        label: string;
        value: string | number;
        change?: {
          direction: 'up' | 'down';
          value: string;
        };
        loading?: boolean;
      }
      ` : ''}

      export function Stat({ label, value, change, loading }${usingTsc ? `: StatProps` : ''}) {
        return (
          <Card withBorder radius='md' padding='lg' pos='relative'>
            <Text color='dimmed' size='sm' mb={4}>
              {label}
            </Text>
            <Title order={2}>{value}</Title>
            {change && (
              <Badge
                color={change.direction === 'up' ? 'teal' : 'red'}
                variant='light'
                pos='absolute'
                top={20}
                right={20}
                fw='medium'
              >
                <Group gap={6}>
                  <Text size='10px'>{change.direction === 'up' ? '▲' : '▼'}</Text>
                  {change.value}
                </Group>
              </Badge>
            )}

            <LoadingOverlay
              visible={loading}
              loaderProps={{ size: 'sm', color: 'gray' }}
            />
          </Card>
        );
      }
    `);
  }

  private static getDashboardPeriodPickerComponentFileContent(usingTsc: boolean, defaultPeriod?: string): string {
    return stripIndent(`
      import { useEffect, useState } from 'react';
      import { Group, Select } from '@mantine/core';
      import { DatePickerInput } from '@mantine/dates';
      import dayjs from 'dayjs';

      // Learn more about DatePickerInput component:
      // https://mantine.dev/dates/date-picker-input/

      ${usingTsc ? `
      enum Period {
        ThisWeek = 'This week',
        LastWeek = 'Last week',
        Last7Days = 'Last 7 days',
        ThisMonth = 'This month',
        LastMonth = 'Last month',
        Last30Days = 'Last 30 days',
        Last90Days = 'Last 90 days',
        CustomPeriod = 'Custom period',
      }

      interface PeriodPickerProps {
        value: [string | null, string | null];
        onChange: (value: [string | null, string | null]) => void;
      }
      ` : `
      const Period = Object.freeze({
        ThisWeek: 'This week',
        LastWeek: 'Last week',
        Last7Days: 'Last 7 days',
        ThisMonth: 'This month',
        LastMonth: 'Last month',
        Last30Days: 'Last 30 days',
        Last90Days: 'Last 90 days',
        CustomPeriod: 'Custom period'
      });
      `}

      export function PeriodPicker({
        value,
        onChange,
      }${usingTsc ? `: PeriodPickerProps` : ''}) {
        const [period, setPeriod] = useState${usingTsc ? `<Period>` : ''}(Period.${defaultPeriod ?? 'Last7Days'});
        const [rawValue, setRawValue] = useState(value);

        useEffect(() => {
          if (rawValue[0] && rawValue[1]) {
            onChange(rawValue);
          }
        }, [rawValue]);

        useEffect(() => {
          setRawValue(value);
        }, [value]);

        useEffect(() => {
          switch (period) {
            case Period.ThisWeek:
              onChange([
                dayjs().startOf('week').format('YYYY-MM-DD'),
                dayjs().endOf('week').format('YYYY-MM-DD'),
              ]);
              break;
            case Period.LastWeek:
              onChange([
                dayjs().subtract(1, 'week').startOf('week').format('YYYY-MM-DD'),
                dayjs().subtract(1, 'week').endOf('week').format('YYYY-MM-DD'),
              ]);
              break;
            case Period.Last7Days:
              onChange([
                dayjs().subtract(6, 'day').format('YYYY-MM-DD'),
                dayjs().format('YYYY-MM-DD'),
              ]);
              break;
            case Period.ThisMonth:
              onChange([
                dayjs().startOf('month').format('YYYY-MM-DD'),
                dayjs().endOf('month').format('YYYY-MM-DD'),
              ]);
              break;
            case Period.LastMonth:
              onChange([
                dayjs().subtract(1, 'month').startOf('month').format('YYYY-MM-DD'),
                dayjs().subtract(1, 'month').endOf('month').format('YYYY-MM-DD'),
              ]);
              break;
            case Period.Last30Days:
              onChange([
                dayjs().subtract(29, 'day').format('YYYY-MM-DD'),
                dayjs().format('YYYY-MM-DD'),
              ]);
              break;
            case Period.Last90Days:
              onChange([
                dayjs().subtract(89, 'day').format('YYYY-MM-DD'),
                dayjs().format('YYYY-MM-DD'),
              ]);
              break;
          }
        }, [period]);

        return (
          <Group gap='lg'>
            <DatePickerInput
              readOnly={period !== Period.CustomPeriod}
              variant={period !== Period.CustomPeriod ? 'unstyled' : 'default'}
              type='range'
              placeholder='Select period'
              value={rawValue}
              onChange={setRawValue}
            />

            <Select
              data={Object.entries(Period).map(([key, value]) => ({
                value,
                label: value,
              }))}
              allowDeselect={false}
              checkIconPosition='right'
              maxDropdownHeight={300}
              value={period}
              onChange={(value) => setPeriod(value${usingTsc ? ` as Period` : ''})}
              defaultValue='month'
              placeholder='Select period'
            />
          </Group>
        );
      }
    `);
  }
}
