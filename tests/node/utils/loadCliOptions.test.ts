import {join, resolve} from "node:path"

import {afterEach, describe, expect, test} from "vitest"

import {
  type CliOptions,
  type LoaderName,
  type LoaderOption,
  defaults,
  loadCliOptions
} from "../../../src/utils/loadCliOptions.ts"

const FIXTURES_ROOT = resolve(
  import.meta.dirname,
  "..",
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

describe("env", () => {
  const variables = [
    "MIKRO_ORM_CLI_LOADER",
    "MIKRO_ORM_CLI_USE_TS_NODE",
    "MIKRO_ORM_CLI_TS_CONFIG_PATH",
    "MIKRO_ORM_CLI_ALWAYS_ALLOW_TS",
    "MIKRO_ORM_CLI_VERBOSE"
  ] as const

  afterEach(() => {
    variables.forEach(variable => Reflect.deleteProperty(process.env, variable))
  })

  test("loads variables from process.env", async () => {
    process.env.MIKRO_ORM_CLI_ALWAYS_ALLOW_TS = "false"
    process.env.MIKRO_ORM_CLI_USE_TS_NODE = "false"
    process.env.MIKRO_ORM_CLI_TS_CONFIG_PATH = "tsconfig.json"
    process.env.MIKRO_ORM_CLI_LOADER = "native" satisfies LoaderName
    process.env.MIKRO_ORM_CLI_VERBOSE = "false"

    const options = await loadCliOptions(join(FIXTURES_ROOT, "defaults"))

    expect(options).toMatchObject({
      alwaysAllowTs: false,
      useTsNode: false,
      tsConfigPath: "tsconfig.json",
      loader: "native",
      verbose: false
    } satisfies CliOptions)
  })

  test("overrides an option from package.json", async () => {
    process.env.MIKRO_ORM_CLI_LOADER = "jiti" satisfies LoaderName

    const options = await loadCliOptions(join(FIXTURES_ROOT, "tsx"))

    expect(options.loader).toBe(process.env.MIKRO_ORM_CLI_LOADER)
  })

  test("casts falsy loader option to false", async () => {
    process.env.MIKRO_ORM_CLI_LOADER = "0"

    const options = await loadCliOptions(join(FIXTURES_ROOT, "defaults"))

    expect(options.loader).toBe(false)
  })

  test("casts truthy loader option to auto", async () => {
    process.env.MIKRO_ORM_CLI_LOADER = "t"

    const option = await loadCliOptions(join(FIXTURES_ROOT, "defaults"))

    expect(option.loader).toBe("auto" satisfies LoaderOption)
  })

  test("casts truthy string to boolean", async () => {
    process.env.MIKRO_ORM_CLI_ALWAYS_ALLOW_TS = "1"

    const options = await loadCliOptions(join(FIXTURES_ROOT, "defaults"))

    expect(options.alwaysAllowTs).toBe(true)
  })
})
