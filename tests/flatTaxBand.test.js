import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { FLAT_TAX_LIMIT, FLAT_TAX_MONTH } from "../src/constants.js";
import {
  formatFlatTaxSuggestion,
  suggestFlatTaxBand,
} from "../src/tax/flatTaxBand.js";

describe("návrh pásma paušální daně (FS 2026, výchozí IT 60 %)", () => {
  it("do 1 000 000 Kč vždy I. pásmo", () => {
    assert.equal(suggestFlatTaxBand(0).band, "I");
    assert.equal(suggestFlatTaxBand(FLAT_TAX_LIMIT.alwaysI).band, "I");
    assert.equal(suggestFlatTaxBand(FLAT_TAX_LIMIT.alwaysI).rule, "I_always");
    assert.equal(suggestFlatTaxBand(500_000, { share60or80: 0 }).band, "I");
  });

  it("IT 60 % (≥75 %): I do 1 500 000 Kč", () => {
    const r = suggestFlatTaxBand(1_000_001);
    assert.equal(r.band, "I");
    assert.equal(r.rule, "I_60_80");
    assert.equal(suggestFlatTaxBand(FLAT_TAX_LIMIT.share60or80_I).band, "I");
    assert.match(r.label, /Navrženo: pásmo I — protože/);
    assert.match(r.label, /IT/);
  });

  it("IT 60 %: nad 1 500 000 do 2 000 000 Kč → II", () => {
    const r = suggestFlatTaxBand(1_500_001);
    assert.equal(r.band, "II");
    assert.equal(r.rule, "II_60_80");
    assert.equal(suggestFlatTaxBand(FLAT_TAX_LIMIT.share60or80_II).band, "II");
    assert.match(r.label, /Navrženo: pásmo II — protože/);
  });

  it("nad 2 000 000 Kč nelze paušální daň", () => {
    const r = suggestFlatTaxBand(2_000_001);
    assert.equal(r.band, null);
    assert.equal(r.eligible, false);
    assert.equal(r.rule, "over_limit");
    assert.match(r.label, /přesahuje/);
  });
});

describe("návrh pásma bez IT 60% pravidla", () => {
  it("nad 1 mil. bez 60%/80% podílu → II do 1,5 mil.", () => {
    const r = suggestFlatTaxBand(1_000_001, { share60or80: 0, share80: 0 });
    assert.equal(r.band, "II");
    assert.equal(r.rule, "II_always");
    assert.equal(
      suggestFlatTaxBand(FLAT_TAX_LIMIT.alwaysII, { share60or80: 0 }).band,
      "II",
    );
  });

  it("nad 1,5 mil. bez 60%/80% podílu → III do 2 mil.", () => {
    const r = suggestFlatTaxBand(1_500_001, { share60or80: 0, share80: 0 });
    assert.equal(r.band, "III");
    assert.equal(r.rule, "III");
    assert.equal(
      suggestFlatTaxBand(FLAT_TAX_LIMIT.alwaysIII, { share60or80: 0 }).band,
      "III",
    );
  });

  it("80% paušál ≥75 %: I až do 2 mil.", () => {
    const r = suggestFlatTaxBand(1_800_000, {
      share60or80: 1,
      share80: 1,
    });
    assert.equal(r.band, "I");
    assert.equal(r.rule, "I_80");
  });

  it("podíl 75 % stačí, 74,9 % nestačí", () => {
    assert.equal(
      suggestFlatTaxBand(1_200_000, { share60or80: 0.75 }).band,
      "I",
    );
    assert.equal(
      suggestFlatTaxBand(1_200_000, { share60or80: 0.749 }).band,
      "II",
    );
  });
});

describe("text návrhu a ruční přepis", () => {
  it("při shodě vrátí Navrženo: pásmo X", () => {
    const s = suggestFlatTaxBand(800_000);
    assert.equal(formatFlatTaxSuggestion(s, "I"), s.label);
    assert.match(s.label, /^Navrženo: pásmo I — protože /);
  });

  it("při přepisu uvede vybrané pásmo i návrh", () => {
    const s = suggestFlatTaxBand(800_000);
    const text = formatFlatTaxSuggestion(s, "II");
    assert.match(text, /Vybráno pásmo II/);
    assert.match(text, /Navrženo: pásmo I/);
  });

  it("nemění sazby záloh 2026", () => {
    assert.equal(FLAT_TAX_MONTH.I, 9_162);
    assert.equal(FLAT_TAX_MONTH.II, 16_745);
    assert.equal(FLAT_TAX_MONTH.III, 27_139);
  });
});
