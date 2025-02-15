import type {Configuration} from "@mikro-orm/core"
import {glob} from "tinyglobby"

import {type LoaderOption, loadCliOptions} from "./utils/loadCliOptions.ts"
import {createLoader} from "./utils/loaders.ts"

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
   * @param patterns - An array of glob patterns to search for. Defaults to `['**\/*.{ts,mts}']`
   */
  (patterns: string | string[], options?: GlobDiscoveryOptions): GlobDiscovery
}

const createGlobDiscovery: CreateGlobDiscovery = (patterns, options = {}) =>
  async function* globDiscovery(
    config: Configuration
  ): AsyncGenerator<GlobDiscoveryResult> {
    const cwd = options.cwd || config.get("baseDir") || process.cwd()
    const cliOptions = await loadCliOptions(cwd)

    if (options.loader) {
      cliOptions.loader = options.loader
    }

    const loader = await createLoader(cwd, cliOptions)

    let input = Array.isArray(patterns) ? patterns.slice() : [patterns]

    if (input.length === 0) {
      input = ["**/*.{ts,mst,js,mjs}"]
    }

    const paths = await glob(input, {...options, cwd, absolute: true})
    for (const path of paths) {
      const exports = await loader.import(path)

      yield {path, exports}
    }
  }

export const discoverEntities = createGlobDiscovery
