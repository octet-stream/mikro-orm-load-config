import {resolve, join} from "node:path"

import {describe, test, expect} from "vitest"

import {loadConfig} from "./load-config.ts"

const FIXTURES_ROOT = resolve(import.meta.dirname, "fixtures", "configs")

describe("auto detect", () => {
  test("default search place", async () => {
    const expected = await import(
      "./fixtures/configs/default-auto-detect/mikro-orm.config.ts"
    )

    const actual = await loadConfig(join(FIXTURES_ROOT, "default-auto-detect"))

    expect(actual.config).toMatchObject(expected.default)
  })

  test("custom search place", async () => {
    const expected = await import("./fixtures/configs/custom/config.ts")

    const actual = await loadConfig(join(FIXTURES_ROOT, "custom"))

    expect(actual.config).toMatchObject(expected.default)
  })
})
