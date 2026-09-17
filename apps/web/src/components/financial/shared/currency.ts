const locale = "id-ID";

/** Format an integer minor-unit amount using the currency's standard fraction digits. */
export function formatMoney(amountMinor: number, currency = "IDR") {
  const formatter = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  });
  const fractionDigits = formatter.resolvedOptions().maximumFractionDigits ?? 0;
  return formatter.format(amountMinor / 10 ** fractionDigits);
}
