import {describe, expect, test, vi} from "vitest"

import {
  Configuration,
  Entity,
  type Options,
  PrimaryKey,
  defineConfig
} from "@mikro-orm/better-sqlite"

import {ResolveConfigError} from "../../../src/errors/ResolveConfigError.ts"
import {
  type ConfigFactory,
  resolveConfig
} from "../../../src/utils/resolveConfig.ts"

@Entity()
class BlankEntity {
  @PrimaryKey({type: "int", autoincrement: true})
  id!: number
}

describe("object", () => {
  test("without name", async () => {
    const input = defineConfig({
      dbName: ":memory:",
      entities: [BlankEntity]
    })

    const config = await resolveConfig(input, import.meta.filename)

    expect(config).toBeInstanceOf(Configuration)
    expect(config.get("contextName")).toBe("default")
    expect(config.getAll()).toMatchObject(input)
  })

  test("with name", async () => {
    const input = defineConfig({
      contextName: "test",
      dbName: ":memory:",
      entities: [BlankEntity]
    })

    const config = await resolveConfig(
      input,
      import.meta.filename,
      input.contextName
    )

    expect(config.get("contextName")).toBe(input.contextName)
  })

  describe("throws", () => {
    test("when called with incorrect name", async () => {
      expect.hasAssertions()

      const input = defineConfig({
        contextName: "test",
        dbName: ":memory:",
        entities: [BlankEntity]
      })

      try {
        await resolveConfig(input, import.meta.filename, "incorrect-name")
      } catch (error) {
        const actual = error as ResolveConfigError

        expect(actual).toBeInstanceOf(ResolveConfigError)
        expect(actual.message).toBe(
          `Unable to resolve 'incorrect-name' config from '${import.meta.filename}' module. The module should have the default export with a function returning config object with matching 'contextName' property, an array of objects/functions, or a single config object`
        )
      }
    })

    test("when called without name, but config has name", async () => {
      expect.hasAssertions()

      const input = defineConfig({
        contextName: "test",
        dbName: ":memory:",
        entities: [BlankEntity]
      })

      try {
        await resolveConfig(input, import.meta.filename)
      } catch (error) {
        const actual = error as ResolveConfigError

        expect(actual).toBeInstanceOf(ResolveConfigError)
        expect(actual.message).toBe(
          `Unable to resolve 'default' config from '${import.meta.filename}' module. The module should have the default export with a function returning config object with matching 'contextName' property, an array of objects/functions, or a single config object`
        )
      }
    })

    test("when called with name, but config has default name", async () => {
      expect.hasAssertions()

      const input = defineConfig({
        dbName: ":memory:",
        entities: [BlankEntity]
      })

      try {
        await resolveConfig(input, import.meta.filename, "test")
      } catch (error) {
        const actual = error as ResolveConfigError

        expect(actual).toBeInstanceOf(ResolveConfigError)
        expect(actual.message).toBe(
          `Unable to resolve 'test' config from '${import.meta.filename}' module. The module should have the default export with a function returning config object with matching 'contextName' property, an array of objects/functions, or a single config object`
        )
      }
    })
  })
})

describe("factory", () => {
  test("calls config factory with default name", async () => {
    const fn = vi.fn<ConfigFactory>(async () =>
      defineConfig({
        dbName: ":memory:",
        entities: [BlankEntity]
      })
    )

    await resolveConfig(fn, import.meta.filename)

    expect(fn).toBeCalledWith("default")
  })

  test("calls factory with given name", async () => {
    const expected = "test"

    const fn = vi.fn<ConfigFactory>(async contextName =>
      defineConfig({
        contextName,
        dbName: ":memory:",
        entities: [BlankEntity]
      })
    )

    await resolveConfig(fn, import.meta.filename, expected)

    expect(fn).toBeCalledWith(expected)
  })

  describe("throws", () => {
    test("when factory returns null", async () => {
      // @ts-expect-error The function is supposed to return null for this test
      const fn: ConfigFactory = async () => null

      try {
        await resolveConfig(fn, import.meta.filename)
      } catch (error) {
        const actual = error as ResolveConfigError

        expect(actual).toBeInstanceOf(ResolveConfigError)
        expect(actual.message).toBe(
          `Mikro ORM config 'default' was not what the function exported from '${import.meta.filename}' provided. Ensure it returns a config object with no name, or name matching the requested one.`
        )
      }
    })

    test("when factory returns config with incorrect name", async () => {
      const fn: ConfigFactory = async () =>
        defineConfig({
          contextName: "test",
          dbName: ":memory:",
          entities: [BlankEntity]
        })

      try {
        await resolveConfig(fn, import.meta.filename, "some-name")
      } catch (error) {
        const actual = error as ResolveConfigError

        expect(actual).toBeInstanceOf(ResolveConfigError)
        expect(actual.message).toBe(
          `Mikro ORM config 'some-name' was not what the function exported from '${import.meta.filename}' provided. Ensure it returns a config object with no name, or name matching the requested one.`
        )
      }
    })
  })
})

describe("array", () => {
  test("resolves config object", async () => {
    const expected = defineConfig({
      dbName: ":memory:",
      entities: [BlankEntity]
    })

    const config = await resolveConfig([expected], import.meta.filename)

    expect(config.getAll()).toMatchObject(expected)
  })

  test("calls config factory", async () => {
    const fn = vi.fn<ConfigFactory>(async () =>
      defineConfig({
        dbName: ":memory:",
        entities: [BlankEntity]
      })
    )

    await resolveConfig([fn], import.meta.filename)

    expect(fn).toBeCalled()
  })

  describe("throws", () => {
    test("when array is empty", async () => {
      try {
        await resolveConfig([], import.meta.filename)
      } catch (error) {
        const actual = error as ResolveConfigError

        expect(actual).toBeInstanceOf(ResolveConfigError)
        expect(actual.message).toBe(
          `Unable to find Mikro ORM config 'default' within the array exposed from the '${import.meta.filename}' module. Either add a config with this name to the array, or add a function that when given this name will return a configuration object without a name, or with name set to this name.`
        )
      }
    })

    test("when unable to find given config name", async () => {
      const expected = "test"

      const config = defineConfig({
        dbName: ":memory:",
        entities: [BlankEntity]
      })

      const input = Array.from(
        {
          length: 2
        },

        (_, index) =>
          ({
            ...config,

            contextName: `config-${index}`
          }) satisfies Options
      )

      try {
        await resolveConfig(input, import.meta.filename, expected)
      } catch (error) {
        const actual = error as ResolveConfigError

        expect(actual).toBeInstanceOf(ResolveConfigError)
        expect(actual.message).toBe(
          `Unable to find Mikro ORM config '${expected}' within the array exposed from the '${import.meta.filename}' module. Either add a config with this name to the array, or add a function that when given this name will return a configuration object without a name, or with name set to this name.`
        )
      }
    })
  })
})
