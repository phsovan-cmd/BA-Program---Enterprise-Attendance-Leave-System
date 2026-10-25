/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { User, LeaveRequest, AttendanceRecord, LeaveType, Product, SalesOrder, StockInRecord, StockAdjustmentType } from './types';
import {
  getStoredUsers,
  saveStoredUsers,
  getStoredLeaves,
  saveStoredLeaves,
  getStoredAttendance,
  saveStoredAttendance,
  getCurrentSession,
  saveCurrentSession,
  getGpsTestMode,
  setGpsTestMode as saveGpsTestMode,
  syncUsersFromSheet,
  loginFromSheet,
  syncLeavesFromSheet,
  syncAttendanceFromSheet,
  postToGoogleSheet,
  saveBAUserToSheet, checkBAListApiVersion,
  deleteUserFromSheet,
  removeDeletedUserId,
  getStoredProducts,
  saveStoredProducts,
  getStoredSalesOrders,
  saveStoredSalesOrders,
  postSalesOrdersToSheet,
  postStockSummaryToSheet,
  postProductListToSheet,
  postStockInTransactionToSheet,
  syncProductsFromSheet,
  syncSalesFromSheet,
  syncStockInForChecklist,
  getBaActualStock,
  changeOwnPassword,
  getStoredStockInRecords,
  saveStoredStockInRecords,
} from './services/api';
import { formatDateToYMD } from './utils/date';
import { Navbar } from './components/Navbar';
import { AppSidebar } from './components/AppSidebar';
import { AuthView } from './components/AuthView';

import { LeaveButtonsBar } from './components/LeaveButtonsBar';
import { LeaveModal } from './components/LeaveModal';
import { UserModal } from './components/UserModal';
import { MapPickerModal } from './components/MapPickerModal';
import { BAMonthlyCombinedReport } from './components/BAMonthlyCombinedReport';
import { CheckInPanel } from './components/CheckInPanel';
import { StaffManagementView } from './components/StaffManagementView';
import { LeaveRequestsView } from './components/LeaveRequestsView';
import { ProfileModal } from './components/ProfileModal';
import { UploadUsersModal } from './components/UploadUsersModal';
import { ToastContainer, ToastMessage } from './components/ToastContainer';
import { AttendanceHistoryView, isUserUnderManager } from './components/AttendanceHistoryView';
import { SalesOrderView } from './components/SalesOrderView';
import { StockManagementView } from './components/StockManagementView';
import { StockAdjustmentTool } from './components/StockAdjustmentTool';
import { ProductItemsView } from './components/ProductItemsView';
import {
  LogIn,
  LogOut,
  FileText,
  Clock,
  Calendar,
  Users,
  History,
  MapPin,
  CheckCircle,
  ShoppingCart,
  Package,
  LayoutDashboard,
  ClipboardList,
  ShoppingBag,
  ListChecks,
} from 'lucide-react';

export default function App() {
  // Application Data States
  const [users, setUsers] = useState<User[]>(getStoredUsers);
  const [leaves, setLeaves] = useState<LeaveRequest[]>(getStoredLeaves);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(getStoredAttendance);
  const [products, setProducts] = useState<Product[]>(getStoredProducts);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>(getStoredSalesOrders);
  const [stockInRecords, setStockInRecords] = useState<StockInRecord[]>(getStoredStockInRecords);
  const [currentUser, setCurrentUser] = useState<User | null>(getCurrentSession);

  // Reference to prevent stale closures and avoid any auto-login on logout
  const currentUserRef = useRef<User | null>(currentUser);
  const isSyncingRef = useRef(false);
  const lastSyncTimeRef = useRef(0);
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  // UI States: Separated Layout Modules (1. Attendance vs 2. Sale Order & Stock)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);
  const [mainModule, setMainModule] = useState<'attendance' | 'sales_stock'>('attendance');
  const [attendanceTab, setAttendanceTab] = useState<'report' | 'attendance' | 'leave' | 'staff' | 'history'>('report');
  const [submittedStock, setSubmittedStock] = useState<Record<string, number>>({});
  const [submittedAt, setSubmittedAt] = useState('');
  const [salesStockTab, setSalesStockTab] = useState<'sales' | 'stock' | 'adjustment' | 'products'>('sales');
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastCloudSync, setLastCloudSync] = useState('');
  const [reportSyncError, setReportSyncError] = useState('');
  const [gpsTestMode, setGpsTestMode] = useState<boolean>(getGpsTestMode);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // PWA install prompt
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(() =>
    typeof window !== 'undefined' && (window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & {standalone?: boolean}).standalone === true)
  );

  // Modals
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [activeLeaveType, setActiveLeaveType] = useState<LeaveType>('AL');

  const [userModalOpen, setUserModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);

  const [mapPickerOpen, setMapPickerOpen] = useState(false);
  const [mapInitialLoc, setMapInitialLoc] = useState('11.556400,104.928200');
  const [mapOnPickedCallback, setMapOnPickedCallback] = useState<((c: string) => void) | null>(null);

  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [uploadUsersModalOpen, setUploadUsersModalOpen] = useState(false);

  // Toast Notification helper
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = 'toast_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // PWA install handler
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };
    const installed = () => { setIsInstalled(true); setCanInstall(false); setDeferredPrompt(null); };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', installed);
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installed);
    };
  }, []);

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        showToast('បានទទួលសំណើដំឡើង App!', 'success');
      }
      setDeferredPrompt(null);
      setCanInstall(false);
    }
  };

  // Cloud report refresh: throttled to avoid freezing Google Sheets or browser
  useEffect(() => {
    // Initial fetch
    if (currentUserRef.current) void handleSyncAll(false);

    // Auto update once every 90 seconds silently when tab is active
    const timer = setInterval(() => {
      if (currentUserRef.current && document.visibilityState === 'visible') {
        void handleSyncAll(false);
      }
    }, 90000);

    // Auto update when tab becomes visible (throttled)
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible' && currentUserRef.current) {
        void handleSyncAll(false);
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);


  const handleSyncAll = async (showFeedback = false) => {
    // Prevent concurrent sync calls that block each other on Google Sheets locks
    if (isSyncingRef.current) return;

    const now = Date.now();
    // Throttle automatic background requests to prevent flooding Google Apps Script
    if (!showFeedback && now - lastSyncTimeRef.current < 60000) {
      return;
    }

    try {
      isSyncingRef.current = true;
      lastSyncTimeRef.current = now;
      setIsSyncing(true);
      if (showFeedback) showToast('កំពុងទាញយកទិន្នន័យពី Google Sheet...', 'info');

      const [resUsers, resLeaves, resAttendance, resProducts, resSales, resStockIn] = await Promise.all([
        syncUsersFromSheet(),
        syncLeavesFromSheet(),
        syncAttendanceFromSheet(),
        syncProductsFromSheet(),
        syncSalesFromSheet(),
        syncStockInForChecklist()
          .then((data: StockInRecord[]) => ({ success: true, data, error: '' }))
          .catch((error: any) => ({ success: false, data: undefined as StockInRecord[] | undefined, error: String(error) })),
      ]);

      const issues = [
        !resUsers.success ? 'BA List' : '',
        !resLeaves.success ? 'Leave' : '',
        !resAttendance.success ? 'Attendance' : '',
        !resProducts.success ? 'Products' : '',
        !resSales.success ? 'Sale Out' : '',
        !resStockIn.success ? 'Stock Count' : '',
      ].filter(Boolean);
      setReportSyncError(issues.length ? `មិនទាន់អាចទាញទិន្នន័យថ្មីពី Google Sheets៖ ${issues.join(', ')}` : '');
      if (!issues.length) setLastCloudSync(new Date().toLocaleTimeString('en-GB', {hour:'2-digit',minute:'2-digit'}));
      // Reports must reflect the server, not stale browser-only transactions.
      if (resSales.success && resSales.data) {
        setSalesOrders(resSales.data);
        saveStoredSalesOrders(resSales.data);
      }
      if (resStockIn.success && resStockIn.data) {
        setStockInRecords(resStockIn.data);
        saveStoredStockInRecords(resStockIn.data);
      }
      if (resUsers.success && resUsers.data) {
        setUsers(resUsers.data);
        saveStoredUsers(resUsers.data);

        // Update current user ONLY if user is currently authenticated (never resurrect on/after logout)
        const activeUser = currentUserRef.current;
        if (activeUser && activeUser.id) {
          const freshMe = resUsers.data.find(
            u => u.id.trim().toLowerCase() === activeUser.id.trim().toLowerCase()
          );
          if (freshMe && currentUserRef.current) {
            setCurrentUser(freshMe);
            saveCurrentSession(freshMe);
          }
        }
      }
      if (resLeaves.success && resLeaves.data) {
        setLeaves(resLeaves.data);
      }
      if (resAttendance.success && resAttendance.data) {
        setAttendance(resAttendance.data);
      }
      if (resProducts?.success && resProducts.data?.length) {
        const activeBA = currentUserRef.current;
        if (activeBA?.id) {
          const requestedBA = activeBA.id;
          const count = await getBaActualStock(requestedBA);
          // A user may log out or switch accounts while the network request is in flight.
          if (currentUserRef.current?.id !== requestedBA) return;
          if (count.success) {
            setSubmittedStock(count.submittedStock || {});
            setSubmittedAt(count.submittedAt || '');
            const bySKU = count.stock || {};
            const stockOut = count.stockOut || count.saleOut;
            const scoped = resProducts.data.map(p => ({
              ...p,
              stockQty: bySKU[p.productCode.trim().toUpperCase()] ?? 0,
              initialStock: count.openingStock?.[p.productCode.trim().toUpperCase()] ?? p.initialStock ?? 0,
              stockIn: count.stockIn?.[p.productCode.trim().toUpperCase()] ?? 0,
              totalSold: stockOut?.[p.productCode.trim().toUpperCase()] ?? p.totalSold ?? 0,
            }));
            setProducts(scoped);
            if (showFeedback) showToast(count.hasApprovedCount
              ? `Stock synced for ${requestedBA}`
              : `BA ${requestedBA}: No Approved Stock Count or Stock In transactions.`, 'info');
          } else {
            // Failed stock requests must not leave cached quantities looking verified.
            setSubmittedStock({}); setSubmittedAt('');
            setProducts(resProducts.data.map(p => ({ ...p, stockQty: 0 })));
            if (showFeedback) showToast(`Stock Sync Error: ${count.error || 'Google Sheets request failed'}`, 'error');
          }
        } else {
          setProducts(resProducts.data);
        }
      } else if (showFeedback && !resProducts?.success) {
        showToast(`Product Sync Error: ${resProducts?.error || 'Google Sheets request failed'}`, 'error');
      }
    } catch (e: any) {
      setReportSyncError('មិនអាចភ្ជាប់ Google Sheets បាន។ ទិន្នន័យអាចមិនទាន់ថ្មី។');
      if (showFeedback) {
        showToast('មិនអាចភ្ជាប់ Google Sheet (កំពុងប្រើ Offline Data)', 'info');
      }
    } finally {
      isSyncingRef.current = false;
      setIsSyncing(false);
    }
  };

  // Auth Handlers
  const handleLogin = async (id: string, pass: string): Promise<boolean> => {
    // Validate against the authoritative BA List; never trust stale local credentials.
    const found = await loginFromSheet(id,pass);

    if (found) {
      currentUserRef.current = found;
      setProducts(prev=>prev.map(p=>({...p,stockQty:0})));
      setSubmittedStock({}); setSubmittedAt('');
      setCurrentUser(found);
      saveCurrentSession(found);
      void handleSyncAll(false);
      showToast(`សូមស្វាគមន៍ ${found.name}! ចូលប្រព័ន្ធជោគជ័យ`, 'success');
      return true;
    }
    return false;
  };

  const handleRegister = async (_newUser: User) => {
    showToast('BA registration must be completed by an Admin in BA List.', 'error');

  };

  const handleLogout = () => {
    // 1. Invalidate current user ref immediately to stop background sync re-login
    currentUserRef.current = null;
    // 2. Set current user state to null (renders AuthView)
    setCurrentUser(null);
    // 3. Clear all stored session keys & set logout flag in storage
    saveCurrentSession(null);
    // 4. Alert user
    showToast('បានចាកចេញពីប្រព័ន្ធដោយជោគជ័យ! សូមបញ្ចូល User ID និង Password ដើម្បីចូលប្រើឡើងវិញ', 'info');
  };

  // Toggle GPS Test Mode
  const handleToggleGpsTestMode = (enabled: boolean) => {
    setGpsTestMode(enabled);
    saveGpsTestMode(enabled);
    showToast(
      enabled
        ? 'បានបើក Test Mode (អនុញ្ញាត Check-In ដោយមិនចាំបាច់មាន GPS តូប)'
        : 'បានបិទ Test Mode (តម្រូវឱ្យនៅចម្ងាយក្រោម ១០ម)',
      'info'
    );
  };

  // Check-In / Check-Out
  const handlePerformCheckIn = async (action: 'IN' | 'OUT', distanceMeters: number) => {
    if (!currentUser) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString('km-KH', { hour12: false });
    const fullIso = now.toISOString();

    const newRecord: AttendanceRecord = {
      userId: currentUser.id,
      userName: currentUser.name,
      userType: currentUser.type,
      action: action,
      timestamp: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
        now.getDate()
      ).padStart(2, '0')} ${timeStr}`,
      location: currentUser.location || '11.556400,104.928200',
      checkIn: action === 'IN' ? timeStr : undefined,
      checkOut: action === 'OUT' ? timeStr : undefined,
      distanceMeters,
      details: `Check-${action} at ${now.toLocaleString()} (${Math.round(distanceMeters)}m)`,
    };

    try {
      await postToGoogleSheet({type:'attendance', record: {...newRecord, date: formatDateToYMD(newRecord.timestamp)}});
      const updated=[...attendance,newRecord];
      setAttendance(updated); saveStoredAttendance(updated);
      showToast('Attendance saved to Google Sheets', 'success');
    } catch(e:any) {
      throw e; // The CheckInPanel must never animate success after a failed submission.
    }

  };

  // Update current user's store location
  const handleUpdateUserLocation = async (newLocation: string) => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, location: newLocation };
    setCurrentUser(updatedUser);
    saveCurrentSession(updatedUser);

    const updatedUsers = users.map(u => (u.id === currentUser.id ? updatedUser : u));
    setUsers(updatedUsers);
    saveStoredUsers(updatedUsers);

    // Profile updates are best-effort here; Admin staff editing uses the verified API.
    // This profile field is local-only; BA List changes require an Admin-approved write.
    setTimeout(() => handleSyncAll(false), 1200);
  };

  // Update current user's profile avatar
  const handleUpdateAvatar = async (newAvatar: string | undefined) => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, avatar: newAvatar };
    setCurrentUser(updatedUser);
    saveCurrentSession(updatedUser);

    const updatedUsers = users.map(u => (u.id === currentUser.id ? updatedUser : u));
    setUsers(updatedUsers);
    saveStoredUsers(updatedUsers);

    // This profile field is local-only; BA List changes require an Admin-approved write.
  };

  const handleChangePassword = async (oldPassword: string, newPassword: string) => {
    const active=currentUserRef.current;
    if(!active)throw new Error('Please log in again');
    await changeOwnPassword(active.id,oldPassword,newPassword);
    const fresh={...active,password:newPassword};
    currentUserRef.current=fresh;
    setCurrentUser(fresh);
    saveCurrentSession(fresh);
    setUsers(previous=>{
      const updated=previous.map(u=>u.id===fresh.id?{...u,password:newPassword}:u);
      saveStoredUsers(updated);return updated;
    });
  };

  // Leave Submit
  const handleLeaveSubmit = async (data: {
    type: LeaveType;
    startDate: string;
    endDate: string;
    reason: string;
  }) => {
    if (!currentUser) return;

    const newLeave: LeaveRequest = {
      id: 'LEAVE_' + Date.now(),
      userId: currentUser.id,
      userName: currentUser.name,
      managerId: currentUser.managerId || '',
      type: data.type,
      startDate: data.startDate,
      endDate: data.endDate,
      reason: data.reason,
      status: 'Pending',
      createdAt: new Date().toISOString(),
    };

    try {
      await postToGoogleSheet({ type:'leave_request', leave:newLeave });
      const updated=[...leaves,newLeave];
      setLeaves(updated); saveStoredLeaves(updated);
      showToast('សំណើច្បាប់ត្រូវបានរក្សាទុកក្នុង Google Sheets!', 'success');
      setMainModule('attendance'); setAttendanceTab('leave');
    } catch(e:any) { showToast(e?.message || 'Leave submit failed', 'error'); }

  };

  // Leave Approve / Reject
  const handleApproveLeave = async (leaveId: string) => {
    const target=leaves.find(l=>l.id===leaveId); if(!target)return;
    const updatedLeave={...target,status:'Approved' as const};
    try {
      await postToGoogleSheet({type:'leave_action',leave:updatedLeave});
      const updated=leaves.map(l=>l.id===leaveId?updatedLeave:l);
      setLeaves(updated); saveStoredLeaves(updated);
      showToast('Leave status updated in Google Sheets', 'success');
    } catch(e:any) {showToast(e?.message || 'Leave update failed','error');}

  };

  const handleRejectLeave = async (leaveId: string) => {
    const target=leaves.find(l=>l.id===leaveId); if(!target)return;
    const updatedLeave={...target,status:'Rejected' as const};
    try {
      await postToGoogleSheet({type:'leave_action',leave:updatedLeave});
      const updated=leaves.map(l=>l.id===leaveId?updatedLeave:l);
      setLeaves(updated); saveStoredLeaves(updated);
      showToast('Leave status updated in Google Sheets', 'success');
    } catch(e:any) {showToast(e?.message || 'Leave update failed','error');}

  };

  // Staff Save & Delete
  const handleSaveUser = async (userData: User) => {
    const actor = currentUserRef.current;
    if (!actor || actor.type !== 'Admin') throw new Error('Admin permission required to edit BA List');
    // The spreadsheet is authoritative. Never announce success based on local state.
    await checkBAListApiVersion();
    await saveBAUserToSheet(userData, actor.id, actor.password || '');
    let refreshed = await syncUsersFromSheet();
    for (let attempt = 0; attempt < 4; attempt++) {
      const match = refreshed.data?.find(u => u.id.trim().toUpperCase() === userData.id.trim().toUpperCase());
      if (refreshed.success && match && match.location.trim() === userData.location.trim()) break;
      await new Promise(resolve => setTimeout(resolve, 750));
      refreshed = await syncUsersFromSheet();
    }
    if (!refreshed.success || !refreshed.data) {
      throw new Error('Cannot read updated BA List. Check Apps Script deployment and permissions.');
    }
    const actual = refreshed.data.find(u => u.id.trim().toUpperCase() === userData.id.trim().toUpperCase());
    const equal = (x: unknown, y: unknown) => String(x ?? '').trim() === String(y ?? '').trim();
    if (!actual || !equal(actual.name,userData.name) || !equal(actual.location,userData.location)
      || !equal(actual.status,userData.status) || !equal(actual.type,userData.type)
      || !equal(actual.managerId,userData.managerId)
      || !equal(String(actual.startDate).slice(0,10),String(userData.startDate).slice(0,10))) {
      throw new Error('BA List update not confirmed by Google Sheets. Please check deployment / permissions.');
    }
    setUsers(refreshed.data);
    saveStoredUsers(refreshed.data);
    if (currentUserRef.current?.id === userData.id) {
      setCurrentUser(actual);
      saveCurrentSession(actual);
    }
    removeDeletedUserId(userData.id);
    showToast('បាន Update BA List ក្នុង Google Sheets', 'success');
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteUserFromSheet(userId);
      const updated = users.filter(u=>u.id!==userId);
      setUsers(updated); saveStoredUsers(updated);
      showToast('BA removed from Google Sheets', 'success');
    } catch(e:any) {showToast(e?.message || 'BA delete failed', 'error');}

  };

  // Bulk Import Users (from Excel / CSV / Clipboard)
  const handleBulkImportUsers = async (importedUsers: User[], syncToSheet: boolean) => {
    const userMap = new Map<string, User>();
    users.forEach(u => userMap.set(u.id.trim().toUpperCase(), u));

    importedUsers.forEach(u => {
      const existing = userMap.get(u.id.trim().toUpperCase());
      userMap.set(u.id.trim().toUpperCase(), {
        ...existing,
        ...u,
      });
      removeDeletedUserId(u.id.trim());
    });

    const mergedUsers = Array.from(userMap.values());
    setUsers(mergedUsers);
    saveStoredUsers(mergedUsers);

    if (currentUserRef.current) {
      const activeUser = currentUserRef.current;
      const updatedMe = mergedUsers.find(
        u => u.id.trim().toUpperCase() === activeUser.id.trim().toUpperCase()
      );
      if (updatedMe && currentUserRef.current) {
        setCurrentUser(updatedMe);
        saveCurrentSession(updatedMe);
      }
    }

    if (syncToSheet) {
      showToast('Import is local-only. Update BA List in Google Sheets for server changes.', 'info');
    }
  };

  // Open Map Picker helper
  const handleOpenMapPicker = (currentLoc: string, onPicked: (coords: string) => void) => {
    setMapInitialLoc(currentLoc || '11.556400,104.928200');
    setMapOnPickedCallback(() => onPicked);
    setMapPickerOpen(true);
  };

  // Submit multiple physical stock corrections under one shared approval batch.
  const handleSubmitStockBatch = async (changes: {productId: string; newStock: number}[], note: string) => {
    if (!currentUser || !changes.length) throw new Error('No stock changes to submit');
    if (changes.some(c => !Number.isSafeInteger(c.newStock) || c.newStock < 0 || !products.some(p => p.id === c.productId))) {
      throw new Error('ចំនួន Actual Stock មិនត្រឹមត្រូវ');
    }
    const batchId = `BATCH_${Date.now()}_${currentUser.id}`;
    const timestamp = new Date().toISOString();
    const records: StockInRecord[] = changes.map((c, index) => {
      const product = products.find(p => p.id === c.productId)!;
      return {id: `${batchId}_${index}`, batchId, date: timestamp.slice(0,10), timestamp,
        productCode: product.productCode, productName: product.name,
        addedQty: c.newStock - (product.stockQty || 0), previousStock: product.stockQty || 0,
        newStock: c.newStock, baId: currentUser.id, requestedById: currentUser.id,
        requestedBy: currentUser.name, updatedBy: currentUser.id, status: 'Pending',
        type: 'Adjustment', note};
    });
    const all = [...records, ...stockInRecords];
    setStockInRecords(all);
    saveStoredStockInRecords(all);
    showToast(`បានស្នើ Approval ${changes.length} SKU ក្នុង Batch តែមួយ`, 'success');
  };

  // Stock Count UI records direct Stock In movements (no approval required).
  // Server validates each SKU and confirms each idempotent transaction before success.
  const handleSubmitStockInBatch = async (changes: {productId: string; qty: number; transactionId: string}[], note: string) => {
    if (!currentUser || !changes.length) throw new Error('Stock In data missing');
    for (const change of changes) {
      const product = products.find(p => p.id === change.productId);
      if (!product || !Number.isSafeInteger(change.qty) || change.qty <= 0 || !change.transactionId) {
        throw new Error('Invalid SKU or Stock In quantity');
      }
      const now = new Date().toISOString();
      const record: StockInRecord = {
        id: change.transactionId, date: now.slice(0, 10), timestamp: now,
        productCode: product.productCode, productName: product.name,
        addedQty: change.qty, previousStock: product.stockQty || 0,
        newStock: (product.stockQty || 0) + change.qty,
        baId: currentUser.id, updatedBy: currentUser.id,
        requestedById: currentUser.id, requestedBy: currentUser.name,
        status: 'Approved', type: 'Stock In', note,
      } as StockInRecord;
      const result = await postStockInTransactionToSheet(record);
      if (!result.success) throw new Error(`Stock In ${product.productCode}: ${result.error || 'Google Sheets did not confirm save'}`);
    }
    await handleSyncAll(false);
  };

  // Sales Order & Stock Handlers
  const handleSubmitSalesOrder = async (
    order: SalesOrder
  ): Promise<{ success: boolean; error?: string }> => {
    // Validate against real + demo stock. Any demo-dependent sale stays local only.
    const usesDemo = !order.isNoSales && order.items.some(item => {
      const p = products.find(p => p.productCode.toUpperCase() === item.productCode.toUpperCase());
      return !!p && item.quantity > (p.stockQty || 0);
    });
    // Validate in the parent at commit time, not only in quantity controls.
    if (!order.isNoSales) {
      for (const item of order.items) {
        const product = products.find(p => p.productCode.toUpperCase() === item.productCode.toUpperCase());
        if (!product || !Number.isInteger(item.quantity) || item.quantity <= 0 || item.quantity > ((product.stockQty || 0) + (product.demoStockQty || 0))) {
          return { success: false, error: `ស្តុកមិនគ្រប់សម្រាប់ ${item.productName} (មាន ${(product?.stockQty || 0) + (product?.demoStockQty || 0)})` };
        }
      }
    }
    if (!usesDemo) {
      const result = await postSalesOrdersToSheet(order);
      if (!result.success) return result;
    }
    const updatedOrders = [order, ...salesOrders];
    setSalesOrders(updatedOrders);
    saveStoredSalesOrders(updatedOrders);
    if (!order.isNoSales && order.items.length > 0) {
      const updatedProducts = products.map(p => {
        const qty = order.items.filter(i => i.productCode.toUpperCase() === p.productCode.toUpperCase())
          .reduce((sum, i) => sum + i.quantity, 0);
        return qty ? (usesDemo
          ? {...p, demoStockQty: Math.max(0, (p.demoStockQty || 0) - qty)}
          : {...p, stockQty: p.stockQty - qty, totalSold: (p.totalSold || 0) + qty}) : p;
      });
      setProducts(updatedProducts);
      saveStoredProducts(updatedProducts);
      // Global Product List balances must not be overwritten by a BA's individual sales.
    }
    if (usesDemo) {
      showToast('Demo Sale បានរក្សាទុកក្នុង App ប៉ុណ្ណោះ មិនបានផ្ញើទៅ Google Sheets', 'info');
      return {success: true};
    }
    if (!usesDemo) await handleSyncAll(false);
    return {success:true};
  };

  // Stock In is applied immediately and never sends a Stock In report.
  // Physical stock corrections remain Pending until Admin/Manager approval.
  const handleRequestStockAdjustment = async (
    productId: string,
    addedQty: number,
    type: StockAdjustmentType = 'Stock In',
    note?: string
  ) => {
    const targetProduct = products.find(p => p.id === productId);
    if (!targetProduct || !Number.isInteger(addedQty) || !Number.isFinite(addedQty)) return;
    const prevStock = targetProduct.stockQty || 0;
    const newStock = prevStock + addedQty;
    if (newStock < 0 || (type === 'Stock In' && addedQty <= 0) || (type !== 'Adjustment' && addedQty === 0)) {
      showToast('ចំនួនស្តុកមិនត្រឹមត្រូវ', 'error');
      return;
    }
    const activeBaId = currentUser?.id || 'BA00001';
    const record: StockInRecord = {
      id: `STK_ADJ_${Date.now()}`, date: new Date().toISOString().split('T')[0],
      timestamp: new Date().toISOString(), productCode: targetProduct.productCode,
      productName: targetProduct.name, addedQty, previousStock: prevStock,
      newStock, baId: activeBaId, requestedById: activeBaId,
      requestedBy: currentUser?.name || 'Staff', updatedBy: activeBaId,
      status: type === 'Stock In' ? 'Approved' : 'Pending', type, note: note || '',
      ...(type === 'Stock In' ? { approvedBy: 'Auto (Stock In)', approvedAt: new Date().toISOString() } : {}),
    };
    const records = [record, ...stockInRecords];
    setStockInRecords(records);
    saveStoredStockInRecords(records);
    if (type === 'Stock In') {
      const updatedProducts = products.map(p => p.id === productId
        ? { ...p, stockQty: (p.stockQty || 0) + addedQty }
        : p);
      setProducts(updatedProducts);
      saveStoredProducts(updatedProducts);
      // Apply Stock In without approval, but only after Google Sheets confirms receipt.
      const sent = await postStockInTransactionToSheet(record);
      if (!sent.success) {
        setStockInRecords(stockInRecords);
        saveStoredStockInRecords(stockInRecords);
        setProducts(products);
        saveStoredProducts(products);
        showToast(`Stock In មិនបានរក្សាទុកក្នុង Google Sheets: ${sent.error || 'Unknown error'}`, 'error');
        throw new Error(sent.error || 'Stock In submit not verified');
      }
      await handleSyncAll(false);
      showToast(`បានបន្ថែម Stock In ${addedQty} ដោយមិនចាំបាច់ Approval`, 'success');
    } else {
      showToast(`បានផ្ញើសំណើកែ Actual Stock (${prevStock} → ${newStock}) រង់ចាំ Approval`, 'info');
    }
  };

  // 2. "ហើយ Admin និង Manager ជាអ្នក Approval រួចហើយបានផ្ញើ Report stock in ទៅ Google sheet"
  const handleApproveStockAdjustment = async (recordId: string) => {
    if (!currentUser || (currentUser.type !== 'Admin' && currentUser.type !== 'Manager')) {
      showToast('សិទ្ធិអនុម័ត (Approval) គឺសម្រាប់តែ Admin និង Manager ប៉ុណ្ណោះ!', 'error');
      return;
    }

    const targetRecord = stockInRecords.find(r => r.id === recordId);
    if (!targetRecord || targetRecord.status !== 'Pending') return;
    const pendingGroup = stockInRecords.filter(r => r.status === 'Pending' &&
      (targetRecord.batchId ? r.batchId === targetRecord.batchId : r.id === recordId));
    if (pendingGroup.some(r => !products.some(p => p.productCode.toUpperCase() === r.productCode.toUpperCase()))) {
      showToast('រកមិនឃើញ SKU ក្នុង Batch', 'error'); return;
    }
    const approvedAt = new Date().toISOString();
    const approved = pendingGroup.map(r => ({...r, status:'Approved' as const,
      approvedBy: currentUser.name, approvedById: currentUser.id, approvedAt}));
    const approvedMap = new Map(approved.map(r => [r.id, r]));
    const updatedProducts = products.map(p => {
      const r = pendingGroup.find(x => x.productCode.toUpperCase() === p.productCode.toUpperCase());
      if (!r) return p;
      const finalStock = r.type === 'Adjustment' ? r.newStock : (p.stockQty || 0) + r.addedQty;
      return {...p, stockQty: Math.max(0, finalStock)};
    });
    const updatedRecords = stockInRecords.map(r => approvedMap.get(r.id) || r);
    setProducts(updatedProducts);
    saveStoredProducts(updatedProducts);
    setStockInRecords(updatedRecords);
    saveStoredStockInRecords(updatedRecords);
    try {
      for (const r of approved) if (r.type !== 'Stock In') await postStockInTransactionToSheet(r);
      await postProductListToSheet(updatedProducts, currentUser.name);
      showToast(`Approved ${approved.length} SKU និងបានផ្ញើទៅ Google Sheets`, 'success');
    } catch (e) {
      console.error('Sync failed after approval:', e);
      showToast('Approved ក្នុង App ប៉ុន្តែ Google Sheets Sync បរាជ័យ។ សូមពិនិត្យឡើងវិញ', 'error');
    }
  };

  // 3. Reject stock adjustment
  const handleRejectStockAdjustment = async (recordId: string, reason?: string) => {
    if (!currentUser || (currentUser.type !== 'Admin' && currentUser.type !== 'Manager')) {
      showToast('សិទ្ធិបដិសេធគឺសម្រាប់តែ Admin និង Manager ប៉ុណ្ណោះ!', 'error');
      return;
    }

    const targetRecord = stockInRecords.find(r => r.id === recordId);
    if (!targetRecord || targetRecord.status !== 'Pending') return;

    const rejectedRecord: StockInRecord = {
      ...targetRecord,
      status: 'Rejected',
      approvedBy: currentUser.name,
      approvedAt: new Date().toISOString(),
      rejectedReason: reason || `បដិសេធដោយ ${currentUser.name}`,
    };

    const updatedRecords = stockInRecords.map(r => (r.id === recordId ? rejectedRecord : r));
    setStockInRecords(updatedRecords);
    saveStoredStockInRecords(updatedRecords);

    showToast(`បានបដិសេធ (Rejected) សំណើកែសម្រួលស្តុក`, 'info');
  };

  const handleSaveProduct = async (productData: Product) => {
    const exists = products.some(p => p.id === productData.id);
    let updated: Product[];
    if (exists) {
      updated = products.map(p => (p.id === productData.id ? productData : p));
    } else {
      updated = [productData, ...products];
    }
    if (exists) {
      const oldProduct = products.find(p => p.id === productData.id)!;
      if (oldProduct.stockQty !== productData.stockQty) {
        showToast('សូមកែ Actual Stock តាមប្រអប់ស្តុក ដើម្បីស្នើ Approval ជាមុន', 'error');
        return;
      }
    }
    setProducts(updated);
    saveStoredProducts(updated);
    await postProductListToSheet(updated, currentUser?.name || 'Admin');
  };

  const handleBulkSaveProducts = async (newProducts: Product[]) => {
    const newCodes = new Set(newProducts.map(p => p.productCode.toUpperCase()));
    // Replace if exists, or append
    const remainingOld = products.filter(p => !newCodes.has(p.productCode.toUpperCase()));
    const updated = [...newProducts, ...remainingOld];
    setProducts(updated);
    saveStoredProducts(updated);

    // Sync to Google Sheet (Sheet: Product List)
    await postProductListToSheet(updated, currentUser?.name || 'Admin');
  };

  const handleDeleteProduct = async (productId: string) => {
    const targetProduct = products.find(p => p.id === productId);
    const updated = products.filter(p => p.id !== productId);
    setProducts(updated);
    saveStoredProducts(updated);
    showToast(
      `បានលុបទំនិញ ${targetProduct ? targetProduct.productCode : ''} ដោយជោគជ័យ!`,
      'success'
    );
    // Sync to Google Sheet (Sheet: Product List)
    await postProductListToSheet(updated, currentUser?.name || 'Admin');
  };

  const handleSyncProductListToSheetAction = async () => {
    const res = await postProductListToSheet(products, currentUser?.name || 'Admin');
    if (!res.success) {
      throw new Error(res.error || 'Failed to sync product list');
    }
  };

  const handleSyncStockReportToSheet = async () => {
    const res = await postStockSummaryToSheet(products, currentUser?.name || 'Admin');
    if (!res.success) {
      throw new Error(res.error || 'Failed to sync stock report');
    }
  };

  // Computed summary stats
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const myMonthlyAttendance = attendance.filter(a => {
    if (!currentUser) return false;
    const aUserId = (a.userId || '').trim().toUpperCase();
    const myId = currentUser.id.trim().toUpperCase();

    if (currentUser.type === 'BA Staff') {
      if (aUserId !== myId) return false;
    } else if (currentUser.type === 'Manager') {
      const isSelf = aUserId === myId;
      const targetUser = users.find(u => u.id.trim().toUpperCase() === aUserId);
      const isSub = targetUser && isUserUnderManager(currentUser, targetUser);
      if (!isSelf && !isSub) return false;
    }

    const d = new Date(a.timestamp);
    if (isNaN(d.getTime())) return true;
    return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
  });

  const checkInsCount = myMonthlyAttendance.filter(a => a.action === 'IN' || !!a.checkIn).length;
  const checkOutsCount = myMonthlyAttendance.filter(a => a.action === 'OUT' || !!a.checkOut).length;

  const relevantLeaves = leaves.filter(l => {
    if (!currentUser) return false;
    const lUserId = (l.userId || '').trim().toUpperCase();
    const myId = currentUser.id.trim().toUpperCase();

    if (currentUser.type === 'BA Staff') {
      if (lUserId !== myId) return false;
    } else if (currentUser.type === 'Manager') {
      const isSelf = lUserId === myId;
      const targetUser = users.find(u => u.id.trim().toUpperCase() === lUserId);
      const isSub = targetUser && isUserUnderManager(currentUser, targetUser);
      if (!isSelf && !isSub) return false;
    }
    return true;
  });

  // Exclude Off (ថ្ងៃសម្រាក) from actual leave count
  const actualLeaves = relevantLeaves.filter(l => l.type !== 'Off');
  const totalLeavesCount = actualLeaves.length;
  const pendingLeavesCount = relevantLeaves.filter(l => l.status === 'Pending').length;
  // Approvals only: BA's own leave is not an approval item for the same Manager.
  const pendingApprovalLeaves = currentUser && (currentUser.type === 'Admin' || currentUser.type === 'Manager')
    ? Array.from(new Map(leaves.filter(l => {
        if (l.status !== 'Pending') return false;
        if (currentUser.type === 'Admin') return true;
        if ((l.userId || '').trim().toUpperCase() === currentUser.id.trim().toUpperCase()) return false;
        const ba = users.find(u => u.id.trim().toUpperCase() === (l.userId || '').trim().toUpperCase());
        return !!ba && isUserUnderManager(currentUser, ba);
      }).map(l => [l.id, l] as const)).values())
    : [];


  // Filter today's records for current user
  const todayDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}`;

  const todayRecords = attendance.filter(a => {
    if (a.userId !== currentUser?.id || !a.timestamp) return false;
    const ymd = formatDateToYMD(a.timestamp);
    return ymd === todayDateStr || (typeof a.timestamp === 'string' && a.timestamp.includes(todayDateStr));
  });

  // Computed summary stats for Sales & Stock
  const totalSalesRevenue = salesOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const totalSalesUnits = salesOrders.reduce((sum, o) => sum + (o.totalQty || 0), 0);
  const totalStockBalance = products.reduce((sum, p) => sum + (p.stockQty || 0), 0);
  const lowStockCount = products.filter(p => (p.stockQty || 0) <= (p.minAlertQty || 5)).length;

  return (
    <div className="bg-gradient-to-br from-slate-50 via-indigo-50/25 to-slate-100 font-sans text-slate-800 antialiased min-h-screen flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Navigation Bar */}
      <Navbar
        currentUser={currentUser}
        isSyncing={isSyncing}
        onSync={() => handleSyncAll(true)}
        onLogout={handleLogout}
        canInstall={canInstall}
        isInstalled={isInstalled}
        onInstall={handleInstallApp}
        onOpenProfileModal={() => setProfileModalOpen(true)}
        onOpenMainMenu={() => setSidebarMobileOpen(true)}
        pendingLeaveRequests={pendingApprovalLeaves}
        onOpenPendingLeaves={() => { setMainModule('attendance'); setAttendanceTab('leave'); setSidebarMobileOpen(false); }}
      />

      {currentUser && <AppSidebar
        currentUser={currentUser}
        activePage={mainModule === 'attendance' ? (attendanceTab === 'report' ? 'overview' : attendanceTab === 'attendance' ? 'attendance' : attendanceTab === 'leave' ? 'leave' : attendanceTab === 'staff' ? 'staff' : 'history') : salesStockTab}
        onNavigate={page => {
          if (page === 'overview' || page === 'attendance' || page === 'leave' || page === 'staff' || page === 'history') {
            setMainModule('attendance');
            setAttendanceTab(page === 'attendance' ? 'attendance' : page === 'leave' ? 'leave' : page === 'staff' ? 'staff' : page === 'history' ? 'history' : 'report');
          } else {
            setMainModule('sales_stock');
            setSalesStockTab(page);
          }
        }}
        collapsed={sidebarCollapsed}
        onCollapse={() => setSidebarCollapsed(v => !v)}
        mobileOpen={sidebarMobileOpen}
        onMobileClose={() => setSidebarMobileOpen(false)}
        onOpenMobile={() => setSidebarMobileOpen(true)}
        onSync={() => handleSyncAll(true)}
        onProfile={() => setProfileModalOpen(true)}
        onLogout={handleLogout}
        isSyncing={isSyncing}
      />}
      {/* Main Container */}
      {!currentUser ? (
        <AuthView
          users={users}
          onLogin={handleLogin}
          onShowToast={showToast}
        />
      ) : (
        <main className={`flex-grow w-full px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6 transition-[padding] duration-200 ${sidebarCollapsed ? 'lg:pl-[100px]' : 'lg:pl-[284px]'}`}>
          {/* ========================================================= */}
          {/* LAYOUT 1: ATTENDANCE (វត្តមាន និងការគ្រប់គ្រងបុគ្គលិក) */}
          {/* ========================================================= */}
          {mainModule === 'attendance' && (
            <div className="space-y-4 sm:space-y-6">
              {attendanceTab === 'report' && (
                <div className="space-y-6">
                  <BAMonthlyCombinedReport currentUser={currentUser} users={users} attendance={attendance} leaves={leaves} salesOrders={salesOrders} stockInRecords={stockInRecords} />
                </div>
              )}

              {attendanceTab === 'attendance' && (
                <div className="space-y-4 sm:space-y-6">
                  <div className="rounded-2xl bg-white border border-slate-200 p-4">
                    <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2"><Calendar className="h-5 w-5 text-pink-600"/>Attendance / វត្តមាន</h2>
                    <p className="text-xs text-slate-500 mt-1">ចុះវត្តមាន Check-In / Check-Out ផ្ទៀងផ្ទាត់ទីតាំង GPS</p>
                  </div>
                  <CheckInPanel
                    currentUser={currentUser}
                    todayRecords={todayRecords}
                    gpsTestMode={gpsTestMode}
                    onPerformCheckIn={handlePerformCheckIn}
                    onShowToast={showToast}
                  />
                </div>
              )}

              {attendanceTab === 'leave' && (
                <div className="space-y-4 sm:space-y-6">
                  <LeaveButtonsBar
                    onSelectType={type => {
                      setActiveLeaveType(type);
                      setLeaveModalOpen(true);
                    }}
                  />
                  <LeaveRequestsView
                    currentUser={currentUser}
                    users={users}
                    leaves={leaves}
                    onApprove={handleApproveLeave}
                    onReject={handleRejectLeave}
                    onOpenNewLeave={() => setLeaveModalOpen(true)}
                  />
                </div>
              )}

              {attendanceTab === 'staff' && (
                <StaffManagementView
                  currentUser={currentUser}
                  users={users}
                  onOpenAddModal={() => {
                    setUserToEdit(null);
                    setUserModalOpen(true);
                  }}
                  onOpenEditModal={user => {
                    setUserToEdit(user);
                    setUserModalOpen(true);
                  }}
                  onDeleteUser={handleDeleteUser}
                  onOpenMapPicker={handleOpenMapPicker}
                  onOpenUploadModal={() => setUploadUsersModalOpen(true)}
                />
              )}

              {attendanceTab === 'history' && (
                <AttendanceHistoryView
                  currentUser={currentUser}
                  users={users}
                  attendance={attendance}
                  onShowToast={showToast}
                />
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* LAYOUT 2: SALE ORDER & STOCK (ការលក់ និងស្ដុកទំនិញ) */}
          {/* ========================================================= */}
          {mainModule === 'sales_stock' && (
            <div className="space-y-4 sm:space-y-6">
              {/* Sales & Stock KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-white/95 backdrop-blur-xl p-4 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-3 transition-all hover:shadow-md">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
                    <ShoppingCart className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-500 font-semibold">ចំណូលលក់សរុប</p>
                    <h4 className="text-lg sm:text-xl font-extrabold text-emerald-600">
                      ${totalSalesRevenue.toFixed(2)}
                    </h4>
                  </div>
                </div>

                <div className="bg-white/95 backdrop-blur-xl p-4 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-3 transition-all hover:shadow-md">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-500 font-semibold">បរិមាណលក់សរុប</p>
                    <h4 className="text-lg sm:text-xl font-extrabold text-blue-600">
                      {totalSalesUnits} ប្រអប់
                    </h4>
                  </div>
                </div>

                <div className="bg-white/95 backdrop-blur-xl p-4 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-3 transition-all hover:shadow-md">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-500 font-semibold">ស្តុកនៅសល់ជាក់ស្ដែង</p>
                    <h4 className="text-lg sm:text-xl font-extrabold text-indigo-600">
                      {totalStockBalance} ប្រអប់
                    </h4>
                  </div>
                </div>

                <div className="bg-white/95 backdrop-blur-xl p-4 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-3 transition-all hover:shadow-md">
                  <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-500 font-semibold">ទំនិញជិតអស់</p>
                    <h4 className="text-lg sm:text-xl font-extrabold text-amber-700">
                      {lowStockCount} មុខ
                    </h4>
                  </div>
                </div>
              </div>

              {/* Sales & Stock Sub-Tab Bar - Matching Google Spreadsheet "BA Control" sheets */}
              <div className="hidden">
                <div className="flex items-center gap-1.5 w-full sm:w-auto">
                  <button
                    onClick={() => setSalesStockTab('sales')}
                    className={`flex-1 sm:flex-initial px-3.5 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shrink-0 ${
                      salesStockTab === 'sales'
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>១. កត់ត្រាការលក់ (Sale Out)</span>
                  </button>

                  <button
                    onClick={() => setSalesStockTab('stock')}
                    className={`flex-1 sm:flex-initial px-3.5 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shrink-0 ${
                      salesStockTab === 'stock'
                        ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md shadow-teal-500/20'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Package className="w-4 h-4" />
                    <span>២. គ្រប់គ្រងស្ដុក (Stock In)</span>
                  </button>

                  <button
                    onClick={() => setSalesStockTab('products')}
                    className={`flex-1 sm:flex-initial px-3.5 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shrink-0 ${
                      salesStockTab === 'products'
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-md shadow-emerald-500/20'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Package className="w-4 h-4" />
                    <span>៣. បញ្ជីទំនិញ &amp; Form Upload (Product List)</span>
                    {currentUser.type === 'Admin' && (
                      <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-md font-extrabold hidden sm:inline">
                        Admin
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Sales & Stock Active Views */}
              {salesStockTab === 'sales' && (
                <SalesOrderView
                  currentUser={currentUser}
                  users={users}
                  products={products}
                  salesOrders={salesOrders}
                  onSubmitSalesOrder={handleSubmitSalesOrder}
                  onSyncSummaryToSheet={handleSyncStockReportToSheet}
                  onShowToast={showToast}
                />
              )}

              {salesStockTab === 'stock' && (
                <StockManagementView
                  mode="inventory"
                  submittedStock={submittedStock}
                  submittedAt={submittedAt}
                  currentUser={currentUser}
                  products={products}
                  stockInRecords={stockInRecords}
                  onRequestStockAdjustment={handleRequestStockAdjustment}
                  onSubmitStockBatch={handleSubmitStockBatch}
                  onApproveStockAdjustment={handleApproveStockAdjustment}
                  onRejectStockAdjustment={handleRejectStockAdjustment}
                  onSaveProduct={handleSaveProduct}
                  onSyncStockReportToSheet={handleSyncStockReportToSheet}
                  onShowToast={showToast}
                />
              )}

              {salesStockTab === 'adjustment' && (
                <StockAdjustmentTool currentUser={currentUser} products={products} onSubmitStockInBatch={handleSubmitStockInBatch} onShowToast={showToast} />
              )}

              {salesStockTab === 'products' && (
                <ProductItemsView
                  currentUser={currentUser}
                  products={products}
                  onSaveProduct={handleSaveProduct}
                  onBulkSaveProducts={handleBulkSaveProducts}
                  onDeleteProduct={handleDeleteProduct}
                  onSyncProductListToSheet={handleSyncProductListToSheetAction}
                  onShowToast={showToast}
                />
              )}
            </div>
          )}
        </main>
      )}

      {/* Footer */}
      <footer className="mt-8 border-t border-slate-200/80 bg-white/70 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} BA Program Enterprise - ប្រព័ន្ធគ្រប់គ្រងស្ដង់ដារបុគ្គលិក BA</p>
          <p className="text-[11px] text-slate-400">
            ដំណើរការរលូន និងមានសុវត្ថិភាពខ្ពស់ • គាំទ្រ Google Sheets &amp; GPS Validation
          </p>
        </div>
      </footer>

      {/* Modals */}
      <LeaveModal
        isOpen={leaveModalOpen}
        initialType={activeLeaveType}
        onClose={() => setLeaveModalOpen(false)}
        onSubmit={handleLeaveSubmit}
      />

      <UserModal
        isOpen={userModalOpen}
        userToEdit={userToEdit}
        onClose={() => setUserModalOpen(false)}
        onSave={handleSaveUser}
        onOpenMapPicker={handleOpenMapPicker}
        onShowToast={showToast}
      />

      <MapPickerModal
        isOpen={mapPickerOpen}
        initialLocation={mapInitialLoc}
        onClose={() => setMapPickerOpen(false)}
        onConfirm={coords => {
          if (mapOnPickedCallback) {
            mapOnPickedCallback(coords);
          }
        }}
      />

      <ProfileModal
        isOpen={profileModalOpen}
        currentUser={currentUser}
        onClose={() => setProfileModalOpen(false)}
        onUpdateAvatar={handleUpdateAvatar}
        onChangePassword={handleChangePassword}
        onShowToast={showToast}
      />

      <UploadUsersModal
        isOpen={uploadUsersModalOpen}
        existingUsers={users}
        onClose={() => setUploadUsersModalOpen(false)}
        onImport={handleBulkImportUsers}
        onShowToast={showToast}
      />
    </div>
  );
}
