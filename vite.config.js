import { resolve } from 'path';
import { defineConfig } from "vite";
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  base: "/smeditor",
  appType: "mpa",
  plugins: [
    VitePWA({
      registerType: "autoUpdate",
      manifestFilename: "manifest.json",
      manifest: {
        short_name: "SMEditor",
        name: "SMEditor",
        start_url: "/smeditor/app",
        display: "standalone",
        theme_color: "#18191c",
        background_color: "#18191c",
        version: "1.0.0",
        icons: [
          {
            src: "assets/icon/icon_512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable"
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html}', 'assets/**/*'],
        ignoreURLParametersMatching: [/^flags/, /^url/, /^chartIndex/, /^chartType/],
      }
      
    })
  ],
  server: {
    host: "127.0.0.1",
  },
  build: {
    target: "esnext",
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        app: resolve(__dirname, 'app/index.html'),
        embed: resolve(__dirname, 'embed/index.html'),
      },
      output: {
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: (assetInfo) => {
          if (assetInfo.name == "sw.js") {
            return 'sw.js'
          }
          return "[name]-[hash].js"
        },
        entryFileNames: "[name].js",
      }
    }
  },
  optimizeDeps: {
    esbuildOptions: {
      target: "esnext",
    },
  },
})
