import type {Options} from "@mikro-orm/core"
import type {LilconfigResult, Loader, Loaders} from "lilconfig"
import {lilconfig} from "lilconfig"

import {createConfigNameVariants} from "./utils/createConfigNameVariants.ts"
import {createLoader} from "./utils/createLoader.ts"
import {extnames} from "./utils/extnames.ts"
import {loadCliOptions} from "./utils/loadCliOptions.ts"
import type {Replace} from "./utils/types/Replace.ts"

const name = "mikro-orm"
const base = `${name}.config`
const configNameVariants = createConfigNameVariants(base, extnames)

const withLoaders = (loader: Loader): Loaders =>
  Object.fromEntries(extnames.map(extname => [extname, loader]))

export type LoadedConfigResult = Replace<
  NonNullable<LilconfigResult>,
  {
    config: Options
  }
>

export class LoadConfigError extends Error {
  constructor(searchFrom: string, options?: ErrorOptions) {
    super(`Unable to load Mikro ORM config at ${searchFrom}`, options)
  }
}

/**
 * Loads Mikro ORM config
 */
export async function loadConfig(
  searchFrom = process.cwd()
): Promise<LoadedConfigResult> {
  const options = await loadCliOptions(searchFrom)
  const loader = await createLoader(searchFrom, options)

  const result = await lilconfig(name, {
    searchPlaces: [...options.configPaths, ...configNameVariants],
    loaders: withLoaders(loader.import)
  }).search(searchFrom)

  if (!result) {
    throw new LoadConfigError(searchFrom)
  }

  return result
}
