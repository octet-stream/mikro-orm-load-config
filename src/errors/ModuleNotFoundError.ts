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
