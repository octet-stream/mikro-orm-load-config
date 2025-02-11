import {expect, test} from "vitest"

import {ModuleNotFoundError, tryModule} from "../../../src/utils/tryModule.ts"

test("Resolves given import() promise", async () => {
  const promise = import("../../fixtures/loaders/config.ts")
  const actual = await tryModule(promise, {
    specifier: "../../fixtures/loaders/config.ts"
  })

  const expected = await promise

  expect(actual).toEqual(expected)
})

test("Throws an ModuleNotFoundError", async () => {
  expect.hasAssertions()

  class TestError extends Error implements NodeJS.ErrnoException {
    code = "ERR_MODULE_NOT_FOUND"
  }

  const expected = "test.ts"
  const expectedReason = new TestError("Test error message")

  try {
    await tryModule(Promise.reject(expectedReason), {
      specifier: expected
    })
  } catch (error) {
    const actual = error as ModuleNotFoundError

    expect(actual).toBeInstanceOf(ModuleNotFoundError)
    expect(actual.message).toBe(`Unable to import module "${expected}"`)
    expect(actual.cause).toBe(expectedReason)
  }
})

test("Rethrows unknown errors", async () => {
  expect.hasAssertions()

  const expected = new Error("Some generic error")

  try {
    await tryModule(Promise.reject(expected), {
      specifier: "unreachable.ts"
    })
  } catch (error) {
    expect(error).toBeInstanceOf(Error)
    expect(error).toBe(expected)
  }
})
