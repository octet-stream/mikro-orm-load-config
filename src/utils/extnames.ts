import {concat} from "./concat.ts"
import {createExtnameVariants} from "./createExtnameVariants.ts"

export const extnames = concat(
  createExtnameVariants("ts", ["", "m", "c"]),
  createExtnameVariants("js", ["", "m", "c"])
)
