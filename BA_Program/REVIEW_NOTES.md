# BA Program — reviewed changes (24 October 2026)

## Changes
- Removed silent fallback to an embedded Apps Script deployment URL. Set `VITE_GOOGLE_SHEET_API_URL` explicitly in `.env`, based on `.env.example`.
- Removed `setup_six_reports` from the public web endpoint. It could change a live spreadsheet by GET, including deleting columns named `Records JSON` and `Submission Data`.
- Removed automatic retry that invoked that setup endpoint whenever the stock read failed. Sheet changes must now be run manually by an authorized editor.
- Excluded `.env` from this shared ZIP to avoid exposing a live deployment setting.

## Deploy
1. Back up Google Sheets and its existing Apps Script before any change.
2. Create `.env` with the CURRENT deployed Apps Script `/exec` URL (see `.env.example`).
3. Paste `google-apps-script/Code.gs` into the script bound to the correct spreadsheet. Deploy a new version under Manage deployments.
4. Check `/exec?type=api_health`: expect `wide-clean-v3-20261024`.
5. Verify all six sheet headers and all existing records. If an initial setup is actually needed, run `setupSixReports()` from the Apps Script editor only **after backing up and checking schemas**. This function can delete columns with legacy JSON headers.
6. Run `npm install`, `npm run lint`, and `npm run build` locally, then exercise login, stock reads/writes, sales, leave and attendance against test records.

## Not fixed / limitations
- No live Google account / Google Sheet testing was possible here.
- Passwords are still stored in sheets and sent in URL queries. This is not a production-safe authentication design.
- `no-cors` POST does not provide reliable HTTP status visibility. Confirm transaction IDs and sheet entries.
- Old setup instructions/versions in some Khmer documentation may not match the current backend.
