/**
 * Konstanty daňového a pojistného výpočtu — Česká republika, rok 2026.
 *
 * Zdroje (neměnit bez kontroly legislativy daného roku):
 * - Zákon č. 586/1992 Sb., o daních z příjmů
 *   (§ 16 sazby 15 / 23 %, § 35ba sleva na poplatníka, § 38h zálohy ze mzdy,
 *    § 7 výdajový paušál, § 7a paušální daň)
 * - Zákon č. 589/1992 Sb., o pojistném na sociální zabezpečení
 * - Zákon č. 592/1992 Sb., o pojistném na veřejné zdravotní pojištění
 * - Nařízení vlády: všeobecný vyměřovací základ / průměrná mzda 2026 = 48 967 Kč
 * - Max. vyměřovací základ SP 2026 = 48 × průměrná mzda = 2 350 416 Kč
 * - Hranice 23 % daně = 36 × průměrná mzda (1 762 812 Kč / rok, 146 901 Kč / měsíc)
 * - Finanční správa: paušální daň 2026 (pásmo I po úpravě od 7/2026)
 * - ČSSZ: min. zálohy OSVČ hlavní činnost — 1. pololetí 5 720 Kč, od 7/2026 5 005 Kč
 *
 * Model je orientační a není daňové poradenství.
 */

export const YEAR = 2026;

/** Zaměstnanec — sociální pojištění (důchodové 6,5 % + nemocenské 0,6 %). */
export const EMP_SOC = 0.071;
/** Zaměstnanec — zdravotní pojištění. */
export const EMP_HEALTH = 0.045;
/** Zaměstnavatel — sociální pojištění. */
export const ER_SOC = 0.248;
/** Zaměstnavatel — zdravotní pojištění. */
export const ER_HEALTH = 0.09;
/** Součet odvodů zaměstnavatele (33,8 %). */
export const ER_TOTAL = ER_SOC + ER_HEALTH;

export const TAX_BRACKET_MONTH = 146_901;
export const TAX_BRACKET_YEAR = 1_762_812;
export const TAX_LOW = 0.15;
export const TAX_HIGH = 0.23;

export const TAXPAYER_CREDIT_MONTH = 2_570;
export const TAXPAYER_CREDIT_YEAR = 30_840;

export const SOC_CEILING_YEAR = 2_350_416;
export const AVERAGE_WAGE = 48_967;

/** OSVČ IT — výdajový paušál 60 %, strop 1 200 000 Kč. */
export const OSVA_EXPENSE_RATE = 0.6;
export const OSVA_EXPENSE_CAP = 1_200_000;

/** OSVČ — vyměřovací základ SP = 55 % základu daně. */
export const OSVA_SOC_VZ_RATE = 0.55;
/** Min. roční VZ SP (35 % průměrné mzdy × 12). */
export const OSVA_SOC_VZ_MIN_YEAR = 205_668;
export const OSVA_SOC_RATE = 0.292;

/** OSVČ — vyměřovací základ ZP = max(50 % ZD, 50 % průměrné mzdy × 12). */
export const OSVA_HEALTH_VZ_RATE = 0.5;
export const OSVA_HEALTH_MIN_MONTHLY_BASE = 24_483.5;
export const OSVA_HEALTH_RATE = 0.135;
/** Minimální záloha ZP (informativní, zaokrouhlená). */
export const OSVA_HEALTH_MIN_ADVANCE_MONTH = 3_306;

/**
 * Minimální zálohy SP hlavní činnost (informativní).
 * H1 = 1. pololetí 2026 (40 % prům. mzdy), H2 = od 7/2026 (35 %).
 */
export const OSVA_SOC_ADVANCE_H1 = 5_720;
export const OSVA_SOC_ADVANCE_H2 = 5_005;

/** Paušální daň — měsíční zálohy Finanční správy 2026. */
export const FLAT_TAX_MONTH = Object.freeze({
  I: 9_162,
  II: 16_745,
  III: 27_139,
});
