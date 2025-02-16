import {packageUp} from "package-up"

import {resolveDefaultExport} from "./resolveDefaultExport.ts"
import type {RequiredSome} from "./types/RequiredSome.ts"
import type {Simplify} from "./types/Simplify.ts"

export type LoaderName = "auto" | "jiti" | "tsx" | "native"

export type LoaderOption = LoaderName | false | null

/**
 * Mikro ORM CLI options
 */
export interface CliOptions {
  /**
   * Enable verbose logging (e.g. print queries used in seeder or schema diffing)
   */
  verbose?: boolean

  /**
   * A custom path to your `tsconfig.json` file
   */
  tsConfigPath?: string

  /**
   * Custom paths for Mikro ORM config lookup
   */
  configPaths?: string[]

  /**
   * A loader to import Mikro ORM config with.
   * This option enables TypeScript support if the runtime of your choice can't do that for you.
   *
   * You can use `MIKRO_ORM_CLI_LOADER` to set this option via environment variables.
   *
   * The value can be either of these: [`'ts-node'`](https://www.npmjs.com/package/ts-node), [`'jiti'`](https://www.npmjs.com/package/jiti), [`'tsx'`](https://www.npmjs.com/package/tsx), `'auto'`, `'native'`, `false`, `null`, or `undefined`.
   *
   * When set to `'native'`, Mikro ORM will try and use runtime's native [`import()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import) to load config, whether or not the runtime can handle TypeScript files.
   *
   * When set to `'auto'`, Mikro ORM will try and use loaders in following order:
   *
   * 1. `ts-node`
   * 2. `jiti`
   * 3. `tsx`
   * 4. `import()`
   *
   * If none of these can read the config, you will be asked to install either of the packages.
   *
   * The use of `ts-node` as config loader is discouraged and it might be removed in a future releases.
   *
   * @default 'auto'
   */
  loader?: LoaderOption

  /**
   * Whether or not to bypass TypeScript `loader` and let the runtime to hanlde it
   *
   * @default false
   *
   * @deprecated use `loader` option instead
   */
  alwaysAllowTs?: boolean

  /**
   * Whether or not use `ts-node` package to import the config.
   *
   * **The package must be installed!**
   *
   * @deprecated use `loader` option instead
   */
  useTsNode?: boolean

  /**
   * An alias for `useTsNode`
   *
   * @deprecated use `loader` option instead
   */
  preferTs?: boolean
}

type CastImplementation<T> = (value: string) => T

const createTypeCast =
  <T>(fn: CastImplementation<T>) =>
  (value: string | undefined) =>
    value ? fn(value) : undefined

const truthy = ["1", "true", "t"]

const falsy = ["0", "false", "f"]

const castBoolean = createTypeCast(value => truthy.includes(value))

const castLoaderOption = createTypeCast((value): LoaderOption => {
  if (truthy.includes(value)) {
    return "auto" // This option should override value from package.json, so we return auto
  }

  if (falsy.includes(value)) {
    return false
  }

  return value as LoaderOption
})

const cliOptionsFromEnv = (): CliOptions =>
  Object.fromEntries(
    Object.entries({
      alwaysAllowTs: castBoolean(process.env.MIKRO_ORM_CLI_ALWAYS_ALLOW_TS),
      useTsNode: castBoolean(process.env.MIKRO_ORM_CLI_USE_TS_NODE),
      verbose: castBoolean(process.env.MIKRO_ORM_CLI_VERBOSE),
      loader: castLoaderOption(process.env.MIKRO_ORM_CLI_LOADER),
      tsConfigPath: process.env.MIKRO_ORM_CLI_TS_CONFIG_PATH
    } satisfies CliOptions).filter(([, value]) => value != null) // filter out nullish values, so that object rest spread will not override non-null values from other objects
  )

type Defaults = RequiredSome<CliOptions, "loader" | "configPaths">

export const defaults: Defaults = {
  loader: "auto",
  configPaths: []
}

interface PackageSlice {
  "mikro-orm"?: CliOptions
}

interface PackageModule {
  default: PackageSlice
}

export async function loadCliOptions(
  searchFrom: string
): Promise<Simplify<CliOptions & Defaults>> {
  const path = await packageUp({cwd: searchFrom})

  if (!path) {
    throw Error(
      `Unable to find 'package.json' file at ${searchFrom} or its parent directories`
    )
  }

  const pkg = resolveDefaultExport(
    (await import(path, {with: {type: "json"}})) as PackageModule,

    true
  )

  return {...defaults, ...pkg["mikro-orm"], ...cliOptionsFromEnv()}
}
