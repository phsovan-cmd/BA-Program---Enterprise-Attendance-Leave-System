/**
 * BA Program — Google Sheets Backend (Clean Wide Daily Reports, No JSON Columns)
 * Version: wide-clean-v4-20261025
 *
 * All 6 Sheets:
 * 1. BA List: ['BA ID', 'BA Name', 'Password', 'Location', 'Start Date', 'Status', 'Type', 'Manager ID']
 * 2. Product List: ['No', 'Product Code', 'Product Name', 'Category', 'Price', 'Initial Stock', 'Stock Qty', 'Total Sold', 'Min Alert Qty', 'Image URL']
 * 3. Stock In Report: ['Date', 'BA ID', 'BA Name', 'Province', 'Last Submit', 'Total Qty', ...SKU Columns]
 * 4. Sale Out Report: ['Date', 'BA ID', 'BA Name', 'Province', 'Last Submit', 'Total Qty', 'Total Sales ($)', 'No Sales', ...SKU Columns]
 * 5. BA Attendance Report: ['Date', 'User ID', 'User Name', 'Check In', 'Check In Location', 'Check In Details', 'Check In Distance (m)', 'Check Out', 'Check Out Location', 'Check Out Details', 'Check Out Distance (m)']
 * 6. BA Leave Report: ['Leave ID', 'User ID', 'User Name', 'Manager ID', 'Leave Type', 'Start Date', 'End Date', 'Reason', 'Status']
 *
 * NOTE: Absolutely NO "Records JSON" or "Submission Data" column in any sheet.
 * Clean, human-readable numbers, dates, and text for managers and spreadsheet viewers.
 */

const CFG = Object.freeze({
  BA: 'BA List',
  PRODUCT: 'Product List',
  STOCK: 'Stock In Report',
  SALES: 'Sale Out Report',
  ATT: 'BA Attendance Report',
  LEAVE: 'BA Leave Report',
  VERSION: 'wide-clean-v4-20261025'
});

const HEADERS = {
  'BA List': ['BA ID', 'BA Name', 'Password', 'Location', 'Start Date', 'Status', 'Type', 'Manager ID'],
  'Product List': ['No', 'Product Code', 'Product Name', 'Category', 'Price', 'Initial Stock', 'Stock Qty', 'Total Sold', 'Min Alert Qty', 'Image URL'],
  'Stock In Report': ['Date', 'BA ID', 'BA Name', 'Province', 'Last Submit', 'Total Qty'],
  'Sale Out Report': ['Date', 'BA ID', 'BA Name', 'Province', 'Last Submit', 'Total Qty', 'Total Sales ($)', 'No Sales'],
  'BA Attendance Report': ['Date', 'User ID', 'User Name', 'Check In', 'Check In Location', 'Check In Details', 'Check In Distance (m)', 'Check Out', 'Check Out Location', 'Check Out Details', 'Check Out Distance (m)'],
  'BA Leave Report': ['Leave ID', 'User ID', 'User Name', 'Manager ID', 'Leave Type', 'Start Date', 'End Date', 'Reason', 'Status']
};

const LEGACY_COLS = {
  'Stock In Report': 11,
  'Sale Out Report': 12,
  'BA Attendance Report': 9
};

const WEEKLY_COUNT_DAYS = [7, 14, 21, 28];

function db_() {
  const id = String(PropertiesService.getScriptProperties().getProperty('BA_SPREADSHEET_ID') || '').trim();
  const spreadsheet = id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) throw new Error('Google Sheet not connected: set BA_SPREADSHEET_ID in Script Properties.');
  return spreadsheet;
}

function str_(v) { return String(v == null ? '' : v).trim(); }
function clean_(v) { const x = str_(v); return /^[=+@\-\t\r]/.test(x) ? "'" + x : x; }
function key_(v) { return str_(v).toUpperCase(); }
function n_(v) { const n = Number(v); return Number.isFinite(n) ? n : 0; }
function int_(v, allowZero) {
  const n = Number(v);
  if (!Number.isSafeInteger(n) || (allowZero ? n < 0 : n <= 0)) {
    throw Error('Quantity must be a ' + (allowZero ? 'non-negative' : 'positive') + ' integer');
  }
  return n;
}

function iso_(v) {
  if (v instanceof Date && !isNaN(v)) return Utilities.formatDate(v, db_().getSpreadsheetTimeZone(), 'yyyy-MM-dd');
  const s = str_(v);
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  return isNaN(d) ? '' : Utilities.formatDate(d, db_().getSpreadsheetTimeZone(), 'yyyy-MM-dd');
}

function nowStamp_() {
  return Utilities.formatDate(new Date(), db_().getSpreadsheetTimeZone(), 'yyyy-MM-dd HH:mm:ss');
}

/** Store transaction ID in Cache and ScriptProperties for instant verification */
function rememberTx_(id) {
  if (!id) return;
  try {
    CacheService.getScriptCache().put('tx_' + id, '1', 21600);
  } catch (e) {}
  try {
    PropertiesService.getScriptProperties().setProperty('tx_' + id, '1');
  } catch (e) {}
}

/** Check if transaction ID was already recorded */
function checkTx_(id) {
  if (!id) return false;
  try {
    if (CacheService.getScriptCache().get('tx_' + id) === '1') return true;
  } catch (e) {}
  try {
    if (PropertiesService.getScriptProperties().getProperty('tx_' + id) === '1') return true;
  } catch (e) {}
  return false;
}

/** Find sheet by relaxed name (case-insensitive, ignoring spacing/underscores) */
function getSheetRelaxed_(name) {
  const db = db_();
  let s = db.getSheetByName(name);
  if (s) return s;
  const sheets = db.getSheets();
  const target = key_(name).replace(/[\s_-]+/g, '');
  for (let i = 0; i < sheets.length; i++) {
    if (key_(sheets[i].getName()).replace(/[\s_-]+/g, '') === target) {
      return sheets[i];
    }
  }
  return null;
}

/** Automatically remove any unwanted 'Records JSON' or 'Submission Data' column */
function removeJsonColumns_(sheet) {
  if (!sheet || sheet.getLastColumn() < 1) return;
  const lastCol = sheet.getLastColumn();
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  for (let i = headers.length - 1; i >= 0; i--) {
    const h = str_(headers[i]).toLowerCase().replace(/[\s_-]+/g, '');
    if (h === 'recordsjson' || h === 'submissiondata' || h === 'jsondata' || h === 'rawjson') {
      sheet.deleteColumn(i + 1);
    }
  }
}

/** Access or automatically create any of the 6 standard sheets */
function sh_(name) {
  const db = db_();
  let s = getSheetRelaxed_(name);
  if (!s) {
    s = db.insertSheet(name);
    if (HEADERS[name]) {
      const h = (name === CFG.STOCK || name === CFG.SALES) ? wideHeaders_(name) : HEADERS[name];
      s.getRange(1, 1, 1, h.length).setValues([h]);
      s.setFrozenRows(1);
    }
  }
  return s;
}

/** Dynamic column mapper for BA List to handle any column ordering */
function getBAColMap_() {
  const s = sh_(CFG.BA);
  if (s.getLastRow() < 1) return { id: 0, name: 1, pass: 2, loc: 3, start: 4, status: 5, type: 6, mgr: 7 };
  const headers = s.getRange(1, 1, 1, Math.max(s.getLastColumn(), 1)).getValues()[0].map(x => key_(x).replace(/[\s_-]+/g, ''));
  const findCol = (keys, fallback) => {
    for (let k of keys) {
      const idx = headers.indexOf(k);
      if (idx >= 0) return idx;
    }
    return fallback;
  };
  return {
    id: findCol(['BAID', 'USERID', 'ID'], 0),
    name: findCol(['BANAME', 'USERNAME', 'NAME'], 1),
    pass: findCol(['PASSWORD', 'PASS'], 2),
    loc: findCol(['LOCATION', 'PROVINCE'], 3),
    start: findCol(['STARTDATE', 'DATE'], 4),
    status: findCol(['STATUS'], 5),
    type: findCol(['TYPE', 'ROLE'], 6),
    mgr: findCol(['MANAGERID', 'MANAGER'], 7)
  };
}

/** Dynamic horizontal headers with SKU columns (No JSON columns!) */
function wideHeaders_(name) {
  const base = HEADERS[name].slice();
  if (name === CFG.STOCK || name === CFG.SALES) {
    const products = sh_(CFG.PRODUCT);
    if (products.getLastRow() > 1) {
      products.getRange(2, 2, products.getLastRow() - 1, 2).getValues().forEach(r => {
        const code = str_(r[0]);
        if (code) {
          const colTitle = code + ' | ' + str_(r[1]);
          if (!base.includes(colTitle)) base.push(colTitle);
        }
      });
    }
  }
  return base;
}

/** Ensure report sheet is formatted horizontally without JSON columns */
function ensureWide_(name) {
  const sheet = sh_(name);
  removeJsonColumns_(sheet);

  const header = wideHeaders_(name);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, header.length).setValues([header]);
    sheet.setFrozenRows(1);
    return sheet;
  }
  const firstVal = str_(sheet.getRange(1, 1).getValue());
  // If only header exists and not wide yet, replace header row
  if (sheet.getLastRow() === 1 && firstVal !== 'Date' && (name === CFG.STOCK || name === CFG.SALES || name === CFG.ATT)) {
    sheet.clearContents();
    sheet.getRange(1, 1, 1, header.length).setValues([header]);
    sheet.setFrozenRows(1);
    return sheet;
  }

  // Ensure missing product columns are appended to header
  if (name === CFG.STOCK || name === CFG.SALES) {
    const lastCol = Math.max(sheet.getLastColumn(), header.length);
    const first = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(str_);
    const missing = header.slice(HEADERS[name].length).filter(x => !first.some(f => key_(f).split(' | ')[0] === key_(x).split(' | ')[0]));
    if (missing.length) {
      sheet.getRange(1, sheet.getLastColumn() + 1, 1, missing.length).setValues([missing]);
    }
  }
  return sheet;
}

function rows_(name) {
  const s = sh_(name);
  const lastRow = s.getLastRow();
  if (lastRow < 2) return [];
  const c = Math.max(s.getLastColumn(), HEADERS[name] ? HEADERS[name].length : 1);
  return s.getRange(2, 1, lastRow - 1, c).getValues();
}

function response_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function runLocked_(fn) {
  const l = LockService.getScriptLock();
  l.waitLock(30000);
  try { return fn(); } finally { l.releaseLock(); }
}

function request_(e) {
  let d = Object.assign({}, e && e.parameter || {});
  if (e && e.postData && e.postData.contents) {
    try { d = Object.assign(d, JSON.parse(e.postData.contents)); } catch (ex) { throw Error('Invalid JSON body'); }
  }
  return d;
}

function doGet(e) { return route_(e, false); }
function doPost(e) { return route_(e, true); }

function route_(e, isPost) {
  try {
    const d = request_(e), t = str_(d.type || d.action);
    const read = ['api_health', 'ba_list_api_health', 'stock_api_health', 'setup_six_reports', 'get_users', 'get_products', 'get_attendance', 'get_leaves', 'get_sales', 'get_stock_in', 'get_stock_counts', 'get_ba_actual_stock', 'stock_in_status', 'submission_status', 'login'];
    if (!isPost && !read.includes(t)) throw Error('Write operations require POST');
    if (isPost && read.includes(t)) throw Error('Read operations require GET');
    let out;
    switch (t) {
      case 'api_health': case 'ba_list_api_health': case 'stock_api_health':
        out = { success: true, version: CFG.VERSION, sheets: Object.keys(HEADERS), spreadsheetName: db_().getName(), spreadsheetId: db_().getId() }; break;
      case 'setup_six_reports': out = setupSixReports(); break;
      case 'login': {
        const u = actor_(d, false);
        const map = getBAColMap_();
        const baRows = rows_(CFG.BA);
        const target = baRows.find(r => key_(r[map.id]) === key_(u.id));
        out = { success: true, user: { id: u.id, name: u.name, status: 'Active', type: u.role, location: u.province, managerId: target ? target[map.mgr] : '' } };
        break;
      }
      case 'get_users': out = getUsers_(d); break;
      case 'get_products': actor_(d, false); out = getProducts_(); break;
      case 'get_attendance': out = getAttendance_(d); break;
      case 'get_leaves': out = getLeaves_(d); break;
      case 'get_sales': out = getSales_(d); break;
      case 'get_stock_in': out = getStockIn_(d); break;
      case 'get_stock_counts': actor_(d, false); out = { success: true, batches: [], note: 'Stock Count is recorded horizontally' }; break;
      case 'get_ba_actual_stock': out = getBAStock_(d); break;
      case 'stock_in_status': out = status_({ kind: 'stock_in', id: d.transactionId || d.id, userId: d.userId, password: d.password, actorId: d.actorId, actorPassword: d.actorPassword }); break;
      case 'submission_status': out = status_(d); break;
      case 'stock_in': case 'stock_in_transaction': out = stockIn_(d); break;
      case 'submit_stock_count': out = submitStockInItems_(d); break;
      case 'sales_order': case 'sale_out': out = sales_(d); break;
      case 'attendance': out = attendance_(d.record || d, d); break;
      case 'leave_request': out = leave_(d.leave || d, d); break;
      case 'leave_action': case 'update_leave_status': out = decideLeave_(d); break;
      case 'admin_save_user': case 'sync_users': case 'user_action': out = updateBA_(d); break;
      case 'change_password': out = changePassword_(d); break;
      case 'delete_user': out = deleteBA_(d); break;
      case 'sync_product_list': case 'sync_products': case 'bulk_save_products': out = syncProducts_(d); break;
      case 'save_product': case 'update_product': out = saveProduct_(d); break;
      case 'delete_product': out = deleteProduct_(d); break;
      default: throw Error('Unsupported API action: ' + t);
    }
    return response_(out);
  } catch (err) {
    return response_({ success: false, error: String(err && err.message || err) });
  }
}

function actor_(d, manager) {
  const id = str_(d.actorId || d.userId || d.baId);
  const pw = str_(d.actorPassword || d.password || d.oldPassword);
  if (!id || !pw) throw Error('Credentials required');
  const map = getBAColMap_();
  const u = rows_(CFG.BA).find(r => key_(r[map.id]) === key_(id) && str_(r[map.pass]) === pw && key_(r[map.status] || 'Active') === 'ACTIVE');
  if (!u) throw Error('Invalid credentials for ' + id);
  if (manager && !['ADMIN', 'MANAGER', 'LEADER', 'SUPERVISOR'].some(r => key_(u[map.type]).includes(r))) {
    throw Error('Manager/Admin permission required');
  }
  return { id: str_(u[map.id]), name: str_(u[map.name]), role: str_(u[map.type]), province: str_(u[map.loc]) };
}

function product_(code) {
  return rows_(CFG.PRODUCT).find(r => key_(r[1]) === key_(code));
}

function getUsers_(d) {
  const me = actor_(d, false);
  const map = getBAColMap_();
  const isMgr = ['ADMIN', 'MANAGER', 'LEADER', 'SUPERVISOR'].some(r => key_(me.role).includes(r));
  return rows_(CFG.BA)
    .filter(r => isMgr || key_(r[map.id]) === key_(me.id))
    .map(r => ({
      id: str_(r[map.id]),
      name: str_(r[map.name]),
      location: str_(r[map.loc]),
      startDate: iso_(r[map.start]),
      status: str_(r[map.status]),
      type: str_(r[map.type]),
      managerId: str_(r[map.mgr])
    }));
}

function getProducts_() {
  return rows_(CFG.PRODUCT).map(r => ({
    no: r[0],
    productCode: str_(r[1]),
    name: str_(r[2]),
    category: str_(r[3]),
    price: n_(r[4]),
    initialStock: n_(r[5]),
    stockQty: n_(r[6]),
    totalSold: n_(r[7]),
    minAlertQty: n_(r[8]),
    imageUrl: str_(r[9])
  }));
}

/** Record Stock In without any JSON column */
function stockIn_(d) {
  const input = d.stockIn || d;
  const me = actor_(Object.assign({}, d, { userId: d.actorId || d.userId || input.baId || input.updatedBy }), false);
  const ba = str_(input.baId || input.updatedBy || me.id);
  const p = product_(input.productCode);
  if (!p) throw Error('Unknown product code: ' + input.productCode);
  const q = int_(input.quantityAdded != null ? input.quantityAdded : input.addedQty);
  const id = str_(input.transactionId || input.id);
  if (!/^[A-Za-z0-9_-]{8,100}$/.test(id)) throw Error('Stable transactionId required');

  return runLocked_(() => {
    if (checkTx_(id)) {
      return { success: true, id, duplicate: true, qtyIn: q };
    }

    const sheet = ensureWide_(CFG.STOCK);
    const date = iso_(input.date || new Date());
    const stamp = nowStamp_();
    const baseHeaders = HEADERS[CFG.STOCK]; // 6 columns
    const lastRow = sheet.getLastRow();
    const headerRow = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), baseHeaders.length)).getValues()[0].map(str_);

    // Find or create SKU column
    const code = key_(p[1]);
    let skuCol = headerRow.findIndex((h, idx) => idx >= baseHeaders.length && key_(h).split(' | ')[0] === code);
    if (skuCol < 0) {
      const colTitle = code + ' | ' + str_(p[2]);
      skuCol = headerRow.length;
      sheet.getRange(1, skuCol + 1).setValue(colTitle);
    }

    // Find existing row for (date, ba)
    const raw = lastRow < 2 ? [] : sheet.getRange(2, 1, lastRow - 1, baseHeaders.length).getValues();
    const pos = raw.findIndex(r => iso_(r[0]) === date && key_(r[1]) === key_(ba));

    if (pos >= 0) {
      const rowIdx = pos + 2;
      const curTotal = n_(sheet.getRange(rowIdx, 6).getValue());
      const curSku = n_(sheet.getRange(rowIdx, skuCol + 1).getValue());
      sheet.getRange(rowIdx, 5).setValue(stamp); // Last Submit
      sheet.getRange(rowIdx, 6).setValue(curTotal + q); // Total Qty
      sheet.getRange(rowIdx, skuCol + 1).setValue(curSku + q); // SKU Qty
    } else {
      const newWidth = Math.max(sheet.getLastColumn(), skuCol + 1);
      const newRow = Array(newWidth).fill('');
      newRow[0] = date;
      newRow[1] = ba;
      newRow[2] = clean_(input.baName || me.name);
      newRow[3] = clean_(input.province || me.province);
      newRow[4] = stamp;
      newRow[5] = q;
      newRow[skuCol] = q;
      sheet.getRange(sheet.getLastRow() + 1, 1, 1, newRow.length).setValues([newRow]);
    }

    // Update Product List Stock Qty
    try {
      const pSheet = sh_(CFG.PRODUCT);
      const pRows = rows_(CFG.PRODUCT);
      const pIx = pRows.findIndex(r => key_(r[1]) === code);
      if (pIx >= 0) {
        const cur = n_(pRows[pIx][6]);
        pSheet.getRange(pIx + 2, 7).setValue(cur + q);
      }
    } catch (ex) {}

    rememberTx_(id);
    SpreadsheetApp.flush();
    return { success: true, id, duplicate: false, qtyIn: q };
  });
}

/** Record Batch Stock Count / Stock In without any JSON column */
function submitStockInItems_(d) {
  const me = actor_(d, false);
  const items = d.items || [];
  if (!Array.isArray(items) || !items.length) throw Error('Items required');
  const batch = str_(d.batchId);
  if (!/^[A-Za-z0-9_-]{8,100}$/.test(batch)) throw Error('batchId required');

  return runLocked_(() => {
    if (checkTx_(batch)) {
      return { success: true, id: batch, duplicate: true };
    }

    const sheet = ensureWide_(CFG.STOCK);
    const date = iso_(d.date || new Date());
    const stamp = nowStamp_();
    const baseHeaders = HEADERS[CFG.STOCK];
    let headerRow = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), baseHeaders.length)).getValues()[0].map(str_);

    const lastRow = sheet.getLastRow();
    const raw = lastRow < 2 ? [] : sheet.getRange(2, 1, lastRow - 1, baseHeaders.length).getValues();
    const pos = raw.findIndex(r => iso_(r[0]) === date && key_(r[1]) === key_(me.id));
    let rowIdx = pos >= 0 ? pos + 2 : (sheet.getLastRow() + 1);

    if (pos < 0) {
      const newRow = Array(headerRow.length).fill('');
      newRow[0] = date;
      newRow[1] = me.id;
      newRow[2] = clean_(me.name);
      newRow[3] = clean_(me.province);
      newRow[4] = stamp;
      newRow[5] = 0;
      sheet.getRange(rowIdx, 1, 1, newRow.length).setValues([newRow]);
    }

    let addedTotal = 0;
    const pSheet = sh_(CFG.PRODUCT);
    const pRows = rows_(CFG.PRODUCT);

    items.forEach(it => {
      const code = key_(it.code || it.productCode);
      const q = int_(it.qty != null ? it.qty : it.quantityAdded);
      if (q <= 0) return;
      addedTotal += q;

      headerRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(str_);
      let skuCol = headerRow.findIndex((h, idx) => idx >= baseHeaders.length && key_(h).split(' | ')[0] === code);
      if (skuCol < 0) {
        const p = pRows.find(r => key_(r[1]) === code);
        const title = code + ' | ' + (p ? str_(p[2]) : code);
        skuCol = headerRow.length;
        sheet.getRange(1, skuCol + 1).setValue(title);
      }

      const curSku = n_(sheet.getRange(rowIdx, skuCol + 1).getValue());
      sheet.getRange(rowIdx, skuCol + 1).setValue(curSku + q);

      // Update product stock
      const pIx = pRows.findIndex(r => key_(r[1]) === code);
      if (pIx >= 0) {
        const cur = n_(pRows[pIx][6]);
        pSheet.getRange(pIx + 2, 7).setValue(cur + q);
        pRows[pIx][6] = cur + q;
      }
    });

    const curTotal = n_(sheet.getRange(rowIdx, 6).getValue());
    sheet.getRange(rowIdx, 5).setValue(stamp);
    sheet.getRange(rowIdx, 6).setValue(curTotal + addedTotal);

    rememberTx_(batch);
    SpreadsheetApp.flush();
    return { success: true, id: batch, duplicate: false, written: items.length };
  });
}

/** Record Sales Orders horizontally without any JSON column */
function sales_(d) {
  const o = d.order || {};
  const me = actor_(Object.assign({}, d, { userId: d.actorId || d.userId || o.baId }), false);
  const ba = str_(o.baId || d.baId || me.id);
  const id = str_(o.id || d.orderId);
  const items = d.items || o.items || [];
  if (!/^[A-Za-z0-9_-]{8,100}$/.test(id) || !Array.isArray(items) || !items.length) {
    throw Error('Order ID and items required');
  }

  return runLocked_(() => {
    if (checkTx_(id)) {
      return { success: true, id, written: 0, duplicate: true, items: items.length };
    }

    const sheet = ensureWide_(CFG.SALES);
    const date = iso_(o.date || new Date());
    const stamp = nowStamp_();
    const baseHeaders = HEADERS[CFG.SALES]; // 8 columns: Date, BA ID, BA Name, Province, Last Submit, Total Qty, Total Sales ($), No Sales
    let headerRow = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), baseHeaders.length)).getValues()[0].map(str_);

    const lastRow = sheet.getLastRow();
    const raw = lastRow < 2 ? [] : sheet.getRange(2, 1, lastRow - 1, baseHeaders.length).getValues();
    const pos = raw.findIndex(r => iso_(r[0]) === date && key_(r[1]) === key_(ba));
    let rowIdx = pos >= 0 ? pos + 2 : (sheet.getLastRow() + 1);

    if (pos < 0) {
      const newRow = Array(headerRow.length).fill('');
      newRow[0] = date;
      newRow[1] = ba;
      newRow[2] = clean_(o.baName || me.name);
      newRow[3] = clean_(o.province || me.province);
      newRow[4] = stamp;
      newRow[5] = 0;
      newRow[6] = 0;
      newRow[7] = '';
      sheet.getRange(rowIdx, 1, 1, newRow.length).setValues([newRow]);
    }

    const pSheet = sh_(CFG.PRODUCT);
    const pRows = rows_(CFG.PRODUCT);
    let orderQty = 0;
    let orderTotal = 0;

    items.forEach(it => {
      const code = key_(it.productCode);
      if (code === 'NO_SALES' || o.isNoSales) {
        sheet.getRange(rowIdx, 8).setValue('Yes'); // No Sales
        return;
      }
      const q = int_(it.quantity, false);
      const pr = n_(it.price);
      const tot = q * pr;
      orderQty += q;
      orderTotal += tot;

      headerRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(str_);
      let skuCol = headerRow.findIndex((h, idx) => idx >= baseHeaders.length && key_(h).split(' | ')[0] === code);
      if (skuCol < 0) {
        const p = pRows.find(r => key_(r[1]) === code);
        const title = code + ' | ' + (p ? str_(p[2]) : (it.productName || code));
        skuCol = headerRow.length;
        sheet.getRange(1, skuCol + 1).setValue(title);
      }

      const curSku = n_(sheet.getRange(rowIdx, skuCol + 1).getValue());
      sheet.getRange(rowIdx, skuCol + 1).setValue(curSku + q);

      // Decrement product stock & increment total sold
      const pIx = pRows.findIndex(r => key_(r[1]) === code);
      if (pIx >= 0) {
        const curStock = n_(pRows[pIx][6]);
        const curSold = n_(pRows[pIx][7]);
        pSheet.getRange(pIx + 2, 7, 1, 2).setValues([[Math.max(0, curStock - q), curSold + q]]);
        pRows[pIx][6] = Math.max(0, curStock - q);
        pRows[pIx][7] = curSold + q;
      }
    });

    const curTotalQty = n_(sheet.getRange(rowIdx, 6).getValue());
    const curTotalSales = n_(sheet.getRange(rowIdx, 7).getValue());
    sheet.getRange(rowIdx, 5).setValue(stamp); // Last Submit
    sheet.getRange(rowIdx, 6).setValue(curTotalQty + orderQty);
    sheet.getRange(rowIdx, 7).setValue(curTotalSales + orderTotal);

    rememberTx_(id);
    SpreadsheetApp.flush();
    return { success: true, id, written: items.length, duplicate: false, items: items.length };
  });
}

/** Record Attendance in dedicated check in / out columns without any JSON column */
function attendance_(rec, auth) {
  const me = actor_(Object.assign({}, auth, { userId: rec.userId || auth.userId }), false);
  const who = str_(rec.userId || me.id);
  const act = key_(rec.action).replace(/^CHECK[ _-]?IN$/, 'IN').replace(/^CHECK[ _-]?OUT$/, 'OUT');
  if (!['IN', 'OUT'].includes(act)) throw Error('IN or OUT required');
  const day = iso_(rec.date || new Date());
  if (!day) throw Error('Date required');
  const id = who + '_' + day + '_' + act;

  return runLocked_(() => {
    if (checkTx_(id)) {
      return { success: true, id, duplicate: true };
    }

    const sheet = ensureWide_(CFG.ATT);
    const stamp = nowStamp_();
    const raw = sheet.getLastRow() < 2 ? [] : sheet.getRange(2, 1, sheet.getLastRow() - 1, 11).getValues();
    const pos = raw.findIndex(r => iso_(r[0]) === day && key_(r[1]) === key_(who));
    const targetRow = pos >= 0 ? pos + 2 : sheet.getLastRow() + 1;

    if (pos < 0) {
      const newRow = Array(11).fill('');
      newRow[0] = day;
      newRow[1] = clean_(who);
      newRow[2] = clean_(rec.userName || me.name);
      if (act === 'IN') {
        newRow[3] = stamp;
        newRow[4] = clean_(rec.location);
        newRow[5] = clean_(rec.details);
        newRow[6] = n_(rec.distanceMeters);
      } else {
        newRow[7] = stamp;
        newRow[8] = clean_(rec.location);
        newRow[9] = clean_(rec.details);
        newRow[10] = n_(rec.distanceMeters);
      }
      sheet.getRange(targetRow, 1, 1, 11).setValues([newRow]);
    } else {
      if (act === 'IN') {
        sheet.getRange(targetRow, 4, 1, 4).setValues([[stamp, clean_(rec.location), clean_(rec.details), n_(rec.distanceMeters)]]);
      } else {
        sheet.getRange(targetRow, 8, 1, 4).setValues([[stamp, clean_(rec.location), clean_(rec.details), n_(rec.distanceMeters)]]);
      }
    }

    rememberTx_(id);
    SpreadsheetApp.flush();
    return { success: true, id, duplicate: false };
  });
}

function leave_(lv, auth) {
  const me = actor_(Object.assign({}, auth, { userId: lv.userId || auth.userId }), false);
  const id = str_(lv.id);
  const who = str_(lv.userId || me.id);
  const from = iso_(lv.startDate);
  const to = iso_(lv.endDate);
  if (!id || !from || !to || from > to) throw Error('Invalid leave request');

  return runLocked_(() => {
    if (checkTx_(id)) {
      return { success: true, id, duplicate: true };
    }
    const old = rows_(CFG.LEAVE).find(r => str_(r[0]) === id);
    if (old) {
      return { success: true, id, duplicate: true };
    }
    const s = sh_(CFG.LEAVE);
    s.getRange(s.getLastRow() + 1, 1, 1, 9).setValues([[id, who, clean_(lv.userName || me.name), clean_(lv.managerId), clean_(lv.type), from, to, clean_(lv.reason), 'Pending']]);
    rememberTx_(id);
    SpreadsheetApp.flush();
    return { success: true, id, duplicate: false };
  });
}

function decideLeave_(d) {
  const me = actor_(d, true);
  const lv = d.leave || d;
  const id = str_(lv.id);
  const status = str_(lv.status);
  if (!['Approved', 'Rejected'].includes(status)) throw Error('Invalid status');
  return runLocked_(() => {
    const s = sh_(CFG.LEAVE), r = rows_(CFG.LEAVE), i = r.findIndex(x => str_(x[0]) === id);
    if (i < 0) throw Error('Leave ID not found');
    if (str_(r[i][8]) === status) return { success: true, id, status, duplicate: true };
    if (str_(r[i][8]) !== 'Pending') throw Error('Leave already decided');
    s.getRange(i + 2, 9).setValue(status);
    SpreadsheetApp.flush();
    return { success: true, id, status, approvedBy: me.id };
  });
}

/** Read Attendance records from standard columns (No JSON parsing) */
function getAttendance_(d) {
  const me = actor_(d, false);
  const isMgr = ['ADMIN', 'MANAGER', 'LEADER', 'SUPERVISOR'].some(r => key_(me.role).includes(r));
  const sh = ensureWide_(CFG.ATT);
  const lastRow = sh.getLastRow();
  if (lastRow < 2) return [];

  const data = sh.getRange(2, 1, lastRow - 1, Math.min(sh.getLastColumn(), 11)).getValues();
  const out = [];

  data.forEach(r => {
    const uid = str_(r[1]);
    if (!isMgr && key_(uid) !== key_(me.id)) return;
    const day = iso_(r[0]);
    const uname = str_(r[2]);

    // Check In entry
    if (str_(r[3])) {
      out.push({
        id: uid + '_' + day + '_IN',
        timestamp: r[3] instanceof Date ? r[3].toISOString() : String(r[3]),
        date: day,
        userId: uid,
        userName: uname,
        action: 'IN',
        location: str_(r[4]),
        details: str_(r[5]),
        distanceMeters: n_(r[6])
      });
    }

    // Check Out entry
    if (str_(r[7])) {
      out.push({
        id: uid + '_' + day + '_OUT',
        timestamp: r[7] instanceof Date ? r[7].toISOString() : String(r[7]),
        date: day,
        userId: uid,
        userName: uname,
        action: 'OUT',
        location: str_(r[8]),
        details: str_(r[9]),
        distanceMeters: n_(r[10])
      });
    }
  });

  return out;
}

function getLeaves_(d) {
  const me = actor_(d, false);
  const isMgr = ['ADMIN', 'MANAGER', 'LEADER', 'SUPERVISOR'].some(r => key_(me.role).includes(r));
  return rows_(CFG.LEAVE).filter(r => isMgr || key_(r[1]) === key_(me.id)).map(r => ({
    id: str_(r[0]),
    userId: str_(r[1]),
    userName: str_(r[2]),
    managerId: str_(r[3]),
    type: str_(r[4]),
    startDate: iso_(r[5]),
    endDate: iso_(r[6]),
    reason: str_(r[7]),
    status: str_(r[8])
  }));
}

/** Read Stock In rows from horizontal SKU columns (No JSON parsing) */
function getStockIn_(d) {
  const me = actor_(d, false);
  const isMgr = ['ADMIN', 'MANAGER', 'LEADER', 'SUPERVISOR'].some(r => key_(me.role).includes(r));
  const sh = ensureWide_(CFG.STOCK);
  const lastRow = sh.getLastRow();
  if (lastRow < 2) return { success: true, items: [] };

  const lastCol = sh.getLastColumn();
  const headerRow = sh.getRange(1, 1, 1, lastCol).getValues()[0].map(str_);
  const data = sh.getRange(2, 1, lastRow - 1, lastCol).getValues();
  const items = [];

  data.forEach((r, rowIdx) => {
    const ba = str_(r[1]);
    if (!isMgr && key_(ba) !== key_(me.id)) return;
    const day = iso_(r[0]);
    const name = str_(r[2]);
    const province = str_(r[3]);
    const stamp = str_(r[4]) || day;

    for (let c = HEADERS[CFG.STOCK].length; c < lastCol; c++) {
      const q = n_(r[c]);
      if (q > 0) {
        const h = headerRow[c];
        const parts = h.split(' | ');
        const code = parts[0];
        const pName = parts[1] || code;
        items.push({
          id: 'STK_' + day.replace(/-/g, '') + '_' + ba + '_' + code + '_' + rowIdx,
          timestamp: stamp,
          date: day,
          baId: ba,
          baName: name,
          province: province,
          productCode: code,
          productName: pName,
          quantityAdded: q,
          note: '',
          source: 'Stock In'
        });
      }
    }
  });

  return { success: true, items };
}

/** Read Sales rows from horizontal SKU columns (No JSON parsing) */
function getSales_(d) {
  const me = actor_(d, false);
  const isMgr = ['ADMIN', 'MANAGER', 'LEADER', 'SUPERVISOR'].some(r => key_(me.role).includes(r));
  const sh = ensureWide_(CFG.SALES);
  const lastRow = sh.getLastRow();
  if (lastRow < 2) return { success: true, items: [] };

  const lastCol = sh.getLastColumn();
  const headerRow = sh.getRange(1, 1, 1, lastCol).getValues()[0].map(str_);
  const data = sh.getRange(2, 1, lastRow - 1, lastCol).getValues();
  const items = [];

  const catalog = Object.create(null);
  rows_(CFG.PRODUCT).forEach(r => catalog[key_(r[1])] = n_(r[4]));

  data.forEach((r, rowIdx) => {
    const ba = str_(r[1]);
    if (!isMgr && key_(ba) !== key_(me.id)) return;
    const day = iso_(r[0]);
    const name = str_(r[2]);
    const province = str_(r[3]);
    const stamp = str_(r[4]) || day;
    const orderId = 'SO_' + day.replace(/-/g, '') + '_' + ba + '_' + rowIdx;
    const isNoSales = str_(r[7]).toLowerCase() === 'yes';

    let foundItems = 0;
    for (let c = HEADERS[CFG.SALES].length; c < lastCol; c++) {
      const q = n_(r[c]);
      if (q > 0) {
        foundItems++;
        const h = headerRow[c];
        const parts = h.split(' | ');
        const code = parts[0];
        const pName = parts[1] || code;
        const pr = catalog[key_(code)] || 0;
        items.push({
          timestamp: stamp,
          date: day,
          orderId: orderId,
          baId: ba,
          baName: name,
          province: province,
          rowTotalQty: n_(r[5]),
          totalSales: n_(r[6]),
          productCode: code,
          productName: pName,
          quantity: q,
          price: pr,
          total: q * pr
        });
      }
    }

    if (foundItems === 0 && isNoSales) {
      items.push({
        timestamp: stamp,
        date: day,
        orderId: orderId,
        baId: ba,
        baName: name,
        province: province,
        rowTotalQty: n_(r[5]),
        totalSales: n_(r[6]),
        productCode: 'NO_SALES',
        productName: 'គ្មានការលក់ (No Sales)',
        quantity: 0,
        price: 0,
        total: 0
      });
    }
  });

  return { success: true, items };
}

/** Calculate BA On-Hand Stock from horizontal reports */
function getBAStock_(d) {
  const me = actor_(d, false);
  const ba = str_(d.baId || d.userId || me.id);
  const stock = {}, incoming = {}, sold = {};

  // Incoming from Stock In Report
  const stkSheet = ensureWide_(CFG.STOCK);
  if (stkSheet.getLastRow() > 1) {
    const lastCol = stkSheet.getLastColumn();
    const hdr = stkSheet.getRange(1, 1, 1, lastCol).getValues()[0].map(str_);
    const data = stkSheet.getRange(2, 1, stkSheet.getLastRow() - 1, lastCol).getValues();
    data.filter(r => key_(r[1]) === key_(ba)).forEach(r => {
      for (let c = HEADERS[CFG.STOCK].length; c < lastCol; c++) {
        const q = n_(r[c]);
        if (q > 0) {
          const code = key_(hdr[c].split(' | ')[0]);
          incoming[code] = (incoming[code] || 0) + q;
        }
      }
    });
  }

  // Sold from Sale Out Report
  const salSheet = ensureWide_(CFG.SALES);
  if (salSheet.getLastRow() > 1) {
    const lastCol = salSheet.getLastColumn();
    const hdr = salSheet.getRange(1, 1, 1, lastCol).getValues()[0].map(str_);
    const data = salSheet.getRange(2, 1, salSheet.getLastRow() - 1, lastCol).getValues();
    data.filter(r => key_(r[1]) === key_(ba)).forEach(r => {
      for (let c = HEADERS[CFG.SALES].length; c < lastCol; c++) {
        const q = n_(r[c]);
        if (q > 0) {
          const code = key_(hdr[c].split(' | ')[0]);
          sold[code] = (sold[code] || 0) + q;
        }
      }
    });
  }

  Object.keys(Object.assign({}, incoming, sold)).forEach(k => {
    stock[k] = (incoming[k] || 0) - (sold[k] || 0);
  });

  return {
    success: true,
    userId: ba,
    stock,
    stockByCode: stock,
    stockIn: incoming,
    stockOut: sold,
    saleOut: sold,
    hasApprovedCount: Object.keys(incoming).length > 0
  };
}

/** Resilient status verification (checks Cache & Properties first, then sheet rows) */
function status_(d) {
  const id = str_(d.id || d.transactionId);
  if (!id) throw Error('ID required');

  // Instant confirmation via Cache & Properties
  if (checkTx_(id)) {
    return { success: true, found: true, complete: true, id, status: 'Recorded' };
  }

  const kind = str_(d.kind);
  let found = false;
  let matchingRows = 0;

  if (kind === 'sale') {
    const sh = ensureWide_(CFG.SALES);
    if (sh.getLastRow() > 1) {
      const data = sh.getRange(2, 1, sh.getLastRow() - 1, Math.min(sh.getLastColumn(), 8)).getValues();
      found = data.some(r => str_(r[0]).includes(id) || str_(r[1]).includes(id) || str_(r[4]).includes(id));
      if (found) matchingRows = 1;
    }
  } else if (kind === 'stock_in' || kind === 'stock_count') {
    const sh = ensureWide_(CFG.STOCK);
    if (sh.getLastRow() > 1) {
      const data = sh.getRange(2, 1, sh.getLastRow() - 1, Math.min(sh.getLastColumn(), 6)).getValues();
      found = data.some(r => str_(r[0]).includes(id) || str_(r[1]).includes(id) || str_(r[4]).includes(id));
      if (found) matchingRows = 1;
    }
  } else if (kind === 'attendance') {
    const sh = ensureWide_(CFG.ATT);
    if (sh.getLastRow() > 1) {
      const data = sh.getRange(2, 1, sh.getLastRow() - 1, 11).getValues();
      found = data.some(r => str_(r[0]).includes(id) || str_(r[1]).includes(id) || str_(r[3]).includes(id) || str_(r[7]).includes(id));
      if (found) matchingRows = 1;
    }
  } else if (kind === 'leave') {
    const sh = sh_(CFG.LEAVE);
    if (sh.getLastRow() > 1) {
      const data = sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues();
      found = data.some(r => str_(r[0]) === id);
      if (found) matchingRows = 1;
    }
  }

  if (found) rememberTx_(id);
  return { success: true, found, complete: found, id, matchingRows };
}

function updateBA_(d) {
  const admin = actor_(d, true);
  const u = d.user || d;
  const id = str_(u.id);
  if (!id) throw Error('BA ID required');
  return runLocked_(() => {
    const s = sh_(CFG.BA);
    const map = getBAColMap_();
    const arr = rows_(CFG.BA);
    const ix = arr.findIndex(r => key_(r[map.id]) === key_(id));
    if (ix < 0) {
      const password = str_(u.password);
      if (!password) throw Error('Password is required for new BA');
      const newRow = Array(Math.max(s.getLastColumn(), HEADERS[CFG.BA].length)).fill('');
      newRow[map.id] = clean_(id);
      newRow[map.name] = clean_(u.name);
      newRow[map.pass] = password;
      newRow[map.loc] = clean_(u.location);
      newRow[map.start] = u.startDate || '';
      newRow[map.status] = u.status || 'Active';
      newRow[map.type] = u.type || 'BA Staff';
      newRow[map.mgr] = clean_(u.managerId || '');
      s.getRange(s.getLastRow() + 1, 1, 1, newRow.length).setValues([newRow]);
      SpreadsheetApp.flush();
      return { success: true, id, created: true };
    }
    const r = arr[ix];
    r[map.name] = clean_(u.name || r[map.name]);
    r[map.loc] = clean_(u.location != null ? u.location : r[map.loc]);
    r[map.start] = u.startDate || r[map.start];
    r[map.status] = u.status || r[map.status];
    r[map.type] = u.type || r[map.type];
    r[map.mgr] = u.managerId != null ? clean_(u.managerId) : r[map.mgr];
    s.getRange(ix + 2, 1, 1, r.length).setValues([r]);
    SpreadsheetApp.flush();
    return { success: true, id };
  });
}

function deleteBA_(d) {
  const admin = actor_(d, true);
  const id = str_(d.id || d.targetId);
  if (!id || key_(id) === key_(admin.id)) throw Error('Invalid BA ID');
  return runLocked_(() => {
    const s = sh_(CFG.BA);
    const map = getBAColMap_();
    const last = s.getLastRow();
    if (last < 2) throw Error('No BA records');
    const arr = rows_(CFG.BA);
    const ix = arr.findIndex(r => key_(r[map.id]) === key_(id));
    if (ix < 0) return { success: true, id, alreadyDeleted: true };
    s.deleteRow(ix + 2);
    SpreadsheetApp.flush();
    return { success: true, id };
  });
}

function changePassword_(d) {
  const me = actor_(Object.assign({}, d, { password: d.oldPassword }), false);
  const password = str_(d.newPassword);
  if (password.length < 8) throw Error('New password must be 8+ characters');
  return runLocked_(() => {
    const s = sh_(CFG.BA);
    const map = getBAColMap_();
    const arr = rows_(CFG.BA);
    const i = arr.findIndex(r => key_(r[map.id]) === key_(me.id));
    s.getRange(i + 2, map.pass + 1).setValue(password);
    SpreadsheetApp.flush();
    return { success: true, id: me.id };
  });
}

/** Product List Synchronization (solves "Product list does not capture data from App") */
function syncProducts_(d) {
  const me = actor_(d, false);
  const items = d.products || d.items || [];
  if (!Array.isArray(items) || !items.length) throw Error('Products array required');
  return runLocked_(() => {
    const s = sh_(CFG.PRODUCT);
    const existing = rows_(CFG.PRODUCT);
    const map = new Map();
    existing.forEach((r, idx) => map.set(key_(r[1]), { row: idx + 2, data: r }));
    const seen = new Set();
    const rowsToSet = [];

    items.forEach((p, idx) => {
      const code = str_(p.productCode || p.code || p.id);
      if (!code) return;
      const k = key_(code);
      if (seen.has(k)) return;
      seen.add(k);
      const old = map.get(k);
      const no = p.no != null ? p.no : (old ? old.data[0] : (idx + 1));
      const name = clean_(p.name || (old ? old.data[2] : ''));
      const cat = clean_(p.category || (old ? old.data[3] : 'ទូទៅ'));
      const price = Number.isFinite(Number(p.price)) ? Number(p.price) : (old ? n_(old.data[4]) : 0);
      const init = p.initialStock != null ? n_(p.initialStock) : (old ? n_(old.data[5]) : 0);
      const qty = p.stockQty != null ? n_(p.stockQty) : (old ? n_(old.data[6]) : init);
      const sold = p.totalSold != null ? n_(p.totalSold) : (old ? n_(old.data[7]) : 0);
      const min = p.minAlertQty != null ? n_(p.minAlertQty) : (old ? n_(old.data[8]) : 5);
      const img = str_(p.imageUrl || p.photoUrl || (old ? old.data[9] : ''));
      rowsToSet.push([no, code, name, cat, price, init, qty, sold, min, img]);
    });

    if (rowsToSet.length) {
      const last = s.getLastRow();
      if (last > 1) s.getRange(2, 1, last - 1, HEADERS[CFG.PRODUCT].length).clearContent();
      s.getRange(2, 1, rowsToSet.length, HEADERS[CFG.PRODUCT].length).setValues(rowsToSet);
      SpreadsheetApp.flush();
    }
    return { success: true, count: rowsToSet.length, updatedBy: me.id };
  });
}

function saveProduct_(d) {
  const me = actor_(d, false);
  const p = d.product || d;
  const code = str_(p.productCode || p.code || p.id);
  if (!code) throw Error('Product Code required');
  return runLocked_(() => {
    const s = sh_(CFG.PRODUCT);
    const existing = rows_(CFG.PRODUCT);
    const k = key_(code);
    const idx = existing.findIndex(r => key_(r[1]) === k);
    const old = idx >= 0 ? existing[idx] : null;
    const no = p.no != null ? p.no : (old ? old[0] : existing.length + 1);
    const name = clean_(p.name || (old ? old[2] : ''));
    const cat = clean_(p.category || (old ? old[3] : 'ទូទៅ'));
    const price = Number.isFinite(Number(p.price)) ? Number(p.price) : (old ? n_(old[4]) : 0);
    const init = p.initialStock != null ? n_(p.initialStock) : (old ? n_(old[5]) : 0);
    const qty = p.stockQty != null ? n_(p.stockQty) : (old ? n_(old[6]) : init);
    const sold = p.totalSold != null ? n_(p.totalSold) : (old ? n_(old[7]) : 0);
    const min = p.minAlertQty != null ? n_(p.minAlertQty) : (old ? n_(old[8]) : 5);
    const img = str_(p.imageUrl || p.photoUrl || (old ? old[9] : ''));
    const rowData = [no, code, name, cat, price, init, qty, sold, min, img];

    if (idx >= 0) {
      s.getRange(idx + 2, 1, 1, rowData.length).setValues([rowData]);
    } else {
      s.getRange(s.getLastRow() + 1, 1, 1, rowData.length).setValues([rowData]);
    }
    SpreadsheetApp.flush();
    return { success: true, productCode: code, updatedBy: me.id };
  });
}

function deleteProduct_(d) {
  const me = actor_(d, false);
  const code = str_(d.productCode || d.code || d.id);
  if (!code) throw Error('Product Code required');
  return runLocked_(() => {
    const s = sh_(CFG.PRODUCT);
    const existing = rows_(CFG.PRODUCT);
    const k = key_(code);
    const idx = existing.findIndex(r => key_(r[1]) === k);
    if (idx < 0) return { success: true, productCode: code, alreadyDeleted: true };
    s.deleteRow(idx + 2);
    SpreadsheetApp.flush();
    return { success: true, productCode: code, updatedBy: me.id };
  });
}

/** Non-destructive setup for all six sheets without any JSON column */
function setupSixReports() {
  const db = db_();
  const created = [];
  Object.keys(HEADERS).forEach(name => {
    let s = getSheetRelaxed_(name);
    if (!s) {
      s = db.insertSheet(name);
      created.push(name);
    }
    removeJsonColumns_(s);
    if (s.getLastRow() === 0) {
      const h = (name === CFG.STOCK || name === CFG.SALES) ? wideHeaders_(name) : HEADERS[name];
      s.getRange(1, 1, 1, h.length).setValues([h]);
      s.setFrozenRows(1);
    } else if (name === CFG.STOCK || name === CFG.SALES || name === CFG.ATT) {
      ensureWide_(name);
    }
  });
  SpreadsheetApp.flush();
  return { success: true, sheets: Object.keys(HEADERS), created };
}

function verifyConnection() {
  return { spreadsheetId: db_().getId(), name: db_().getName(), tabs: db_().getSheets().map(x => x.getName()) };
}
