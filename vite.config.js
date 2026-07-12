import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base must match the GitHub Pages project path: https://<user>.github.io/chem-atlas/
export default defineConfig({
  plugins: [react()],
  base: '/chem-atlas/',
});
