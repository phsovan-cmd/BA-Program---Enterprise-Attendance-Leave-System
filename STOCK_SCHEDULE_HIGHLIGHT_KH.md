# Stock Count Schedule Highlight — Dashboard

បានកែ `src/components/BAMonthlyCombinedReport.tsx`៖
- ថ្ងៃរាប់ស្តុក 7, 14, 21, 28 នៃខែនីមួយៗ មានផ្ទៃពណ៌ស្វាយស្រាលនៅក្នុងជួរ «ស្តុក»។
- បើមិនទាន់មានកំណត់ត្រារាប់ស្តុកសម្រាប់ថ្ងៃនោះ បង្ហាញ SC1 · –, SC2 · –, SC3 · – ឬ SC4 · – ពណ៌លឿង។
- បើមានទិន្នន័យ Stock Count ដែលបាន Submit បង្ហាញ SC1–SC4 ជាពណ៌បៃតង។
- SCN នៅតែបង្ហាញពណ៌ស្វាយដោយឡែក។
- បន្ថែម Legend ពណ៌ខាងលើតារាង។
- ទិន្នន័យត្រូវទាញតាម logic ដើម; គ្មានការកែ Google Apps Script / កាលវិភាគ Backend។

ចំណាំ៖ ថ្ងៃនេះជាការកំណត់ក្នុង Project បច្ចុប្បន្ន។ មិនមាន Live Google Sheets Test ឬ Full Build ដែលបានបញ្ជាក់ទេ។
