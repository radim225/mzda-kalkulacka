import "./styles.css";
import { FLAT_TAX_MONTH } from "./constants.js";
import { formatKc, formatSignedKc, parseKc } from "./format.js";
import { compareHppOsvc } from "./tax/compare.js";
import { calcHpp } from "./tax/hpp.js";
import { calcOsvc } from "./tax/osvc.js";

const STORAGE_KEY = "mzda-kalkulacka-2026";

const els = {
  tabs: document.querySelectorAll("[data-tab]"),
  panelHpp: document.getElementById("panel-hpp"),
  panelOsvc: document.getElementById("panel-osvc"),
  hppGross: document.getElementById("hpp-gross"),
  hppBonus: document.getElementById("hpp-bonus"),
  hppCredit: document.getElementById("hpp-credit"),
  hppEmployer: document.getElementById("hpp-employer"),
  hppEmployerCard: document.getElementById("hpp-employer-card"),
  osvcIncome: document.getElementById("osvc-income"),
  osvcIncomeLabel: document.getElementById("osvc-income-label"),
  osvcBands: document.getElementById("osvc-bands"),
  osvcAdvances: document.getElementById("osvc-advances"),
  periodBtns: document.querySelectorAll("[data-period]"),
  bandBtns: document.querySelectorAll("[data-band]"),
  install: document.getElementById("install-hint"),
};

const state = {
  tab: "hpp",
  hppGross: "40000",
  hppBonus: "",
  hppCredit: true,
  hppEmployer: false,
  osvcPeriod: "month",
  osvcIncome: "80000",
  osvcMode: "klasika",
  osvcBand: "I",
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    Object.assign(state, JSON.parse(raw));
  } catch {
    /* ignore */
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function monthlyOsvcIncome() {
  const value = parseKc(state.osvcIncome);
  return state.osvcPeriod === "year" ? value / 12 : value;
}

function yearlyOsvcIncome() {
  const value = parseKc(state.osvcIncome);
  return state.osvcPeriod === "year" ? value : value * 12;
}

function setTab(tab) {
  state.tab = tab;
  for (const btn of els.tabs) {
    const on = btn.dataset.tab === tab;
    btn.setAttribute("aria-selected", String(on));
  }
  els.panelHpp.hidden = tab !== "hpp";
  els.panelOsvc.hidden = tab !== "osvc";
  saveState();
}

function renderHpp() {
  const r = calcHpp({
    gross: parseKc(state.hppGross),
    bonus: parseKc(state.hppBonus),
    taxpayerCredit: state.hppCredit,
  });

  document.getElementById("hpp-net").textContent = formatKc(r.net);
  document.getElementById("hpp-net-year").textContent =
    `za rok cca ${formatKc(r.net * 12)}`;
  document.getElementById("hpp-gross-out").textContent = formatKc(r.gross);
  document.getElementById("hpp-sp").textContent = `− ${formatKc(r.sp)}`;
  document.getElementById("hpp-zp").textContent = `− ${formatKc(r.zp)}`;
  document.getElementById("hpp-tax").textContent = `− ${formatKc(r.tax)}`;
  document.getElementById("hpp-net-row").textContent = formatKc(r.net);
  document.getElementById("hpp-zb-hint").textContent =
    `Základ daně ${formatKc(r.zb)} (hrubá na 100 Kč nahoru).`;

  els.hppEmployerCard.hidden = !state.hppEmployer;
  document.getElementById("hpp-er-sp").textContent = formatKc(r.erSoc);
  document.getElementById("hpp-er-zp").textContent = formatKc(r.erHealth);
  document.getElementById("hpp-er-total").textContent = formatKc(r.employerCost);

  const cmp = compareHppOsvc({
    monthlyAmount: r.gross,
    taxpayerCredit: state.hppCredit,
    osvcMode: "klasika",
  });
  document.getElementById("hpp-cmp-hpp").textContent = formatKc(cmp.hppMonthly);
  document.getElementById("hpp-cmp-osvc").textContent = formatKc(cmp.osvcMonthly);
  const diffEl = document.getElementById("hpp-cmp-diff-row");
  diffEl.classList.toggle("plus", cmp.diffMonthly > 0);
  diffEl.classList.toggle("minus", cmp.diffMonthly < 0);
  document.getElementById("hpp-cmp-diff").textContent = formatSignedKc(
    cmp.diffMonthly,
  );
}

function renderOsvc() {
  const yearly = yearlyOsvcIncome();
  const r = calcOsvc({
    incomeYearly: yearly,
    mode: state.osvcMode,
    band: state.osvcBand,
  });
  const monthly = r.takeHome / 12;
  const pausal = state.osvcMode === "pausal";

  document.getElementById("osvc-hero-label").textContent = pausal
    ? "Take-home měsíčně (paušální daň)"
    : "Take-home měsíčně";
  document.getElementById("osvc-net").textContent = formatKc(monthly);
  document.getElementById("osvc-net-year").textContent =
    `za rok ${formatKc(r.takeHome)}`;
  document.getElementById("osvc-income-label").textContent =
    state.osvcPeriod === "year" ? "Roční příjem (bez DPH)" : "Měsíční příjem (bez DPH)";

  els.osvcBands.hidden = !pausal;
  document.getElementById("osvc-exp-row").hidden = pausal;
  document.getElementById("osvc-zd-row").hidden = pausal;
  document.getElementById("osvc-sp-row").hidden = pausal;
  document.getElementById("osvc-zp-row").hidden = pausal;
  els.osvcAdvances.hidden = pausal;

  document.getElementById("osvc-p").textContent = formatKc(r.income);
  document.getElementById("osvc-exp").textContent = formatKc(r.expensesPausal);
  document.getElementById("osvc-zd").textContent = formatKc(r.taxBaseRounded);
  document.getElementById("osvc-tax-label").textContent = pausal
    ? `Paušální daň pásmo ${state.osvcBand} (12× ${formatKc(FLAT_TAX_MONTH[state.osvcBand])})`
    : "Daň z příjmů";
  document.getElementById("osvc-tax").textContent = `− ${formatKc(r.tax)}`;
  document.getElementById("osvc-sp").textContent = `− ${formatKc(r.soc)}`;
  document.getElementById("osvc-zp").textContent = `− ${formatKc(r.health)}`;
  document.getElementById("osvc-th").textContent = formatKc(r.takeHome);
  document.getElementById("osvc-cash-note").textContent = pausal
    ? "Paušální daň je jedna měsíční platba místo daně, sociálního i zdravotního pojištění."
    : "Paušální výdaje snižují daňový základ, ale z účtu je neplatíte. Take-home = příjem − daň − SP − ZP.";

  document.getElementById("osvc-h1").textContent = formatKc(r.advances.spH1);
  document.getElementById("osvc-h2").textContent = formatKc(r.advances.spH2);
  document.getElementById("osvc-zpmin").textContent = formatKc(r.advances.zpMin);

  const cmp = compareHppOsvc({
    monthlyAmount: monthlyOsvcIncome(),
    taxpayerCredit: true,
    osvcMode: state.osvcMode,
    osvcBand: state.osvcBand,
  });
  document.getElementById("osvc-cmp-hpp").textContent = formatKc(cmp.hppMonthly);
  document.getElementById("osvc-cmp-osvc").textContent = formatKc(cmp.osvcMonthly);
  const diffEl = document.getElementById("osvc-cmp-diff-row");
  diffEl.classList.toggle("plus", cmp.diffMonthly > 0);
  diffEl.classList.toggle("minus", cmp.diffMonthly < 0);
  document.getElementById("osvc-cmp-diff").textContent = formatSignedKc(
    cmp.diffMonthly,
  );
}

function render() {
  renderHpp();
  renderOsvc();
}

function syncForm() {
  els.hppGross.value = state.hppGross;
  els.hppBonus.value = state.hppBonus;
  els.hppCredit.checked = state.hppCredit;
  els.hppEmployer.checked = state.hppEmployer;
  els.osvcIncome.value = state.osvcIncome;
  for (const btn of els.periodBtns) {
    btn.classList.toggle("on", btn.dataset.period === state.osvcPeriod);
  }
  for (const radio of document.querySelectorAll("[name=osvc-mode]")) {
    radio.checked = radio.value === state.osvcMode;
  }
  for (const btn of els.bandBtns) {
    btn.classList.toggle("on", btn.dataset.band === state.osvcBand);
  }
  setTab(state.tab);
}

function bind() {
  for (const btn of els.tabs) {
    btn.addEventListener("click", () => setTab(btn.dataset.tab));
  }
  els.hppGross.addEventListener("input", () => {
    state.hppGross = els.hppGross.value;
    saveState();
    render();
  });
  els.hppBonus.addEventListener("input", () => {
    state.hppBonus = els.hppBonus.value;
    saveState();
    render();
  });
  els.hppCredit.addEventListener("change", () => {
    state.hppCredit = els.hppCredit.checked;
    saveState();
    render();
  });
  els.hppEmployer.addEventListener("change", () => {
    state.hppEmployer = els.hppEmployer.checked;
    saveState();
    render();
  });
  els.osvcIncome.addEventListener("input", () => {
    state.osvcIncome = els.osvcIncome.value;
    saveState();
    render();
  });
  for (const btn of els.periodBtns) {
    btn.addEventListener("click", () => {
      const next = btn.dataset.period;
      if (next === state.osvcPeriod) return;
      const current = parseKc(state.osvcIncome);
      state.osvcIncome = String(
        next === "year" ? Math.round(current * 12) : Math.round(current / 12),
      );
      state.osvcPeriod = next;
      els.osvcIncome.value = state.osvcIncome;
      saveState();
      syncForm();
      render();
    });
  }
  for (const radio of document.querySelectorAll("[name=osvc-mode]")) {
    radio.addEventListener("change", () => {
      if (!radio.checked) return;
      state.osvcMode = radio.value;
      saveState();
      render();
    });
  }
  for (const btn of els.bandBtns) {
    btn.addEventListener("click", () => {
      state.osvcBand = btn.dataset.band;
      saveState();
      syncForm();
      render();
    });
  }
}

function setupPwa() {
  const standalone = window.matchMedia("(display-mode: standalone)").matches
    || window.navigator.standalone === true;
  if (standalone && els.install) els.install.hidden = true;

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js", { scope: "./" }).catch(() => {
        /* Pages / file protocol */
      });
    });
  }
}

loadState();
syncForm();
bind();
render();
setupPwa();
