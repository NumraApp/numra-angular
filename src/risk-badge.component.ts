import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { badgeParts, styleString } from '@numra/browser';

/* A presentational badge. No fetching, no key, no opinion about your layout.

   The label, the colours and the geometry come from @numra/browser, shared
   with the React, Vue and Svelte packages — a merchant running two of ours on
   two pages must not see two different badges. See that package for why
   blacklisted outranks the band and why unrated has its own words.

   `*ngIf` rather than `@if`: the built-in control flow needs Angular 17, and
   this package says it supports 16. A peer range has to be true.

   role="status" because the badge appears and changes on its own while the
   operator is typing somewhere else; without a live region a screen-reader
   user never hears the verdict. No aria-label: the label is the text inside,
   and naming it twice reads it twice. */

@Component({
  selector: 'numra-risk-badge',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span *ngIf="parts as p" role="status" [style]="p.containerCss">
      <span aria-hidden="true" [style]="p.dotCss"></span>
      {{ p.label }}
      <span *ngIf="p.score !== null" [style]="p.scoreCss">{{ p.score }}</span>
    </span>
  `,
})
export class RiskBadgeComponent {
  @Input() check: any = null;
  @Input() loading = false;
  /** The service's `error`. Given one, the badge says the check did not run. */
  @Input() error: unknown = null;
  @Input() showScore = false;
  /** Merged over the container. The base geometry survives. */
  @Input() badgeStyle: Record<string, unknown> = {};

  get parts() {
    const b = badgeParts(this.check, {
      loading: this.loading,
      error: this.error,
      showScore: this.showScore,
      style: this.badgeStyle,
    });
    if (!b) return null;

    /* CSS strings rather than style maps: the shared style objects use
       unitless numbers the way React does, and Angular's style map would
       write `font-size:13` with no unit. styleString() adds px where px is
       what the property means. */
    return {
      label: b.label,
      score: b.score,
      containerCss: styleString(b.container),
      dotCss: styleString(b.dot),
      scoreCss: styleString(b.scoreStyle),
    };
  }
}
