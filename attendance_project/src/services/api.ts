import { User, LeaveRequest, AttendanceRecord, Product, SalesOrder, StockInRecord } from '../types';
import { formatDateToYMD } from '../utils/date';

export const GOOGLE_SHEET_API_URL =
  'https://script.google.com/macros/s/AKfycbyK1y4XW4_SCOP3wsyIEhapnj95mXr-xxLCmVHGtyUB5nGOEjalniPxY-Iml61rn5onug/exec';

// Real baseline data matching the user's Google Sheet
export const INITIAL_USERS: User[] = [
  {
    id: 'BA00001',
    name: 'VN',
    password: '1111',
    location: '11.570000,104.890000',
    startDate: '2026-10-19',
    status: 'Active',
    type: 'Admin',
    managerId: '',
  },
  {
    id: 'BA00002',
    name: 'រ៉ាន អូន',
    password: '963799230',
    location: '11.58881983, 104.80320520',
    startDate: '2026-10-21',
    status: 'Active',
    type: 'BA Staff',
    managerId: 'DTPP1',
  },
  {
    id: 'BA00006',
    name: 'មួន សុភ័ក្រ្ត',
    password: '87814487',
    location: '11.54685900, 104.92557800',
    startDate: '2026-10-21',
    status: 'Active',
    type: 'BA Staff',
    managerId: 'DTPP3',
  },
  {
    id: 'SM0003',
    name: 'PP3',
    password: '123',
    location: '11.566452, 104.871013',
    startDate: '2026-10-21',
    status: 'Active',
    type: 'Manager',
    managerId: 'DTPP3',
  },
];

export const INITIAL_LEAVES: LeaveRequest[] = [
  {
    id: 'LEAVE_1792581778980',
    userId: 'BA00006',
    userName: 'មួន សុភ័ក្រ្ត',
    managerId: 'DTPP3',
    type: 'AL',
    startDate: '2026-10-24',
    endDate: '2026-10-24',
    reason: 'ឈឺ',
    status: 'Approved',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'LEAVE_1792585573397',
    userId: 'BA00006',
    userName: 'មួន សុភ័ក្រ្ត',
    managerId: 'DTPP3',
    type: 'CS',
    startDate: '2026-10-30',
    endDate: '2026-10-30',
    reason: 'test',
    status: 'Approved',
    createdAt: new Date().toISOString(),
  },
];

export const INITIAL_ATTENDANCE: AttendanceRecord[] = [];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'PROD_PM0006',
    productCode: 'PM0006',
    name: 'Peter&Moré_Whitening Essential Mask',
    category: 'ម៉ាសបំប៉នស្បែកស (Whitening Mask)',
    price: 22.0,
    imageUrl: 'https://images.unsplash.com/photo-1608248597359-00109919f2a0?w=500&auto=format&fit=crop&q=60',
    stockQty: 30,
    initialStock: 30,
    stockIn: 0,
    totalSold: 0,
    minAlertQty: 5,
    isHot: true,
  },
  {
    id: 'PROD_PM0005',
    productCode: 'PM0005',
    name: 'Peter&Moré_Collagen Essential Mask',
    category: 'ម៉ាសខូឡាជេន (Collagen Mask)',
    price: 18.0,
    imageUrl: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&auto=format&fit=crop&q=60',
    stockQty: 30,
    initialStock: 30,
    stockIn: 0,
    totalSold: 0,
    minAlertQty: 5,
    isHot: true,
  },
  {
    id: 'PROD_PM0004',
    productCode: 'PM0004',
    name: 'Peter&Moré_Acne Care Essential Mask',
    category: 'ម៉ាសព្យាបាលមុន (Acne Mask)',
    price: 20.0,
    imageUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500&auto=format&fit=crop&q=60',
    stockQty: 35,
    initialStock: 35,
    stockIn: 0,
    totalSold: 0,
    minAlertQty: 5,
  },
  {
    id: 'PROD_PM0003',
    productCode: 'PM0003',
    name: 'Peter&Moré_Tintee Oil Control Sunscreen',
    category: 'ឡេការពារកម្ដៅថ្ងៃ (Sunscreen)',
    price: 16.5,
    imageUrl: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&auto=format&fit=crop&q=60',
    stockQty: 60,
    initialStock: 60,
    stockIn: 0,
    totalSold: 0,
    minAlertQty: 5,
  },
  {
    id: 'PROD_BC0004',
    productCode: 'BC0004',
    name: 'Morea Whitening Cream',
    category: 'គ្រីមបំប៉នស្បែកស (Whitening)',
    price: 24.0,
    imageUrl: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&auto=format&fit=crop&q=60',
    stockQty: 25,
    initialStock: 25,
    stockIn: 0,
    totalSold: 0,
    minAlertQty: 5,
  },
  {
    id: 'PROD_PM0001',
    productCode: 'PM0001',
    name: 'Peter&Moré_Cleanser',
    category: 'ហ្វូមលាងមុខ (Cleanser)',
    price: 12.0,
    imageUrl: 'https://images.unsplash.com/photo-1556228722-d0b74b1e56b4?w=500&auto=format&fit=crop&q=60',
    stockQty: 50,
    initialStock: 50,
    stockIn: 0,
    totalSold: 0,
    minAlertQty: 5,
  },
  {
    id: 'PROD_PM0002',
    productCode: 'PM0002',
    name: 'Peter&Moré_Toner',
    category: 'ទឹកជូតស្បែកមុខ (Toner)',
    price: 15.0,
    imageUrl: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=500&auto=format&fit=crop&q=60',
    stockQty: 40,
    initialStock: 40,
    stockIn: 0,
    totalSold: 0,
    minAlertQty: 5,
  },
];

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
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

/**
 * Sync Users from Google Sheet
 */
export async function syncUsersFromSheet(): Promise<{ success: boolean; data?: User[]; error?: string }> {
  try {
    const res = await fetchWithTimeout(`${GOOGLE_SHEET_API_URL}?type=get_users`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      const deletedIds = getDeletedUserIds();
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
            password: String(u.password || ''),
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
    const res = await fetchWithTimeout(`${GOOGLE_SHEET_API_URL}?type=get_leaves`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
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
    const res = await fetchWithTimeout(`${GOOGLE_SHEET_API_URL}?type=get_attendance`);
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
      
      // Preserve any local attendance records while updating from sheet
      const localAttendance = getStoredAttendance();
      const combined = [...localAttendance];
      for (const item of formatted) {
        if (!combined.some(c => c.userId === item.userId && c.timestamp === item.timestamp && c.action === item.action)) {
          combined.push(item);
        }
      }
      saveStoredAttendance(combined);
      return { success: true, data: combined };
    }
    return { success: false, error: 'Empty attendance' };
  } catch (e: any) {
    return { success: false, error: e.message || 'Network error' };
  }
}

/**
 * Sync Products from Google Sheet "Product List"
 */
export async function syncProductsFromSheet(): Promise<{ success: boolean; data?: Product[]; error?: string }> {
  try {
    const res = await fetchWithTimeout(`${GOOGLE_SHEET_API_URL}?type=get_products`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      const formatted: Product[] = data.map((p: any, idx: number) => ({
        id: String(p.id || `PROD_${idx}_${Date.now()}`),
        productCode: String(p.productCode || p.code || '').trim().toUpperCase(),
        name: String(p.name || '').trim(),
        category: p.category ? String(p.category).trim() : 'ទូទៅ',
        price: typeof p.price === 'number' ? p.price : parseFloat(p.price) || 0,
        imageUrl: p.imageUrl || p.photoUrl || '',
        stockQty: typeof p.stockQty === 'number' ? p.stockQty : parseInt(p.stockQty, 10) || 0,
        initialStock: typeof p.initialStock === 'number' ? p.initialStock : parseInt(p.initialStock, 10) || 0,
        stockIn: typeof p.stockIn === 'number' ? p.stockIn : parseInt(p.stockIn, 10) || 0,
        totalSold: typeof p.totalSold === 'number' ? p.totalSold : parseInt(p.totalSold, 10) || 0,
        minAlertQty: typeof p.minAlertQty === 'number' ? p.minAlertQty : parseInt(p.minAlertQty, 10) || 5,
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
export async function postToGoogleSheet(payload: any) {
  try {
    await fetch(GOOGLE_SHEET_API_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    console.warn('Background sync to Google Sheet failed (saved locally):', e);
  }
}

/**
 * Delete User from Google Sheet
 */
export async function deleteUserFromSheet(userId: string): Promise<boolean> {
  const cleanId = String(userId).trim();
  addDeletedUserId(cleanId);

  try {
    // 1. Send GET request matching user's original Google Apps Script
    fetch(
      `${GOOGLE_SHEET_API_URL}?type=delete_user&userId=${encodeURIComponent(
        cleanId
      )}&id=${encodeURIComponent(cleanId)}`,
      {
        method: 'GET',
        mode: 'no-cors',
      }
    ).catch(() => {});

    // 2. Also send POST payload for redundancy
    await postToGoogleSheet({
      type: 'delete_user',
      userId: cleanId,
      id: cleanId,
    });
    return true;
  } catch (err) {
    console.warn('Error deleting user from sheet:', err);
    return false;
  }
}

/**
 * Product & Stock Storage Helpers
 */
export function getStoredProducts(): Product[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const hasPM = parsed.some(p => p.productCode && p.productCode.startsWith('PM'));
        if (!hasPM) {
          const merged = [...INITIAL_PRODUCTS, ...parsed];
          localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(merged));
          return merged;
        }
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to parse stored products:', e);
  }
  return INITIAL_PRODUCTS;
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

    // Map quantities for all known products horizontally (1 row matrix format)
    const productQuantities: Record<string, number> = {};
    const columnValues: Record<string, number> = {};
    INITIAL_PRODUCTS.forEach(p => {
      productQuantities[p.productCode] = 0;
      columnValues[`${p.productCode}-${p.name}`] = 0;
    });

    if (!order.isNoSales && order.items) {
      order.items.forEach(it => {
        productQuantities[it.productCode] = (productQuantities[it.productCode] || 0) + it.quantity;
        const matched = INITIAL_PRODUCTS.find(p => p.productCode.toUpperCase() === it.productCode.toUpperCase());
        const headerKey = matched ? `${matched.productCode}-${matched.name}` : `${it.productCode}-${it.productName}`;
        columnValues[headerKey] = (columnValues[headerKey] || 0) + it.quantity;
      });
    }

    const payload = {
      type: 'sales_order',
      action: 'sale_out',
      sheet: 'Sale Out',
      targetSheet: 'Sale Out',
      date: order.date,
      timestamp: order.timestamp,
      baId: order.baId,
      baName: order.baName,
      province: order.province,
      isNoSales: order.isNoSales,
      totalItems: order.totalItems,
      totalQty: order.totalQty,
      totalAmount: order.totalAmount,
      // Horizontal row product items format
      productQuantities,
      columnValues,
      singleRowPerDay: true,
      mergeSameDateRow: true,
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

    await fetch(GOOGLE_SHEET_API_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    });

    return { success: true };
  } catch (e: any) {
    console.error('Error sending sales orders to Google Sheet:', e);
    return { success: false, error: e.message || 'Network error' };
  }
}

/**
 * Post Single Stock-In Transaction to Google Sheet
 * Targets Sheet: "Stock In" in Google Spreadsheet "BA Control"
 * Formats product items as horizontal row (1 row per day)
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

    // Map quantities horizontally for Stock In
    const productQuantities: Record<string, number> = {};
    const columnValues: Record<string, number> = {};
    INITIAL_PRODUCTS.forEach(p => {
      productQuantities[p.productCode] = 0;
      columnValues[`${p.productCode}-${p.name}`] = 0;
    });
    productQuantities[stockInEntry.productCode] = stockInEntry.addedQty;
    const matched = INITIAL_PRODUCTS.find(p => p.productCode.toUpperCase() === stockInEntry.productCode.toUpperCase());
    const headerKey = matched ? `${matched.productCode}-${matched.name}` : `${stockInEntry.productCode}-${stockInEntry.productName}`;
    columnValues[headerKey] = stockInEntry.addedQty;

    const payload = {
      type: 'stock_in_transaction',
      sheet: 'Stock In',
      targetSheet: 'Stock In',
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
      // Horizontal row product items format
      productQuantities,
      columnValues,
      singleRowPerDay: true,
      mergeSameDateRow: true,
      stockIn: stockInEntry,
    };

    await fetch(GOOGLE_SHEET_API_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    });

    return { success: true };
  } catch (e: any) {
    console.error('Error posting stock-in transaction to Google Sheet:', e);
    return { success: false, error: e.message || 'Network error' };
  }
}

/**
 * Product items are horizontal columns; each BA/date is one report row.
 * The active product list controls the header, including newly added SKUs.
 */
export async function syncDailySaleOutMatrixToSheet(
  orders: SalesOrder[], products: Product[] = getStoredProducts()
): Promise<{ success: boolean; error?: string }> {
  try {
    const productMap = new Map<string, { code: string; name: string; header: string }>();
    products.forEach(p => productMap.set(p.productCode.trim().toUpperCase(), {
      code: p.productCode, name: p.name, header: `${p.productCode}-${p.name}`,
    }));
    orders.forEach(o => o.items?.forEach(i => {
      const key = i.productCode.trim().toUpperCase();
      if (!productMap.has(key)) productMap.set(key, {
        code: i.productCode, name: i.productName, header: `${i.productCode}-${i.productName}`,
      });
    }));
    const catalog = Array.from(productMap.values());
    const rows = new Map<string, any>();
    orders.forEach(o => {
      const key = `${o.date}|${o.baId.trim().toUpperCase()}`;
      if (!rows.has(key)) rows.set(key, {
        date: o.date, baId: o.baId, baName: o.baName, province: o.province,
        productQuantities: {}, columnValues: {}, totalQty: 0, totalAmount: 0,
        isNoSales: true,
      });
      const row = rows.get(key);
      if (!o.isNoSales) {
        row.isNoSales = false;
        o.items?.forEach(i => {
          const code = i.productCode.trim().toUpperCase();
          row.productQuantities[code] = (row.productQuantities[code] || 0) + i.quantity;
        });
      }
      row.totalQty += o.totalQty || 0;
      row.totalAmount += o.totalAmount || 0;
    });
    const matrixRows = Array.from(rows.values()).map(row => {
      catalog.forEach(p => { row.columnValues[p.header] = row.productQuantities[p.code.trim().toUpperCase()] || 0; });
      return row;
    });
    await fetch(GOOGLE_SHEET_API_URL, {
      method: 'POST', mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ type: 'sync_sale_out_matrix', action: 'sync_sale_out_matrix',
        sheet: 'Sale Out', targetSheet: 'Sale Out', layout: 'horizontal',
        products: catalog, matrixRows }),
    });
    // no-cors hides response status; receipt by the server cannot be confirmed.
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message || 'Network error' };
  }
}

/** Stock In: one horizontal row per BA/date, approved transactions only. */
export async function syncDailyStockInMatrixToSheet(
  records: StockInRecord[], products: Product[] = getStoredProducts()
): Promise<{ success: boolean; error?: string }> {
  try {
    const approved = records.filter(r => r.status === 'Approved');
    const productMap = new Map<string, { code: string; name: string; header: string }>();
    products.forEach(p => productMap.set(p.productCode.trim().toUpperCase(), {
      code: p.productCode, name: p.name, header: `${p.productCode}-${p.name}`,
    }));
    approved.forEach(r => {
      const code = r.productCode.trim().toUpperCase();
      if (!productMap.has(code)) productMap.set(code, {
        code: r.productCode, name: r.productName, header: `${r.productCode}-${r.productName}`,
      });
    });
    const catalog = Array.from(productMap.values());
    const rows = new Map<string, any>();
    approved.forEach(r => {
      const baId = r.baId || r.requestedById || r.updatedBy || '';
      const key = `${r.date}|${baId.trim().toUpperCase()}`;
      if (!rows.has(key)) rows.set(key, {
        date: r.date, baId, baName: r.requestedBy || '', note: '',
        productQuantities: {}, columnValues: {}, totalAdded: 0,
      });
      const row = rows.get(key);
      const code = r.productCode.trim().toUpperCase();
      row.productQuantities[code] = (row.productQuantities[code] || 0) + r.addedQty;
      row.totalAdded += r.addedQty;
      if (r.note && !row.note.split(' | ').includes(r.note)) row.note = row.note ? `${row.note} | ${r.note}` : r.note;
    });
    const matrixRows = Array.from(rows.values()).map(row => {
      catalog.forEach(p => { row.columnValues[p.header] = row.productQuantities[p.code.trim().toUpperCase()] || 0; });
      return row;
    });
    await fetch(GOOGLE_SHEET_API_URL, {
      method: 'POST', mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ type: 'sync_stock_in_matrix', action: 'sync_stock_in_matrix',
        sheet: 'Stock In', targetSheet: 'Stock In', layout: 'horizontal',
        products: catalog, matrixRows }),
    });
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message || 'Network error' };
  }
}

/**
 * Post Stock Summary Report to Google Sheet
 * Targets Sheet: "Stock In" in Google Spreadsheet "BA Control"
 */
export async function postStockSummaryToSheet(
  products: Product[],
  reporterName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const summaryPayload = {
      sheet: 'Stock In',
      targetSheet: 'Stock In',
      type: 'stock_summary_report',
      action: 'stock_summary_report',
      timestamp: new Date().toISOString(),
      reporter: reporterName,
      totalSKUs: products.length,
      totalStockUnits: products.reduce((sum, p) => sum + (p.stockQty || 0), 0),
      totalStockValue: products.reduce((sum, p) => sum + (p.stockQty || 0) * (p.price || 0), 0),
      totalSoldUnits: products.reduce((sum, p) => sum + (p.totalSold || 0), 0),
      products: products.map(p => ({
        code: p.productCode,
        name: p.name,
        category: p.category || '-',
        price: p.price,
        stockQty: p.stockQty,
        initialStock: p.initialStock ?? p.stockQty,
        stockIn: p.stockIn ?? 0,
        totalSold: p.totalSold ?? 0,
        stockValue: (p.stockQty || 0) * (p.price || 0),
      })),
    };

    await fetch(GOOGLE_SHEET_API_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(summaryPayload),
    });

    return { success: true };
  } catch (e: any) {
    console.error('Error posting stock summary to Google Sheet:', e);
    return { success: false, error: e.message || 'Network error' };
  }
}

/**
 * Post / Upload Product List to Google Sheet
 * Targets Sheet: "Product List" in Google Spreadsheet "BA Control"
 * Sends exactly ONE POST request
 */
export async function postProductListToSheet(
  products: Product[],
  adminName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const flatRows = products.map((p, index) => ({
      no: index + 1,
      productCode: p.productCode,
      name: p.name,
      category: p.category || '',
      price: p.price,
      initialStock: p.initialStock ?? p.stockQty,
      stockQty: p.stockQty,
      minAlertQty: p.minAlertQty || 5,
      totalSold: p.totalSold || 0,
      imageUrl: p.imageUrl || '',
      updatedBy: adminName,
      updatedAt: new Date().toISOString(),
    }));

    const payload = {
      type: 'sync_product_list',
      sheet: 'Product List',
      targetSheet: 'Product List',
      action: 'sync_product_list',
      admin: adminName,
      timestamp: new Date().toISOString(),
      productsCount: products.length,
      products: flatRows,
    };

    await fetch(GOOGLE_SHEET_API_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    });

    return { success: true };
  } catch (e: any) {
    console.error('Error posting product list to Google Sheet:', e);
    return { success: false, error: e.message || 'Network error' };
  }
}

