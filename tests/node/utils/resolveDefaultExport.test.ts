import {expect, test} from "vitest"

import {resolveDefaultExport} from "../../../src/utils/resolveDefaultExport.ts"

test("return object with default property resolved when resolveDefault is enabled", () => {
  const expected = "Some value"

  const input = {
    default: expected
  } as const

  expect(resolveDefaultExport(input, true)).toBe(expected)
})

test("returns object w/o default property as is", () => {
  const expected = {
    dbName: ":memory:"
  } as const

  expect(resolveDefaultExport(expected)).toEqual(expected)
})
