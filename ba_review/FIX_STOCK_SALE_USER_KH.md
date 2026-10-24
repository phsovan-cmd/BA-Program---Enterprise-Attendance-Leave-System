# កំណែជួសជុល BA Program — Stock In / Sale Out និង User ID

## បញ្ហាដែលរកឃើញ
1. នៅក្នុង localStorage កូដចាស់ប្រើ ID `BA00002` ដោយស្វ័យប្រវត្តិ នៅពេល Stock In record គ្មាន BA ID។ ទិន្នន័យខ្លះអាចត្រូវបានបង្ហាញក្រោម BA ខុស។
2. ការបង្ហាញ Stock In តាម User ធ្លាប់អនុញ្ញាតឱ្យ `updatedBy` (អ្នកកែ/អនុម័ត) ត្រូវរាប់ជាម្ចាស់ទិន្នន័យ។ ឥឡូវប្រើ `baId` ឬ `requestedById` ប៉ុណ្ណោះ។
3. នៅ Backend ការបញ្ជូន Stock In, Sale Out និងការអានស្តុកមិនទាន់មានការត្រួតពិនិត្យការប្ដូរ BA ID គ្រប់គ្រាន់។ កំណែថ្មីទប់ BA ធម្មតាពីការប្រើ BA ID របស់អ្នកដទៃ។

## របៀបដាក់ប្រើប្រាស់
1. Backup Google Sheets និង Project ចាស់ជាមុន។
2. Copy `google-apps-script/Code.gs` ថ្មីទៅ Apps Script ហើយ Deploy > Manage deployments > Edit > New version > Deploy។
3. ពិនិត្យ `VITE_GOOGLE_SHEET_API_URL` ក្នុង `.env` ថាចង្អុលទៅ `/exec` នៃ Apps Script deployment ដែលប្រើ។
4. Build / deploy React website ថ្មីដោយយោងតាម README; បើក website និង login ម្តងទៀត។
5. ធ្វើតេស្ត BA A និង BA B ជាមួយ Stock In និង Sale Out ផ្សេងគ្នា។ ត្រូវឃើញតែទិន្នន័យតាមសិទ្ធិរបស់ User។
6. ពិនិត្យ Google Sheets ជួរឈរ `BA ID` សម្រាប់ records ចាស់។ កូដមិនអាចស្វែងរកម្ចាស់ពិតប្រាកដរបស់ records ចាស់ដែលរក្សាទុកក្រោម ID ខុសដោយស្វ័យប្រវត្តិទេ។ កុំប្ដូរទិន្នន័យចាស់ដោយគ្មានភស្តុតាង។

## ដែនកំណត់
- ធ្វើ Static checks និង Google Apps Script syntax check ប៉ុណ្ណោះ។ មិនទាន់អាចចូល Google Sheet ពិត, សាកល្បង browser app ឬ build ពេញលេញបានទេ។
- ប្រសិនបើរបាយការណ៍មិនបង្ហាញ សូមពិនិត្យ Sync error, Apps Script /exec URL, deployment permissions និង BA List credentials។
- កំណែនេះមិនកែប្រែ Google Sheet របស់អ្នកដោយផ្ទាល់ទេ។
