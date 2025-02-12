import type {Simplify} from "./Simplify.ts"

export type RequiredSome<T, U extends keyof T> = Simplify<
  Omit<T, U> & {[K in U]-?: T[K]}
>
