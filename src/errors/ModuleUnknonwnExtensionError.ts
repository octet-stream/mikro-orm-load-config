export interface ModuleUnknonwnExtensionErrorOptions extends ErrorOptions {
  cause: NodeJS.ErrnoException
}

export class ModuleUnknonwnExtensionError extends Error {
  readonly cause: NodeJS.ErrnoException

  constructor(specifier: string, options: ModuleUnknonwnExtensionErrorOptions) {
    const {cause, ...rest} = options

    super(
      `Unable to import "${specifier}" module.\nYou need to install either "jiti" or "tsx" to import TypeScript modules.`,

      rest
    )

    this.cause = cause
  }
}
