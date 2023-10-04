import nwbuild from "nw-builder";


const baseOptions = {
  srcDir: "./nw",
  mode: "build",
  version: "latest",
  glob: false,
  logLevel: "debug",
}

const mac = Object.assign(structuredClone(baseOptions), {
  outDir: "build/SMEditor-Mac",
  platform: "osx",
  version: "0.76.1",
  app: {
    name: "SMEditor",
    genericName: "SMEditor",
    icon: "./public/assets/icon/mac.icns",
    comment: "Open source tool to view and edit StepMania charts"
  }
})


const win = Object.assign(structuredClone(baseOptions), {
  outDir: "build/SMEditor-Windows",
  platform: "win",
  app: {
    name: "SMEditor",
    genericName: "SMEditor",
    internalName: "SMEditor",
    company: "tillvit",
    icon: "./public/assets/icon/favicon.ico",
    comment: "Open source tool to view and edit StepMania charts"
  }
})


const linux = Object.assign(structuredClone(baseOptions), {
  outDir: "build/SMEditor-Linux",
  platform: "linux",
  arch: "x64",
  app: {
    name: "SMEditor",
    genericName: "SMEditor",
    icon: "./public/assets/icon/favicon.ico",
    comment: "Open source tool to view and edit StepMania charts"
  }
})

await nwbuild(mac)
await nwbuild(win)
await nwbuild(linux)