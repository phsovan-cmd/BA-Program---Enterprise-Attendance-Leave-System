# BA Program — Google Sheets API / ការដំឡើង

1. Backup BA Control Google Sheet និង Project មុនកែ។
2. ប្រាកដថា Sheets ទាំង 6 មាន Headers ដូច `google-apps-script/Code.gs`។ បើ Headers មិនត្រូវ កុំ Run Migration លើ Data ដើម។
3. ក្នុង BA Control → Extensions → Apps Script ជំនួស Code ដោយ `google-apps-script/Code.gs`។ Run `verifyConnection` និង `setupSixReports` (លើ Copy ជាមុន)។
4. Deploy → Manage deployments → Edit → New version → Deploy។ អនុញ្ញាត Web App តាម Access Policy របស់អង្គភាព។
5. នៅ AI Studio ដាក់ `VITE_GOOGLE_SHEET_API_URL` ជា deployed `/exec` URL ពិត។ Project នេះមាន fallback URL បើ `.env` ខូច។
6. បើក `<exec-url>?type=api_health`។ រំពឹង JSON `success:true` និង version `six-tabs-stable-2026-10-23-r4`។ បើ version ខុស គឺ deployment ចាស់។
7. សាកល្បង Login, GET Products, Stock In, Sale Out, Check In/Out, Leave និង `submission_status` លើ Test BA / Test SKU តែប៉ុណ្ណោះ។
8. Submit ជាមួយ Transaction ID / Order ID ដដែលពេល Retry។ កុំបង្កើត ID ថ្មីបើ Status មិនច្បាស់។

## API
GET: `api_health`, `login`, `get_users`, `get_products`, `get_attendance`, `get_leaves`, `get_sales`, `get_stock_in`, `get_ba_actual_stock`, `submission_status`។
POST: `stock_in`, `submit_stock_count`, `sales_order`, `attendance`, `leave_request`, `leave_action`, `admin_save_user`, `delete_user`, `change_password`។

**កំណត់សម្គាល់**: Google Apps Script ContentService មាន CORS/redirect limitations។ POST `no-cors` មិនត្រឡប់ response ដែល frontend អាចអានបានទេ។ App ត្រូវ Poll `submission_status` និងសម្រេច Success តែក្រោយ confirmation។ មិនទាន់បានធ្វើ Live Test លើ Spreadsheet ពិត។

**Security**: ប្រព័ន្ធនេះនៅប្រើ Plaintext Password និងបញ្ជូន Credentials តាម Query។ មិនមែន Production-ready សម្រាប់ Data បុគ្គលិកពិតទេ។ ត្រូវប្តូរទៅ Authentication ដែលប្រសើរជាងនេះ។
