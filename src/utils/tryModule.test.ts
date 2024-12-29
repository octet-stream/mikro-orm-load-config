import {test, expect} from "vitest"

import {tryModule, ModuleImportError} from "./tryModule.ts"

test("Resolves given import() promise", async () => {
  const promise = import("../fixtures/loaders/config.ts")
  const actual = await tryModule(promise, {
    errorMessage: "This should not throw"
  })

  const expected = await promise

  expect(actual).toEqual(expected)
})

test("Throws an ModuleImportError", async () => {
  const expected = "Can't find a module"
  const expectedReason = {code: "ERR_MODULE_NOT_FOUND"}

  try {
    await tryModule(Promise.reject(expectedReason), {
      errorMessage: expected
    })
  } catch (error) {
    const actual = error as ModuleImportError

    expect(actual).toBeInstanceOf(ModuleImportError)
    expect(actual.message).toBe(expected)
    expect(actual.cause).toEqual(expectedReason)
  }
})

test("Rethrows unknown errors", async () => {
  const expected = new Error("Some generic error")

  try {
    await tryModule(Promise.reject(expected), {
      errorMessage: "This will not show up for unknown errors"
    })
  } catch (error) {
    expect(error).toBeInstanceOf(Error)
    expect(error).toBe(expected)
  }
})
