# BA Control — Daily Wide Reports

កំណែនេះប្រើ `Product List` Column B (Product Code) និង C (Product Name) ដើម្បីបង្កើត Column សម្រាប់ SKU ដោយស្វ័យប្រវត្តិក្នុង **Stock In Report** និង **Sale Out Report**។

- `Stock In Report`: ១ Row ក្នុង ១ ថ្ងៃ / BA; SKU មួយមាន Column មួយ (Qty In សរុបប្រចាំថ្ងៃ)។
- `Sale Out Report`: ១ Row ក្នុង ១ ថ្ងៃ / BA; SKU មួយមាន Column មួយ (Qty Sold សរុបប្រចាំថ្ងៃ)។
- `BA Attendance Report`: ១ Row ក្នុង ១ ថ្ងៃ / User; Check In និង Check Out មាន Column ដាច់ដោយឡែក។
- `Records JSON` ជា Column ចាំបាច់ សម្រាប់រក្សា ID, time, individual orders, price និងប្រវត្តិមិនឱ្យ API និង stock balance ខូច។ កុំលុប Column នេះ (អាច Hide បាន)។

## ដំឡើង / បម្លែងទិន្នន័យចាស់

1. **ធ្វើ Copy Google Spreadsheet ដើម** ហើយសាកល្បងលើ Copy មុន។
2. បើ Sheets ទាំង ៣ មានទិន្នន័យទម្រង់ចាស់ (Transaction ID នៅ Column A), ដាក់ `google-apps-script/Code.gs` ថ្មីក្នុង Apps Script របស់ Copy រួច Run `migrateDailyWideReportsOnBackupCopy()` **ម្តងប៉ុណ្ណោះ**។ វា Copy backup របស់ report ចាស់ទៅ snapshot tabs រួចបម្លែងទិន្នន័យទៅទម្រង់ថ្មី។
3. បើ Sheets ថ្មីទទេ សូម Run `setupSixReports()` ជំនួស។
4. Check រាល់ 3 Reports និងសាក Test Stock In, Sale Out, Check In, Check Out, retry transaction មុននឹងប្ដូរ deployment URL។
5. Deploy Google Apps Script ជា New Version (Web App)។ កុំប្ដូរ spreadsheet ផ្ទាល់មុនសាកល្បងចប់។

**សំខាន់:** បើ SKU មួយបាន Submit ច្រើនដងក្នុងថ្ងៃតែមួយ Column Qty នឹងបូកបញ្ចូលគ្នា។ Transaction-level details រក្សានៅ `Records JSON`។ កុំ Delete `Records JSON` ឬ snapshot backup មុនពេលផ្ទៀងផ្ទាត់ទិន្នន័យ។

**កំណត់សម្គាល់:** Syntax បានត្រួតពិនិត្យ តែ Google Apps Script live និង App frontend មិនទាន់បានធ្វើ end-to-end test ទេ។
