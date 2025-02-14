import {isAbsolute, join, resolve} from "node:path"
import type {Configuration, Options} from "@mikro-orm/core"
import type {LilconfigResult, Loaders} from "lilconfig"
import {lilconfig} from "lilconfig"

import {createConfigNameVariants} from "./utils/createConfigNameVariants.ts"
import {extnames} from "./utils/extnames.ts"
import {loadCliOptions} from "./utils/loadCliOptions.ts"
import {type ModuleLoader, createLoader} from "./utils/loaders.ts"
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

function createConfigLoaders(loader: ModuleLoader): Loaders {
  const configLoader = (specifier: string) =>
    loader.import<Options>(specifier, {default: true})

  return Object.fromEntries(extnames.map(extname => [extname, configLoader]))
}

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
  const loaders = createConfigLoaders(loader)

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
