import { describe, expect, it } from "vitest";
import { formatMoney } from "./currency";

describe("formatMoney", () => {
  it("formats zero-decimal currencies without scaling them", () => {
    expect(formatMoney(125000, "IDR")).toBe("Rp 125.000");
  });

  it("scales two-decimal currencies from minor units", () => {
    expect(formatMoney(12345, "USD")).toBe("US$123,45");
  });

  it("preserves negative amounts", () => {
    expect(formatMoney(-500, "USD")).toBe("-US$5,00");
  });
});
