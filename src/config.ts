/**
 * Configuration file for the Sheets Personal Vault Manager.
 * 
 * Paste your Google Apps Script "Web App URL" into GOOGLE_SHEETS_SCRIPT_URL.
 * 
 * To get this URL:
 * 1. Open Google Sheet > Extensions > Apps Script.
 * 2. Paste contents of '/code.js'.
 * 3. Save > Deploy > New Deployment > Web App.
 * 4. Ensure "Execute as": "Me", "Who has access": "Anyone".
 * 5. Deploy and copy the URL.
 */

// Put your deployed URL here (Hardcoded):
export const GOOGLE_SHEETS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyQJa68wgPM0xmYgytbGO3L2pdM59xogziUESbAjPZO17u0qs1QOcm3Z4mvRT7stzVv/exec";

/**
 * Utility checks if a URL looks valid.
 */
export function isValidAppsScriptUrl(url: string): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  return trimmed.startsWith("https://script.google.com/macros/") || trimmed.startsWith("https://script.google.com/a/macros/");
}
