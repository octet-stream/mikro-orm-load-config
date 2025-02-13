class NoopError extends Error implements NodeJS.ErrnoException {
  code = "ERR_UNKNOWN_FILE_EXTENSION"
}

throw new NoopError("Unable to find module")
