import {join} from "node:path"

import {requireDefault} from "./requireDefault.ts"
import type {RequiredSome} from "./types/RequiredSome.ts"
import type {Simplify} from "./types/Simplify.ts"

export type LoaderName = "auto" | "jiti" | "tsx" | "native"

export type LoaderOption = LoaderName | false | null

export interface CliOptions {
  alwaysAllowTs?: boolean // I think it should be deprecated in favoir of loader option set to `false`
  configPaths?: string[]
  loader?: LoaderOption
}

type Defaults = RequiredSome<CliOptions, "loader" | "configPaths">

export const defaults: Defaults = {
  loader: "auto",
  configPaths: []
}

interface PackageSlice {
  "mikro-orm"?: CliOptions
}

export async function loadCliOptions(
  searchFrom: string
): Promise<Simplify<CliOptions & Defaults>> {
  const pkg = requireDefault<PackageSlice>(
    await import(join(searchFrom, "package.json"), {with: {type: "json"}})
  )

  return {...defaults, ...pkg["mikro-orm"]}
}
