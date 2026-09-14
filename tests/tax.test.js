import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  EMP_HEALTH,
  EMP_SOC,
  ER_HEALTH,
  ER_SOC,
  FLAT_TAX_MONTH,
  OSVA_EXPENSE_CAP,
  OSVA_SOC_ADVANCE_H1,
  OSVA_SOC_ADVANCE_H2,
  OSVA_HEALTH_MIN_ADVANCE_MONTH,
} from "../src/constants.js";
import { compareHppOsvc } from "../src/tax/compare.js";
import { calcHpp } from "../src/tax/hpp.js";
import { ceilKc } from "../src/tax/math.js";
import { calcOsvc } from "../src/tax/osvc.js";

describe("HPP 2026", () => {
  it("hrubá 40 000 Kč se slevou na poplatníka → čistá 31 930 Kč", () => {
    const r = calcHpp({ gross: 40_000, taxpayerCredit: true });
    assert.equal(r.zb, 40_000);
    assert.equal(r.sp, 2_840);
    assert.equal(r.zp, 1_800);
    assert.equal(r.tax, 3_430);
    assert.equal(r.net, 31_930);
    assert.equal(r.sp, ceilKc(40_000 * EMP_SOC));
    assert.equal(r.zp, ceilKc(40_000 * EMP_HEALTH));
  });

  it("hrubá 40 000 Kč bez slevy na poplatníka → čistá 29 360 Kč", () => {
    const r = calcHpp({ gross: 40_000, taxpayerCredit: false });
    assert.equal(r.tax, 6_000);
    assert.equal(r.net, 29_360);
  });

  it("bonus se přičte k hrubé mzdě", () => {
    const r = calcHpp({ gross: 35_000, bonus: 5_000, taxpayerCredit: true });
    const plain = calcHpp({ gross: 40_000, taxpayerCredit: true });
    assert.equal(r.net, plain.net);
    assert.equal(r.sp, plain.sp);
  });

  it("základ daně zaokrouhlí na 100 Kč nahoru", () => {
    const r = calcHpp({ gross: 40_001, taxpayerCredit: false });
    assert.equal(r.zb, 40_100);
  });

  it("náklady zaměstnavatele jsou 33,8 % navíc", () => {
    const r = calcHpp({ gross: 40_000 });
    assert.equal(r.erSoc, ceilKc(40_000 * ER_SOC));
    assert.equal(r.erHealth, ceilKc(40_000 * ER_HEALTH));
    assert.equal(r.employerCost, 40_000 + r.erSoc + r.erHealth);
    assert.equal(r.erSoc, 9_920);
    assert.equal(r.erHealth, 3_600);
    assert.equal(r.employerCost, 53_520);
  });
});

describe("OSVČ IT 2026", () => {
  it("klasika 60% paušál: roční příjem 1 200 000 Kč", () => {
    const r = calcOsvc({ incomeYearly: 1_200_000, mode: "klasika" });
    assert.equal(r.expensesPausal, 720_000);
    assert.equal(r.taxBase, 480_000);
    assert.equal(r.taxBaseRounded, 480_000);
    // daň 15 % z 480 000 = 72 000 − sleva 30 840 = 41 160
    assert.equal(r.tax, 41_160);
    // VZ SP = 0,55 × 480 000 = 264 000; × 0,292 = 77 088
    assert.equal(r.vzSoc, 264_000);
    assert.equal(r.soc, 77_088);
    // VZ ZP = max(240 000, 24 483,50 × 12) = 293 802; × 0,135
    assert.equal(r.vzHealth, 24_483.5 * 12);
    assert.equal(r.health, ceilKc(24_483.5 * 12 * 0.135));
    assert.equal(r.takeHome, 1_200_000 - r.tax - r.soc - r.health);
    assert.ok(r.takeHome > r.income - r.expensesPausal);
    assert.equal(r.advances.spH1, OSVA_SOC_ADVANCE_H1);
    assert.equal(r.advances.spH2, OSVA_SOC_ADVANCE_H2);
    assert.equal(r.advances.zpMin, OSVA_HEALTH_MIN_ADVANCE_MONTH);
  });

  it("strop paušálních výdajů 1 200 000 Kč", () => {
    const r = calcOsvc({ incomeYearly: 3_000_000, mode: "klasika" });
    assert.equal(r.expensesPausal, OSVA_EXPENSE_CAP);
    assert.equal(r.taxBase, 1_800_000);
  });

  it("paušální daň pásmo I: take-home = příjem − 12 × 9 162", () => {
    const r = calcOsvc({
      incomeYearly: 1_200_000,
      mode: "pausal",
      band: "I",
    });
    assert.equal(r.tax, FLAT_TAX_MONTH.I * 12);
    assert.equal(r.soc, 0);
    assert.equal(r.health, 0);
    assert.equal(r.takeHome, 1_200_000 - 9_162 * 12);
  });
});

describe("srovnání HPP vs OSVČ", () => {
  it("při 40 000 Kč drží HPP mírně navrch kvůli minimům OSVČ", () => {
    const c = compareHppOsvc({ monthlyAmount: 40_000 });
    assert.equal(c.hppMonthly, 31_930);
    assert.equal(Math.round(c.osvcMonthly), 31_690);
    assert.ok(c.osvcMonthly < c.hppMonthly);
    assert.equal(c.diffMonthly, c.osvcMonthly - c.hppMonthly);
  });

  it("při 80 000 Kč je OSVČ take-home vyšší než čistá HPP", () => {
    const c = compareHppOsvc({ monthlyAmount: 80_000 });
    assert.ok(c.osvcMonthly > c.hppMonthly);
  });
});
