import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://daveshap.com',
  output: 'static',
  build: {
    inlineStylesheets: 'auto',
    assets: '_assets'
  },
  integrations: [
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