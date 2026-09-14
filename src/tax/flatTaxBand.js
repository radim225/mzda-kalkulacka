import {
  FLAT_TAX_LIMIT,
  FLAT_TAX_SHARE_MIN,
} from "../constants.js";

function qualifies(share) {
  return Number(share) >= FLAT_TAX_SHARE_MIN;
}

function formatLimit(kc) {
  return `${kc.toLocaleString("cs-CZ")} Kč`;
}

/**
 * Navrhne nejnižší přípustné pásmo paušální daně podle § 7a ZDP.
 *
 * Výchozí předpoklad aplikace: OSVČ IT s 60% paušálem, tedy
 * ≥ 75 % příjmů z činností s 60% (nebo 80%) výdajovým paušálem.
 *
 * @param {number} incomeYearly roční příjem ze samostatné činnosti
 * @param {{ share60or80?: number, share80?: number }} [opts]
 * @returns {{
 *   band: "I"|"II"|"III"|null,
 *   eligible: boolean,
 *   rule: string,
 *   income: number,
 *   label: string,
 * }}
 */
export function suggestFlatTaxBand(
  incomeYearly = 0,
  { share60or80 = 1, share80 = 0 } = {},
) {
  const P = Math.max(0, Number(incomeYearly) || 0);
  const has60or80 = qualifies(share60or80);
  const has80 = qualifies(share80);
  const L = FLAT_TAX_LIMIT;

  if (P > L.alwaysIII) {
    return {
      band: null,
      eligible: false,
      rule: "over_limit",
      income: P,
      label: `Paušální daň nelze použít — roční příjem přesahuje ${formatLimit(L.alwaysIII)}.`,
    };
  }

  if (P <= L.alwaysI) {
    return result("I", "I_always", P, has60or80);
  }
  if (P <= L.share60or80_I && has60or80) {
    return result("I", "I_60_80", P, has60or80);
  }
  if (P <= L.share80_I && has80) {
    return result("I", "I_80", P, has60or80);
  }
  if (P <= L.alwaysII) {
    return result("II", "II_always", P, has60or80);
  }
  if (P <= L.share60or80_II && has60or80) {
    return result("II", "II_60_80", P, has60or80);
  }
  return result("III", "III", P, has60or80);
}

function result(band, rule, income, it60) {
  return {
    band,
    eligible: true,
    rule,
    income,
    label: `Navrženo: pásmo ${band} — protože ${reasonCs(rule, it60)}`,
  };
}

function reasonCs(rule, it60) {
  const L = FLAT_TAX_LIMIT;
  switch (rule) {
    case "I_always":
      return `roční příjem je do ${formatLimit(L.alwaysI)}, takže I. pásmo platí bez ohledu na druh činnosti.`;
    case "I_60_80":
      return it60
        ? `roční příjem je do ${formatLimit(L.share60or80_I)} a u IT (60% paušál, alespoň 75 % příjmů) stačí I. pásmo.`
        : `roční příjem je do ${formatLimit(L.share60or80_I)} a alespoň 75 % příjmů je z činností s 60% nebo 80% paušálem.`;
    case "I_80":
      return `roční příjem je do ${formatLimit(L.share80_I)} a alespoň 75 % příjmů je z činností s 80% paušálem.`;
    case "II_always":
      return `roční příjem je nad ${formatLimit(L.alwaysI)} a do ${formatLimit(L.alwaysII)} a na I. pásmo nestačí podíl činností s 60%/80% paušálem.`;
    case "II_60_80":
      return it60
        ? `roční příjem je nad ${formatLimit(L.share60or80_I)} a do ${formatLimit(L.share60or80_II)}; u IT (60% paušál, alespoň 75 % příjmů) lze použít II. pásmo.`
        : `roční příjem je do ${formatLimit(L.share60or80_II)} a alespoň 75 % příjmů je z činností s 60% nebo 80% paušálem.`;
    case "III":
      return `roční příjem je do ${formatLimit(L.alwaysIII)} a na I. ani II. pásmo nestačí podíl činností s 60%/80% paušálem.`;
    default:
      return "";
  }
}

/**
 * Text nápovědy k pásmu včetně ruční odchylky od návrhu.
 */
export function formatFlatTaxSuggestion(suggestion, selectedBand) {
  if (!suggestion) return "";
  if (!suggestion.eligible) return suggestion.label;
  if (selectedBand && selectedBand !== suggestion.band) {
    return `Vybráno pásmo ${selectedBand} (upraveno ručně). ${suggestion.label}`;
  }
  return suggestion.label;
}
