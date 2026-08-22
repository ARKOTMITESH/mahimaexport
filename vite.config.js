import { defineConfig } from 'vite';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Dynamically locate all HTML files in the project root directory
const getHtmlEntries = () => {
  const entries = {};
  const files = fs.readdirSync(__dirname);
  files.forEach(file => {
    if (file.endsWith('.html')) {
      const name = file.replace('.html', '');
      entries[name] = resolve(__dirname, file);
    }
  });
  return entries;
};

export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001',
      '/uploads': 'http://localhost:3001'
    }
  },
  build: {
    rollupOptions: {
      input: getHtmlEntries(),
    },
  },
});
