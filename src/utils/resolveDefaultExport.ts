import type {IsNever} from "./types/IsNever.ts"

type WithDefaultExport<T> = T | {default: T}

type ResolveDefaultExport<
  // biome-ignore lint/suspicious/noExplicitAny: This doesn't work without "any" type
  TExports extends Record<PropertyKey, any>,
  TEnabled extends boolean = never
> = IsNever<TEnabled> extends true
  ? TExports
  : TExports extends WithDefaultExport<infer TResolved>
    ? TResolved
    : TExports

/**
 * Resolves `default` export of given module object `value` if the second argument is set to `true`
 *
 * @param exports - A ES module exports object
 * @param enabled - Whether or not to resolve default module export. Defaults to `false`
 */
export const resolveDefaultExport = <
  // biome-ignore lint/suspicious/noExplicitAny: This doesn't work without "any" type
  TExports extends Record<PropertyKey, any>,
  TEnabled extends boolean = never
>(
  exports: TExports,
  enabled?: TEnabled
) =>
  (exports && "default" in exports && enabled
    ? exports.default
    : exports) as ResolveDefaultExport<TExports, TEnabled>
