/**
 * Checks if given `value` is a non-array object
 *
 * @param value - A value to test
 */
export const isObject = (
  value: unknown
): value is Record<PropertyKey, unknown> =>
  typeof value === "object" && value != null && !Array.isArray(value)
