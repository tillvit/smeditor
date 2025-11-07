import { readFileSync, writeFileSync } from "node:fs";

const exclude = [
  "app/src/chart/gameTypes/noteskin/",
  "app/src/chart/component/"
]

let fileContent = readFileSync("./app/src/util/custom-script/smlib.d.ts", "utf-8");
fileContent = fileContent.replaceAll(/declare module "(.+)" {[^]+?\n}/gm, (match, module) => {
  if (module.startsWith("app/src/chart/") && !exclude.some((path) => module.startsWith(path))) {
    return match
  }
  return ""
}).replaceAll(/\n+/g, "\n").trim() + "\n";

writeFileSync("./app/src/util/custom-script/smlib.d.ts", fileContent, "utf-8");
