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
      __IS_WAILS__: JSON.stringify(isDesktop),
      __IS_WEB__: JSON.stringify(!isDesktop),
    },
    server: {
      port: 5173,
      strictPort: true,
    },
  };
});
