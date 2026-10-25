# BA Program — ដំឡើង និង Deploy ឯករាជ្យ

## A. បើកលើ Computer

1. ដំឡើង **Node.js LTS** ពី https://nodejs.org និង **Visual Studio Code** ពី https://code.visualstudio.com ។
2. Extract ZIP ហើយនៅក្នុង VS Code ចុច **File > Open Folder** រើស Folder ដែលមាន `package.json`។
3. ចុច **Terminal > New Terminal**។
4. វាយ `npm install` រួច `npm run dev`។
5. បើក `http://localhost:3000` (ឬ URL ដែល Terminal បង្ហាញ)។

## B. ភ្ជាប់ Google Sheets

1. បើក Google Sheets ដែលកាន់ទិន្នន័យ BA Program → Extensions → Apps Script។
2. បម្រុងទុក Script ចាស់ មុន Copy Code ថ្មីពី `google-apps-script/Code.gs`។
3. ប្រសិនបើ Apps Script មិនភ្ជាប់ទៅ Sheet ដោយផ្ទាល់ កំណត់ **Project Settings > Script Properties**: `BA_SPREADSHEET_ID` = Spreadsheet ID របស់ Sheet។
4. Apps Script → **Deploy > New deployment > Web app**។ កំណត់សិទ្ធិ Access យ៉ាងប្រុងប្រយ័ត្ន មិនគួរបើកទិន្នន័យបុគ្គលិកជាសាធារណៈ។ Copy `/exec` URL។
5. ក្នុង Folder Project បង្កើត `.env.local` ពី `.env.example`។ ដាក់៖

```
VITE_GOOGLE_SHEET_API_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

6. Restart `npm run dev` ហើយសាកល្បង Login, Sale Out, Stock In និង Reports។
7. បើប្ដូរតែទិន្នន័យនៅ Sheet ដដែល មិនចាំបាច់ប្ដូរ URL។ បើប្ដូរ Spreadsheet ថ្មី កែ `BA_SPREADSHEET_ID`។

## C. Publish App

- វាយ `npm run build`។ នឹងបាន Folder `dist/`។
- Upload `dist/` ទៅ Static Hosting (Firebase Hosting, Netlify ឬ Vercel) ដែលអ្នកគ្រប់គ្រង។
- កំណត់ Environment Variable `VITE_GOOGLE_SHEET_API_URL` នៅ Hosting មុន Build។

## D. Deploy ទៅ GitHub Pages

1. ដាក់ Project នេះក្នុង GitHub repository ហើយ Push branch `main`។
2. នៅ GitHub ចូល **Settings > Pages** ហើយជ្រើស **GitHub Actions** ជា Build and deployment source។
3. បើចង់កំណត់ Apps Script URL ដោយខ្លួនឯង បន្ថែម Repository Variable `VITE_GOOGLE_SHEET_API_URL` នៅ **Settings > Secrets and variables > Actions > Variables**។
4. Workflow `.github/workflows/deploy-pages.yml` នឹង Build និង Deploy រាល់ពេល Push ទៅ `main`។ Link ថ្មីបង្ហាញនៅ Workflow deployment environment។

## សុវត្ថិភាព

មុន Share ទៅ BA/Manager ត្រូវពិនិត្យ Server-side Login/Role permissions, Google Apps Script Web App Access និងសិទ្ធិចូលទិន្នន័យ។ ការលាក់ Report តាម UI មិនគ្រប់គ្រាន់សម្រាប់ការការពារទិន្នន័យទេ។

**ស្ថានភាព:** Code បង្កើតបានជាប្រភេទ Project សម្រាប់ VS Code; ការភ្ជាប់ Google Sheets ផ្ទាល់ត្រូវការសិទ្ធិ និង Deployment របស់អ្នក ដូច្នេះមិនទាន់អាចបញ្ជាក់ Live Sync បានទេ។
