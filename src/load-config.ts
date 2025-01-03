import type {Options} from "@mikro-orm/core"
import type {LilconfigResult, Loader, Loaders} from "lilconfig"
import {lilconfig} from "lilconfig"

import {concat} from "./utils/concat.ts"
import {createConfigNameVariants} from "./utils/createConfigNameVariants.ts"
import {createExtnameVariants} from "./utils/createExtnameVariants.ts"
import {createLoader} from "./utils/createLoader.ts"
import {loadCliOptions} from "./utils/loadCliOptions.ts"
import type {Replace} from "./utils/types/Replace.ts"

const extnames = concat(
  createExtnameVariants("ts", ["", "m", "c"]),
  createExtnameVariants("js", ["", "m", "c"])
)

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

  const result = await lilconfig(name, {
    searchPlaces: [...options.configPaths, ...configNameVariants],
    loaders: withLoaders(loader.import)
  }).search(rootFile)

  if (!result) {
    throw new LoadConfigError(rootFile)
  }

  return result
}
