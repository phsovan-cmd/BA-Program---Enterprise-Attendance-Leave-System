# BA Program — Build/Sync Fix

1. Unzip ZIP. Open the extracted project folder **containing package.json directly**. Do not open a parent folder.
2. Set `VITE_GOOGLE_SHEET_API_URL` to your *current* Apps Script `/exec` deployment URL in `.env.local` or the static host's build environment. `.env.example` is documentation only.
3. In Google Sheets, Extensions > Apps Script, deploy the matching `google-apps-script/Code.gs` as a new version. Do not delete existing data tabs before backup and migration.
4. Check `/exec?type=api_health`. The version must match the installed backend. Run `setupSixReports` only after confirming your six sheet headers match; existing headers must not be overwritten.
5. For failed attendance / leave submission, first inspect the corresponding Google Sheet. An opaque no-cors POST does not prove failure or success; if retrying, reuse the same transaction ID.
6. From the project root: `npm install`, `npm run check:project`, `npm run lint`, `npm run build`. Publish the generated `dist/` folder to a static host. If npm install is unavailable in an offline environment, these checks cannot complete.

**What changed:** flattened project structure to fix missing `/app/applet/package.json`; kept one active source folder, preserved frontend / Apps Script; added URL validation and clearer submission error.

**Limits:** Not live-tested against your Google account or API. Google Apps Script code still uses password-based GET authentication and requires security hardening before production.
