import {join, resolve} from "node:path"

import {describe, expect, test} from "vitest"

import {
  type ConfigLoader,
  createLoader
} from "../../../src/utils/createLoader.ts"
import {extnames} from "../../../src/utils/extnames.ts"
import type {
  LoaderName,
  LoaderOption
} from "../../../src/utils/loadCliOptions.ts"

const FIXTURES_ROOT = resolve(
  import.meta.dirname,
  "..",
  "..",
  "fixtures",
  "loaders"
)

type SuiteName = Exclude<LoaderName, "native">

const createLoaderSuite = (name: SuiteName, loader: ConfigLoader) =>
  describe(name, () => {
    if (name !== "auto") {
      test(`returns ${name} loader`, async () => {
        expect(loader.name).toBe(name)
      })
    }

    extnames.forEach(extname => {
      test(`loads ${extname} file`, async () => {
        const expected = await import(join(FIXTURES_ROOT, `config${extname}`))
        const actual = await loader.import(join(FIXTURES_ROOT, "config.ts"))

        expect(actual).toMatchObject(expected.default)
      })
    })

    test("resolves Promise exported from a module", async () => {
      const expected = await import("../../fixtures/loaders/promise.ts")
      const actual = await loader.import(join(FIXTURES_ROOT, "promise.ts"))

      expect(actual).toEqual(await expected.default)
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

describe("native", () => {
  ;([false, "native"] satisfies LoaderOption[]).forEach(value => {
    test(`when set to "${value}"`, async () => {
      const expected = await import("../../fixtures/loaders/config.ts")

      const loader = await createLoader(FIXTURES_ROOT, {loader: value})
      const actual = await loader.import(join(FIXTURES_ROOT, "config.js"))

      expect(actual).toMatchObject(expected.default)
    })
  })
})
