import nwbuild from "nw-builder";

const baseOptions = {
  srcDir: "./nw/**/*",
  mode: "build",
  version: "latest",
  flavor: "normal",
}

const mac = Object.assign(structuredClone(baseOptions), {
  outDir: "build/mac",
  platform: "osx",
  app: {
    name: "SMEditor",
    genericName: "SMEditor",
    icon: "./public/assets/icon/mac.icns",
    comment: "Tool to view and edit StepMania chart (.sm/.ssc files)."
  }
})


const win = Object.assign(structuredClone(baseOptions), {
  outDir: "build/win",
  platform: "win",
  app: {
    name: "SMEditor",
    genericName: "SMEditor",
    internalName: "SMEditor",
    company: "tillvit",
    icon: "./public/assets/icon/favicon.ico",
    comment: "Tool to view and edit StepMania chart (.sm/.ssc files)."
  }
})


const linux = Object.assign(structuredClone(baseOptions), {
  outDir: "build/linux",
  platform: "linux",
  arch: "x64",
  app: {
    name: "SMEditor",
    genericName: "SMEditor",
    icon: "./public/assets/icon/favicon.ico",
    comment: "Tool to view and edit StepMania chart (.sm/.ssc files)."
  }
})

await nwbuild(mac)
await nwbuild(win)
await nwbuild(linux)