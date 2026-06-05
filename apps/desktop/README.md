# Project Spine Desktop

An opt-in Electron wrapper for running the public Project Spine CLI against a local repo.

## Use

```sh
npm install
npm run build --prefix ../..
npm start
```

From the repository root:

```sh
npm install --prefix apps/desktop
npm run build
npm run verify --prefix apps/desktop
npm start --prefix apps/desktop
```

The wrapper uses the local `dist/cli.js` when the root package has been built. If that file is missing, it falls back to `spine` on `PATH`. Set `PROJECT_SPINE_CLI=/absolute/path/to/spine` to override that resolution.

## Security Model

- The renderer loads local files only.
- Node integration is disabled.
- Context isolation and sandboxing are enabled.
- The preload exposes only whitelisted calls for `doctor`, `compile`, `template list`, native path selection, and opening local output folders.
- CLI arguments are passed to `child_process.spawn` without a shell.

This package is private and outside the root npm package `files` list, so it does not change the published CLI tarball.
