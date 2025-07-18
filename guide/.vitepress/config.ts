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
          {
            text: "XMod vs CMod",
            link: "/xmod-cmod",
          },
          {
            text: "Timing Tracks and Events",
            link: "/timing-events",
          },
          {
            text: "Parity Checking",
            link: "/parity",
          },
        ],
      },
      {
        text: "Advanced",
        items: [
          // {
          //   text: "Audio Filtering",
          // },
          {
            text: "Auto BPM Detection",
            link: "/auto-sync",
          },
          {
            text: "Scripting",
            link: "/scripting",
          },
        ],
      },
    ],
  },
})
