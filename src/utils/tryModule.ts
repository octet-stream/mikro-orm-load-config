import {isErrnoExpeption} from "./isErrnoException.ts"

/**
 * @internal
 */
export interface ModuleNotFoundErrorOptions extends ErrorOptions {
  cause: NodeJS.ErrnoException
}

/**
 * This error is a noop flavor for `ERR_MODULE_NOT_FOUND` error with required `cause` option.
 *
 * @internal
 */

export class ModuleNotFoundError extends Error {
  override readonly cause: NodeJS.ErrnoException

  /**
   * Module specifier
   */
  readonly specifier: string

  constructor(specifier: string, options: ModuleNotFoundErrorOptions) {
    const {cause, ...rest} = options

    super(`Unable to import module "${specifier}"`, rest)

    this.specifier = specifier
    this.cause = cause
  }
}

export interface TryModuleOptions {
  specifier: string
}

/**
 * Takes a `promise` returned from an `import()` call, then resolves it to have correct typings, and catches any `ERR_MODULE_NOT_FOUND` error.
 * If such error occurs, then it throws a `ModuleNotFoundError` with the original error as its `cause`.
 *
 * @param promise A promise that resolves the module
 * @param options Extra options
 *
 * @internal
 */
export const tryModule = <T>(promise: Promise<T>, options: TryModuleOptions) =>
  promise.catch(error => {
    if (!isErrnoExpeption(error) || error.code !== "ERR_MODULE_NOT_FOUND") {
      throw error
    }

    throw new ModuleNotFoundError(
      options.specifier,

      {
        cause: error
      }
    )
  })
