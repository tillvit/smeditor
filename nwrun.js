import nwbuild from "nw-builder"

nwbuild({
  mode: "run",
  srcDir: "./nw",
  flavor: "sdk",
  version: "latest",
  glob: false,
  logLevel: "debug",
})
