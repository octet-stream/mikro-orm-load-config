import {defineConfig} from "tsup"

export default defineConfig({
  dts: true,
  entry: {
    "load-config": "src/index.ts"
  },
  outDir: "lib",
  format: "esm"
})
