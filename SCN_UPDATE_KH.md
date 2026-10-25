# BA Program: SCN Dashboard update

1. ដក Status Bar `Google Sheets updated` និងប៊ូតុង `Refresh Reports` ចេញពី Dashboard។ មិនបានលុប Auto Sync និង Menu `Sync Google Sheets` ទេ។
2. Stock Count Report ឥឡូវបង្ហាញ `SC1`–`SC4` និង `SCN`។ `SCN` មានន័យថា Stock Count Note ក្រៅវគ្គ។
3. យកទិន្នន័យពី `Stock In Report` តាម API ដែលមានស្រាប់ (`get_stock_in`)។ យក Note ដែលចាប់ផ្តើម `Stock Count Note` ឬ Source ដែលមាន `Stock Count Note`។
4. Group តាម BA ID + Date និងប្រើ Set ដើម្បីមិនឱ្យ Badge ដូចគ្នាស្ទួននៅថ្ងៃតែមួយ ទោះ Submit មានច្រើន SKU។
5. រក្សា `Refresh` នៅផ្ទាំង Stock Count Report ដើម្បីអាចទាញឡើងវិញបាន។

**Installation:** Build the updated project with `npm run build` and deploy the generated `dist/` folder to your static host. No Apps Script changes are required for this UI-only modification if the existing `get_stock_in` API already returns date, BA ID and note/source accurately.

**Verification:** Project structure checked. Full React build and live Google Sheets sync were not executed here.
