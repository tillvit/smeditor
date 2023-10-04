import nwbuild from "nw-builder"
import { platform } from "os"

nwbuild({
  mode: "run",
  srcDir: "./nw",
  flavor: "sdk",
  version: platform() === "darwin" ? "0.76.1" : "latest", // inspect element is bugged on later versions
  glob: false,
  logLevel: "debug",
})
