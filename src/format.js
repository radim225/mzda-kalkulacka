const czk0 = new Intl.NumberFormat("cs-CZ", {
  style: "currency",
  currency: "CZK",
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
});

const czk2 = new Intl.NumberFormat("cs-CZ", {
  style: "currency",
  currency: "CZK",
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
});

export function formatKc(value, { digits = 0 } = {}) {
  const n = Number(value);
  if (!Number.isFinite(n)) return digits ? czk2.format(0) : czk0.format(0);
  if (digits === 0) return czk0.format(Math.round(n));
  return czk2.format(n);
}

export function formatSignedKc(value) {
  const n = Number(value) || 0;
  const abs = formatKc(Math.abs(n));
  if (n > 0) return `+${abs}`;
  if (n < 0) return `−${abs}`;
  return abs;
}

/** Vstup: mezery, české desetinné čárky. */
export function parseKc(raw) {
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : 0;
  const s = String(raw)
    .trim()
    .replace(/\s/g, "")
    .replace(/\u00a0/g, "")
    .replace(",", ".");
  if (!s) return 0;
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

export function formatPct(rate) {
  const n = Number(rate);
  if (!Number.isFinite(n)) return "0 %";
  const pct = n * 100;
  const digits = Number.isInteger(pct) ? 0 : 1;
  return `${pct.toLocaleString("cs-CZ", { maximumFractionDigits: digits })} %`;
}
