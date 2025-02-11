import {expect, test} from "vitest"

import {isTsExtname} from "../../../src/utils/isTsExtname.ts"

test("returns true for set of valid ts extensions", () => {
  const extnames = ["ts", "tsx", "cts", "mts", "ctsx", "mtsx"].map(e => `.${e}`)

  expect.assertions(extnames.length)

  extnames.forEach(extname => {
    expect(isTsExtname(extname), `Invalid extname ${extname}`).toBe(true)
  })
})

test("returns false for other extnames", () => {
  const extnames = ["js", "cjs", "mjs", "jsx", "cjsx", "mjsx"].map(e => `.${e}`)

  expect.assertions(extnames.length)

  extnames.forEach(extname => {
    expect(isTsExtname(extname), `Invalid extname ${extname}`).toBe(false)
  })
})
