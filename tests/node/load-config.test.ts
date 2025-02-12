import {join, resolve} from "node:path"

import {describe, expect, test} from "vitest"

import {LoadConfigError, loadConfig} from "../../src/load-config.ts"

const FIXTURES_ROOT = resolve(import.meta.dirname, "..", "fixtures", "configs")

describe("auto detect", () => {
  test("default search place", async () => {
    const expected = await import(
      "../fixtures/configs/default-auto-detect/mikro-orm.config.ts"
    )

    const actual = await loadConfig(join(FIXTURES_ROOT, "default-auto-detect"))

    expect(actual.config).toEqual(expected.default)
  })

  test("custom search place", async () => {
    const expected = await import("../fixtures/configs/custom/config.ts")
    const actual = await loadConfig(join(FIXTURES_ROOT, "custom"))

    expect(actual.config).toEqual(expected.default)
  })
})

test("supports relative paths", async () => {
  const expected = await import("../fixtures/configs/custom/config.ts")
  const actual = await loadConfig("tests/fixtures/configs/custom")

  expect(actual.config).toEqual(expected.default)
})

test("reads config using specified loader", async () => {
  const {default: expected} = await import(
    "../fixtures/configs/tsx/package.json",

    {
      with: {type: "json"}
    }
  )

  const actual = await loadConfig("tests/fixtures/configs/tsx")

  expect(actual.loader).toBe(expected["mikro-orm"].loader)
})

test("Throws error if no config found", async () => {
  expect.hasAssertions()

  try {
    await loadConfig(
      resolve(import.meta.dirname, "..", "fixtures", "cli-options", "defaults")
    )
  } catch (error) {
    expect(error).toBeInstanceOf(LoadConfigError)
  }
})
