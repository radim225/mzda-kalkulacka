import {
  FLAT_TAX_MONTH,
  OSVA_EXPENSE_CAP,
  OSVA_EXPENSE_RATE,
  OSVA_HEALTH_MIN_ADVANCE_MONTH,
  OSVA_HEALTH_MIN_MONTHLY_BASE,
  OSVA_HEALTH_RATE,
  OSVA_HEALTH_VZ_RATE,
  OSVA_SOC_ADVANCE_H1,
  OSVA_SOC_ADVANCE_H2,
  OSVA_SOC_RATE,
  OSVA_SOC_VZ_MIN_YEAR,
  OSVA_SOC_VZ_RATE,
  SOC_CEILING_YEAR,
  TAX_BRACKET_YEAR,
  TAXPAYER_CREDIT_YEAR,
} from "../constants.js";
import { ceilKc, clamp, floorToHundred, taxProgressive } from "./math.js";

/**
 * Roční take-home OSVČ (IT, hlavní činnost).
 * Paušální výdaje snižují základ daně, ale nejsou hotovostní výdaj.
 *
 * mode: "klasika" | "pausal"
 * band: "I" | "II" | "III" (jen paušální daň)
 */
export function calcOsvc({
  incomeYearly = 0,
  mode = "klasika",
  band = "I",
} = {}) {
  const P = Math.max(0, Number(incomeYearly) || 0);
  const advances = {
    spH1: OSVA_SOC_ADVANCE_H1,
    spH2: OSVA_SOC_ADVANCE_H2,
    zpMin: OSVA_HEALTH_MIN_ADVANCE_MONTH,
  };

  if (mode === "pausal") {
    const monthly = FLAT_TAX_MONTH[band] ?? FLAT_TAX_MONTH.I;
    const yearly = monthly * 12;
    return {
      mode: "pausal",
      band,
      income: P,
      expensesPausal: 0,
      taxBase: 0,
      taxBaseRounded: 0,
      tax: yearly,
      soc: 0,
      health: 0,
      vzSoc: 0,
      vzHealth: 0,
      takeHome: P - yearly,
      includedInFlatTax: yearly,
      advances,
    };
  }

  const expensesPausal = Math.min(P * OSVA_EXPENSE_RATE, OSVA_EXPENSE_CAP);
  const taxBase = P - expensesPausal;
  const taxBaseRounded = floorToHundred(taxBase);

  const taxBeforeCredit = ceilKc(
    taxProgressive(taxBaseRounded, TAX_BRACKET_YEAR),
  );
  const tax = Math.max(0, taxBeforeCredit - TAXPAYER_CREDIT_YEAR);

  const vzSoc = clamp(
    OSVA_SOC_VZ_RATE * taxBase,
    OSVA_SOC_VZ_MIN_YEAR,
    SOC_CEILING_YEAR,
  );
  const soc = ceilKc(vzSoc * OSVA_SOC_RATE);

  const vzHealth = Math.max(
    OSVA_HEALTH_VZ_RATE * taxBase,
    OSVA_HEALTH_MIN_MONTHLY_BASE * 12,
  );
  const health = ceilKc(vzHealth * OSVA_HEALTH_RATE);

  return {
    mode: "klasika",
    band: null,
    income: P,
    expensesPausal,
    taxBase,
    taxBaseRounded,
    taxBeforeCredit,
    tax,
    soc,
    health,
    vzSoc,
    vzHealth,
    takeHome: P - tax - soc - health,
    includedInFlatTax: 0,
    advances,
  };
}
