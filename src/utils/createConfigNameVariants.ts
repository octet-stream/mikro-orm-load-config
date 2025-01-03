import type {ToString} from "./types/ToString.ts"
import type {ToStringArray} from "./types/ToStringArray.ts"

export type CreateConfigNameVariantsResult<
  TBase extends string,
  TPrefixes extends unknown[],
  TOmitDot extends boolean = false
> = TPrefixes extends [infer TFirst, ...infer TRest]
  ? [TFirst] extends [never]
    ? never
    : [
        `${TBase}${ToString<TFirst>}`,
        ...CreateConfigNameVariantsResult<TBase, ToStringArray<TRest>, TOmitDot>
      ]
  : TPrefixes

export const createConfigNameVariants = <
  TBase extends string,
  const TExtnames extends string[]
>(
  base: TBase,
  extnames: TExtnames
) =>
  extnames.map(
    extname => `${base}${extname}`
  ) as CreateConfigNameVariantsResult<TBase, TExtnames>
