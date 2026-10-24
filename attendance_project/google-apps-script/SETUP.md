# Horizontal product-item reports — BA Control

**Layout:** one row per date and BA ID; product items are columns from left to right.
Sale Out: Date | BA ID | BA Name | Province | No Sales | SKU A | SKU B | ... | Total Qty | Total Amount
Stock In: Date | BA ID | BA Name | Note | SKU A | SKU B | ... | Total Added

1. Open your current Google Sheet **BA Control** > Extensions > Apps Script.
2. Copy the `report-matrix.gs` functions into a new script file in that existing project.
3. In your existing `doPost(e)` handler, immediately after parsing `JSON.parse(e.postData.contents)` into `data`, add:

```js
if (data.type === 'sync_sale_out_matrix' || data.type === 'sync_stock_in_matrix') {
  return handleHorizontalReportMatrix_(data);
}
```

4. Save and **deploy a new version** of the web app; update the API URL in `src/services/api.ts` if the deployment URL changed.
5. In the BA web app, use the Sale Out Sync button to publish sale-out matrix and the Stock In Sync button to publish **approved** stock-in matrix.

The original app script was not included in the ZIP, so these server-side changes must be installed in your current Apps Script project. Existing unrelated doPost actions should remain intact. The client sends data in `no-cors` mode, so it cannot verify Google's actual response; check the sheet after syncing. Matrix sync replaces values for the same Date + BA ID and preserves other dates; newly added product items become columns. The existing single-order/single-stock-in backend actions may continue to write their own layout until their handlers are updated too.
