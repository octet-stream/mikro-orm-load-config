import type {Options} from "@mikro-orm/core"

import {tryModule, ModuleImportError} from "./tryModule.ts"
import type {CliOptions} from "./loadCliOptions.ts"
import {requireDefault} from "./requireDefault.ts"

const createErrorMessage = (name: string) =>
  `The ${name} package is required for TypeScript support. Make sure it is installed.`

export interface ConfigLoader {
  name: string
  importModule(id: string): Promise<Options>
}

export type CreateConfigLoader = (
  rootFile: string
) => ConfigLoader | Promise<ConfigLoader>

const createNativeLoader: CreateConfigLoader = (): ConfigLoader => ({
  name: "import",
  importModule: async id => requireDefault(await import(id)) as Options
})

const createJitiLoader: CreateConfigLoader = async (
  rootFile: string
): Promise<ConfigLoader> => {
  const {createJiti} = await tryModule(import("jiti"), {
    errorMessage: createErrorMessage("jiti")
  })

  const jiti = createJiti(rootFile)

  return {
    name: "jiti",
    importModule: id => jiti.import(id, {default: true})
  }
}

const createTsxLoader: CreateConfigLoader = async rootFile => {
  const {tsImport} = await tryModule(import("tsx/esm/api"), {
    errorMessage: createErrorMessage("tsx")
  })

  return {
    name: "tsx",
    importModule: async id => requireDefault(await tsImport(id, rootFile))
  }
}

const loaders = [createJitiLoader, createTsxLoader]

async function createAutoLoader(rootFile: string) {
  let loader: ConfigLoader | undefined = undefined
  for (const factory of loaders) {
    if (loader) {
      break
    }

    try {
      loader = await factory(rootFile)
      /* c8 ignore next 5 */
    } catch (error) {
      if (!(error instanceof ModuleImportError)) {
        throw error
      }
    }
  }

  return loader ? loader : createNativeLoader(rootFile)
}

export interface CreateLoaderOptions extends CliOptions {}

export async function createLoader(
  rootFile: string,
  options: CreateLoaderOptions = {}
): Promise<ConfigLoader> {
  switch (options.loader) {
    case "jiti":
      return createJitiLoader(rootFile)
    case "tsx":
      return createTsxLoader(rootFile)
    case false:
      return createNativeLoader(rootFile)
    default:
      return createAutoLoader(rootFile)
  }
}
