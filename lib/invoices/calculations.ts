/**
 * Money math on scaled integers. Amounts arrive as decimal strings and are
 * turned into `bigint` hundredths, so nothing is ever accumulated as a float.
 * Rounding is half away from zero, which is what Postgres `round(numeric)` does.
 */

const DECIMAL_PATTERN = /^(-)?(\d+)(?:\.(\d{1,2}))?$/;

/** Parses "12", "12.5" or "12.50" into hundredths. Returns null when invalid. */
export function toHundredths(value: string | number | null | undefined): bigint | null {
  if (value === null || value === undefined) {
    return null;
  }

  const text = typeof value === "number" ? value.toFixed(2) : value.trim();
  const match = DECIMAL_PATTERN.exec(text);

  if (!match) {
    return null;
  }

  const [, sign, whole, fraction = ""] = match;
  const hundredths = BigInt(whole) * BigInt(100) + BigInt(fraction.padEnd(2, "0"));
  return sign ? -hundredths : hundredths;
}

/** Formats hundredths back into a plain decimal string such as "1234.50". */
export function fromHundredths(value: bigint): string {
  const negative = value < BigInt(0);
  const absolute = negative ? -value : value;
  const whole = absolute / BigInt(100);
  const fraction = (absolute % BigInt(100)).toString().padStart(2, "0");
  return `${negative ? "-" : ""}${whole.toString()}.${fraction}`;
}

function divideRounded(numerator: bigint, denominator: bigint): bigint {
  const negative = numerator < BigInt(0) !== denominator < BigInt(0);
  const absNumerator = numerator < BigInt(0) ? -numerator : numerator;
  const absDenominator = denominator < BigInt(0) ? -denominator : denominator;
  const quotient = (absNumerator + absDenominator / BigInt(2)) / absDenominator;
  return negative ? -quotient : quotient;
}

/** quantity × unit price, rounded to cents. Mirrors the generated `line_total` column. */
export function lineTotalHundredths(quantity: string, unitPrice: string): bigint {
  const q = toHundredths(quantity) ?? BigInt(0);
  const p = toHundredths(unitPrice) ?? BigInt(0);
  return divideRounded(q * p, BigInt(100));
}

export type InvoiceTotals = {
  subtotal: string;
  taxAmount: string;
  total: string;
};

/** Same order as `recalculate_invoice_totals()`: round lines, sum, round tax once. */
export function calculateTotals(
  lines: { quantity: string; unit_price: string }[],
  taxRate: string,
): InvoiceTotals {
  const subtotal = lines.reduce(
    (sum, line) => sum + lineTotalHundredths(line.quantity, line.unit_price),
    BigInt(0),
  );
  const rate = toHundredths(taxRate) ?? BigInt(0);
  const tax = divideRounded(subtotal * rate, BigInt(10000));

  return {
    subtotal: fromHundredths(subtotal),
    taxAmount: fromHundredths(tax),
    total: fromHundredths(subtotal + tax),
  };
}

/** Stripe minor units. All supported currencies use two decimals. */
export function toMinorUnits(amount: string | number): number {
  const hundredths = toHundredths(amount);
  if (hundredths === null) {
    throw new Error("Invalid amount");
  }
  return Number(hundredths);
}

/** Normalises a numeric value from the database into a two-decimal string. */
export function toAmountString(value: string | number | null | undefined): string {
  const hundredths = toHundredths(value ?? 0);
  return fromHundredths(hundredths ?? BigInt(0));
}

export function formatMoney(amount: string | number, currency: string): string {
  const hundredths = toHundredths(amount) ?? BigInt(0);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(hundredths) / 100);
}

export function formatQuantity(value: string | number): string {
  const text = toAmountString(value);
  return text.endsWith(".00") ? text.slice(0, -3) : text;
}
