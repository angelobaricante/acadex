import { describe, it, expect } from "vitest";
import { formatBytes, formatPercent, formatDate } from "./format";

describe("formatBytes", () => {
  it("formats zero", () => {
    expect(formatBytes(0)).toBe("0 B");
  });

  it("formats bytes under 1KB", () => {
    expect(formatBytes(512)).toBe("512 B");
  });

  it("formats kilobytes with one decimal", () => {
    expect(formatBytes(1536)).toBe("1.5 KB");
  });

  it("formats megabytes", () => {
    expect(formatBytes(5_242_880)).toBe("5.0 MB");
  });

  it("formats gigabytes", () => {
    expect(formatBytes(2_147_483_648)).toBe("2.0 GB");
  });
});

describe("formatPercent", () => {
  it("formats a ratio as an integer percent", () => {
    expect(formatPercent(0.82)).toBe("82%");
  });

  it("rounds half up", () => {
    expect(formatPercent(0.825)).toBe("83%");
  });

  it("handles zero", () => {
    expect(formatPercent(0)).toBe("0%");
  });

  it("shows <1% for tiny positive values", () => {
    expect(formatPercent(0.004)).toBe("<1%");
  });

  it("clamps negative values to 0%", () => {
    expect(formatPercent(-0.03)).toBe("<0%");
  });
});

describe("formatDate", () => {
  it("formats an ISO string to a short date", () => {
    const out = formatDate("2026-04-10T12:00:00Z");
    expect(out).toMatch(/Apr/);
    expect(out).toMatch(/2026/);
  });
});
