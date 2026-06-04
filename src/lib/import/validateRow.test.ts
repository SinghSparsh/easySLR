import { describe, it, expect } from "vitest";
import { validateAndNormalizeRows } from "./validateRow";

// Helper — build a minimal valid raw row
const valid = (overrides = {}) => ({
  PMID: "38910001",
  Title: "A valid article title",
  "Publication Year": 2023,
  DOI: "10.1000/test.001",
  ...overrides,
});

describe("validateAndNormalizeRows", () => {

  // ── Happy path ────────────────────────────────────────────────────────

  it("returns valid for a well-formed row", () => {
    const [result] = validateAndNormalizeRows([valid()]);
    expect(result!.status).toBe("valid");
    expect(result!.pmid).toBe("38910001");
    expect(result!.title).toBe("A valid article title");
  });

  // ── Title validation ──────────────────────────────────────────────────

  it("errors on blank title", () => {
    const [result] = validateAndNormalizeRows([valid({ Title: "" })]);
    expect(result!.status).toBe("error");
    expect(result!.reason).toBe("Missing title");
  });

  it("errors on missing title field", () => {
    const row = { PMID: "38910001" }; // no Title key at all
    const [result] = validateAndNormalizeRows([row]);
    expect(result!.status).toBe("error");
    expect(result!.reason).toBe("Missing title");
  });

  // ── PMID validation ───────────────────────────────────────────────────

  it("errors on blank PMID", () => {
    const [result] = validateAndNormalizeRows([valid({ PMID: "" })]);
    expect(result!.status).toBe("error");
    expect(result!.reason).toBe("Missing PMID");
  });

  it("errors on non-numeric PMID", () => {
    const [result] = validateAndNormalizeRows([valid({ PMID: "ABC123" })]);
    expect(result!.status).toBe("error");
    expect(result!.reason).toBe("PMID must be numeric");
  });

  it("accepts numeric PMID provided as a number type", () => {
    const [result] = validateAndNormalizeRows([valid({ PMID: 38910001 })]);
    expect(result!.status).toBe("valid");
    expect(result!.pmid).toBe("38910001");
  });

  it("errors on duplicate PMID within the same batch", () => {
    const rows = [valid({ PMID: "38910001" }), valid({ PMID: "38910001", DOI: "10.1000/other" })];
    const results = validateAndNormalizeRows(rows);
    expect(results[0]!.status).toBe("valid");
    expect(results[1]!.status).toBe("error");
    expect(results[1]!.reason).toBe("Duplicate PMID in file");
  });

  // ── DOI validation ────────────────────────────────────────────────────

  it("errors on duplicate DOI within the same batch", () => {
    const rows = [
      valid({ PMID: "38910001", DOI: "10.1000/same" }),
      valid({ PMID: "38910002", DOI: "10.1000/same" }),
    ];
    const results = validateAndNormalizeRows(rows);
    expect(results[0]!.status).toBe("valid");
    expect(results[1]!.status).toBe("error");
    expect(results[1]!.reason).toBe("Duplicate DOI in file");
  });

  it("normalises DOI: strips 'DOI:' prefix and lowercases", () => {
    const [result] = validateAndNormalizeRows([valid({ DOI: "DOI:10.1000/Test.ABC" })]);
    expect(result!.status).toBe("valid");
    expect(result!.doi).toBe("10.1000/test.abc");
  });

  it("normalises DOI: strips lowercase 'doi:' prefix", () => {
    const [result] = validateAndNormalizeRows([valid({ DOI: "doi:10.1000/abc" })]);
    expect(result!.doi).toBe("10.1000/abc");
  });

  // ── Publication year validation ───────────────────────────────────────

  it("errors on non-numeric publication year", () => {
    const [result] = validateAndNormalizeRows([valid({ "Publication Year": "Twenty twenty" })]);
    expect(result!.status).toBe("error");
    expect(result!.reason).toBe("Invalid publication year");
  });

  it("warns on future publication year but still imports", () => {
    const [result] = validateAndNormalizeRows([valid({ "Publication Year": 2099 })]);
    expect(result!.status).toBe("warning");
    expect(result!.reason).toMatch(/future/i);
    expect(result!.publicationYear).toBe(2099);
  });

  it("accepts a valid past year", () => {
    const [result] = validateAndNormalizeRows([valid({ "Publication Year": 2020 })]);
    expect(result!.status).toBe("valid");
    expect(result!.publicationYear).toBe(2020);
  });

  it("accepts a missing year without erroring", () => {
    const [result] = validateAndNormalizeRows([valid({ "Publication Year": undefined })]);
    expect(result!.status).toBe("valid");
    expect(result!.publicationYear).toBeUndefined();
  });

  // ── Whitespace normalisation ──────────────────────────────────────────

  it("trims whitespace from all fields", () => {
    const [result] = validateAndNormalizeRows([
      valid({
        PMID: "  38910023  ",
        Title: "  Whitespace title  ",
        Authors: "  Patel A ; Green D  ",
        DOI: "  DOI:10.1000/NQ.2024.010  ",
      }),
    ]);
    expect(result!.pmid).toBe("38910023");
    expect(result!.title).toBe("Whitespace title");
    expect(result!.authors).toBe("Patel A ; Green D");
    expect(result!.doi).toBe("10.1000/nq.2024.010");
  });

  // ── Batch behaviour ───────────────────────────────────────────────────

  it("processes multiple rows and returns results in order", () => {
    const rows = [
      valid({ PMID: "001", DOI: "10.1000/a" }),
      valid({ PMID: "002", DOI: "10.1000/b" }),
      valid({ PMID: "003", DOI: "10.1000/c" }),
    ];
    const results = validateAndNormalizeRows(rows);
    expect(results).toHaveLength(3);
    expect(results.every(r => r.status === "valid")).toBe(true);
  });

  it("handles an empty batch without throwing", () => {
    const results = validateAndNormalizeRows([]);
    expect(results).toHaveLength(0);
  });

  // ── Real sample file edge cases ───────────────────────────────────────
  // These mirror the deliberate edge cases seeded in sample_article_import.xlsx

  it("row 4 — blank title → error", () => {
    const [result] = validateAndNormalizeRows([valid({ PMID: "38910004", Title: "" })]);
    expect(result!.status).toBe("error");
  });

  it("row 6 — 'Twenty twenty' year → error", () => {
    const [result] = validateAndNormalizeRows([
      valid({ PMID: "38910006", "Publication Year": "Twenty twenty" }),
    ]);
    expect(result!.status).toBe("error");
  });

  it("row 22 — year 2035 → warning (future)", () => {
    const [result] = validateAndNormalizeRows([
      valid({ PMID: "38910022", "Publication Year": 2035 }),
    ]);
    expect(result!.status).toBe("warning");
  });

  it("rows 16+17 — duplicate PMID → second row errors", () => {
    const rows = [
      valid({ PMID: "38910016", DOI: "10.1000/a", Title: "First article" }),
      valid({ PMID: "38910016", DOI: "10.1000/b", Title: "Duplicate PMID article" }),
    ];
    const results = validateAndNormalizeRows(rows);
    expect(results[0]!.status).toBe("valid");
    expect(results[1]!.status).toBe("error");
    expect(results[1]!.reason).toBe("Duplicate PMID in file");
  });

  it("rows 1+5 — duplicate DOI → second row errors", () => {
    const rows = [
      valid({ PMID: "38910001", DOI: "10.1000/jdh.2024.001" }),
      valid({ PMID: "38910005", DOI: "10.1000/jdh.2024.001" }),
    ];
    const results = validateAndNormalizeRows(rows);
    expect(results[0]!.status).toBe("valid");
    expect(results[1]!.status).toBe("error");
    expect(results[1]!.reason).toBe("Duplicate DOI in file");
  });
});
