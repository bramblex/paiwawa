import { defineConfig } from 'vite';

export default defineConfig({
  base: '/game/',
  server: {
    host: '127.0.0.1',
    port: 4319,
  },
  preview: {
    host: '127.0.0.1',
    port: 4320,
  },
});
