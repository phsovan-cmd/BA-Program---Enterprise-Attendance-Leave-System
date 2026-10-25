# BA List / Product List Sync Fix

1. បើក Google Sheet **BA Control** → Extensions → Apps Script → ប្ដូរ `Code.gs` ជាឯកសារថ្មីក្នុង ZIP នេះ។
2. Deploy → Manage deployments → Edit (pencil) → Version: **New version** → Deploy។ ជ្រើស Execute as: **Me**, Who has access: កម្រិតដែលអនុញ្ញាតឱ្យ App របស់អ្នកប្រើ (ត្រូវគោរពតាមសុវត្ថិភាពរបស់អង្គការ)។
3. Copy **Web app /exec URL** ដែលទើប Deploy ហើយដាក់ក្នុង `.env` ឬ environment variables នៃ Hosting: `VITE_GOOGLE_SHEET_API_URL=<NEW_EXEC_URL>`។ **Rebuild និង redeploy App** (Vite reads env at build time)។ កុំប្រើ deployment URL ចាស់។
4. បើក `/exec?type=api_health` លើ URL ថ្មី ហើយពិនិត្យ `version` = `wide-clean-v5-20261025`, `spreadsheetName` = BA Control និង `spreadsheetId` ត្រូវនឹង Google Sheet ពិត។
5. Sign out / Sign in ម្តងទៀត ដើម្បីទទួល credentials ចុងក្រោយ ហើយ Sync data។ តេស្តបន្ថែម BA មួយ និងកែ Product មួយលើ Backup Copy ជាមុន។

**ការកែសំខាន់:** App ឈប់ប្រើ URL fallback ចាស់; API version check ត្រូវជាមួយ backend; Admin អាចបន្ថែម BA ថ្មី; Upload Product List ត្រូវបញ្ជាក់ការរក្សាទុកដោយ Read-back មុនបង្ហាញ success។

**ចំណាំ:** ការកែ Project ZIP មិនប្ដូរ Google Sheet ឬ Apps Script ដែលបាន Deploy ពិតដោយស្វ័យប្រវត្តិឡើយ។ ត្រូវ Deploy ទាំង backend និង frontend តាមជំហានខាងលើ។
