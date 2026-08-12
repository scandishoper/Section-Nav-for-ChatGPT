# AMO source build instructions

## Submitted version

Section Nav for ChatGPT 1.0.0

Target runtime: Firefox 142.0 or newer.

## Build environment

- Operating system: Linux; the submitted artifact was built on EndeavourOS.
- Node.js: 26.6.0. The project declares Node.js 22.12.0 or newer.
- npm: 12.0.2.
- Package manager lockfile: `package-lock.json`.

All dependencies are downloaded from the public npm registry through `npm ci`. No private repository, private package, external binary, or generated source download is required.

## Build steps

From the source archive root:

```bash
npm ci
npm run build:firefox
```

The exact Firefox extension submitted to AMO is generated in `dist-firefox/`. Package the contents of that directory with `manifest.json` at the ZIP root.

## Source mapping

- `src/` contains the readable TypeScript and React source.
- `manifest.firefox.json` is emitted as `dist-firefox/manifest.json`.
- `public/icons/` is copied to `dist-firefox/icons/`.
- `vite.config.ts` defines the build and emits one bundled `content.js` file.
- `package.json` and `package-lock.json` define and lock all dependencies.

Source maps are disabled in the production package. The unminified source in this archive is the authoritative source for review.
