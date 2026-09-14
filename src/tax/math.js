import { TAX_HIGH, TAX_LOW } from "../constants.js";

/**
 * Zaokrouhlení na celé Kč nahoru (pojistné / záloha na daň).
 * Pracuje v haléřích, aby 7,1 % z 40 000 vyšlo přesně 2 840.
 */
export function ceilKc(value) {
  if (!Number.isFinite(value) || value <= 0) return 0;
  const cents = Math.round(value * 100);
  return Math.trunc((cents + 99) / 100);
}

/** Základ daně ze mzdy: na celé 100 Kč nahoru. */
export function ceilToHundred(value) {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.ceil(value / 100) * 100;
}

/** Roční základ daně FO: na celé 100 Kč dolů. */
export function floorToHundred(value) {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.floor(value / 100) * 100;
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/** Progresivní daň 15 / 23 % z (už zaokrouhleného) základu. */
export function taxProgressive(base, bracket) {
  if (!Number.isFinite(base) || base <= 0) return 0;
  if (base <= bracket) return base * TAX_LOW;
  return bracket * TAX_LOW + (base - bracket) * TAX_HIGH;
}
