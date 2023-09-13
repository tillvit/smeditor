import { defineConfig } from "vite"

// https://vitejs.dev/config/
export default defineConfig({
  base: "",
  server: {
    host: "127.0.0.1",
  },
  build: {
    target: "esnext",
  },
  optimizeDeps: {
    esbuildOptions: {
      target: "esnext",
    },
  },
})
