const TS_EXT_REGEXPR = /\.[mc]?tsx?$/

export const isTsExtname = (specifier: string) => TS_EXT_REGEXPR.test(specifier)
