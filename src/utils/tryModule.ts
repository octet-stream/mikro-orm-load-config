export interface TryModuleOptions {
  errorMessage: string
}

export class ModuleImportError extends Error {}

export const tryModule = <T>(
  promise: Promise<T>,
  {errorMessage}: TryModuleOptions
) =>
  promise
    /* c8 ignore start */ // Not sure how to test it with import() in vitest, other than faking the function itself, so I'll just pretend this is going to work :)
    .catch(error => {
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
/* c8 ignore stop */
