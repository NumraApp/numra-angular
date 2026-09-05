import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');
const dist = path.join(root, 'dist');

/* ═══════════════════════════════════════════════════════════════════════════
   This package has a build, so the tests are about what the build produced
   ───────────────────────────────────────────────────────────────────────────
   Angular components must be compiled ahead of time to be publishable, so
   `npm test` runs ng-packagr first. The compile IS most of the test: a
   template that does not type-check, a signal used wrongly, or a peer range
   the compiler disagrees with all stop the build.

   What is left to check here is what a compile cannot: that the thing about
   to be published carries no credential, and that its manifest points at
   files that exist. Behaviour lives in @numra/browser and is tested there.
   ═══════════════════════════════════════════════════════════════════════════ */

const distPkg = () => JSON.parse(fs.readFileSync(path.join(dist, 'package.json'), 'utf8'));

test('the build produced something publishable', () => {
  assert.ok(fs.existsSync(dist), 'run `npm run build` first');
  const p = distPkg();

  assert.equal(p.name, '@numra/angular');
  /* ng-packagr strips scripts and devDependencies from the published
     manifest. If they ever come back, a merchant installing this package
     would pull the entire Angular toolchain. */
  assert.equal(p.scripts, undefined);
  assert.equal(p.devDependencies, undefined);

  for (const rel of Object.values(p.exports?.['.'] ?? {})) {
    if (typeof rel === 'string') {
      assert.ok(fs.existsSync(path.join(dist, rel)), `${rel} is referenced but missing`);
    }
  }
});

test('@numra/browser ships as a real dependency, not a peer', () => {
  /* It is ours and it is tiny. Making a merchant install it themselves is a
     step that adds nothing and can be got wrong. */
  const p = distPkg();
  assert.equal(p.dependencies['@numra/browser'], '^1.0.0');
  assert.ok(!('@numra/browser' in (p.peerDependencies ?? {})));
});

test('the peer range the package claims is the one it was compiled for', () => {
  const p = distPkg();
  /* `*ngIf` rather than `@if` is what makes 16 true. The moment someone
     writes built-in control flow, this range becomes a lie and merchants on
     16 get a template error from OUR file in THEIR build. */
  assert.equal(p.peerDependencies['@angular/core'], '>=16');
  const tpl = stripComments(fs.readFileSync(path.join(root, 'src', 'risk-badge.component.ts'), 'utf8'));
  assert.ok(!/@if|@for|@switch/.test(tpl), 'built-in control flow needs Angular 17');
});

test('the badge that ships is announced, and can say a lookup failed', () => {
  /* Two defects, both only visible in what was published.

     There was no error input at all, so a 403, a 503 QUOTA_EXCEEDED and a
     dead network rendered exactly what an empty field renders: nothing. The
     operator could not tell "this number has no history" from "we never got
     to ask", and only one of those needs a human.

     And the badge appears, changes and disappears on its own while the
     operator is typing somewhere else, with no live region — so a screen
     reader never mentioned the verdict at all.

     Read from the FESM bundle rather than from src, and with comments
     stripped, so a sentence ABOUT role="status" cannot stand in for the
     attribute. ng-packagr compiles partially, which leaves the template and
     the input list in the bundle verbatim. */
  const bundle = stripComments(
    fs.readFileSync(path.join(dist, 'fesm2022', 'numra-angular.mjs'), 'utf8'),
  );

  assert.match(bundle, /<span \*ngIf="parts as p" role="status"/, 'the badge is not a live region');
  /* No aria-label: the label is the text inside, and naming it twice reads
     it twice. */
  assert.doesNotMatch(bundle, /aria-label/);
  assert.match(bundle, /inputs: \{[^}]*\berror: "error"/, 'the badge cannot be told the lookup failed');
  assert.match(bundle, /error: this\.error/, 'the error input is declared but never passed on');

  /* And the declaration file a TypeScript app compiles against agrees. */
  const dts = fs.readFileSync(path.join(dist, 'risk-badge.component.d.ts'), 'utf8');
  assert.match(dts, /"error": \{ "alias": "error"/);
});

/* ── The invariant every browser package holds ──────────────────────────── */

const stripComments = (s) =>
  s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

const sources = fs
  .readdirSync(path.join(root, 'src'))
  .map((f) => ({ f, s: stripComments(fs.readFileSync(path.join(root, 'src', f), 'utf8')) }));

test('no source file holds a credential or reaches the Numra API', () => {
  /* One careless "just add an apiKey so it works standalone" and every
     merchant who upgrades ships their fraud-database key to every visitor.
     If this fails, the fix is not to relax the test. */
  for (const { f, s } of sources) {
    assert.ok(!/apiKey|api_key|API_KEY/.test(s), `${f} mentions an API key`);
    assert.ok(!/secret/i.test(s), `${f} mentions a secret`);
    assert.ok(!/api\.numra\.ma/.test(s), `${f} targets the Numra API directly`);
    assert.ok(!/\bfetch\s*\(/.test(s), `${f} makes its own request instead of using @numra/browser`);
  }
});

test('neither does the compiled bundle', () => {
  /* The source scan above cannot see what a build inlined. This one reads
     what is actually about to be published. */
  const bundles = fs
    .readdirSync(path.join(dist, 'fesm2022'))
    .filter((f) => f.endsWith('.mjs'))
    /* Comments survive the build — ng-packagr keeps them — and the ones in
       this package are the sentences explaining that it holds no credential.
       Scanning them would force those explanations out of the shipped file,
       which is backwards. Strip, then scan. */
    .map((f) => stripComments(fs.readFileSync(path.join(dist, 'fesm2022', f), 'utf8')));

  assert.ok(bundles.length > 0, 'no FESM bundle was produced');
  for (const b of bundles) {
    assert.ok(!/api\.numra\.ma/.test(b), 'the published bundle can reach the Numra API');
    assert.ok(!/numra_live_|numra_test_/.test(b), 'the published bundle contains a key-shaped literal');
  }
});

test('the package does not depend on @numra/core', () => {
  /* @numra/core throws in a browser by design. */
  const p = distPkg();
  const deps = { ...p.dependencies, ...p.peerDependencies };
  assert.ok(!('@numra/core' in deps));
});
