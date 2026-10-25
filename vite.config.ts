import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1];
const isGitHubPages = process.env.GITHUB_ACTIONS === 'true' && !!repositoryName;
const base = isGitHubPages
  ? (repositoryName.endsWith('.github.io') ? '/' : `/${repositoryName}/`)
  : '/';

export default defineConfig(() => {
  return {
    base,
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
