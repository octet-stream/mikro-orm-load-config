import {join} from "node:path"
import {defineConfig} from "tsup"

export default defineConfig({
  dts: true,
  entry: ["load-config", "discovery", "errors"].map(entry =>
    join("src", `${entry}.ts`)
  ),
  outDir: "lib",
  format: "esm"
})
