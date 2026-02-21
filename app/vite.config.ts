import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isDesktop = mode === 'desktop';

  return {
    plugins: [svelte()],
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
