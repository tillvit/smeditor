import nwbuild from "nw-builder";


const baseOptions = {
  srcDir: "./nw",
  mode: "build",
  version: "latest",
  glob: false,
  logLevel: "debug",
  arch: "x64",
}

const mac_x64 = Object.assign(structuredClone(baseOptions), {
  outDir: "build/mac-x64/SMEditor",
  platform: "osx",
  app: {
    name: "SMEditor",
    genericName: "SMEditor",
    icon: "./public/assets/icon/mac.icns",
    comment: "Open source tool to view and edit StepMania charts",
    CFBundleIdentifier: "io.github.tillvit.smeditor",
    NSHumanReadableCopyright: ""
  }
})

const mac_arm = Object.assign(structuredClone(mac_x64), {
  outDir: "build/mac-arm/SMEditor",
  arch: "arm64",
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
  app: {
    name: "SMEditor",
    genericName: "SMEditor",
    icon: "./public/assets/icon/favicon.ico",
    comment: "Open source tool to view and edit StepMania charts"
  }
})

await nwbuild(mac_arm)
await nwbuild(mac_x64)
await nwbuild(win)
await nwbuild(linux)