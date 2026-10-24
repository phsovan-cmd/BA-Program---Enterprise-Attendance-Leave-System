# BA Program — App Error Fix (24 Oct 2026)

## កែសម្រួល
- ការឆ្លើយតប Sync យឺតពី User ចាស់ មិនអាចកែ State របស់ User ដែលបាន Login ថ្មី / Logout បានទៀត។
- ពេលប្ដូរ Login ឬ Logout សម្អាតតម្លៃ Sale Out, Stock In និង Stock Balance ដែលនៅក្នុង State ពី User មុន។
- ការបញ្ចូល Stock In មិនប្រើ BA00001 ជា fallback ទៀតទេ។ ត្រូវមានអ្នក Login ពិតប្រាកដ។
- API Stock In មិនប្រើ `updatedBy` (អ្នកកែ/អ្នកអនុម័ត) ជា BA ម្ចាស់ទិន្នន័យទៀតទេ។
- BA Staff មិនអាចបញ្ជូន Sale Out ក្រោម BA ID ផ្សេងពី User ដែល Login បានទេ (frontend check)។
- ការអនុម័ត Stock Adjustment មិនបញ្ជូនស្តុករបស់ BA ម្នាក់ទៅ overwrite Global Product List ទៀតទេ។ កត់ត្រា transaction ជាមុន រួច Sync ពី Server។
- ប្រសិនបើ Google Sheets មិនបញ្ជាក់ការអនុម័ត App មិនសរសេរថា Approved ជោគជ័យភ្លាមៗទេ។

## អ្វីដែលបានសាកល្បង
- TypeScript TSX/TS syntax parsing របស់ App.tsx និង api.ts: PASS.
- Google Apps Script Code.gs JavaScript syntax: PASS.
- Project required files: PASS.
- Full `vite build` / TypeScript typechecking មិនទាន់បានធ្វើ ដោយសារ dependencies មិនមាននៅក្នុង runtime នេះ។
- មិនទាន់សាកល្បងជាមួយ Google Sheets ពិត ឬនៅលើ Browser/PWA ទេ។

## របៀបដាក់ប្រើប្រាស់
1. Backup Google Sheets និង Web App ចាស់។
2. ប្រៀបធៀប `src/App.tsx` និង `src/services/api.ts` ជាមួយ code ចាស់។
3. `google-apps-script/Code.gs` រួមជាមួយ project ដើម្បី deploy backend version ត្រឹមត្រូវ។
4. ផ្ទៀងផ្ទាត់ `.env` មាន `VITE_GOOGLE_SHEET_API_URL` សម្រាប់ Apps Script `/exec` (កុំដាក់សម្ងាត់ក្នុង ZIP ដែលចែករំលែក)។
5. `npm install`, `npm run lint`, `npm run build`; បន្ទាប់មក deploy Web App និង Apps Script។
6. Test BA A និង BA B ដោយ Stock In និង Sale Out ផ្សេងគ្នា, Logout/Login, Sync, និង Admin Approval។

**សំខាន់:** កែ code មិនអាចកំណត់ម្ចាស់ពិតរបស់ rows ចាស់ដែលមាន BA ID ខុសដោយស្វ័យប្រវត្តិបានទេ។ ត្រូវផ្ទៀងផ្ទាត់ sheet source។ ការការពារ frontend មិនជំនួស server-side authentication / authorization ទេ។
