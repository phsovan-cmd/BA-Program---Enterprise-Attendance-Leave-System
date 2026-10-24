# Sale Out Checklist — Update

- Added `src/components/MonthlySaleOutChecklist.tsx`.
- Added Sale Out monthly matrix to Dashboard / Overview above attendance report; BA rows and day 1–31 columns.
- `SO` appears only on dates with a saved SalesOrder with positive `totalQty` and `isNoSales === false`; `–` means no sale record (not necessarily confirmed zero sales).
- Clicking SO displays order count, total quantity, sales value, and unique SKU count.
- Search BA, month arrows, Manager filter for Admin, and role-based BA visibility.
- Sales orders are deduplicated in the display by `BA ID + Order ID`.
- Uses `salesOrders` loaded by existing app; NO new sheets, no change to Google Apps Script.
- If existing app has not synced sales data from Google Sheets, the checklist will not yet show them. Validate the API connection and sync.
- Project-structure check passed. Full build not executed because dependencies are unavailable in the current environment.
