import { Injectable, InjectionToken, OnDestroy, computed, inject, signal } from '@angular/core';
import { createCheckController, IDLE } from '@numra/browser';

/* ═══════════════════════════════════════════════════════════════════════════
   @numra/angular — the browser half, Angular-shaped
   ───────────────────────────────────────────────────────────────────────────
   No apiKey option, and no way to add one: this package talks to YOUR
   backend, the endpoint one of the server packages mounts.

   Debounce, abort and stale-answer rejection live in @numra/browser's
   controller, shared with React, Vue and Svelte — see there for why a late
   answer is dropped by identity rather than by catching AbortError.

   Signals rather than an Observable, so the template needs no async pipe and
   the service needs no RxJS. Angular 16 and up.

   This is the one package in the family that HAS a build step. Angular
   components must be compiled ahead of time to be publishable, so ng-packagr
   is not optional here the way a bundler was optional everywhere else.
   ═══════════════════════════════════════════════════════════════════════════ */

export interface NumraOptions {
  /** Your own backend, mounted by one of the Numra server packages. */
  endpoint?: string;
  debounceMs?: number;
}

export const NUMRA_OPTIONS = new InjectionToken<NumraOptions>('NUMRA_OPTIONS');

/** Register once, in your app config. */
export function provideNumra(options: NumraOptions = {}) {
  return [{ provide: NUMRA_OPTIONS, useValue: options }];
}

export interface NumraCheckState {
  status: 'idle' | 'loading' | 'success' | 'error';
  data: any | null;
  error: any | null;
}

/**
 * One lookup, driven from your component.
 *
 * Provided per component rather than in root: two forms on one page are two
 * independent lookups, and a root singleton would have them overwrite each
 * other's verdict.
 *
 *     @Component({ providers: [NumraCheckService], ... })
 */
@Injectable()
export class NumraCheckService implements OnDestroy {
  private readonly options = inject(NUMRA_OPTIONS, { optional: true }) ?? {};

  private readonly _state = signal<NumraCheckState>({ ...IDLE });

  private readonly controller = createCheckController({
    endpoint: this.options.endpoint,
    debounceMs: this.options.debounceMs,
    onState: (s: NumraCheckState) => this._state.set(s),
  });

  readonly state = this._state.asReadonly();
  readonly data = computed(() => this._state().data);
  readonly error = computed(() => this._state().error);
  readonly status = computed(() => this._state().status);
  readonly isLoading = computed(() => this._state().status === 'loading');

  /** Call whenever the number or the enabled flag changes. */
  check(phone: string | null, enabled = true): void {
    this.controller.set(phone, enabled);
  }

  /** Re-run now, skipping the debounce. */
  refetch(): Promise<unknown> {
    return this.controller.refetch();
  }

  /* Angular calls this for you. Without it a timer outlives the component and
     a request nobody will read stays on the wire. */
  ngOnDestroy(): void {
    this.controller.dispose();
  }
}
