# BA Monthly Combined Report

Dashboard: BA Staff មើលតែ Monthly Report ផ្ទាល់ខ្លួន (Date | វត្តមាន | លក់ | ស្តុក)។ Admin/Manager អាច Filter តាម BA ដែលមានសិទ្ធិ។ Admin/Manager នៅតែឃើញ Reports ទាំង ៣ ដើម។

✓ = Check In/Out, AL/SL/... = Approved Leave, SO = Sale Out (មិនរាប់ No-Sales), SC1–SC4/SCN = Stock Count។ – = គ្មាន Record (មិនមែនមានន័យថាអវត្តមានជាក់លាក់ទេ)។

Auto Sync: ទាញទិន្នន័យពី Google Sheets តាមការកំណត់ App ដែលមានស្រាប់ 60 វិនាទី ពេល Browser Focus និង Login។

Files: src/components/BAMonthlyCombinedReport.tsx (new), src/App.tsx (updated).

Notes: Google Apps Script មិនបានផ្លាស់ប្ដូរ។ ការផ្ទៀងផ្ទាត់ Full Build និង Live Google Sheets ត្រូវធ្វើក្នុង environment deployment។
