export function normalizeDoi(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  return raw.trim().replace(/^doi:\s*/i, "").toLowerCase() || undefined;
}

export function normalizePmid(raw: string | number | undefined): string | undefined {
  if (raw === undefined || raw === null || raw === "") return undefined;
  return String(raw).trim() || undefined;
}

export function normalizeYear(raw: string | number | undefined): number | undefined {
  if (raw === undefined || raw === null || raw === "") return undefined;
  const n = Number(raw);
  return isNaN(n) ? undefined : Math.floor(n);
}

export function normalizeString(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  return raw.trim() || undefined;
}
