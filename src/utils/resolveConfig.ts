import {Configuration, type Options} from "@mikro-orm/core"

import {ResolveConfigError} from "../errors/ResolveConfigError.ts"

import {isObject} from "./isObject.ts"
import type {ConfigFactory, ImportConfigResult} from "./loaders.ts"

const isValidConfigFactoryResult = (
  config: unknown,
  contextName: string
): config is Options =>
  isObject(config) &&
  (!("contextName" in config) || config.contextName === contextName)

const isValidConfigObject = (
  config: unknown,
  contextName: string
): config is Options =>
  isObject(config) &&
  ((!("contextName" in config) && contextName === "default") ||
    config.contextName === contextName)

/**
 * Calls config factory with `contextName`, validates the result and returns `Configuration` instance.
 */
async function configFromFactory(
  fn: ConfigFactory,
  path: string,
  contextName: string
): Promise<Configuration> {
  const config = await fn(contextName)

  if (!isValidConfigFactoryResult(config, contextName)) {
    throw new ResolveConfigError(
      `Mikro ORM config '${contextName}' was not what the function exported from '${path}' provided. Ensure it returns a config object with no name, or name matching the requested one.`
    )
  }

  return new Configuration(config)
}

/**
 * Finds config in array by given `contextName`
 */
async function configFromArray(
  configs: Array<ConfigFactory | Options>,
  path: string,
  contextName: string
): Promise<Configuration> {
  for (const candidate of configs) {
    if (isValidConfigObject(candidate, contextName)) {
      return new Configuration(candidate)
    }

    if (typeof candidate === "function") {
      const result = await candidate(contextName)
      if (isValidConfigFactoryResult(result, contextName)) {
        return new Configuration(result)
      }
    }
  }

  throw new ResolveConfigError(
    `Unable to find Mikro ORM config '${contextName}' within the array exposed from the '${path}' module. Either add a config with this name to the array, or add a function that when given this name will return a configuration object without a name, or with name set to this name.`
  )
}

/**
 * Resolves raw `config` data and returns `Configuration` instance.
 *
 * @param config - Raw config data
 * @param path - Path to the config
 * @param contextName - Name of config to load out of the ORM configuration file. Used when config file exports an array or a function
 */
export async function resolveConfig(
  config: ImportConfigResult,
  path: string,
  contextName = "default"
): Promise<Configuration> {
  if (isValidConfigObject(config, contextName)) {
    return new Configuration(config)
  }

  if (typeof config === "function") {
    return configFromFactory(config, path, contextName)
  }

  if (Array.isArray(config)) {
    return configFromArray(config, path, contextName)
  }

  throw new ResolveConfigError(
    `Unable to resolve '${contextName}' config from '${path}' module. The module should have the default export with a function returning config object with matching 'contextName' property, an array of objects/functions, or a single config object`
  )
}
