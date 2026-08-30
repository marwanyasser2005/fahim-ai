export const BILLING_PLANS = Object.freeze({
  plus_monthly: Object.freeze({ code: 'plus_monthly', amountCents: 4_900, currency: 'EGP', durationDays: 30, label: 'FAHIM Plus — Monthly' }),
  plus_annual: Object.freeze({ code: 'plus_annual', amountCents: 39_900, currency: 'EGP', durationDays: 365, label: 'FAHIM Plus — Annual' }),
});

export function getBillingPlan(code) {
  return typeof code === 'string' ? BILLING_PLANS[code] : undefined;
}
