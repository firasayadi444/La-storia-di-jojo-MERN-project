import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// Configuration Vite pour Docker - ignore les erreurs TypeScript
export default defineConfig({
  server: {
    host: "0.0.0.0",
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Ignorer les erreurs TypeScript pendant le build
    rollupOptions: {
      onwarn(warning, warn) {
        // Ignorer les warnings TypeScript
        if (warning.code === 'UNRESOLVED_IMPORT') return;
        warn(warning);
      }
    }
  },
  esbuild: {
    // Ignorer les erreurs TypeScript
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  }
});
