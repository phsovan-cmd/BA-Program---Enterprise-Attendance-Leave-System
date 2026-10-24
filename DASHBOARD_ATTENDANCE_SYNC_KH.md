# BA Program — Dashboard & Attendance Separate, Auto Sync

## កែប្រែ
- Dashboard ផ្ទាល់: 1) វត្តមាន 2) Sale Out Checklist 3) Stock Count Checklist
- Attendance Menu ផ្ទាល់: របាយការណ៍វត្តមាន (មិនបង្ហាញ Sales/Stock)
- Sale Out: ទាញ API `get_sales` រួច regroup តាម BA + Order ID ដើម្បីការពារស្ទួន
- Stock Count: ទាញ API `get_stock_in` និងតារាងទិន្នន័យក្នុង Google Sheets
- Attendance, Leave, BA List, Product List: sync ពី endpoints ដើម
- Refresh ពេល login, ពេល browser/tab ត្រឡប់មកវិញ និងរៀងរាល់ 60 វិនាទី (នៅពេល login)
- បង្ហាញស្ថានភាព Update និង Error នៅ Dashboard; ពេល sync fail មិនអះអាងថាទិន្នន័យជា live ឡើយ

## ជំហានដំឡើង
1. Backup Project និង Google Sheets.
2. Replace Project Frontend ដោយ ZIP ថ្មី។ រក្សា `.env` ឬ Environment Variable API URL `/exec` ឱ្យបានត្រឹមត្រូវ។
3. មិនចាំបាច់ Replace Apps Script បើ endpoint `get_sales`, `get_stock_in`, `get_attendance`, `get_leaves`, `get_users`, `get_products` មាននៅក្នុង Deployment ដើម។
4. Build/Preview ហើយ login និងចុច Refresh Reports។
5. ផ្ទៀងផ្ទាត់ Sales, Stock Count, Attendance និង Leave ជាមួយ Google Sheets ពិត។

សំខាន់៖ ក្នុងបរិស្ថានកែនេះមិនមាន frontend dependencies ទេ ហេតុនេះ Full Vite Build មិនអាចបញ្ជាក់បាន។ មិនទាន់សាកល្បង Live Google Sheets។
