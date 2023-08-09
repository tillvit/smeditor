import nwbuild from "nw-builder";

nwbuild({
  mode: "run",
  srcDir: "./nw",
  flavor:"sdk",
  glob: false
});