/**
 * Paste into the existing BA Control Apps Script project.
 * In its EXISTING doPost(e), after parsing JSON into `data`, add:
 *   if (data.type === 'sync_sale_out_matrix' || data.type === 'sync_stock_in_matrix') {
 *     return handleHorizontalReportMatrix_(data);
 *   }
 * Keep all other doPost cases intact.
 * Bound script: SpreadsheetApp.getActiveSpreadsheet(); standalone: openById.
 */
function handleHorizontalReportMatrix_(data) {
  var sheetName = data.type === 'sync_sale_out_matrix' ? 'Sale Out' : 'Stock In';
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var book = SpreadsheetApp.getActiveSpreadsheet();
    if (!book) throw new Error('Bind this script to BA Control or use SpreadsheetApp.openById.');
    var sh = book.getSheetByName(sheetName) || book.insertSheet(sheetName);
    var sale = sheetName === 'Sale Out';
    var fixed = sale ? ['Date','BA ID','BA Name','Province','No Sales'] : ['Date','BA ID','BA Name','Note'];
    var tail = sale ? ['Total Qty','Total Amount'] : ['Total Added'];
    // Include historical product headers so archived SKU data is never deleted.
    var existing = sh.getLastColumn() ? sh.getRange(1,1,1,sh.getLastColumn()).getDisplayValues()[0] : [];
    var historical = existing.filter(function(h) { return h && fixed.indexOf(h) < 0 && tail.indexOf(h) < 0; });
    var supplied = (data.products || []).map(function(p) { return String(p.header || p.code + '-' + p.name); });
    var productHeaders = [];
    historical.concat(supplied).forEach(function(h) { if (productHeaders.indexOf(h) === -1) productHeaders.push(h); });
    var headers = fixed.concat(productHeaders).concat(tail);
    var oldRows = sh.getLastRow() > 1 ? sh.getRange(2,1,sh.getLastRow()-1,Math.max(1,sh.getLastColumn())).getValues() : [];
    var oldIndex = {};
    existing.forEach(function(h,i) { oldIndex[h] = i; });
    var records = new Map();
    oldRows.forEach(function(row) {
      var record = {};
      existing.forEach(function(h,i) { if(h) record[h] = row[i]; });
      var key = String(record['Date'] || '') + '|' + String(record['BA ID'] || '').toUpperCase();
      if (key !== '|') records.set(key,record);
    });
    (data.matrixRows || []).forEach(function(r) {
      var record = {
        'Date': r.date || '', 'BA ID': r.baId || '', 'BA Name': r.baName || '',
      };
      if (sale) {
        record['Province'] = r.province || '';
        record['No Sales'] = !!r.isNoSales;
        record['Total Qty'] = Number(r.totalQty || 0);
        record['Total Amount'] = Number(r.totalAmount || 0);
      } else {
        record['Note'] = r.note || '';
        record['Total Added'] = Number(r.totalAdded || 0);
      }
      productHeaders.forEach(function(header) {
        var p = (data.products || []).find(function(product) { return String(product.header || product.code + '-' + product.name) === header; });
        record[header] = p ? Number((r.columnValues || {})[header] || (r.productQuantities || {})[String(p.code).toUpperCase()] || 0) : 0;
      });
      records.set(String(record['Date']) + '|' + String(record['BA ID']).toUpperCase(),record);
    });
    var rows = Array.from(records.values()).sort(function(a,b) {
      return String(a['Date']).localeCompare(String(b['Date'])) || String(a['BA ID']).localeCompare(String(b['BA ID']));
    }).map(function(rec) { return headers.map(function(h) { return rec[h] == null ? '' : rec[h]; }); });
    sh.clearContents();
    sh.getRange(1,1,1,headers.length).setValues([headers]);
    if(rows.length) sh.getRange(2,1,rows.length,headers.length).setValues(rows);
    sh.setFrozenRows(1);
    return ContentService.createTextOutput(JSON.stringify({success:true, sheet:sheetName, rows:rows.length}))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
