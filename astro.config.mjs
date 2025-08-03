import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://daveshap.com',
  output: 'static',
  build: {
    inlineStylesheets: 'auto',
    assets: '_assets'
  },
  integrations: [
    tailwind({
      applyBaseStyles: false,
    }),
    sitemap()
  ],
  compressHTML: true,
  vite: {
    build: {
      cssMinify: true,
      rollupOptions: {
        output: {
          assetFileNames: '_assets/[name].[hash:8][extname]'
        }
      }
    }
  }
});