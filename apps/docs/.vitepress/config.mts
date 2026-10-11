import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'creation',
  description: 'Design, engineering and learning notes for Creation.',
  lang: 'en',
  base: '/docs/',
  outDir: 'dist',
  themeConfig: {
    nav: [
      { text: 'Project reference', link: '/' },
      { text: 'Design system', link: 'https://creation.jerem.io/design-system/' },
    ],
    sidebar: [
      {
        text: 'Engineering',
        items: [
          { text: 'Development', link: '/development' },
          { text: 'Architecture', link: '/architecture' },
          { text: 'Standards', link: '/standards' },
          { text: 'Delivery', link: '/delivery' },
        ],
      },
    ],
    search: { provider: 'local' },
  },
});
