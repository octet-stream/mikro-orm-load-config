import {join, resolve} from "node:path"

import {describe, expect, test} from "vitest"

import {extnames} from "../../../src/utils/extnames.ts"
import type {
  LoaderName,
  LoaderOption
} from "../../../src/utils/loadCliOptions.ts"
import {
  type ConfigLoader,
  type CreateLoaderOptions,
  ModuleUnknonwnExtensionError,
  createLoader
} from "../../../src/utils/loaders.ts"

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

        expect(actual).toEqual(expected.default)
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
    test(`returned when loader option is set to "${value}"`, async () => {
      const loader = await createLoader(FIXTURES_ROOT, {loader: value})

      expect(loader.name).toBe("native")
    })
  })

  interface Task {
    option: keyof CreateLoaderOptions
    value?: boolean
  }

  const tasks: Task[] = [
    {
      option: "alwaysAllowTs",
      value: true
    },
    {
      option: "preferTs",
      value: false
    },
    {
      option: "useTsNode",
      value: false
    }
  ]

  tasks.forEach(({option, value}) => {
    test(`is returned when ${option} option is set to ${value}`, async () => {
      const loader = await createLoader(FIXTURES_ROOT, {[option]: value})

      expect(loader.name).toBe("native" satisfies LoaderName)
    })

    test(`${option} overrides the loader option`, async () => {
      const loader = await createLoader(FIXTURES_ROOT, {
        [option]: value,
        loader: "tsx"
      })

      expect(loader.name).toBe("native" satisfies LoaderName)
    })
  })

  test("loads a .js file", async () => {
    const expected = await import("../../fixtures/loaders/config.ts")

    const loader = await createLoader(FIXTURES_ROOT, {loader: "native"})
    const actual = await loader.import(join(FIXTURES_ROOT, "config.js"))

    expect(actual).toEqual(expected.default)
  })

  test("resolves promise exposed from module", async () => {
    const expected = await import("../../fixtures/loaders/promise.ts")

    const loader = await createLoader(FIXTURES_ROOT, {loader: "native"})
    const actual = await loader.import(join(FIXTURES_ROOT, "promise.js"))

    expect(actual).toEqual(await expected.default)
  })

  test("throws ModuleUnknonwnExtensionError error", async () => {
    const loader = await createLoader(FIXTURES_ROOT, {loader: "native"})
    const specifier = join(FIXTURES_ROOT, "throws-uknown-extname.ts")

    try {
      await loader.import(specifier)
    } catch (error) {
      const actual = error as ModuleUnknonwnExtensionError

      expect(actual).toBeInstanceOf(ModuleUnknonwnExtensionError)
      expect(actual.message).toBe(
        `Unable to import "${specifier}" module.\nYou need to install either "jiti" or "tsx" to import TypeScript modules.`
      )
    }
  })

  test("re-throws unknown errors as-is", async () => {
    const loader = await createLoader(FIXTURES_ROOT, {loader: "native"})

    try {
      await loader.import(join(FIXTURES_ROOT, "throws-unknown-error.ts"))
    } catch (error) {
      const actual = error as Error

      expect(actual).not.toBeInstanceOf(ModuleUnknonwnExtensionError)
      expect(actual.message).toBe("Unknown error")
    }
  })
})
