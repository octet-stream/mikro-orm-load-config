import {defineConfig} from "tsup"

export default defineConfig({
  dts: true,
  entry: {
    "load-config": "src/load-config.ts",
    discovery: "src/discovery.ts",
    errors: "src/errors.ts"
  },
  outDir: "lib",
  format: "esm"
})
