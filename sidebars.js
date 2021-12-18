/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */

// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  // By default, Docusaurus generates a sidebar from the docs folder structure
  // allDocsSidebar: [{type: 'autogenerated', dirName: '.'}],
  tutorialSidebar: [
    {
      type: 'category',
      label: 'Walk-through Tutorial',
      link: { type: 'doc', id: 'tutorial/get-started' },
      items: [{type: 'autogenerated', dirName: 'tutorial'}]
    },
    {
      type: 'category',
      label: 'Xomega Generators',
      link: { type: 'doc', id: 'generators/overview' },
      items: [{type: 'autogenerated', dirName: 'generators'}]
    },
  ],
};

module.exports = sidebars;
