# Mzda kalkulačka

Mobilní PWA pro **orientační** výpočet čisté mzdy zaměstnance (HPP) a skutečného take-home OSVČ v IT s 60% výdajovým paušálem. Rok **2026**, uživatelské rozhraní česky.

Živá aplikace (GitHub Pages):
**https://radim225.github.io/mzda-kalkulacka/**

Repozitář: https://github.com/radim225/mzda-kalkulacka

> Soukromý repozitář: GitHub Pages u private repo často vyžaduje **GitHub Pro**. V Settings → Pages nastavte zdroj na **GitHub Actions**. Bez toho workflow testy projdou, ale publikování stránek selže.

## Co umí

### Zaměstnanec (HPP)
- Hrubá mzda a volitelný bonus (počítá se jako mzda)
- Okamžitá čistá mzda
- Přepínač slevy na poplatníka (2 570 Kč / měsíc)
- Rozklad: sociální 7,1 %, zdravotní 4,5 %, daň, čistá
- Volitelně náklady zaměstnavatele 33,8 % (24,8 % + 9 %)

### OSVČ (IT)
- Příjem měsíčně nebo ročně (bez DPH)
- Výchozí režim: klasika + **60% paušál** (strop výdajů 1 200 000 Kč)
- Take-home = příjem − daň − SP − ZP. Paušální výdaje **nejsou** hotovostní výdaj.
- Přepínač paušální daně pásma I / II / III (9 162 / 16 745 / 27 139 Kč měsíčně)
- Informativní minimální zálohy SP (5 720 Kč v 1. pololetí, 5 005 Kč od 7/2026) a ZP 3 306 Kč
- Srovnání stejné částky HPP vs. OSVČ

## Instalace na plochu telefonu

Aplikace je instalovatelná PWA (manifest, service worker, ikony).

1. Otevřete stránku v Safari (iPhone) nebo Chrome (Android).
2. **iPhone:** tlačítko Sdílet → **Přidat na plochu**.
3. **Android:** menu prohlížeče → **Instalovat aplikaci** nebo **Přidat na plochu**.
4. Ikona „Mzda“ se objeví mezi aplikacemi a jde otevřít bez adresního řádku.

Funguje i offline po první návštěvě.

## Lokální spuštění

```bash
npm install
npm test
npm run dev
```

Sestavení statického webu do `dist/`:

```bash
npm run build
npm run preview
```

Žádný backend, žádné tajné klíče. Čistě statický frontend.

## Testy

`npm test` kontroluje daňovou matematiku (mimo jiné hrubá 40 000 Kč → čistá **31 930 Kč** se slevou na poplatníka a jeden roční případ OSVČ 60% paušál).

## Daňové konstanty 2026

Všechny sazby jsou v [`src/constants.js`](src/constants.js) s odkazy na zákony a průměrnou mzdu 48 967 Kč. Úpravy jen tam.

**Toto není daňové poradenství.** Jde o zjednodušený model (bez dětí, bez vedlejší činnosti, bez slevy na manžela/ku). Závazné je vyúčtování mzdy, přiznání a přehledy na OSSZ / zdravotní pojišťovnu.
