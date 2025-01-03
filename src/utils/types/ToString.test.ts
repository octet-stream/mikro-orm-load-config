import {expectTypeOf, test} from "vitest"

import type {ToString} from "./ToString.ts"

test("cast number", () => {
  expectTypeOf<ToString<42>>().toEqualTypeOf<"42">()
})

test("cast string", () => {
  expectTypeOf<ToString<"Hello, World!">>().toEqualTypeOf<"Hello, World!">()
})

test("cast boolean", () => {
  expectTypeOf<ToString<true>>().toEqualTypeOf<"true">()
})

test("returns never for unsupported types", () => {
  expectTypeOf<ToString<["hello", "world"]>>().toBeNever()
})
