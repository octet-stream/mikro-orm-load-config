export type ToString<T> = T extends string | number | boolean ? `${T}` : never
