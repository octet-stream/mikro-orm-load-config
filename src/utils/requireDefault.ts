export const requireDefault = <T = unknown>(
  value?: Record<PropertyKey, unknown>
) => (value && "default" in value ? value.default : value) as T
