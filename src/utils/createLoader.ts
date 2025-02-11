import type {Options} from "@mikro-orm/core"

import {isErrnoExpeption} from "./isErrnoException.ts"
import {isTsExtname} from "./isTsExtname.ts"
import type {CliOptions} from "./loadCliOptions.ts"
import {requireDefault} from "./requireDefault.ts"
import {ModuleNotFoundError, tryModule} from "./tryModule.ts"

export interface ModuleUnknonwnExtensionErrorOptions extends ErrorOptions {
  cause: NodeJS.ErrnoException
}

/* c8 ignore start */
export class ModuleUnknonwnExtensionError extends Error {
  readonly cause: NodeJS.ErrnoException

  constructor(specifier: string, options: ModuleUnknonwnExtensionErrorOptions) {
    const {cause, ...rest} = options

    super(
      `Unable to import "${specifier}" module.\nYou need to install either "ts-node", "jiti", or "tsx" to import TypeScript modules.`,

      rest
    )

    this.cause = cause
  }
}
/* c8 ignore stop */

export interface ConfigLoader {
  name: string
  import(id: string): Promise<Options>
}

export type CreateConfigLoader = (
  resolveFrom: string
) => ConfigLoader | Promise<ConfigLoader>

/**
 * Creates a loader for native [`import()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import) to import files
 */
const createNativeLoader: CreateConfigLoader = (): ConfigLoader => ({
  name: "native",
  import: async id =>
    import(id)
      .then(result => requireDefault<Options>(result))
      /* c8 ignore start */
      .catch((error): never => {
        if (
          !isErrnoExpeption(error) ||
          error.code !== "ERR_UNKNOWN_FILE_EXTENSION" ||
          !isTsExtname(id)
        ) {
          throw error
        }

        throw new ModuleUnknonwnExtensionError(id, {cause: error})
      })
  /* c8 ignore stop */
})

/**
 * Creates a loader with [`jiti`](https://www.npmjs.com/package/jiti) as transpiler
 */
const createJitiLoader: CreateConfigLoader = async (
  resolveFrom: string
): Promise<ConfigLoader> => {
  const name = "jiti"
  const {createJiti} = await tryModule(import("jiti"), {
    specifier: name
  })

  const jiti = createJiti(resolveFrom)

  return {
    name,
    import: id => jiti.import(id, {default: true})
  }
}

/**
 * Creates a loader with [`tsx`](https://www.npmjs.com/package/tsx) as transpiler
 */
const createTsxLoader: CreateConfigLoader = async resolveFrom => {
  const name = "tsx"
  const {tsImport} = await tryModule(import("tsx/esm/api"), {
    specifier: name
  })

  return {
    name,
    import: async id => requireDefault(await tsImport(id, resolveFrom))
  }
}

const loaders = [createJitiLoader, createTsxLoader]

/**
 * Auto detects available transpiler by iterating over the internal `loaders` array (see above) and creating each loader from the list.
 *
 * If a loader factory throws `ModuleNotFoundError` that means there's no transpiler for this package installed.
 *
 * If no loader has been successfully created, it will return native loader and let the runtime to deal with config loading.
 */
async function createAutoLoader(resolveFrom: string) {
  for (const createLoader of loaders) {
    try {
      return await createLoader(resolveFrom)
      /* c8 ignore start */
    } catch (error) {
      if (!(error instanceof ModuleNotFoundError)) {
        throw error
      }
    }
  }

  // Fallback to the native `import()`
  return createNativeLoader(resolveFrom)
}
/* c8 ignore stop */

export interface CreateLoaderOptions extends CliOptions {}

/**
 * Creates a loader depending on given `options.loader` value.
 *
 * If no loader specified, it will auto-detect whatever transpiler is installed within the project's `node_modules` by importing it via `import()`.
 */
export async function createLoader(
  resolveFrom: string,
  options: CreateLoaderOptions = {}
): Promise<ConfigLoader> {
  if (options.alwaysAllowTs) {
    return createNativeLoader(resolveFrom)
  }

  switch (options.loader) {
    case "jiti":
      return createJitiLoader(resolveFrom)
    case "tsx":
      return createTsxLoader(resolveFrom)
    case "native":
    case false:
      return createNativeLoader(resolveFrom)
    default:
      return createAutoLoader(resolveFrom)
  }
}
