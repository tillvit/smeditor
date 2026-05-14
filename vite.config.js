import dynamicImportVariables from '@rollup/plugin-dynamic-import-vars';
import react from '@vitejs/plugin-react';
import { execSync } from 'child_process';
import { join, resolve } from 'path';
import { defineConfig } from "vite";
import monacoEditorEsmPlugin from 'vite-plugin-monaco-editor-esm';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(() => {
  try {
    process.env.VITE_GIT_COMMIT_DATE = execSync('git log -1 --format=%cI').toString().trimEnd()
    process.env.VITE_GIT_COMMIT_HASH = execSync('git rev-parse HEAD').toString().trimEnd().slice(0, 7)
    process.env.VITE_GIT_COMMIT_BRANCH = execSync('git rev-parse --abbrev-ref HEAD').toString().trimEnd()
  } catch (error) {
    console.error("Couldn't fetch git data", error)
  }
  return {
    base: "/smeditor/",
    appType: "mpa",
    plugins: [
      react(),
      monacoEditorEsmPlugin({
        languageWorkers: ['typescript', 'editorWorkerService'],
        customDistPath: (root, outDir) => {
          return join(root, outDir)
        }
      }),
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
        includeManifestIcons: false,
        workbox: {
          globPatterns: ['**/*.{js,css,html}', 'assets/**/*'],
          globIgnores: ['**/*.mp4'],
          ignoreURLParametersMatching: [/^flags/, /^url/, /^chartIndex/, /^chartType/],
          maximumFileSizeToCacheInBytes: 15 * 1024 * 1024,
          navigateFallback: null,
        }
      }),
    ],
    server: {
      host: "127.0.0.1",
    },
    build: {
      target: "esnext",
      rollupOptions: {
        plugins: [dynamicImportVariables({warnOnError: true})],
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
          manualChunks: () => {

          }
        }
      }
    },
    optimizeDeps: {
      esbuildOptions: {
        target: "esnext",
      },
    },
  }
})
