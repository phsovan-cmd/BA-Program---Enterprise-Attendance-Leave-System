/**
 * Date parsing and formatting utilities
 * Handles various Google Apps Script / Sheet date representations
 */

export function formatDateToYMD(dateInput: any): string {
  if (!dateInput) return '';
  const str = String(dateInput).trim();

  // Pattern 1: ISO or standard YYYY-MM-DD (e.g. "2026-10-24" or "2026-10-24T00:00:00...")
  const isoMatch = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (isoMatch) {
    const y = isoMatch[1];
    const m = String(isoMatch[2]).padStart(2, '0');
    const d = String(isoMatch[3]).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // Pattern 2: DD/MM/YYYY
  const slashMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (slashMatch) {
    const d = String(slashMatch[1]).padStart(2, '0');
    const m = String(slashMatch[2]).padStart(2, '0');
    const y = slashMatch[3];
    return `${y}-${m}-${d}`;
  }

  // Pattern 3: "Sat Oct 24 2026 00:00:00 GMT+0700..."
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dateStrMatch = str.match(/[A-Za-z]{3}\s+([A-Za-z]{3})\s+(\d{1,2})\s+(\d{4})/);
  if (dateStrMatch) {
    const mIdx = monthNames.indexOf(dateStrMatch[1]);
    if (mIdx !== -1) {
      const y = dateStrMatch[3];
      const m = String(mIdx + 1).padStart(2, '0');
      const d = String(dateStrMatch[2]).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  }

  // Pattern 4: Fallback through Date object
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  return str;
}

/**
 * Checks if a specific date (YYYY-MM-DD) falls within a date range [start, end] inclusive
 */
export function isDateInRange(targetDateStr: string, startDateStr: string, endDateStr: string): boolean {
  const target = formatDateToYMD(targetDateStr);
  const start = formatDateToYMD(startDateStr);
  const end = formatDateToYMD(endDateStr);

  if (!target || !start || !end) return false;
  return target >= start && target <= end;
}
