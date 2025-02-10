import {expect, test} from "vitest"

import {requireDefault} from "../../../src/utils/requireDefault.ts"

test("return object with default property resolved", () => {
  const expected = "Some value"

  const input = {
    default: expected
  }

  expect(requireDefault(input)).toBe(expected)
})

test("returns object w/o default property as is", () => {
  const expected = {
    dbName: ":memory:"
  }

  expect(requireDefault(expected)).toEqual(expected)
})
