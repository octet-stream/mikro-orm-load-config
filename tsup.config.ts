import {defineConfig} from "tsup"

export default defineConfig({
  dts: true,
  entry: ["src/load-config.ts"],
  outDir: "lib",
  format: "esm"
})
