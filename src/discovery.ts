import type {Configuration} from "@mikro-orm/core"
import {glob} from "tinyglobby"

import {type LoaderOption, loadCliOptions} from "./utils/loadCliOptions.ts"
import {createLoader} from "./utils/loaders.ts"
import type {NonEmptyArray} from "./utils/types/NonEmptyArray.ts"

function isPatternsParamValid(
  patterns: string | NonEmptyArray<string>
): boolean {
  if (typeof patterns === "string" && !!patterns) {
    return true
  }

  if (Array.isArray(patterns)) {
    return patterns.some(pattern => typeof pattern === "string" && !!pattern)
  }

  return false
}

export interface GlobDiscoveryOptions {
  cwd?: string
  ignore?: string[]
  loader?: LoaderOption
}

interface GlobDiscoveryResult {
  path: string
  exports: Record<string, unknown>
}

export interface GlobDiscovery {
  (config: Configuration): AsyncGenerator<GlobDiscoveryResult>
}

export interface CreateGlobDiscovery {
  /**
   * Takes `patterns` and returns glob discovery iterator that yields modules exports for matched files
   *
   * @param patterns - An array of glob patterns to search for
   */
  (
    patterns: string | NonEmptyArray<string>,
    options?: GlobDiscoveryOptions
  ): GlobDiscovery
}

const createGlobDiscovery: CreateGlobDiscovery = (patterns, options = {}) => {
  if (!isPatternsParamValid(patterns)) {
    throw new Error("You shold provide at least one search pattern")
  }

  return async function* discovery(
    config: Configuration
  ): AsyncGenerator<GlobDiscoveryResult> {
    const cwd = options.cwd || config.get("baseDir") || process.cwd()
    const cliOptions = await loadCliOptions(cwd)

    if (options.loader) {
      cliOptions.loader = options.loader
    }

    const loader = await createLoader(cwd, cliOptions)

    const paths = await glob(patterns, {...options, cwd, absolute: true})
    for (const path of paths) {
      const exports = await loader.import(path)

      yield {path, exports}
    }
  }
}

export const discoverEntities = createGlobDiscovery
