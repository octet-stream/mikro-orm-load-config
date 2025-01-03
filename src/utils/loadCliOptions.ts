import {readFile} from "node:fs/promises"
import {join} from "node:path"

export type ConfigLoader = "auto" | "jiti" | "tsx" | "native" | false

export interface CliOptions {
  alwaysAllowTs?: boolean // I think it should be deprecated in favoir of loader option set to `false`
  configPaths?: string[]
  loader?: ConfigLoader
}

export const defaults: Required<CliOptions> = {
  loader: "auto",
  alwaysAllowTs: true,
  configPaths: []
}

interface PackageSlice {
  "mikro-orm"?: CliOptions
}

export async function loadCliOptions(
  projectRootFolder: string
): Promise<Required<CliOptions>> {
  const pkg: PackageSlice = JSON.parse(
    await readFile(join(projectRootFolder, "package.json"), "utf-8")
  )

  return {...defaults, ...pkg["mikro-orm"]}
}
