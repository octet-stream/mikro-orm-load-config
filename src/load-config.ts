import {isAbsolute, join, resolve} from "node:path"
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
    config: Options
  }
> & {loader: string}

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
): Promise<LoadConfigResult> {
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

  return {...result, loader: loader.name}
}
