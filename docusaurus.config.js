// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const {themes} = require('prism-react-renderer');
const lightTheme = themes.github;
const darkTheme = themes.dracula;

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Xomega Docs',
  tagline: 'The best .NET low-code platform for developers',
  url: 'https://xomega.net',
  baseUrl: '/docs/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/Xomega.ico',
  organizationName: 'Xomega.Net', // Usually your GitHub org/user name.
  projectName: 'Xomega.Net Docs', // Usually your repo name.

  presets: [
    [
      '@docusaurus/preset-classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          routeBasePath: '/',
          sidebarPath: require.resolve('./sidebars.js'),
          // Please change this to your repo.
          editUrl: 'https://github.com/Xomega-Net/Xomega.Docs/edit/master',
          includeCurrentVersion: true,
          lastVersion: "current",
          versions: {
            current: {
              label: "v8.11.1",
            }
          }
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],

  plugins: [
    '@ionic-internal/docusaurus-plugin-tag-manager'
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // announcementBar: {
      //   id: 'doc-blazor',
      //   content:
      //     'Check out new framework documentation on Blazor. Follow us on twitter to stay tuned for additional topics.',
      //   isCloseable: true,
      // },
      docs: {
        sidebar: {
          autoCollapseCategories: true,
          hideable: true,
        }
      },
      colorMode: {
        disableSwitch: true,
      },
      navbar: {
        logo: {
          alt: 'Xomega Logo',
          src: 'img/Logo_Xomega.png',
        },
        items: [
          {
            href: 'https://xomega.net/',
            position: 'left',
            label: 'Home',
            target: null,
            className: 'xomega-link'
          },
          {
            href: 'https://xomega.net/product/download',
            position: 'left',
            label: 'Download',
            target: null,
            className: 'xomega-link'
          },
          {
            href: 'https://xomega.net/product/pricing',
            position: 'left',
            label: 'Pricing',
            target: null,
            className: 'xomega-link'
          },
          {
            type: 'doc',
            docId: 'platform/about',
            position: 'left',
            label: 'Learn',
          },
          {
            href: 'https://xomega.net/blog',
            position: 'left',
            label: 'Blog',
            target: null,
            className: 'xomega-link'
          },
          {
            href: 'https://xomega.net/about/contactus',
            position: 'left',
            label: 'Support',
            target: null,
            className: 'xomega-link'
          },
        ],
      },
      footer: {
        style: 'light',
        links: [
          {
            html: `Copyright © ${new Date().getFullYear()} Xomega.Net. All rights reserved.`
          },
          {
            label: 'Privacy Policy',
            href: 'https://xomega.net/about/privacy'
          }
        ]
      },
      prism: {
        theme: themes.github,
        darkTheme: themes.dracula,
        additionalLanguages: ['csharp', 'cshtml'],
        magicComments : [
          // Remember to extend the default highlight class name as well!
          {
            className: 'theme-code-block-highlighted-line',
            line: 'highlight-next-line',
            block: {start: 'highlight-start', end: 'highlight-end'},
          },
          {
            className: 'code-block-added-line',
            line: 'added-next-line',
            block: { start: 'added-lines-start', end: 'added-lines-end' }
          },
          {
            className: 'code-block-removed-line',
            line: 'removed-next-line',
            block: { start: 'removed-lines-start', end: 'removed-lines-end' }
          }
        ]
      },
      tagManager: {
        trackingID: 'GTM-M48HDZN'
      },
      algolia: {
        // The application ID provided by Algolia
        appId: 'H48R2GFHER',
  
        // Public API key: it is safe to commit it
        apiKey: '67d1b0f74bfeb352b14796efcfc5fd72',
  
        indexName: 'xomega',
  
        // Optional: see doc section below
        contextualSearch: true,
  
        // Optional: Specify domains where the navigation should occur through window.location instead on history.push. Useful when our Algolia config crawls multiple documentation sites and we want to navigate with window.location.href to them.
        //externalUrlRegex: 'external\\.com|domain\\.com',
  
        // Optional: Algolia search parameters
        searchParameters: {},
  
        // Optional: path for search page that enabled by default (`false` to disable it)
        searchPagePath: 'search',
  
        //... other Algolia params
      },
    }),
};

module.exports = config;
