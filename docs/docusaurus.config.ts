import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Kottster Docs',
  tagline: 'Instant admin panel for your project',
  
  favicon: '/favicon-32x32.png',

  url: 'https://kottster.app',
  
  baseUrl: '/docs',

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  trailingSlash: false,

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  scripts: [
    {
      src: '/docs/js/analytics.js',
    }
  ],

  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          routeBasePath: '/',
          sidebarPath: './sidebars.ts',
          sidebarCollapsible: false,
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    colorMode: {
      defaultMode: 'light',
      disableSwitch: false,
      respectPrefersColorScheme: false,
    },
    
    algolia: {
      appId: '7AELTNFN60',

      apiKey: 'eecd275adf7b1b1df986e55d32806f97',

      indexName: 'kottster',

      contextualSearch: false,
    },

    navbar: {
      logo: {
        width: 'auto',
        height: '24px',
        style: {
          width: 'auto',
          height: '24px',
          marginTop: '4px',
          marginLeft: '4px'
        },
        alt: 'Kottster Logo',
        src: '/docs/img/logo.png',
      },
      title: 'Kottster',
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Docs',
        },
        {
          href: 'https://kottster.app/',
          label: 'Website',
          position: 'right',
        },
        {
          href: 'https://demo.kottster.app/',
          label: 'Live Demo',
          position: 'right',
        },
        {
          href: 'https://github.com/kottster/kottster',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
