import { User, LeaveRequest, AttendanceRecord, Product, SalesOrder, StockInRecord } from '../types';
import { formatDateToYMD } from '../utils/date';

// Default deployment URL bound to BA Control spreadsheet
export const DEFAULT_GOOGLE_SHEET_API_URL = 'https://script.google.com/macros/s/AKfycbyK1y4XW4_SCOP3wsyIEhapnj95mXr-xxLCmVHGtyUB5nGOEjalniPxY-Iml61rn5onug/exec';
const configuredApiUrl = String(import.meta.env.VITE_GOOGLE_SHEET_API_URL || '').trim().replace(/\/$/, '');
const validAppsScriptUrl = (url: string) => /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(url);
export const GOOGLE_SHEET_API_URL = validAppsScriptUrl(configuredApiUrl) ? configuredApiUrl : DEFAULT_GOOGLE_SHEET_API_URL;

// Real baseline data matching the user's Google Sheet
export const INITIAL_USERS: User[] = [];

export const INITIAL_LEAVES: LeaveRequest[] = [];

export const INITIAL_ATTENDANCE: AttendanceRecord[] = [];

export const INITIAL_PRODUCTS: Product[] = [];

// LocalStorage Keys
const STORAGE_KEYS = {
  USERS: 'ba_app_users_v3',
  DELETED_USERS: 'ba_deleted_users_list',
  LEAVES: 'ba_app_leaves_v3',
  ATTENDANCE: 'ba_app_attendance_v3',
  SESSION: 'ba_current_session_v3',
  GPS_TEST_MODE: 'ba_gps_test_mode',
  PRODUCTS: 'ba_app_products_v1',
  SALES_ORDERS: 'ba_app_sales_orders_v1',
  STOCK_IN: 'ba_app_stock_in_v1',
};

export function getDeletedUserIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DELETED_USERS);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function addDeletedUserId(userId: string) {
  try {
    const list = getDeletedUserIds();
    const cleanId = String(userId).trim();
    if (!list.includes(cleanId)) {
      list.push(cleanId);
      localStorage.setItem(STORAGE_KEYS.DELETED_USERS, JSON.stringify(list));
    }
  } catch (e) {}
}

export function removeDeletedUserId(userId: string) {
  try {
    const cleanId = String(userId).trim();
    const list = getDeletedUserIds().filter(id => id !== cleanId);
    localStorage.setItem(STORAGE_KEYS.DELETED_USERS, JSON.stringify(list));
  } catch (e) {}
}

// Storage helpers
export function getStoredUsers(): User[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS) || localStorage.getItem('app_users_sheet');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((u: any) => ({
          ...u,
          startDate: formatDateToYMD(u.startDate) || '2026-10-21',
        }));
      }
    }
  } catch (e) {
    console.warn('Failed to parse stored users:', e);
  }
  return INITIAL_USERS;
}

export function saveStoredUsers(users: User[]) {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  localStorage.setItem('app_users_sheet', JSON.stringify(users));
}

export function getStoredLeaves(): LeaveRequest[] {
  try {
    const raw =
      localStorage.getItem(STORAGE_KEYS.LEAVES) ||
      localStorage.getItem('app_leaves_sheet') ||
      localStorage.getItem('app_leaves');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((l: any) => ({
          ...l,
          startDate: formatDateToYMD(l.startDate),
          endDate: formatDateToYMD(l.endDate),
        }));
      }
    }
  } catch (e) {
    console.warn('Failed to parse stored leaves:', e);
  }
  return INITIAL_LEAVES;
}

export function saveStoredLeaves(leaves: LeaveRequest[]) {
  localStorage.setItem(STORAGE_KEYS.LEAVES, JSON.stringify(leaves));
  localStorage.setItem('app_leaves_sheet', JSON.stringify(leaves));
  localStorage.setItem('app_leaves', JSON.stringify(leaves));
}

export function getStoredAttendance(): AttendanceRecord[] {
  try {
    const raw =
      localStorage.getItem(STORAGE_KEYS.ATTENDANCE) ||
      localStorage.getItem('app_attendance_sheet') ||
      localStorage.getItem('app_my_attendance');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Failed to parse stored attendance:', e);
  }
  return INITIAL_ATTENDANCE;
}

export function saveStoredAttendance(attendance: AttendanceRecord[]) {
  localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(attendance));
  localStorage.setItem('app_attendance_sheet', JSON.stringify(attendance));
  localStorage.setItem('app_my_attendance', JSON.stringify(attendance));
}

export function getCurrentSession(): User | null {
  try {
    // If explicitly logged out, never auto login
    if (localStorage.getItem('ba_logged_out') === 'true') {
      return null;
    }

    const raw = localStorage.getItem(STORAGE_KEYS.SESSION) || localStorage.getItem('current_session');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.id) {
        return {
          ...parsed,
          startDate: formatDateToYMD(parsed.startDate),
        };
      }
    }
  } catch (e) {
    console.warn('Failed to parse session:', e);
  }
  return null;
}

export function saveCurrentSession(user: User | null) {
  try {
    if (user && user.id) {
      localStorage.removeItem('ba_logged_out');
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(user));
      localStorage.setItem('current_session', JSON.stringify(user));
    } else {
      localStorage.setItem('ba_logged_out', 'true');
      localStorage.removeItem(STORAGE_KEYS.SESSION);
      localStorage.removeItem('current_session');
      localStorage.removeItem('ba_current_session');
      localStorage.removeItem('ba_session');
      localStorage.removeItem('currentUser');
      localStorage.removeItem('auth_user');
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.clear();
      }
    }
  } catch (e) {
    console.warn('Failed to save session:', e);
  }
}

export function getGpsTestMode(): boolean {
  return localStorage.getItem(STORAGE_KEYS.GPS_TEST_MODE) === 'true';
}

export function setGpsTestMode(enabled: boolean) {
  localStorage.setItem(STORAGE_KEYS.GPS_TEST_MODE, enabled ? 'true' : 'false');
}

// Network / Google Apps Script API calls with timeout
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 10000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

/** Six-tab deployment: client credentials are used for protected queries. */
function credentials() {
  const user = getCurrentSession();
  if (!user?.id || !user.password) throw new Error('Please log in first');
  return { userId: user.id, password: user.password };
}
function query(type: string, extra: Record<string,string> = {}) {
  if (!GOOGLE_SHEET_API_URL) throw new Error('Set VITE_GOOGLE_SHEET_API_URL to the newly deployed Apps Script /exec URL');
  if (!/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(GOOGLE_SHEET_API_URL)) {
    throw new Error('Invalid Apps Script URL: expected a deployed /exec URL.');
  }
  const u = new URL(GOOGLE_SHEET_API_URL);
  Object.entries({type,...extra}).forEach(([k,v]) => u.searchParams.set(k,v));
  u.searchParams.set('_',String(Date.now()));
  return u.toString();
}
async function confirmedSubmission(payload: any, kind: string, id: string): Promise<void> {
  const auth = credentials();
  let lastError = '';

  // Google Apps Script cross-origin responses are opaque. Confirmation MUST be read back.
  await fetchWithTimeout(
    GOOGLE_SHEET_API_URL,
    {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        ...payload,
        userId: payload.userId || auth.userId,
        password: payload.password || auth.password,
        actorId: auth.userId,
        actorPassword: auth.password,
      }),
    },
    25000
  );

  const delays = [500, 800, 1200, 1800, 2500, 3000];
  for (let attempt = 0; attempt < delays.length; attempt++) {
    await new Promise(resolve => setTimeout(resolve, delays[attempt]));
    try {
      const res = await fetchWithTimeout(
        query('submission_status', {
          ...auth,
          actorId: auth.userId,
          actorPassword: auth.password,
          kind,
          id,
          ...(payload.items?.length ? { expectedItems: String(payload.items.length) } : {}),
        }),
        {},
        12000
      );
      if (res.ok) {
        const obj = await res.json();
        if (obj.success && (obj.found || obj.complete)) return;
        if (obj.error) lastError = obj.error;
      }
    } catch {
      /* retry read, never resubmit a different ID */
    }
  }

  // Resilient fallback check: verify if underlying report has recorded the transaction
  try {
    if (kind === 'attendance') {
      const att = await syncAttendanceFromSheet();
      if (att.success && att.data?.some(a => a.userId === auth.userId && (a.id === id || a.timestamp?.includes(payload.record?.date || '')))) {
        return;
      }
    } else if (kind === 'sale') {
      const sales = await syncSalesFromSheet();
      if (sales.success && sales.data?.some(s => s.id === id || (s.baId === auth.userId && s.date === payload.order?.date))) {
        return;
      }
    } else if (kind === 'stock_in') {
      const stk = await syncStockInForChecklist();
      if (stk.some(s => s.id === id || (s.baId === auth.userId && s.date === payload.date))) {
        return;
      }
    }
  } catch {}

  throw new Error(
    `Google Sheets could not confirm ${kind} (${id})${lastError ? ': ' + lastError : ''}. Check the deployment, API permissions, and corresponding report sheet before retrying with the same ID.`
  );
}
export async function loginFromSheet(userId:string,password:string):Promise<User|null>{
  const res=await fetchWithTimeout(query('login',{userId,password}),{},15000);
  if(!res.ok)throw new Error('Login HTTP '+res.status);
  const data=await res.json();
  if(!data.success || !data.user) {
    if (/^Invalid credentials(?:\s|$)/i.test(String(data.error || ''))) return null;
    throw new Error(String(data.error || 'Google Apps Script did not return a user.'));
  }
  return {...data.user,password};
}

/**
 * Sync Users from Google Sheet
 */
export async function syncUsersFromSheet(): Promise<{ success: boolean; data?: User[]; error?: string }> {
  try {
    const res = await fetchWithTimeout(query('get_users',credentials()));
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (Array.isArray(data)) {
      const deletedIds: string[] = []; // Google Sheet is authoritative for staff membership
      const existingUsers = getStoredUsers();
      const existingMap = new Map(existingUsers.map(u => [u.id, u]));

      const formatted: User[] = data
        .filter((u: any) => !deletedIds.includes(String(u.id || '').trim()))
        .map((u: any) => {
          const id = String(u.id || '').trim();
          const existing = existingMap.get(id);
          return {
            id,
            name: String(u.name || '').trim(),
            password: existing?.password || getCurrentSession()?.password || '',
            location: String(u.location || '11.556400,104.928200'),
            startDate: formatDateToYMD(u.startDate) || '2026-10-21',
            status: (u.status || 'Active') as any,
            type: (u.type || 'BA Staff') as any,
            managerId: u.managerId ? String(u.managerId).trim() : '',
            avatar: u.avatar || u.photoUrl || existing?.avatar || undefined,
          };
        });
      saveStoredUsers(formatted);
      return { success: true, data: formatted };
    }
    return { success: false, error: 'Empty data from sheet' };
  } catch (e: any) {
    return { success: false, error: e.message || 'Network error' };
  }
}

/**
 * Sync Leaves from Google Sheet
 */
export async function syncLeavesFromSheet(): Promise<{ success: boolean; data?: LeaveRequest[]; error?: string }> {
  try {
    const res = await fetchWithTimeout(query('get_leaves',credentials()));
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (Array.isArray(data)) {
      const formatted: LeaveRequest[] = data.map((l: any, idx: number) => ({
        id: String(l.id || `LEAVE_${idx}_${Date.now()}`),
        userId: String(l.userId || '').trim(),
        userName: String(l.userName || '').trim(),
        managerId: l.managerId ? String(l.managerId).trim() : '',
        type: (l.type || 'AL') as any,
        startDate: formatDateToYMD(l.startDate),
        endDate: formatDateToYMD(l.endDate),
        reason: String(l.reason || ''),
        status: (l.status || 'Pending') as any,
        createdAt: l.createdAt ? formatDateToYMD(l.createdAt) : new Date().toISOString(),
      }));
      saveStoredLeaves(formatted);
      return { success: true, data: formatted };
    }
    return { success: false, error: 'Empty leaves from sheet' };
  } catch (e: any) {
    return { success: false, error: e.message || 'Network error' };
  }
}

/**
 * Sync Attendance from Google Sheet
 */
export async function syncAttendanceFromSheet(): Promise<{ success: boolean; data?: AttendanceRecord[]; error?: string }> {
  try {
    const res = await fetchWithTimeout(query('get_attendance',credentials()));
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (Array.isArray(data)) {
      const formatted: AttendanceRecord[] = data.map((a: any) => ({
        id: a.id ? String(a.id) : undefined,
        userId: String(a.userId || '').trim(),
        userName: String(a.userName || '').trim(),
        userType: String(a.userType || 'BA Staff'),
        action: (a.action === 'OUT' ? 'OUT' : 'IN') as 'IN' | 'OUT',
        timestamp: String(a.timestamp || new Date().toISOString()),
        location: String(a.location || ''),
        details: String(a.details || ''),
        checkIn: a.checkIn ? String(a.checkIn) : (a.action === 'IN' ? a.timestamp : undefined),
        checkOut: a.checkOut ? String(a.checkOut) : (a.action === 'OUT' ? a.timestamp : undefined),
        distanceMeters: typeof a.distanceMeters === 'number' ? a.distanceMeters : undefined,
      }));
      
      saveStoredAttendance(formatted);
      return { success: true, data: formatted };
    }
    return { success: false, error: 'Empty attendance' };
  } catch (e: any) {
    return { success: false, error: e.message || 'Network error' };
  }
}

/**
 * Sync Products from Google Sheet "Product List"
 */
export async function getBaActualStock(userId: string): Promise<{success:boolean;hasApprovedCount?:boolean;stock?:Record<string,number>;openingStock?:Record<string,number>;stockIn?:Record<string,number>;stockOut?:Record<string,number>;saleOut?:Record<string,number>;error?:string;approvedAt?:string;submittedStock?:Record<string,number>;submittedAt?:string}> {
  try {
    let res = await fetchWithTimeout(query('get_ba_actual_stock',{...credentials(),baId:userId}));
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    let data = await res.json();
    if (!data.success && data.error && (data.error.includes('Missing sheet') || data.error.includes('setupSixReports'))) {
      try {
        await fetchWithTimeout(query('setup_six_reports', credentials()), {}, 10000);
        res = await fetchWithTimeout(query('get_ba_actual_stock',{...credentials(),baId:userId}));
        if (res.ok) data = await res.json();
      } catch { /* proceed with initial response */ }
    }
    if (!data.success) throw new Error(data.error || 'Stock request failed');
    return data;
  } catch(e:any) {return {success:false,error:e?.message||'Network error'};}
}

export async function syncProductsFromSheet(): Promise<{ success: boolean; data?: Product[]; error?: string }> {
  try {
    const res = await fetchWithTimeout(query('get_products', credentials()));
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (Array.isArray(data)) {
      const formatted: Product[] = data.map((p: any, idx: number) => ({
        id: String(p.id || `PROD_${String(p.productCode || p.code || idx).trim().toUpperCase()}`),
        productCode: String(p.productCode || p.code || '').trim().toUpperCase(),
        name: String(p.name || '').trim(),
        category: p.category ? String(p.category).trim() : 'ទូទៅ',
        price: typeof p.price === 'number' ? p.price : parseFloat(p.price) || 0,
        imageUrl: p.imageUrl || p.photoUrl || '',
        stockQty: typeof p.stockQty === 'number' ? p.stockQty : parseInt(p.stockQty, 10) || 0,
        initialStock: typeof p.initialStock === 'number' ? p.initialStock : parseInt(p.initialStock, 10) || 0,
        stockIn: typeof p.stockIn === 'number' ? p.stockIn : parseInt(p.stockIn, 10) || 0,
        totalSold: typeof p.totalSold === 'number' ? p.totalSold : parseInt(p.totalSold, 10) || 0,
        minAlertQty: Number.isFinite(Number(p.minAlertQty)) ? Number(p.minAlertQty) : 5,
        isHot: Boolean(p.isHot),
      }));
      saveStoredProducts(formatted);
      return { success: true, data: formatted };
    }
    return { success: false, error: 'Empty products from sheet' };
  } catch (e: any) {
    return { success: false, error: e.message || 'Network error' };
  }
}

/**
 * Send Background POST to Google Sheet
 */
export async function postToGoogleSheet(payload: any): Promise<void> {
  const type = String(payload?.type || payload?.action || '');
  const auth = credentials();
  if (type === 'attendance') {
    const record = payload.record || payload;
    const day = formatDateToYMD(record.date || record.timestamp);
    const id = `${record.userId || auth.userId}_${day}_${String(record.action).toUpperCase().replace(/^CHECK[ _-]?IN$/, 'IN').replace(/^CHECK[ _-]?OUT$/, 'OUT')}`;
    await confirmedSubmission({ ...payload, record }, 'attendance', id);
    return;
  }
  if (type === 'leave_request') {
    await confirmedSubmission(payload, 'leave', String(payload.leave?.id || payload.id));
    return;
  }
  if (type === 'leave_action' || type === 'update_leave_status') {
    const target = payload.leave || payload;
    if (!['Approved', 'Rejected'].includes(target.status)) throw new Error('Invalid leave status');
    await fetchWithTimeout(GOOGLE_SHEET_API_URL, { method: 'POST', mode: 'no-cors',
      headers: {'Content-Type':'text/plain;charset=utf-8'},
      body: JSON.stringify({...payload,...auth}) }, 20000);
    for(let attempt=0; attempt<5; attempt++) {
      const res = await fetchWithTimeout(query('get_leaves', auth));
      const data = await res.json();
      if (Array.isArray(data) && data.some((v:any)=>v.id===target.id && v.status===target.status)) return;
      await new Promise(resolve=>setTimeout(resolve,500));
    }
    throw new Error('Leave status was not confirmed in Google Sheets');
  }
  throw new Error(`Unsupported background write: ${type}. Use a verified API function.`);
}

/** Save BA List through an authenticated Apps Script mutation, then verify by reading it back. */
export async function saveBAUserToSheet(user: User, actorId: string, actorPassword: string = ''): Promise<void> {
  if (!GOOGLE_SHEET_API_URL) throw new Error('Set VITE_GOOGLE_SHEET_API_URL to the current Apps Script deployment');
  // POST is opaque in browsers; NEVER treat it as proof of success.
  await fetchWithTimeout(GOOGLE_SHEET_API_URL, {
    method: 'POST', mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({type:'admin_save_user',user,actorId,actorPassword}),
  }, 20000);
  const fresh = await syncUsersFromSheet();
  if(!fresh.success || !fresh.data?.some(u=>u.id===user.id && u.name===user.name && u.location===user.location))
    throw new Error('BA update not verified by Google Sheets');
}

/** Confirm the deployment has the BA List write API, not an outdated script. */
export async function checkBAListApiVersion(): Promise<void> {
  const response = await fetchWithTimeout(`${GOOGLE_SHEET_API_URL}?type=ba_list_api_health&_=${Date.now()}`);
  if (!response.ok) throw new Error(`Apps Script health HTTP ${response.status}`);
  const result = await response.json();
  const compatibleVersions = ['wide-clean-v3-20261024', 'wide-clean-v4-20261025', 'wide-clean-v5-20261025'];
  if (!result.success || !compatibleVersions.includes(String(result.version || ''))) {
    throw new Error('Google Apps Script version does not match this app. Deploy the matching google-apps-script/Code.gs version.');
  }
}

/** Password changes write to Google Sheets and must be confirmed by fresh server data. */
export async function changeOwnPassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
  await fetch(GOOGLE_SHEET_API_URL, {
    method: 'POST', mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({type:'change_password',userId,oldPassword,newPassword}),
  });
  // Apps Script web app POST responses can be opaque: verify persistence with a fresh read.
  for(let attempt=0; attempt<3;attempt++){
    const result=await loginFromSheet(userId,newPassword);
    if(result)return;
    await new Promise(resolve=>setTimeout(resolve,500));
  }
  throw new Error('Password update could not be verified in Google Sheets. Please check the old password and deployed script.');
}

/**
 * Delete User from Google Sheet
 */
export async function deleteUserFromSheet(userId: string): Promise<boolean> {
  const auth = credentials();
  const session = getCurrentSession();
  if (session?.type !== 'Admin') throw new Error('Admin permission required');
  const target = String(userId).trim();
  await fetchWithTimeout(GOOGLE_SHEET_API_URL, {method:'POST',mode:'no-cors',
    headers:{'Content-Type':'text/plain;charset=utf-8'},
    body:JSON.stringify({type:'delete_user',id:target,...auth})},20000);
  for (let attempt=0;attempt<5;attempt++) {
    const refreshed=await syncUsersFromSheet();
    if(refreshed.success && !refreshed.data?.some(u=>u.id===target)) return true;
    await new Promise(resolve=>setTimeout(resolve,500));
  }
  throw new Error('Deletion not confirmed in Google Sheets');
}

/**
 * Product & Stock Storage Helpers
 */
export function getStoredProducts(): Product[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS) || '[]');
    if (!Array.isArray(parsed)) return [];
    const unique = new Map<string, Product>();
    for (const p of parsed) {
      const code = String(p?.productCode || '').trim().toUpperCase();
      if (code) unique.set(code, p);
    }
    return [...unique.values()];
  } catch { return []; }
}

export function saveStoredProducts(products: Product[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  } catch (e) {
    console.warn('Failed to save products:', e);
  }
}

/**
 * Sales Orders Storage Helpers
 */
export function getStoredSalesOrders(): SalesOrder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SALES_ORDERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to parse stored sales orders:', e);
  }
  return [];
}

export function saveStoredSalesOrders(orders: SalesOrder[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.SALES_ORDERS, JSON.stringify(orders));
  } catch (e) {
    console.warn('Failed to save sales orders:', e);
  }
}

/**
 * Stock In Records Storage Helpers
 */
export function getStoredStockInRecords(): StockInRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STOCK_IN);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((r: any) => ({
          ...r,
          baId: r.baId || r.requestedById || (typeof r.updatedBy === 'string' && r.updatedBy.startsWith('BA') ? r.updatedBy : 'BA00002'),
          requestedById: r.requestedById || r.baId || 'BA00002',
          status: r.status || 'Approved',
          requestedBy: r.requestedBy || 'Staff',
          updatedBy: r.baId || r.requestedById || r.updatedBy || 'BA00002',
          type: r.type || 'Stock In',
        }));
      }
    }
  } catch (e) {
    console.warn('Failed to parse stored stock in records:', e);
  }
  return [];
}

export function saveStoredStockInRecords(records: StockInRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.STOCK_IN, JSON.stringify(records));
  } catch (e) {
    console.warn('Failed to save stock in records:', e);
  }
}

/**
 * Post Sales Orders to Google Sheet
 * Targets Sheet: "Sale Out" in Google Spreadsheet "BA Control"
 * Sends exactly ONE POST request with full order payload and flat items
 */
export async function postSalesOrdersToSheet(
  order: SalesOrder
): Promise<{ success: boolean; error?: string }> {
  try {
    const items = order.isNoSales
      ? [
          {
            orderId: order.id,
            date: order.date,
            timestamp: order.timestamp,
            baId: order.baId,
            baName: order.baName,
            province: order.province,
            productCode: 'NO_SALES',
            productName: 'គ្មានការលក់ (No Sales)',
            quantity: 0,
            price: 0,
            total: 0,
          },
        ]
      : order.items.map(item => ({
          orderId: order.id,
          date: order.date,
          timestamp: order.timestamp,
          baId: order.baId,
          baName: order.baName,
          province: order.province,
          productCode: item.productCode,
          productName: item.productName,
          quantity: item.quantity,
          price: item.price,
          total: item.total,
        }));

    const payload = {
      type: 'sales_order',
      action: 'sale_out',
      sheet: 'Sale Out Report',
      targetSheet: 'Sale Out Report',
      order: {
        id: order.id,
        date: order.date,
        timestamp: order.timestamp,
        baId: order.baId,
        baName: order.baName,
        province: order.province,
        isNoSales: order.isNoSales,
        totalItems: order.totalItems,
        totalQty: order.totalQty,
        totalAmount: order.totalAmount,
        items: order.items,
      },
      items,
    };

    await confirmedSubmission(payload,'sale',order.id);
    return {success:true};
  } catch (e: any) {
    console.error('Error sending sales orders to Google Sheet:', e);
    return { success: false, error: e.message || 'Network error' };
  }
}

/**
 * Post Single Stock-In Transaction to Google Sheet
 * Targets Sheet: "Stock In" in Google Spreadsheet "BA Control"
 * Sends exactly ONE POST request to prevent duplicate rows
 */
export async function postStockInTransactionToSheet(
  stockInEntry: StockInRecord
): Promise<{ success: boolean; error?: string }> {
  try {
    // User requested "update by ID BA" - Ensure column H "Updated By" in Google Sheet receives the BA ID
    const baId =
      stockInEntry.baId ||
      stockInEntry.requestedById ||
      (stockInEntry.updatedBy && stockInEntry.updatedBy.startsWith('BA') ? stockInEntry.updatedBy : '') ||
      stockInEntry.updatedBy ||
      '';

    const payload = {
      type: 'stock_in_transaction',
      sheet: 'Stock In Report',
      targetSheet: 'Stock In Report',
      action: 'stock_in',
      date: stockInEntry.date,
      timestamp: stockInEntry.timestamp,
      productCode: stockInEntry.productCode,
      productName: stockInEntry.productName,
      quantityAdded: stockInEntry.addedQty,
      addedQty: stockInEntry.addedQty,
      previousStock: stockInEntry.previousStock,
      newStock: stockInEntry.newStock,
      // "update by ID BA" - Column H in Google Sheet is Updated By
      updatedBy: baId,
      baId: baId,
      userId: baId,
      requestedBy: stockInEntry.requestedBy || stockInEntry.updatedBy,
      requestedById: baId,
      approvedBy: stockInEntry.approvedBy || '',
      approvedById: stockInEntry.approvedById || '',
      note: stockInEntry.note || '',
      status: stockInEntry.status,
      stockIn: stockInEntry,
    };

    (payload as any).transactionId = stockInEntry.id;
    await confirmedSubmission(payload,'stock_in',stockInEntry.id);
    return {success:true};
  } catch (e: any) {
    console.error('Error posting stock-in transaction to Google Sheet:', e);
    return { success: false, error: e.message || 'Network error' };
  }
}

/**
 * Post Stock Summary Report to Google Sheet
 * Targets Sheet: "Stock In" in Google Spreadsheet "BA Control"
 */
export async function postStockSummaryToSheet(
  products: Product[], reporterName: string
): Promise<{success:boolean;error?:string}> {
  return postProductListToSheet(products, reporterName);
}

/**
 * Post / Upload Product List to Google Sheet
 * Targets Sheet: "Product List" in Google Spreadsheet "BA Control"
 * Sends exactly ONE POST request with full product payload
 */
export async function postProductListToSheet(
  products: Product[], adminName: string
): Promise<{success:boolean;error?:string}> {
  try {
    const auth = credentials();
    const payload = {
      type: 'sync_product_list',
      adminName,
      userId: auth.userId,
      password: auth.password,
      products: products.map((p, idx) => ({
        no: idx + 1,
        productCode: String(p.productCode || p.id).trim().toUpperCase(),
        name: String(p.name || '').trim(),
        category: p.category ? String(p.category).trim() : 'ទូទៅ',
        price: typeof p.price === 'number' ? p.price : parseFloat(String(p.price)) || 0,
        initialStock: typeof p.initialStock === 'number' ? p.initialStock : parseInt(String(p.initialStock), 10) || 0,
        stockQty: typeof p.stockQty === 'number' ? p.stockQty : parseInt(String(p.stockQty), 10) || 0,
        totalSold: typeof p.totalSold === 'number' ? p.totalSold : parseInt(String(p.totalSold), 10) || 0,
        minAlertQty: typeof p.minAlertQty === 'number' ? p.minAlertQty : parseInt(String(p.minAlertQty), 10) || 5,
        imageUrl: String(p.imageUrl || '').trim(),
      })),
    };

    await fetchWithTimeout(GOOGLE_SHEET_API_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    }, 25000);

    // no-cors POST gives no readable success status: verify the actual spreadsheet.
    for (let attempt = 0; attempt < 5; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 700));
      const fresh = await syncProductsFromSheet();
      if (!fresh.success || !fresh.data) continue;
      const byCode = new Map(fresh.data.map(p => [p.productCode.toUpperCase(), p]));
      const confirmed = products.length === fresh.data.length && products.every(p => {
        const actual = byCode.get(String(p.productCode).trim().toUpperCase());
        return actual && actual.name.trim() === p.name.trim()
          && (actual.category || 'ទូទៅ').trim() === String(p.category || 'ទូទៅ').trim()
          && Number(actual.price) === Number(p.price);
      });
      if (confirmed) return { success: true };
    }
    throw new Error('Product List update was not confirmed in Google Sheets. Check deployment URL, Admin access and script logs.');
  } catch (e: any) {
    console.error('Failed to post product list to sheet:', e);
    return { success: false, error: e?.message || 'Failed to sync product list to Google Sheets' };
  }
}

/** Read authoritative Stock In Report rows for the monthly Stock Count matrix. */
export async function syncStockInForChecklist(): Promise<StockInRecord[]> {
  const res = await fetchWithTimeout(query('get_stock_in',credentials()),{},15000);
  if (!res.ok) throw new Error(`Stock Count report HTTP ${res.status}`);
  const data=await res.json();
  if(!data.success||!Array.isArray(data.items)) throw new Error(data.error||'Stock In Report is unavailable');
  return data.items.map((r:any)=>({
    id:String(r.id),date:String(r.date),timestamp:String(r.timestamp),
    baId:String(r.baId),updatedBy:String(r.baId),productCode:String(r.productCode),
    productName:String(r.productName),addedQty:Number(r.quantityAdded)||0,
    previousStock:0,newStock:0,note:String(r.note||''),status:'Approved' as const,type:'Stock In' as const
  }));
}

/** Load Sale Out Report from the backend, grouping SKU ledger rows into orders. */
export async function syncSalesFromSheet(): Promise<{success:boolean;data?:SalesOrder[];error?:string}> {
  try {
    const res=await fetchWithTimeout(query('get_sales',credentials()),{},15000);
    if(!res.ok) throw new Error(`Sale Out Report HTTP ${res.status}`);
    const result=await res.json();
    if(!result.success || !Array.isArray(result.items)) throw new Error(result.error || 'Sale Out Report unavailable');
    if(result.version !== 'wide-clean-v5-20261025') {
      throw new Error('Google Apps Script is missing the sales-total sync update. Deploy google-apps-script/Code.gs as a new version.');
    }
    const grouped=new Map<string,SalesOrder>();
    for(const r of result.items) {
      const baId=String(r.baId||'').trim();
      const id=String(r.orderId||'').trim();
      if(!baId||!id) continue;
      const groupKey=baId.toUpperCase()+'|'+id;
      let order=grouped.get(groupKey);
      if(!order) {
        const recordedTotal = Number(r.totalSales);
        order={id,date:formatDateToYMD(r.date)||String(r.date||'').slice(0,10),
          timestamp:String(r.timestamp||''),baId,baName:String(r.baName||''),
          province:String(r.province||''),isNoSales:false,items:[],
          totalItems:0,totalQty:Number(r.rowTotalQty)||0,
          totalAmount:Number.isFinite(recordedTotal)?recordedTotal:0,status:'Synced'};
        grouped.set(groupKey,order);
      }
      const code=String(r.productCode||'').trim();
      if(!code || order.items.some(item=>item.productCode.toUpperCase()===code.toUpperCase()))continue;
      const quantity=Number(r.quantity)||0;
      const price=Number(r.price)||0;
      const total=Number(r.total)||0;
      order.items.push({productCode:code,productName:String(r.productName||''),quantity,price,total});
      if (r.rowTotalQty == null) order.totalQty += quantity;
      if (r.totalSales == null) order.totalAmount += total;
      order.totalItems=order.items.length;
      if(code==='NO_SALES') order.isNoSales=true;
    }
    return {success:true,data:Array.from(grouped.values())};
  } catch(error) {
    return {success:false,error:error instanceof Error?error.message:String(error)};
  }
}
