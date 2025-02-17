import {resolve} from "node:path"

import {Configuration} from "@mikro-orm/core"
import {glob} from "tinyglobby"
import {describe, expect, test} from "vitest"

import {discoverEntities} from "../../src/discovery.ts"

describe("discoverEntities", () => {
  test("returns a function", () => {
    expect(typeof discoverEntities(["tests/fixtures/entities/**/*.ts"])).toBe(
      "function"
    )
  })

  test("returned function creates an iterator", () => {
    const discover = discoverEntities(["tests/fixtures/entities/**/*.ts"])
    const iterator = discover(new Configuration({}, false))

    expect(iterator).not.toBeNull()
    expect(typeof iterator).toBe("object")
    expect(typeof iterator.next).toBe("function")
  })

  test("yields files matching given pattern", async () => {
    const pattern = "**/*.ts"
    const cwd = resolve(import.meta.dirname, "..", "fixtures", "entities")

    const expectedPaths = await glob(pattern, {cwd, absolute: true})
    const discover = discoverEntities(pattern, {
      cwd,
      loader: "tsx" // jiti breaks on class properties without initializer: https://github.com/unjs/jiti/issues/57
    })

    const modules = await Array.fromAsync(
      discover(new Configuration({}, false))
    )

    expect(modules.map(({path}) => path)).toEqual(expectedPaths)

    expect(modules[0]?.exports).toHaveProperty("User")
    expect(typeof modules[0]?.exports.User).toBe("function")
  })

  test("accepts array as the 1st argument", async () => {
    const pattern = "**/*.ts"
    const cwd = resolve(import.meta.dirname, "..", "fixtures", "entities")

    const expectedPaths = await glob([pattern], {cwd, absolute: true})
    const discover = discoverEntities([pattern], {
      cwd,
      loader: "tsx" // jiti breaks on class properties without initializer: https://github.com/unjs/jiti/issues/57
    })

    const modules = await Array.fromAsync(
      discover(new Configuration({}, false))
    )

    expect(modules.map(({path}) => path)).toEqual(expectedPaths)
  })

  describe("throws", () => {
    test("when called without arguments", () => {
      // @ts-expect-error
      expect(() => discoverEntities()).toThrow(
        "You shold provide at least one search pattern"
      )
    })

    test("when called with empty string", () => {
      expect(() => discoverEntities("")).toThrow(
        "You shold provide at least one search pattern"
      )
    })

    test("when called with empty array", () => {
      // @ts-expect-error
      expect(() => discoverEntities([])).toThrow(
        "You shold provide at least one search pattern"
      )
    })
  })
})
