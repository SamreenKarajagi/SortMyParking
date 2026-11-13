import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' keeps the build portable: Vercel, Netlify, GitHub Pages or any static host.
export default defineConfig({
  plugins: [react()],
  base: './',
});
