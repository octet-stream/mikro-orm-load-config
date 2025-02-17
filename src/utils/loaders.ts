import {ModuleNotFoundError} from "../errors/ModuleNotFoundError.ts"
import {ModuleUnknonwnExtensionError} from "../errors/ModuleUnknonwnExtensionError.ts"

import {isErrnoExpeption} from "./isErrnoException.ts"
import {isTsExtname} from "./isTsExtname.ts"
import type {CliOptions} from "./loadCliOptions.ts"
import {resolveDefaultExport} from "./resolveDefaultExport.ts"
import {tryModule} from "./tryModule.ts"

export interface CreateLoaderOptions extends CliOptions {}

interface LoaderImportOptions {
  default?: boolean
}

/**
 * Configuration loader object
 */
export interface ModuleLoader {
  /**
   * The unique name of the loader
   */
  name: string

  /**
   * Configuration module import implementation.
   *
   * Returns raw config data
   *
   * @param specifier - A module path to import
   */
  import<TExports extends Record<string, unknown>>(
    specifier: string,
    options?: LoaderImportOptions
  ): Promise<TExports>
}

type LoaderFactory = (
  resolveFrom: string,
  cliSettings: CreateLoaderOptions
) => Promise<ModuleLoader>

const createLoaderFactory = (fn: LoaderFactory): LoaderFactory => fn

/**
 * Creates a loader for native [`import()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import) to import files
 */
const createNativeLoader = createLoaderFactory(async () => ({
  name: "native",
  async import(id, options) {
    try {
      return resolveDefaultExport(await import(id), options?.default)
    } catch (error) {
      if (
        !isErrnoExpeption(error) ||
        error.code !== "ERR_UNKNOWN_FILE_EXTENSION" ||
        !isTsExtname(id)
      ) {
        throw error
      }

      throw new ModuleUnknonwnExtensionError(id, {cause: error})
    }
  }
}))

/**
 * Creates a loader with [`jiti`](https://www.npmjs.com/package/jiti) as transpiler
 */
const createJitiLoader = createLoaderFactory(async resolveFrom => {
  const name = "jiti"
  const {createJiti} = await tryModule(import("jiti"), {
    specifier: name
  })

  const jiti = createJiti(resolveFrom)

  return {
    name,
    import: (id, options) =>
      jiti.import(id, options?.default ? {default: true} : undefined)
  }
})

/**
 * Creates a loader with [`tsx`](https://www.npmjs.com/package/tsx) as transpiler
 */
const createTsxLoader = createLoaderFactory(async resolveFrom => {
  const name = "tsx"
  const {tsImport} = await tryModule(import("tsx/esm/api"), {
    specifier: name
  })

  return {
    name,
    import: async (id, options) =>
      resolveDefaultExport(await tsImport(id, resolveFrom), options?.default)
  }
})

const loaders = [createJitiLoader, createTsxLoader]

/**
 * Auto detects available transpiler by iterating over the internal `loaders` array (see above) and creating each loader from the list.
 *
 * If a loader factory throws `ModuleNotFoundError` that means there's no transpiler for this package installed.
 *
 * If no loader has been successfully created, it will return native loader and let the runtime to deal with config loading.
 */
const createAutoLoader = createLoaderFactory(async (resolveFrom, options) => {
  for (const createLoader of loaders) {
    try {
      return await createLoader(resolveFrom, options)
      /* c8 ignore start */
    } catch (error) {
      if (!(error instanceof ModuleNotFoundError)) {
        throw error
      }
    }
  }

  // Fallback to the native `import()`
  return createNativeLoader(resolveFrom, options)
})
/* c8 ignore stop */

/**
 * Creates a loader depending on given `options.loader` value.
 *
 * If no loader specified, it will auto-detect whatever transpiler is installed within the project's `node_modules` by importing it via `import()`.
 */
export async function createLoader(
  resolveFrom: string,
  options: CreateLoaderOptions = {}
): Promise<ModuleLoader> {
  if (
    options.alwaysAllowTs ||
    options.preferTs === false ||
    options.useTsNode === false
  ) {
    return createNativeLoader(resolveFrom, options)
  }

  switch (options.loader) {
    case "jiti":
      return createJitiLoader(resolveFrom, options)
    case "tsx":
      return createTsxLoader(resolveFrom, options)
    case "native":
    case false:
      return createNativeLoader(resolveFrom, options)
    default:
      return createAutoLoader(resolveFrom, options)
  }
}
