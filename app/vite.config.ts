import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { resolve } from 'path';
import { visualizer } from 'rollup-plugin-visualizer';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isDesktop = mode === 'desktop';
  const isAnalyze = mode === 'analyze';

  return {
    plugins: [
      svelte(),
      isAnalyze &&
        visualizer({
          filename: 'dist/stats.html',
          open: true,
          gzipSize: true,
          brotliSize: true,
          template: 'treemap',
        }),
    ],
    base: './',
    resolve: {
      alias: {
        $lib: resolve(__dirname, './src/lib'),
        $components: resolve(__dirname, './src/components'),
        $assets: resolve(__dirname, './src/assets'),
      },
    },
    build: {
      outDir: isDesktop ? 'dist-desktop' : 'dist',
      emptyOutDir: true,
      sourcemap: !isDesktop,
      minify: 'esbuild',
      target: 'esnext',
      rollupOptions: {
        output: {
          // Keep chart.js in its own cache-stable chunk so re-deploys of app
          // code don't bust the browser cache for the largest dependency.
          manualChunks: {
            'vendor-chartjs': ['chart.js'],
          },
        },
      },
    },
    define: {
      __PLATFORM__: JSON.stringify(isDesktop ? 'desktop' : 'web'),
    },
    server: {
      port: 5173,
      strictPort: true,
    },
  };
});
