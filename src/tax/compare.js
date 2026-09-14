import { calcHpp } from "./hpp.js";
import { calcOsvc } from "./osvc.js";

/**
 * Srovnání stejné měsíční částky jako hrubá mzda HPP vs. příjem OSVČ.
 */
export function compareHppOsvc({
  monthlyAmount = 0,
  taxpayerCredit = true,
  osvcMode = "klasika",
  osvcBand = "I",
} = {}) {
  const amount = Math.max(0, Number(monthlyAmount) || 0);
  const hpp = calcHpp({
    gross: amount,
    bonus: 0,
    taxpayerCredit,
  });
  const osvc = calcOsvc({
    incomeYearly: amount * 12,
    mode: osvcMode,
    band: osvcBand,
  });

  const osvcMonthly = osvc.takeHome / 12;
  const diffMonthly = osvcMonthly - hpp.net;

  return {
    amount,
    hpp,
    osvc,
    hppMonthly: hpp.net,
    osvcMonthly,
    diffMonthly,
    hppYearly: hpp.net * 12,
    osvcYearly: osvc.takeHome,
  };
}
