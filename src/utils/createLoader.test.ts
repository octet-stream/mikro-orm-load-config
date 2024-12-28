import {resolve, join} from "node:path"

import {describe, test, expect} from "vitest"

import {createLoader, type ConfigLoader} from "./createLoader.ts"

const FIXTURES_ROOT = resolve(import.meta.dirname, "..", "fixtures", "loaders")

const createLoaderSuite = (name: string, loader: ConfigLoader) =>
  describe(name, () => {
    if (name !== "auto") {
      test(`returns ${name} loader`, async () => {
        expect(loader.name).toBe(name)
      })
    }
    ;["ts", "mts", "cts", "js", "cjs", "mjs"].forEach(extname => {
      test(`loads ${extname} file`, async () => {
        const expected = await import(`../fixtures/loaders/config.${extname}`)
        const actual = await loader.importModule(
          join(FIXTURES_ROOT, "config.ts")
        )

        expect(actual).toMatchObject(expected.default)
      })
    })
  })

describe("auto detect", async () => {
  const loader = await createLoader(FIXTURES_ROOT)

  test("defaults to jiti", () => {
    expect(loader.name).toBe("jiti")
  })

  createLoaderSuite("auto", loader)
})

test("jiti", async () => {
  const loader = await createLoader(FIXTURES_ROOT, {loader: "jiti"})

  expect(loader.name).toBe("jiti")
})

createLoaderSuite("tsx", await createLoader(FIXTURES_ROOT, {loader: "tsx"}))

describe("disabled", () => {
  test("loads js module using import()", async () => {
    const expected = await import("../fixtures/loaders/config.js")

    const loader = await createLoader(FIXTURES_ROOT, {loader: false})
    const actual = await loader.importModule(join(FIXTURES_ROOT, "config.js"))

    expect(actual).toMatchObject(expected.default)
  })
})
