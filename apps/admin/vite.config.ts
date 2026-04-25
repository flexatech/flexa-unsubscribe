import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import pluginExternal, { Options } from 'vite-plugin-external';

process.env = { ...process.env, ...loadEnv(process.env.mode || 'development', process.cwd()) };

const terserOptions = {
  output: {
    comments: /translators:/i,
  },
  compress: {
    passes: 2,
  },
  mangle: {
    reserved: ['__', '_n', '_nx', '_x'],
  },
};

const externalOptions: Options = {
  interop: 'auto',
  development: {
    externals: {
      '@wordpress/hooks': 'wp.hooks',
      '@wordpress/i18n': 'wp.i18n',
      '@wordpress/api-fetch': 'wp.apiFetch',
      react: 'React',
      'react-dom': 'ReactDOM',
      'react-dom/client': 'ReactDOM',
    },
  },
  production: {
    externals: {
      '@wordpress/hooks': 'wp.hooks',
      '@wordpress/i18n': 'wp.i18n',
      '@wordpress/api-fetch': 'wp.apiFetch',
      react: 'React',
      'react-dom': 'ReactDOM',
      'react-dom/client': 'ReactDOM',
    },
  },
};

export default defineConfig({
  root: './src',

  plugins: [
    react({ jsxRuntime: 'classic' }),
    tailwindcss(),
    pluginExternal(externalOptions),
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  esbuild: {
    loader: 'tsx',
    jsx: 'transform',
  },

  build: {
    minify: 'terser',
    terserOptions: terserOptions,
    manifest: false,
    emptyOutDir: true,
    outDir: path.resolve(__dirname, '../../assets/dist/admin'),
    assetsDir: '',
    cssCodeSplit: false,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'src/main.tsx'),
      },
      output: {
        entryFileNames: 'js/[name].js',
        assetFileNames: '[name].[ext]',
      },
    },
  },

  server: {
    cors: true,
    strictPort: true,
    port: 3001,
    // Vite needs to know its public origin so it rewrites the import
    // specifiers inside served modules to absolute URLs. Without this,
    // relative imports inside main.tsx would be resolved against the
    // WP admin origin (wrong host), 404ing.
    origin: process.env.VITE_SERVER_ORIGIN || 'http://localhost:3001',
    hmr: {
      port: 3001,
      host: 'localhost',
      protocol: 'ws',
    },
  },
});
