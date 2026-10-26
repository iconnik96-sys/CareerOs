import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

const currentDir = typeof import.meta.dirname !== 'undefined' ? import.meta.dirname : process.cwd();

// Load environment variables from the unified project root (.env) if present, else fallback to current directory
const parentEnvDir = path.resolve(currentDir, '..');
const envDir = fs.existsSync(path.resolve(parentEnvDir, '.env')) ? parentEnvDir : currentDir;

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(currentDir, './src')
    }
  },
  envDir,
  server: {
    port: 3000,
    host: true
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'vendor-react';
            }
            if (id.includes('recharts')) {
              return 'vendor-charts';
            }
            if (id.includes('lucide-react') || id.includes('canvas-confetti')) {
              return 'vendor-icons';
            }
            if (id.includes('@supabase')) {
              return 'vendor-supabase';
            }
            return 'vendor-other';
          }
        }
      }
    },
    chunkSizeWarningLimit: 800
  }
});
