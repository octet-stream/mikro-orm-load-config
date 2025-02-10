import {defineConfig} from "vitest/config"

export default defineConfig({
  test: {
    include: ["tests/node/**/*.test.ts"],
    typecheck: {
      enabled: true
    },
    coverage: {
      include: ["src/**/*.ts"]
    }
  }
})
