- In this repo's linked-package setup, widening exported structural types like ServiceContainer or InstanceServiceContainer can break demo/package compatibility because helper packages resolve their own nested @node-projects/web-component-designer types.
- Prefer optional public properties or internal `as any` registration for new cross-cutting services when the demo consumes linked packages compiled against older type surfaces.
- The demo HTML loads dist/appShell.js, so when normal demo tsc is blocked by the linked-package type mismatch, `npx tsc --noCheck` is the pragmatic way to refresh runtime artifacts for UI changes.

- In web-component-designer-demo, running `npm i` can replace the local linked `@node-projects/web-component-designer` package with the published node_modules copy; if browser behavior disagrees with passing source/tests, rebuild the package, run `npm link`, then rerun `npm run linkAll` in the demo before debugging further.

