import nwbuild from "nw-builder";


const baseOptions = {
  srcDir: "./nw",
  mode: "build",
  version: "latest",
  glob: false,
  logLevel: "debug",
}

const mac = Object.assign(structuredClone(baseOptions), {
  outDir: "build/mac/SMEditor",
  version: "0.76.1",
  platform: "osx",
  app: {
    name: "SMEditor",
    genericName: "SMEditor",
    icon: "./public/assets/icon/mac.icns",
    comment: "Open source tool to view and edit StepMania charts",
    CFBundleIdentifier: "io.github.tillvit.smeditor"
  }
})


const win = Object.assign(structuredClone(baseOptions), {
  outDir: "build/win/SMEditor",
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
  outDir: "build/linux/SMEditor",
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