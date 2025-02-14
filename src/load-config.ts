import {isAbsolute, join, resolve} from "node:path"
import type {Configuration} from "@mikro-orm/core"
import type {LilconfigResult, Loader, Loaders} from "lilconfig"
import {lilconfig} from "lilconfig"

import {createConfigNameVariants} from "./utils/createConfigNameVariants.ts"
import {extnames} from "./utils/extnames.ts"
import {loadCliOptions} from "./utils/loadCliOptions.ts"
import {createLoader} from "./utils/loaders.ts"
import {resolveConfig} from "./utils/resolveConfig.ts"
import type {Replace} from "./utils/types/Replace.ts"

const name = "mikro-orm"
const base = `${name}.config`
const configNameVariants = createConfigNameVariants(base, extnames)

const extraPlaces = ["dist", "build"]

const addExtraPlaces = (variant: string) =>
  extraPlaces.map(place => join(place, variant))

const extraVariants = configNameVariants
  .flatMap(variant => addExtraPlaces(variant))
  .sort()

const defaultSearchPlaces = [
  ...configNameVariants,
  ...configNameVariants.map(variant => join("src", variant)),
  ...extraVariants
]

const withLoaders = (loader: Loader): Loaders =>
  Object.fromEntries(extnames.map(extname => [extname, loader]))

export type LoadConfigResult = Replace<
  NonNullable<LilconfigResult>,
  {
    config: Configuration
  }
> & {loader: string}

export class LoadConfigError extends Error {
  constructor(searchFrom: string, options?: ErrorOptions) {
    super(`Unable to load Mikro ORM config at ${searchFrom}`, options)
  }
}

export interface LoadConfigParams {
  /**
   * A directory to search config at. Defaults to `process.cwd()`
   */
  searchFrom?: string

  /**
   * Name of config to load out of the ORM configuration file. Used when config file exports an array or a function
   */
  contextName?: string
}

/**
 * Loads Mikro ORM config at given `searchFrom` directory
 *
 * @param searchFrom - A directory to search config at. Defaults to `process.cwd()`
 * @param contextName - Name of config to load out of the ORM configuration file. Used when config file exports an array or a function
 */
export async function loadConfig({
  searchFrom = process.cwd(),
  contextName
}: LoadConfigParams = {}): Promise<LoadConfigResult> {
  if (!isAbsolute(searchFrom)) {
    searchFrom = resolve(searchFrom)
  }

  const options = await loadCliOptions(searchFrom)
  const loader = await createLoader(searchFrom, options)
  const searchPlaces = [...options.configPaths, ...defaultSearchPlaces]
  const loaders = withLoaders(loader.import)

  const result = await lilconfig(name, {
    searchPlaces,
    loaders
  }).search(searchFrom)

  if (!result) {
    throw new LoadConfigError(searchFrom)
  }

  const config = await resolveConfig(
    result.config,
    result.filepath,
    contextName
  )

  return {...result, config, loader: loader.name}
}
