// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');

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
          editUrl: 'https://github.com/Xomega-Net/Xomega.Docs/',
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

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // announcementBar: {
      //   id: 'test',
      //   content:
      //     'We are looking to revamp our docs, please fill <a target="_blank" rel="noopener noreferrer" href="#">this survey</a>',
      //   backgroundColor: '#fafbfc',
      //   textColor: '#091E42',
      //   isCloseable: true,
      // },
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
            href: 'https://localhost:44391/',
            position: 'left',
            label: 'Home',
            target: null,
            className: 'xomega-link'
          },
          {
            href: 'https://localhost:44391/System/Download.aspx',
            position: 'left',
            label: 'Download',
            target: null,
            className: 'xomega-link'
          },
          {
            href: 'https://localhost:44391/System/Order.aspx',
            position: 'left',
            label: 'Order',
            target: null,
            className: 'xomega-link'
          },
          {
            type: 'doc',
            docId: 'platform/about',
            position: 'left',
            label: 'Documentation',
          },
          {
            href: 'https://localhost:44391/Forum/Forum.aspx',
            position: 'left',
            label: 'Forums',
            target: null,
            className: 'xomega-link'
          },
          {
            href: 'https://localhost:44391/Blog.aspx',
            position: 'left',
            label: 'Blog',
            target: null,
            className: 'xomega-link'
          },
          {
            href: 'https://localhost:44391/System/ContactUs.aspx',
            position: 'left',
            label: 'Contact Us',
            target: null,
            className: 'xomega-link'
          },
        ],
      },
      footer: {
        style: 'light',
        copyright: `Copyright © ${new Date().getFullYear()} Xomega.Net. All rights reserved.`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
        additionalLanguages: ['csharp']
      },
    }),
};

module.exports = config;
