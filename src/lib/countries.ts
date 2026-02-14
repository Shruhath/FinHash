export const COUNTRIES: { code: string; name: string; currency: string; symbol: string }[] = [
  { code: "US", name: "United States", currency: "USD", symbol: "$" },
  { code: "GB", name: "United Kingdom", currency: "GBP", symbol: "£" },
  { code: "EU", name: "European Union", currency: "EUR", symbol: "€" },
  { code: "IN", name: "India", currency: "INR", symbol: "₹" },
  { code: "JP", name: "Japan", currency: "JPY", symbol: "¥" },
  { code: "CN", name: "China", currency: "CNY", symbol: "¥" },
  { code: "AU", name: "Australia", currency: "AUD", symbol: "A$" },
  { code: "CA", name: "Canada", currency: "CAD", symbol: "C$" },
  { code: "CH", name: "Switzerland", currency: "CHF", symbol: "CHF" },
  { code: "KR", name: "South Korea", currency: "KRW", symbol: "₩" },
  { code: "SG", name: "Singapore", currency: "SGD", symbol: "S$" },
  { code: "HK", name: "Hong Kong", currency: "HKD", symbol: "HK$" },
  { code: "SE", name: "Sweden", currency: "SEK", symbol: "kr" },
  { code: "NO", name: "Norway", currency: "NOK", symbol: "kr" },
  { code: "DK", name: "Denmark", currency: "DKK", symbol: "kr" },
  { code: "NZ", name: "New Zealand", currency: "NZD", symbol: "NZ$" },
  { code: "ZA", name: "South Africa", currency: "ZAR", symbol: "R" },
  { code: "BR", name: "Brazil", currency: "BRL", symbol: "R$" },
  { code: "MX", name: "Mexico", currency: "MXN", symbol: "MX$" },
  { code: "AE", name: "UAE", currency: "AED", symbol: "د.إ" },
  { code: "SA", name: "Saudi Arabia", currency: "SAR", symbol: "﷼" },
  { code: "TH", name: "Thailand", currency: "THB", symbol: "฿" },
  { code: "MY", name: "Malaysia", currency: "MYR", symbol: "RM" },
  { code: "PH", name: "Philippines", currency: "PHP", symbol: "₱" },
  { code: "ID", name: "Indonesia", currency: "IDR", symbol: "Rp" },
  { code: "PK", name: "Pakistan", currency: "PKR", symbol: "₨" },
  { code: "BD", name: "Bangladesh", currency: "BDT", symbol: "৳" },
  { code: "NG", name: "Nigeria", currency: "NGN", symbol: "₦" },
  { code: "EG", name: "Egypt", currency: "EGP", symbol: "E£" },
  { code: "TR", name: "Turkey", currency: "TRY", symbol: "₺" },
];

export function getCurrencyByCountry(countryCode: string): { currency: string; symbol: string } {
  const country = COUNTRIES.find((c) => c.code === countryCode);
  return country
    ? { currency: country.currency, symbol: country.symbol }
    : { currency: "USD", symbol: "$" };
}
