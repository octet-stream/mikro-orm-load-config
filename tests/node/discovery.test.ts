import {resolve} from "node:path"

import {Configuration} from "@mikro-orm/core"
import {describe, expect, test} from "vitest"

import {discoverEntities} from "../../src/discovery.ts"

describe("discoverEntities", () => {
  test("returns a function", () => {
    expect(typeof discoverEntities([])).toBe("function")
  })

  test("returned function creates an iterator", () => {
    const discover = discoverEntities([])
    const iterator = discover(new Configuration({}, false))

    expect(iterator).not.toBeNull()
    expect(typeof iterator).toBe("object")
    expect(typeof iterator.next).toBe("function")
  })

  test("yields files matching given pattern", async () => {
    const discover = discoverEntities([], {
      cwd: resolve(import.meta.dirname, "..", "fixtures", "entities"),
      loader: "tsx" // jiti breaks on class properties without initializer: https://github.com/unjs/jiti/issues/57
    })

    const [actual] = await Array.fromAsync(
      discover(new Configuration({}, false))
    )

    expect(actual?.path).toBe(
      resolve(import.meta.dirname, "..", "fixtures", "entities", "User.ts")
    )

    expect(actual?.exports).toHaveProperty("User")
    expect(typeof actual?.exports.User).toBe("function")
  })
})
