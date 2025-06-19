import { DefaultTheme, defineConfig } from 'vitepress'
import {
  groupIconMdPlugin,
  groupIconVitePlugin,
  localIconLoader
} from 'vitepress-plugin-group-icons';

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Kottster Documentation",
  description: "A simple Node.js admin panel for your app. Build an admin panel in minutes.",
  cleanUrls: true,
  themeConfig: {
    logo: { src: '/docs/img/logo.png', height: 20 },
    siteTitle: 'Kottster Docs',

    search: {
      provider: 'algolia',
      options: {
        appId: '7AELTNFN60',
        apiKey: 'eecd275adf7b1b1df986e55d32806f97',
        indexName: 'kottster',
      }
    },

    
    nav: [
      { text: 'Docs', link: '/docs/' },
      { text: 'UI Library', link: '/ui/' },
      { text: 'Website', link: 'https://kottster.app/' },
      { text: 'Live Demo', link: 'https://demo.kottster.app/' },
    ],

    sidebar: {
      '/docs/': { base: '/docs/', items: sidebarDocs() },
      '/ui/': { base: '/ui/', items: sidebarUILibrary() }
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/kottster/kottster' }
    ]
  },
  
  head: [
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
        { text: 'What is Kottster?', link: 'what-is-kottster' },
        { text: 'Quickstart', link: '/' },
        { text: 'Quickstart with Docker', link: 'quickstart-docker' },
        { text: 'Project structure', link: 'project-structure' },
        { text: 'Connect to database', link: 'data-sources' },
        { text: 'Deploying', link: 'deploying' },
        { text: 'Upgrading', link: 'upgrading' },
        
      ]
    },
    {
      text: 'Security & Privacy',
      collapsed: true,
      items: [
        { text: 'Access to database', link: 'security/database-access' },
        { text: 'Authentication', link: 'security/authentication' },
      ]
    },
    {
      text: 'Table Pages',
      collapsed: false,
      items: [
        { text: 'Introduction', link: 'table/introduction' },
        { 
          text: 'Configuration', 
          link: 'table/configuration/api',
          items: [
            { text: 'API Reference', link: 'table/configuration/api' },    
            { text: 'Custom SQL and fetch logic', link: 'table/configuration/custom-queries' },    
            { text: 'Custom relationships', link: 'table/configuration/custom-relationships' },    
          ],
        },
        { 
          text: 'Customization', 
          link: 'table/customization/add-custom-columns',
          items: [
            { text: 'Add custom columns', link: 'table/customization/add-custom-columns' },    
            { text: 'Customize columns', link: 'table/customization/customize-columns' },    
            { text: 'Add custom fields', link: 'table/customization/add-custom-fields' },    
            { text: 'Customize fields', link: 'table/customization/customize-fields' },      
            { text: 'Add custom actions', link: 'table/customization/add-custom-actions' },    
            { text: 'Add custom bulk actions', link: 'table/customization/add-custom-bulk-actions' },    
          ],
        },
      ]
    },
    {
      text: 'Custom Pages',
      collapsed: false,
      items: [
        { text: 'Introduction', link: 'custom-pages/introduction' },
        { text: 'Server API', link: 'custom-pages/api' },
        { text: 'Calling API', link: 'custom-pages/calling-api' },
      ]
    },
  ]
}

function sidebarUILibrary(): DefaultTheme.SidebarItem[] {
  return [
    {
      text: 'Introduction',
      collapsed: false,
      items: [
        { text: 'Overview', link: '/' },
      ]
    },
    {
      text: 'Components',
      collapsed: false,
      items: [
        { text: 'TablePage', link: 'table-page-component' },
        { text: 'Page', link: 'page-component' },
      ]
    },
    {
      text: 'Hooks',
      collapsed: false,
      items: [
        { text: 'usePage', link: 'use-page-hook' },
        { text: 'useCallProcedure', link: 'use-call-procedure-hook' },
      ]
    },
  ]
}