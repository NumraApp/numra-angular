# @numra/angular

**A debounced phone-check service and a risk badge for Angular, talking to your own backend.**

[![npm version](https://img.shields.io/npm/v/@numra/angular)](https://www.npmjs.com/package/@numra/angular) [![npm downloads](https://img.shields.io/npm/dm/@numra/angular)](https://www.npmjs.com/package/@numra/angular) [![licence: MIT](https://img.shields.io/npm/l/@numra/angular)](LICENSE)

The browser half, Angular-shaped. Calls **your** backend — it never holds a
Numra API key and cannot be made to.

```bash
npm install @numra/angular
```

Angular 16 and up. Signals, standalone components, no RxJS required.

## You need the other half first

This package talks to an endpoint you mount yourself, with one of:
`@numra/express`, `@numra/fastify`, `@numra/next`, `@numra/nuxt`,
`numra/laravel`, or `Numra\Handlers` in plain PHP. That endpoint holds the key.

Numra reads a shared fraud ledger, so a key in a bundle is a key in everyone's
hands. There is no `apiKey` option here, and a test scans both the source and
the compiled bundle to keep it that way.

## Use it

```ts
// app.config.ts
import { provideNumra } from '@numra/angular';

export const appConfig = {
  providers: [provideNumra({ endpoint: '/api/numra' })],
};
```

```ts
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NumraCheckService, RiskBadgeComponent } from '@numra/angular';

@Component({
  standalone: true,
  imports: [FormsModule, RiskBadgeComponent],
  providers: [NumraCheckService],
  template: `
    <input [(ngModel)]="phone" (ngModelChange)="numra.check($event)" inputmode="tel" />
    <numra-risk-badge [check]="numra.data()" [loading]="numra.isLoading()" />
  `,
})
export class CheckoutComponent {
  phone = '';
  constructor(readonly numra: NumraCheckService) {}
}
```

`NumraCheckService` is provided **per component**, not in root. Two forms on
one page are two independent lookups, and a root singleton would have them
overwrite each other's verdict.

## What it does that a plain HttpClient call would not

- **Debounces.** `(ngModelChange)` fires on every keystroke, and every lookup
  is billable.
- **Aborts the superseded request** rather than ignoring it.
- **Drops a late answer by identity**, not by catching `AbortError`. An abort
  landing while `res.json()` is still running does not always throw, and the
  operator would be shown the verdict for a number they already changed.
- **Clears the verdict when the field is cleared.**
- **Cancels on destroy**, via `ngOnDestroy`.

All of that lives in `@numra/browser`, shared with the React, Vue and Svelte
packages, so the four cannot drift apart.

## Reading the result

`riskScore` alone **cannot** tell a checked-and-clean customer from a complete
stranger — both come back low. On a cash-on-delivery store most buyers are
new, so the badge renders an unrated number as **“No history”**, never “Low
risk”, and a blacklisted number as **“Blacklisted”** even when its band says
something milder. Those two rules are what stop a storefront contradicting the
control panel.

## Signals on the service

| | |
|---|---|
| `data()` | the check, or null |
| `error()` | a `NumraRequestError` carrying your endpoint's own code |
| `status()` | `idle` / `loading` / `success` / `error` |
| `isLoading()` | convenience |
| `check(phone, enabled?)` | drive it from your form |
| `refetch()` | re-run now, skipping the debounce |

Branch on `error().code` — `NUMRA_NOT_CONFIGURED`, `FORBIDDEN`,
`QUOTA_EXCEEDED`, `UPSTREAM_UNAVAILABLE` — never on the message.

## Why this one has a build

Every other package in this family publishes exactly what is in the repo.
Angular components have to be compiled ahead of time to be publishable, so
this one runs `ng-packagr`. `npm test` builds first and then checks what the
build produced — including scanning the compiled bundle for anything
key-shaped, which a source scan alone would miss.

The template uses `*ngIf` rather than `@if` on purpose: built-in control flow
needs Angular 17, and the peer range says 16. A test enforces that, because a
range that is not true shows up as a template error from our file inside a
merchant's build.

## Release notes

Every release is tagged and written up on the
[Releases page](https://github.com/NumraApp/numra-angular/releases). The same
history in one file is in [CHANGELOG.md](CHANGELOG.md).

## Contributing

Bug reports and patches are welcome. [CONTRIBUTING.md](CONTRIBUTING.md) covers
running the tests, the regression test a change is expected to bring with it,
and which repository a given fix actually belongs in.

## Security

Vulnerabilities go privately to the address in [SECURITY.md](SECURITY.md).
**Do not open a public issue for a security problem** — a public report is a
working exploit for every merchant running the released version until a fix
ships.

## The rest of the family

Twelve packages, one contract. The server side holds the API key; the browser
side calls the endpoint the server side mounts.

Server:

| Package | Repository |
|---|---|
| `@numra/core` | [numra-js-core](https://github.com/NumraApp/numra-js-core) |
| `@numra/express` | [numra-express](https://github.com/NumraApp/numra-express) |
| `@numra/fastify` | [numra-fastify](https://github.com/NumraApp/numra-fastify) |
| `@numra/next` | [numra-next](https://github.com/NumraApp/numra-next) |
| `@numra/nuxt` | [numra-nuxt](https://github.com/NumraApp/numra-nuxt) |
| `numra/numra-php` | [numra-php](https://github.com/NumraApp/numra-php) |
| `numra/laravel` | [numra-laravel](https://github.com/NumraApp/numra-laravel) |

Browser:

| Package | Repository |
|---|---|
| `@numra/browser` | [numra-browser](https://github.com/NumraApp/numra-browser) |
| `@numra/react` | [numra-react](https://github.com/NumraApp/numra-react) |
| `@numra/vue` | [numra-vue](https://github.com/NumraApp/numra-vue) |
| `@numra/svelte` | [numra-svelte](https://github.com/NumraApp/numra-svelte) |
| `@numra/angular` | [numra-angular](https://github.com/NumraApp/numra-angular) — this repo |

Documentation for all of them is at [numra.ma/docs](https://numra.ma/docs).

## Licence

MIT
