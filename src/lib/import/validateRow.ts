import { normalizeDoi, normalizePmid, normalizeString, normalizeYear } from "./normalizeRow";

export interface RawRow {
  PMID?: string | number;
  Title?: string;
  Authors?: string;
  Citation?: string;
  "First Author"?: string;
  "Journal/Book"?: string;
  "Publication Year"?: string | number;
  "Create Date"?: string;
  PMCID?: string;
  "NIHMS ID"?: string;
  DOI?: string;
}

export interface ValidatedRow {
  status: "valid" | "warning" | "error";
  reason?: string;
  pmid?: string;
  title: string;
  authors?: string;
  citation?: string;
  firstAuthor?: string;
  journal?: string;
  publicationYear?: number;
  createDate?: string;
  pmcid?: string;
  nimsId?: string;
  doi?: string;
}

export function validateAndNormalizeRows(rawRows: RawRow[]): ValidatedRow[] {
  const currentYear = new Date().getFullYear();
  const seenPmids = new Set<string>();
  const seenDois = new Set<string>();

  return rawRows.map((raw): ValidatedRow => {
    const pmid = normalizePmid(raw.PMID);
    const title = normalizeString(raw.Title);
    const doi = normalizeDoi(raw.DOI);
    const yearRaw = raw["Publication Year"];
    const yearNum = normalizeYear(yearRaw);

    // — Required field: title
    if (!title) {
      return { status: "error", reason: "Missing title", title: "" };
    }

    // — PMID validation
    if (!pmid) {
      return { status: "error", reason: "Missing PMID", title };
    }
    if (!/^\d+$/.test(pmid)) {
      return { status: "error", reason: "PMID must be numeric", title, pmid };
    }
    if (seenPmids.has(pmid)) {
      return { status: "error", reason: "Duplicate PMID in file", title, pmid };
    }

    // — DOI duplicate check within file
    if (doi && seenDois.has(doi)) {
      return { status: "error", reason: "Duplicate DOI in file", title, pmid, doi };
    }

    // — Year validation
    if (yearRaw !== undefined && yearRaw !== "" && yearNum === undefined) {
      return { status: "error", reason: "Invalid publication year", title, pmid, doi };
    }

    // Track seen values (only after passing checks)
    seenPmids.add(pmid);
    if (doi) seenDois.add(doi);

    // — Warning: future year
    if (yearNum !== undefined && yearNum > currentYear) {
      return {
        status: "warning",
        reason: `Publication year ${yearNum} is in the future`,
        pmid,
        title,
        authors: normalizeString(raw.Authors),
        citation: normalizeString(raw.Citation),
        firstAuthor: normalizeString(raw["First Author"]),
        journal: normalizeString(raw["Journal/Book"]),
        publicationYear: yearNum,
        createDate: normalizeString(raw["Create Date"]),
        pmcid: normalizeString(raw.PMCID),
        nimsId: normalizeString(raw["NIHMS ID"]),
        doi,
      };
    }

    return {
      status: "valid",
      pmid,
      title,
      authors: normalizeString(raw.Authors),
      citation: normalizeString(raw.Citation),
      firstAuthor: normalizeString(raw["First Author"]),
      journal: normalizeString(raw["Journal/Book"]),
      publicationYear: yearNum,
      createDate: normalizeString(raw["Create Date"]),
      pmcid: normalizeString(raw.PMCID),
      nimsId: normalizeString(raw["NIHMS ID"]),
      doi,
    };
  });
}
