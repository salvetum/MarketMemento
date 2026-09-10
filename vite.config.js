import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const staticEntries = ['vendor', 'assets', 'icon.svg', 'manifest.webmanifest', 'sw.js', '.nojekyll'];

export default defineConfig({
  base: './',
  test: {
    environment: 'jsdom',
    environmentOptions: {
      jsdom: {
        url: 'http://localhost/'
      }
    },
    setupFiles: './tests/setup.js',
    globals: true,
    include: ['tests/**/*.test.{js,jsx,ts,tsx}'],
    exclude: ['tests/**/*.test.cjs']
  },
  build: {
    modulePreload: {
      resolveDependencies(filename, dependencies) {
        return dependencies.filter(dependency => !dependency.includes('export-'));
      }
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('@nivo') || id.includes('d3-')) return 'nivo';
          if (id.includes('html2canvas')) return 'export-canvas';
          if (id.includes('jspdf') || id.includes('canvg') || id.includes('dompurify')) return 'export-pdf';
          if (id.includes('react') || id.includes('scheduler')) return 'react';
          if (id.includes('bootstrap')) return 'bootstrap';
          return 'vendor';
        }
      }
    }
  },
  plugins: [
    react(),
    {
      name: 'copy-runtime-assets',
      closeBundle() {
        const output = resolve('dist');
        mkdirSync(output, { recursive: true });
        staticEntries.forEach(entry => {
          const source = resolve(entry);
          if (!existsSync(source)) return;
          cpSync(source, resolve(output, entry), { recursive: true });
        });
      }
    }
  ]
});
