import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://daveshap.com',
  output: 'static',

  // Enable prefetch for instant navigation
  prefetch: true,

  // Build optimizations
  build: {
    inlineStylesheets: 'auto',
    assets: '_assets'
  },

  integrations: [
    tailwind({
      applyBaseStyles: false,
      // Reduce CSS size
      config: {
        content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}']
      }
    }),
    sitemap({
      // Add priority and changefreq
      serialize(item) {
        if (item.url === 'https://daveshap.com/') {
          item.priority = 1.0;
          item.changefreq = 'weekly';
        } else if (item.url.includes('/ai-training') || item.url.includes('/seo')) {
          item.priority = 0.9;
          item.changefreq = 'monthly';
        }
        return item;
      }
    })
  ],

  // HTML compression
  compressHTML: true,

  // Image optimization
  image: {
    domains: ['daveshap.com'],
    remotePatterns: [{ protocol: 'https' }],
    // Use sharp for better optimization
    service: {
      entrypoint: 'astro/assets/services/sharp',
      config: {
        limitInputPixels: false
      }
    }
  },

  // Vite optimizations
  vite: {
    build: {
      cssMinify: true,
      // Better chunking for caching
      rollupOptions: {
        output: {
          assetFileNames: '_assets/[name].[hash:8][extname]',
          // Split vendor chunks
          manualChunks: {
            'vendor': ['astro:content']
          }
        }
      },
      // Optimize deps
      optimizeDeps: {
        exclude: ['@astrojs/image']
      }
    },
    ssr: {
      noExternal: ['@astrojs/image']
    }
  },

});