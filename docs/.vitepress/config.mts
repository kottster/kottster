import { DefaultTheme, defineConfig } from 'vitepress'
import {
  groupIconMdPlugin,
  groupIconVitePlugin,
  localIconLoader
} from 'vitepress-plugin-group-icons';

// https://vitepress.dev/reference/site-config
export default defineConfig({
  base: '/docs/',

  title: "Kottster Documentation",
  description: "A simple Node.js admin panel for your app. Build an admin panel in minutes.",
  cleanUrls: true,
  themeConfig: {
    logo: { src: '/img/logo.png', height: 20 },
    siteTitle: 'Kottster Docs',

    search: {
      provider: 'local',
      // provider: 'algolia',
      // options: {
      //   appId: '7AELTNFN60',
      //   apiKey: 'eecd275adf7b1b1df986e55d32806f97',
      //   indexName: 'kottster',
      // }
    },

    
    nav: [
      { text: 'Docs', link: '/' },
      // TODO: Uncomment when sidebar is fixed
      // { text: 'UI Library', link: '/ui/' },
      { text: 'Website', link: 'https://kottster.app/' },
      { text: 'Live Demo', link: 'https://demo.kottster.app/' },
    ],

    // TODO: Remove this when sidebar is fixed
    sidebar: sidebarDocs(),

    // TODO: Uncomment
    // sidebar: [
    //   '/': { base: '', items: sidebarDocs() },
    //   // '/ui/': { base: '/ui/', items: sidebarUILibrary() }
    // ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/kottster/kottster' },
      { icon: 'discord', link: 'https://kottster.app/discord' },
    ]
  },
  
  head: [
    [
      'script',
      {
        src: '/docs/js/discord.js',
        defer: 'true'
      }
    ],
    [
      'script',
      {
        src: '/docs/js/analytics.js',
      }
    ],
    [
      'link',
      {
        rel: 'stylesheet',
        href: '/docs/css/style.css',
      }
    ],
    [
      'link',
      {
        rel: 'icon',
        href: '/favicon.ico',
        type: 'image/x-icon',
      }
    ],
    [
      'link',
      {
        rel: 'apple-touch-icon',
        sizes: '180x180',
        href: '/apple-touch-icon.png',
      }
    ],
    [
      'link',
      {
        rel: 'icon',
        type: 'image/png',
        href: '/favicon-16x16.png',
        sizes: '16x16',
      }
    ],
    [
      'link',
      {
        rel: 'icon',
        type: 'image/png',
        href: '/favicon-32x32.png',
        sizes: '32x32',
      }
    ],
  ],

  sitemap: {
    hostname: 'https://kottster.app',
  },

  markdown: {
    config(md) {
      md.use(groupIconMdPlugin)
    },
  },

  vite: {
    css: {
      postcss: {
        plugins: []
      }
    },
    plugins: [
      groupIconVitePlugin({
        // customIcon: {
        //   vitepress: localIconLoader(
        //     import.meta.url,
        //     '../public/vitepress-logo-mini.svg'
        //   ),
        //   firebase: 'logos:firebase'
        // }
      }),
    ]
  },
})

function sidebarDocs(): DefaultTheme.SidebarItem[] {
  return [
    {
      text: 'Getting Started',
      collapsed: false,
      items: [
        { text: 'What is Kottster?', link: '/what-is-kottster' },
        { text: 'Quickstart', link: '/' },
        { text: 'Quickstart with Docker', link: '/quickstart-docker' },
        { text: 'Project structure', link: '/project-structure' },
        { text: 'Connect to database', link: '/data-sources' },
        { text: 'Deploying', link: '/deploying' },
        { text: 'Upgrading', link: '/upgrading' },
        
      ]
    },

    {
      text: 'App Configuration',
      collapsed: true,
      items: [
        { text: 'Identity provider', link: '/app-configuration/identity-provider' },
        { text: 'Data sources', link: '/data-sources' },
        { text: 'Brending', link: '/app-configuration/brendning' },
        { text: 'Sidebar', link: '/app-configuration/sidebar' },
      ]
    },

    {
      text: 'Security & Data Access',
      collapsed: true,
      items: [
        { text: 'Roles and permissions', link: '/security/roles-and-permissions' },
        { text: 'Access to database', link: '/security/database-access' },
        { text: 'Database usage', link: '/security/database-usage' },
      ]
    },
    {
      text: 'Table Pages',
      collapsed: false,
      items: [
        { text: 'Introduction', link: '/table/introduction' },
        { 
          text: 'Configuration', 
          link: '/table/configuration/api',
          items: [
            { text: 'API Reference', link: '/table/configuration/api' },    
            { text: 'Raw SQL queries', link: '/table/configuration/raw-sql-queries' },
            { text: 'Custom data fetcher', link: '/table/configuration/custom-data-fetcher' },
            { text: 'Calculated columns', link: '/table/configuration/calculated-columns' },
            { text: 'Relationships', link: '/table/configuration/relationships' },    
          ],
        },
        { text: 'TablePage component', link: '/ui/table-page-component' },
        { 
          text: 'Customization', 
          link: '/table/customization/add-custom-columns',
          items: [
            { text: 'Add custom columns', link: '/table/customization/add-custom-columns' },    
            { text: 'Customize columns', link: '/table/customization/customize-columns' },    
            { text: 'Add custom fields', link: '/table/customization/add-custom-fields' },    
            { text: 'Customize fields', link: '/table/customization/customize-fields' },      
            { text: 'Add actions', link: '/table/customization/add-custom-actions' },    
            { text: 'Add bulk actions', link: '/table/customization/add-custom-bulk-actions' },    
          ],
        },
      ]
    },
    
    {
      text: 'Dashboard Pages',
      collapsed: false,
      items: [
        { text: 'Introduction', link: '/dashboard/introduction' },
        { 
          text: 'Configuration', 
          link: '/dashboard/configuration/api',
          items: [
            { text: 'API Reference', link: '/dashboard/configuration/api' },    
            { text: 'Raw SQL queries', link: '/dashboard/configuration/raw-sql-queries' },
            { text: 'Custom data fetcher', link: '/dashboard/configuration/custom-data-fetcher' },
          ],
        },
        { text: 'DashboardPage component', link: '/ui/dashboard-page-component' },
      ]
    },
    {
      text: 'Custom Pages',
      collapsed: false,
      items: [
        { text: 'Introduction', link: '/custom-pages/introduction' },
        { text: 'Server API', link: '/custom-pages/api' },
        { text: 'Calling API', link: '/custom-pages/calling-api' },
      ]
    },
    // TODO: Remove this section when sidebar is fixed
    {
      text: 'UI Library',
      collapsed: false,
      items: [
        { text: 'Overview', link: '/ui/overview' },
        {
          text: 'Components',
          collapsed: false,
          items: [
            { text: 'TablePage', link: '/ui/table-page-component' },
            { text: 'DashboardPage', link: '/ui/dashboard-page-component' },
            { text: 'Page', link: '/ui/page-component' },
          ]
        },
        {
          text: 'Hooks',
          collapsed: false,
          items: [
            { text: 'usePage', link: '/ui/use-page-hook' },
            { text: 'useCallProcedure', link: '/ui/use-call-procedure-hook' },
          ]
        },
      ]
    },
  ]
}

// TODO: Uncomment
// function sidebarUILibrary(): DefaultTheme.SidebarItem[] {
//   return [
//     {
//       text: 'Introduction',
//       collapsed: false,
//       items: [
//         { text: 'Overview', link: '/' },
//       ]
//     },
//     {
//       text: 'Components',
//       collapsed: false,
//       items: [
//         { text: 'TablePage', link: 'table-page-component' },
//         { text: 'Page', link: 'page-component' },
//       ]
//     },
//     {
//       text: 'Hooks',
//       collapsed: false,
//       items: [
//         { text: 'usePage', link: 'use-page-hook' },
//         { text: 'useCallProcedure', link: 'use-call-procedure-hook' },
//       ]
//     },
//   ]
// }