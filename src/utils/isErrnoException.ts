export const isErrnoExpeption = (
  value: unknown
): value is NodeJS.ErrnoException => value instanceof Error && "code" in value
