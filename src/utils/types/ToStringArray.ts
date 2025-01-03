import type {ToString} from "./ToString.ts"

export type ToStringArray<T extends unknown[]> = T extends [
  infer TFirst,
  ...infer TRest
]
  ? [TFirst] extends [never]
    ? never
    : [ToString<TFirst>, ...ToStringArray<TRest>]
  : T
