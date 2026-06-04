import * as XLSX from "xlsx";
import { validateAndNormalizeRows, type RawRow, type ValidatedRow } from "./validateRow";

export function parseExcelBuffer(buffer: ArrayBuffer): ValidatedRow[] {
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]!];
  if (!firstSheet) return [];

  const rows = XLSX.utils.sheet_to_json<RawRow>(firstSheet, { defval: "" });
  return validateAndNormalizeRows(rows);
}
