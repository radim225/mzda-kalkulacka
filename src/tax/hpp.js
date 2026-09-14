import {
  EMP_HEALTH,
  EMP_SOC,
  ER_HEALTH,
  ER_SOC,
  SOC_CEILING_YEAR,
  TAX_BRACKET_MONTH,
  TAXPAYER_CREDIT_MONTH,
} from "../constants.js";
import { ceilKc, ceilToHundred, taxProgressive } from "./math.js";

const SOC_CEILING_MONTH = SOC_CEILING_YEAR / 12;

/**
 * Měsíční čistá mzda zaměstnance (HPP).
 * Bonus se počítá jako mzda (přičte se k hrubé).
 */
export function calcHpp({
  gross = 0,
  bonus = 0,
  taxpayerCredit = true,
} = {}) {
  const H = Math.max(0, Number(gross) + Number(bonus) || 0);
  const zb = ceilToHundred(H);
  const socBase = Math.min(H, SOC_CEILING_MONTH);

  const sp = ceilKc(socBase * EMP_SOC);
  const zp = ceilKc(H * EMP_HEALTH);

  const taxBeforeCredit = ceilKc(taxProgressive(zb, TAX_BRACKET_MONTH));
  const tax = Math.max(
    0,
    taxBeforeCredit - (taxpayerCredit ? TAXPAYER_CREDIT_MONTH : 0),
  );

  const net = H - sp - zp - tax;

  const erSoc = ceilKc(socBase * ER_SOC);
  const erHealth = ceilKc(H * ER_HEALTH);
  const employerCost = H + erSoc + erHealth;

  return {
    gross: H,
    bonus: Math.max(0, Number(bonus) || 0),
    zb,
    sp,
    zp,
    taxBeforeCredit,
    tax,
    taxpayerCredit,
    net,
    erSoc,
    erHealth,
    employerCost,
  };
}
