import type {LilconfigResult, Loader, Loaders} from "lilconfig"
import type {Options} from "@mikro-orm/core"
import {lilconfig} from "lilconfig"

import {createLoader} from "./utils/createLoader.ts"
import {loadCliOptions} from "./utils/loadCliOptions.ts"
import type {Replace} from "./utils/types/Replace.ts"

const base = "mikro-orm.config"

const searchPlaces = [
  `${base}.ts`,
  `${base}.mts`,
  `${base}.cts`,
  `${base}.js`,
  `${base}.mjs`,
  `${base}.cjs`
] as const

const extnames = [".ts", ".mts", ".cts", ".js", ".mjs", ".cjs"] as const

const withLoaders = (loader: Loader): Loaders =>
  Object.fromEntries(extnames.map(extname => [extname, loader]))

export type LoadedConfigResult = Replace<
  NonNullable<LilconfigResult>,
  {
    config: Options
  }
>

export class LoadConfigError extends Error {
  constructor(rootFile: string, options?: ErrorOptions) {
    super(`Unable to load Mikro ORM config at ${rootFile}`, options)
  }
}

/**
 * Loads Mikro ORM config
 */
export async function loadConfig(
  rootFile = process.cwd()
): Promise<LoadedConfigResult> {
  const options = await loadCliOptions(rootFile)
  const loader = await createLoader(rootFile, options)

  const result = await lilconfig("mikro-orm", {
    searchPlaces: [...options.configPaths, ...searchPlaces],
    loaders: withLoaders(loader.importModule)
  }).search(rootFile)

  if (!result) {
    throw new LoadConfigError(rootFile)
  }

  return result
}
