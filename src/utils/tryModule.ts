export interface TryModuleOptions {
  errorMessage: string
}

export class ModuleImportError extends Error {}

export const tryModule = <T>(
  promise: Promise<T>,
  {errorMessage}: TryModuleOptions
) =>
  promise.catch(error => {
    if ((error as NodeJS.ErrnoException)?.code !== "ERR_MODULE_NOT_FOUND") {
      throw error
    }

    throw new ModuleImportError(
      errorMessage,

      {
        cause: error
      }
    )
  })
