import { defineConfig } from "vitepress"

export default defineConfig({
  title: "SMEditor Guide",
  description: "Guide on how to use SMEditor",
  base: "/smeditor/guide/",
  outDir: "../dist/guide",
  themeConfig: {
    search: {
      provider: "local",
    },
    nav: [{ text: "Home", link: "../" }],

    sidebar: [
      {
        text: "Introduction",
        items: [
          {
            text: "Basic Guide",
            link: "/basic-guide",
          },
        ],
      },
      {
        text: "Advanced",
        items: [
          {
            text: "Timing Tracks and Events",
            link: "/timing-events",
          },
          {
            text: "Audio Filtering",
          },
          {
            text: "Auto BPM Detection",
            link: "/auto-sync",
          },
        ],
      },
    ],
  },
})
