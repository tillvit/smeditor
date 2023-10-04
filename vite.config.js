import { resolve } from 'path';
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  base: "",
  server: {
    host: "127.0.0.1",
  },
  build: {
    target: "modules",
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        app: resolve(__dirname, 'app/index.html'),
      },
    }
  },
  optimizeDeps: {
    esbuildOptions: {
      target: "modules",
    },
  },
})
