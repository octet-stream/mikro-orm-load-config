import type {Simplify} from "./Simplify.ts"

export type Replace<
  TSource extends Record<PropertyKey, unknown>,
  TOverrides extends Partial<Record<keyof TSource, unknown>>
> = Simplify<Omit<TSource, keyof TOverrides> & TOverrides>
