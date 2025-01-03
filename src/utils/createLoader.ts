import type {Options} from "@mikro-orm/core"

import type {CliOptions} from "./loadCliOptions.ts"
import {requireDefault} from "./requireDefault.ts"
import {ModuleImportError, tryModule} from "./tryModule.ts"

const createErrorMessage = (name: string) =>
  `The ${name} package is required for TypeScript support. Make sure it is installed.`

export interface ConfigLoader {
  name: string
  import(id: string): Promise<Options>
}

export type CreateConfigLoader = (
  rootFile: string
) => ConfigLoader | Promise<ConfigLoader>

/**
 * Creates a loader for native [`import()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import) to import files
 */
const createNativeLoader: CreateConfigLoader = (): ConfigLoader => ({
  name: "native",
  import: async id => requireDefault<Options>(await import(id))
})

/**
 * Creates a loader with [`jiti`](https://www.npmjs.com/package/jiti) as transpiler
 */
const createJitiLoader: CreateConfigLoader = async (
  rootFile: string
): Promise<ConfigLoader> => {
  const name = "jiti"
  const {createJiti} = await tryModule(import("jiti"), {
    errorMessage: createErrorMessage(name)
  })

  const jiti = createJiti(rootFile)

  return {
    name,
    import: id => jiti.import(id, {default: true})
  }
}

/**
 * Creates a loader with [`tsx`](https://www.npmjs.com/package/tsx) as transpiler
 */
const createTsxLoader: CreateConfigLoader = async rootFile => {
  const name = "tsx"
  const {tsImport} = await tryModule(import("tsx/esm/api"), {
    errorMessage: createErrorMessage(name)
  })

  return {
    name,
    import: async id => requireDefault(await tsImport(id, rootFile))
  }
}

const loaders = [createJitiLoader, createTsxLoader]

/**
 * Auto detects available transpiler by iterating over the internal `loaders` array (see above) and creating each loader from the list.
 *
 * If a loader factory throws `ModuleImportError` that means there's no transpiler for this package installed.
 *
 * If no loader has been successfully created, it will return native loader and let the runtime to deal with config loading.
 */
async function createAutoLoader(rootFile: string) {
  for (const createLoader of loaders) {
    try {
      return await createLoader(rootFile)
      /* c8 ignore start */
    } catch (error) {
      if (!(error instanceof ModuleImportError)) {
        throw error
      }
    }
  }

  // Fallback to the native `import()`
  return createNativeLoader(rootFile)
}
/* c8 ignore stop */

export interface CreateLoaderOptions extends CliOptions {}

/**
 * Creates a loader depending on given `options.loader` value.
 *
 * If no loader specified, it will auto-detect whatever transpiler is installed within the project's `node_modules` by importing it via `import()`.
 */
export async function createLoader(
  rootFile: string,
  options: CreateLoaderOptions = {}
): Promise<ConfigLoader> {
  if (options.alwaysAllowTs) {
    return createNativeLoader(rootFile)
  }

  switch (options.loader) {
    case "jiti":
      return createJitiLoader(rootFile)
    case "tsx":
      return createTsxLoader(rootFile)
    case "native":
    case false:
      return createNativeLoader(rootFile)
    default:
      return createAutoLoader(rootFile)
  }
}
