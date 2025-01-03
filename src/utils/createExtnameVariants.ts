import type {ToString} from "./types/ToString.ts"
import type {ToStringArray} from "./types/ToStringArray.ts"

export type CreateExtenameVariantsResult<
  TBase extends string,
  TPrefixes extends unknown[]
> = TPrefixes extends [infer TFirst, ...infer TRest]
  ? [TFirst] extends [never]
    ? never
    : [
        `.${ToString<TFirst>}${TBase}`,
        ...CreateExtenameVariantsResult<TBase, ToStringArray<TRest>>
      ]
  : TPrefixes

export const createExtnameVariants = <
  TBase extends string,
  const TPrefixes extends string[]
>(
  base: TBase,
  prefixes: TPrefixes
) =>
  prefixes.map(prefix => `.${prefix}${base}`) as CreateExtenameVariantsResult<
    TBase,
    TPrefixes
  >
