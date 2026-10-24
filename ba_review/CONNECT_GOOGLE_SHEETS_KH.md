# ភ្ជាប់ BA Program ទៅ Google Apps Script

**Web App URL**: `https://script.google.com/macros/s/AKfycbyK1y4XW4_SCOP3wsyIEhapnj95mXr-xxLCmVHGtyUB5nGOEjalniPxY-Iml61rn5onug/exec`

1. កុំលុប `src/services/api.ts` ឬ `.env`។ API URL ត្រូវបានកំណត់ក្នុងទាំងពីរ ដោយ `.env` មានអាទិភាព។
2. បើក **BA Control → Extensions → Apps Script**។ ផ្ទៀងផ្ទាត់ថា `Code.gs` ក្នុង `google-apps-script/Code.gs` ត្រូវនឹង Code ដែលបាន Deploy។
3. **Deploy → Manage deployments → Edit → New version → Deploy**។ Web App URL នេះនឹងនៅដដែល ប្រសិនបើធ្វើ New version លើ Deployment ដើម។
4. នៅក្នុង Browser បើក URL + `?type=api_health`។ ត្រូវឃើញ `success:true` និង `version:six-tabs-integrated-2026-10-23-r3`។ បើមិនបាន មិនត្រូវ Submit ទិន្នន័យពិតឡើយ។
5. Verify ថា Headers របស់ Sheets ទាំង 6 ត្រូវនឹង `HEADERS` ក្នុង Code.gs; ប្រសិនបើ Sheet មានទម្រង់ចាស់ ត្រូវ Backup និង Migration ជាមុន។
6. Preview/Build App ម្តងទៀត ហើយ Login ដោយ BA ដែលមានក្នុង `BA List`។ សាកល្បង Read និង Submit ដោយប្រើ BA / SKU សាកល្បង។

**ព្រមាន**: `no-cors` POST មិនអាចបញ្ជាក់ Success ដោយផ្ទាល់ទេ។ App ប្រើ `submission_status` តាម GET ដើម្បីបញ្ជាក់ថាទិន្នន័យត្រូវបានរក្សាទុក។ ប្រសិនបើបង្ហាញថាមិនអាច Confirm បាន សូមពិនិត្យ Google Sheets និង Deployment មុន Submit ឡើងវិញ ដើម្បីកុំឱ្យស្ទួន។

**សុវត្ថិភាព**: App នេះនៅប្រើ Password ក្នុង query string សម្រាប់ GET ដែលមិនសមស្របសម្រាប់ Production។ ត្រូវផ្លាស់ប្តូរទៅ Authentication ដែលមានសុវត្ថិភាពមុនប្រើទិន្នន័យពិត។
