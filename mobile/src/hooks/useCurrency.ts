import { useCallback, useMemo } from "react";
import { getCurrencyByCountry } from "@shared/countries";
import { formatCompact, formatMoney } from "@shared/format";
import { useCurrentUser } from "./useCurrentUser";

/** Currency symbol plus formatters bound to the signed-in user's country. */
export function useCurrency() {
  const user = useCurrentUser();

  const symbol = useMemo(
    () => (user ? getCurrencyByCountry(user.country).symbol : "$"),
    [user]
  );

  const format = useCallback(
    (amount: number, opts?: { decimals?: boolean; sign?: boolean }) =>
      formatMoney(amount, symbol, opts),
    [symbol]
  );

  const compact = useCallback(
    (amount: number) => formatCompact(amount, symbol),
    [symbol]
  );

  return { symbol, format, compact };
}
