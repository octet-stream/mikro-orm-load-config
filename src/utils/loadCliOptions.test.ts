import {resolve, join} from "node:path"

import {test, expect} from "vitest"

import {loadCliOptions, defaults} from "./loadCliOptions.ts"

const FIXTURES_ROOT = resolve(
  import.meta.dirname,
  "..",
  "fixtures",
  "cli-options"
)

test("Returns default options", async () => {
  const options = await loadCliOptions(join(FIXTURES_ROOT, "defaults"))

  expect(options).toStrictEqual(defaults)
})

test("package.json options will override defaults", async () => {
  const options = await loadCliOptions(join(FIXTURES_ROOT, "disabled-ts"))

  expect(options.alwaysAllowTs).toBe(false)
})
