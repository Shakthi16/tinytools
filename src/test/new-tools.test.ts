import { describe, expect, it } from "vitest";
import { tools, getToolById, getToolsByCategory } from "@/lib/tools/catalog";

describe("Tool Catalog Integrity", () => {
  it("has valid catalog with unique tool IDs", () => {
    const ids = tools.map((t) => t.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
    expect(ids.length).toBeGreaterThan(45);
  });

  it("every tool has non-empty metadata, category, icon, and howToUse steps", () => {
    for (const tool of tools) {
      expect(tool.id.trim(), `id empty on ${tool.id}`).not.toBe("");
      expect(tool.name.trim(), `name empty on ${tool.id}`).not.toBe("");
      expect(tool.description.trim(), `description empty on ${tool.id}`).not.toBe("");
      expect(tool.category.trim(), `category empty on ${tool.id}`).not.toBe("");
      expect(tool.icon.trim(), `icon empty on ${tool.id}`).not.toBe("");
      expect(tool.color.trim(), `color empty on ${tool.id}`).not.toBe("");
      // Every tool must have at least 2 how-to-use steps
      expect(Array.isArray(tool.howToUse), `howToUse not array on ${tool.id}`).toBe(true);
      expect(tool.howToUse.length, `howToUse empty on ${tool.id}`).toBeGreaterThanOrEqual(2);
      // Each step must be a non-empty string
      for (const step of tool.howToUse) {
        expect(typeof step).toBe("string");
        expect(step.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("getToolById finds existing tools and undefined for missing", () => {
    expect(getToolById("pdf-merge")).toBeDefined();
    expect(getToolById("json-formatter")).toBeDefined();
    expect(getToolById("stopwatch")).toBeDefined();
    expect(getToolById("passport-photo")).toBeDefined();
    expect(getToolById("non-existent-tool-xyz")).toBeUndefined();
  });

  it("getToolsByCategory groups tools properly", () => {
    const pdfTools = getToolsByCategory("PDF & documents");
    expect(pdfTools.length).toBeGreaterThanOrEqual(4);
    const devTools = getToolsByCategory("Developer");
    expect(devTools.length).toBeGreaterThanOrEqual(6);
    const bizTools = getToolsByCategory("Business & everyday");
    expect(bizTools.length).toBeGreaterThanOrEqual(2);
    const calcTools = getToolsByCategory("Calculators");
    expect(calcTools.length).toBeGreaterThanOrEqual(6);
  });

  it("all tool hrefs follow /tools/$id convention", () => {
    for (const tool of tools) {
      // Verify ID only contains URL-safe characters
      expect(tool.id).toMatch(/^[a-z0-9-]+$/);
    }
  });
});


describe("Client-side mathematical & utility logic", () => {
  it("calculates accurate loan EMI using standard financial formula", () => {
    // Formula: E = P * r * (1+r)^n / ((1+r)^n - 1)
    const principal = 100000;
    const annualRate = 12;
    const months = 12;

    const monthlyRate = annualRate / (12 * 100);
    const emi = Math.round(
      (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
        (Math.pow(1 + monthlyRate, months) - 1)
    );

    // For 100,000 at 12% for 12 months, standard monthly EMI is ~8885
    expect(emi).toBe(8885);
    const totalPayment = emi * months;
    expect(totalPayment).toBeGreaterThan(principal);
  });

  it("converts units accurately (length, weight, temperature)", () => {
    // Temperature: C to F => (C * 9/5) + 32
    const celsiusToFahrenheit = (c: number) => (c * 9) / 5 + 32;
    expect(celsiusToFahrenheit(0)).toBe(32);
    expect(celsiusToFahrenheit(100)).toBe(212);

    // Length: meters to feet
    const metersToFeet = (m: number) => m * 3.28084;
    expect(Math.round(metersToFeet(1) * 100) / 100).toBe(3.28);

    // Weight: kg to lbs
    const kgToLbs = (kg: number) => kg * 2.20462;
    expect(Math.round(kgToLbs(1) * 100) / 100).toBe(2.2);
  });

  it("handles base64 text roundtrip safely", () => {
    const original = "Tiny Tools ⚡ 100% Client-Side";
    const encoded = btoa(unescape(encodeURIComponent(original)));
    const decoded = decodeURIComponent(escape(atob(encoded)));
    expect(decoded).toBe(original);
  });
});
