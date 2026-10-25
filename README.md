# Morea BA Program

This is a standalone React/Vite app with Google Apps Script for spreadsheet access.

## Run with VS Code (Windows)

1. Install **Node.js LTS** and **VS Code**.
2. Extract the ZIP and open the extracted folder in VS Code (**File → Open Folder**).
3. Open **Terminal → New Terminal**.
4. Run `npm install`, then `npm run dev`.
5. Open the local address shown by Vite, normally `http://localhost:3000`.
6. To verify the production bundle, run `npm run build`; deploy the generated `dist/` folder to a static host you control.

## Deploy independently

1. Create a Web App deployment for `google-apps-script/Code.gs` and copy its `/exec` URL.
2. Set `VITE_GOOGLE_SHEET_API_URL` to that URL in the hosting provider's build environment. For local builds, set it in `.env.local`.
3. Build with `npm run build` and publish `dist/` using the provider's static-site instructions.
4. Test login and the Google Sheets features on the new site.

### GitHub Pages

- Add this project to a GitHub repository and push the default branch as `main`.
- In repository **Settings → Pages**, choose **GitHub Actions** as the build and deployment source.
- Optionally add the repository variable `VITE_GOOGLE_SHEET_API_URL` under **Settings → Secrets and variables → Actions → Variables** to override the configured default Apps Script URL.
- The workflow in `.github/workflows/deploy-pages.yml` builds and publishes on each push to `main`. The published address is shown in the workflow's deployment environment.

## Google Sheets

- The browser app calls a Google Apps Script Web App at `VITE_GOOGLE_SHEET_API_URL`.
- Copy `.env.example` to `.env.local`, then replace the example value with **your own** current Apps Script deployment `/exec` URL.
- Apps Script source is `google-apps-script/Code.gs`. Copy to a project bound to your sheet or set the `BA_SPREADSHEET_ID` Script Property to its spreadsheet ID.
- Deploy the Apps Script as a Web App, update `.env.local`, restart Vite, and test all account roles and Sale Out / Stock In reads/writes.
- Do **not** post login credentials, access tokens, or full spreadsheets in a public repository.
- Use proper server-side authentication and authorization before publishing real employee data. UI-based role filters alone are not a security boundary.

Read `SETUP_VSCODE_KH.md` for instructions in Khmer.
