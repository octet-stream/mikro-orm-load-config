import {readFile} from "node:fs/promises"
import {join} from "node:path"

export type ConfigLoader = "auto" | "jiti" | "tsx" | false

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

export async function loadCliOptions(
  pwd: string
): Promise<Required<CliOptions>> {
  const pkg: Record<string, unknown> = JSON.parse(
    await readFile(join(pwd, "package.json"), "utf-8")
  )

  return {...defaults, ...(pkg["mikro-orm"] as CliOptions)}
}
