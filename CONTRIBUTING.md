# Contributing to @numra/angular

Patches are welcome. What this package renders is what a merchant's staff act
on, so the bar for a change is a test that would have caught the bug, not a
convincing description of it.

## Running the tests

```bash
npm install
npm test
```

Node 22.12 or newer, as `engines` declares. `npm test` runs `ng-packagr`
first and then tests what the build produced, which is deliberate: this is the
one package in the family that publishes a build rather than its source, so
testing the source alone would test something nobody installs. The credential
scan runs over the compiled bundle for the same reason.

Publish the build, never the repository root — `npm run build && npm publish
./dist`. A `prepublishOnly` hook stops a root publish and explains why.

## Every change needs a test

Every package in this family ships a regression suite, and it is the only
thing standing between a refactor and a silent behavioural change. So:

- A bug fix comes with a test that fails before it and passes after.
- A new option or export comes with a test that exercises it.
- A change to existing behaviour comes with the changed assertion, and the
  reason for the change in the commit message.

Two assertions here are not negotiable:

- Nothing key-shaped, and no reference to the Numra API, may appear in the
  source **or** in the compiled bundle. That is the credential boundary: this
  package must only ever call the merchant's own backend.
- The component template uses `*ngIf` rather than `@if`. Built-in control flow
  needs Angular 17 and the peer range says 16, and a peer range that is not
  true surfaces as a template error from our file inside a merchant's build.

## Which repository your fix belongs in

These repositories are split out of a single monorepo. What you see here is
one package of twelve, and this one is a binding: debounce, abort, the
late-answer rule, risk states and badge styling all live in
[numra-browser](https://github.com/NumraApp/numra-browser), shared with the
React, Vue and Svelte packages.

So:

- Anything about *what a check means* — labels, colours, when a request fires,
  which answer wins — belongs in **`@numra/browser`**. Fixing it here alone is
  how the four bindings drift, and they have before.
- Anything Angular-shaped — signals, the injection token, per-component
  providers, `ngOnDestroy`, the template — belongs here.
- A change to what the endpoint returns belongs in
  [numra-js-core](https://github.com/NumraApp/numra-js-core) or the framework
  package that mounts it.

If your fix lands in `@numra/browser`, this package picks it up as a
dependency bump; say so in the pull request.

## The conformance gate

```bash
node scripts/openapi-conformance.js
```

This checks the package against the API contract and against itself. It fails
by default when no contract is vendored, on purpose: a conformance step that
goes green having compared nothing manufactures exactly the assurance it
exists to provide. Point `NUMRA_OPENAPI` at a copy of the spec, or drop it at
one of the paths the script lists, to make it run for real.

## House style

British spelling, no emoji in headings, and prose that says what a thing does
rather than how good it is. Comments explain the decision, not the syntax.

## Reporting a bug

Open an issue with the package version, the Angular version, and the smallest
reproduction you can manage. **A security vulnerability is not a bug report**
— see [SECURITY.md](SECURITY.md) and mail it privately instead.
