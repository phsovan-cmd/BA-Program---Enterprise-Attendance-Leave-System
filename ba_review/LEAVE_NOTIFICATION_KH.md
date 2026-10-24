# Leave-only Approval Notification

- រូបកណ្ដឹងនៅខាងស្តាំ Header សម្រាប់ Admin និង Manager ប៉ុណ្ណោះ។
- រាប់សំណើ `BA Leave Report` ដែល Status = `Pending` ដោយរាប់តាម Leave ID ម្តងតែ១។
- Admin ឃើញសំណើ Pending ដែល App បានទាញយកទាំងអស់។
- Manager ឃើញសំណើ Pending របស់ BA ក្រោមការគ្រប់គ្រងខ្លួន (មិនរាប់សំណើផ្ទាល់ខ្លួន)។
- ចុចលើកណ្ដឹង ឃើញឈ្មោះ BA, Leave Type, និងថ្ងៃឈប់សម្រាក; ចុចសំណើដើម្បីទៅ Leave Requests។
- មិនបង្ហាញ Stock Count / Stock Adjustment នៅក្នុង Notification ទេ។
- ទិន្នន័យ Update តាម Sync របស់ App; មិនមែន Push Notification ពេល App បិទទេ។
- កុំបង្ហាញ Demo Pending ជាទិន្នន័យពិត។ ប្រសិនបើ Google Sheets មិនភ្ជាប់បាន ត្រូវផ្ទៀងផ្ទាត់ Connectivity មុនអនុម័ត។

ការកែនេះជា Frontend ប៉ុណ្ណោះ។ Apps Script មិនត្រូវការកែ ប្រសិនបើ `get_leaves` និង `leave_action` ដំណើរការ។
