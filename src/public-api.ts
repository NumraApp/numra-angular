export * from './numra-check.service';
export * from './risk-badge.component';

/* Re-exported, not redefined. The decision lives in @numra/browser so that
   react, vue, svelte and angular cannot drift apart about what a blacklisted
   number looks like. */
export { riskStateFor, RISK_STATES, NumraRequestError } from '@numra/browser';

/* Deliberately absent from this package, and from every browser package in
   this family: anything that accepts an apiKey, and anything that can reach
   api.numra.ma. See numra-check.service.ts for why. */
