This project uses Node.js and npm. Do not use Bun.

`package.json` is the source of truth for tool versions: `devEngines` sets Node and npm for development and CI, and `engines` sets the minimum Node version for users.

## Commands

- `npm install` installs dependencies. Commit `package-lock.json`.
- `npm run dev` runs the server from source and restarts on file changes.
- `npm start` runs the server from source once.
- `npm run typecheck` type-checks without output.
- `npm run build` compiles `src/` to `dist/`. The npm package ships only `dist/`.

The server needs `MOCHI_API_KEY` in the environment.

## TypeScript

- Node runs `src/*.ts` directly with type stripping. Use only erasable syntax: no `enum`, `namespace`, or constructor parameter properties. `erasableSyntaxOnly` in `tsconfig.json` enforces this.
- Import local modules with the `.ts` extension. `tsc` rewrites them to `.js` in `dist/`.
- Use `node:` built-in modules, for example `node:fs/promises`.

## Releases

Releases are published by `.github/workflows/publish.yml` when a `v*` tag is pushed. Use `npm version <version>` to create the release commit and tag.
