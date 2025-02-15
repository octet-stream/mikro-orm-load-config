# mikro-orm-load-config

Demo of my proposal for Mikro ORM config loading improvements

# Usage

This demo is not supposed to be consumed as npm package, because it needs support on Mikro ORM side and meant to be part of it. But you can still try it out:

1. Clone this repo;
2. Install dependencies via `pnpm install` command;
3. Build the package using `pnpm build` command;
4. Open Node.js' REPL. Now you can access it as `mikro-orm-load-config`. As long as your Node.js version supports `require(esm)` feature, you will be able to import it via both `require()` and `import()`.

Now, there's bunch of files you can toy with at the `tests/fixtures` directory. Here's a few examples using these files (these examples written for REPL):

This is how you can load Mikro ORM config.

```ts
const {loadConfig} = await import("mikro-orm-load-config") // or `require("mikro-orm-load-config")`

const config = await loadConfig({searchFrom: path.resolve("tests", "fixtures", "tsx")})

console.log(config.get("dbName")) // -> :memory:
```

This example will read config from `tests/fixtures/tsx/mikro-orm.config.ts` file (which re-exports the one from `tests/fixtures/loaders/config.ts`)

This demo also implements glob-bases discovery for entities. It is available under `/discovery` subpath:

```ts
const {discoverEntities} = await import("mikro-orm-load-config/discovery")
const {Configuration} = await import("@mikro-orm/core")

// Returns async iterator function called `discovery`
const discovery = discoverEntities("**/*.ts", {
  cwd: path.resolve("tests", "fixtures", "entities"),
  loader: "tsx" // The `loader` defaults to jiti, but it breaks on class properties, so you have to use tsx. See: https://github.com/unjs/jiti/issues/57
})

// The result can be consumed via `for-await-of` iterator, or transformed into Array using `Array.fromAsync` method
const entries = await Array.fromAsync(discovery(new Configuration({}, false)))

console.log(entries) // -> {path: string, exports: Record<string, unknown>}
```

The `discovery` function expects `Configuration` object as first argument, so we can rely on existent Mikro ORM config.

However, this will need integration on Mikro ORM side to work properly, because it returns async iterator function instead of an array entities.
The idea is the Options.entities will accept this function, and then it can be consumed by MetadataDiscovery to get classes
