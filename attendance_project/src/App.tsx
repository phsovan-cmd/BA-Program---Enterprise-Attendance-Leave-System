/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { User, LeaveRequest, AttendanceRecord, LeaveType, Product, SalesOrder, SalesOrderItem, StockInRecord, StockAdjustmentType } from './types';
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
  syncLeavesFromSheet,
  syncAttendanceFromSheet,
  postToGoogleSheet,
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
  getStoredStockInRecords,
  saveStoredStockInRecords,
  syncDailySaleOutMatrixToSheet,
  syncDailyStockInMatrixToSheet,
} from './services/api';
import { formatDateToYMD } from './utils/date';
import { Navbar } from './components/Navbar';
import { AuthView } from './components/AuthView';
import { CheckInPanel } from './components/CheckInPanel';
import { LeaveButtonsBar } from './components/LeaveButtonsBar';
import { LeaveModal } from './components/LeaveModal';
import { UserModal } from './components/UserModal';
import { MapPickerModal } from './components/MapPickerModal';
import { MonthlyReportView } from './components/MonthlyReportView';
import { StaffManagementView } from './components/StaffManagementView';
import { LeaveRequestsView } from './components/LeaveRequestsView';
import { ProfileModal } from './components/ProfileModal';
import { UploadUsersModal } from './components/UploadUsersModal';
import { ToastContainer, ToastMessage } from './components/ToastContainer';
import { AttendanceHistoryView, isUserUnderManager } from './components/AttendanceHistoryView';
import { SalesOrderView } from './components/SalesOrderView';
import { StockManagementView } from './components/StockManagementView';
import { ProductItemsView } from './components/ProductItemsView';
import {
  LogIn,
  LogOut,
  FileText,
  Clock,
  Info,
  Calendar,
  Users,
  History,
  MapPin,
  CheckCircle,
  ShoppingCart,
  Package,
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
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  // UI States: Separated Layout Modules (1. Attendance vs 2. Sale Order & Stock)
  const [mainModule, setMainModule] = useState<'attendance' | 'sales_stock'>('attendance');
  const [attendanceTab, setAttendanceTab] = useState<'report' | 'leave' | 'staff' | 'history'>('report');
  const [salesStockTab, setSalesStockTab] = useState<'sales' | 'stock' | 'products'>('sales');
  const [isSyncing, setIsSyncing] = useState(false);
  const [gpsTestMode, setGpsTestMode] = useState<boolean>(getGpsTestMode);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // PWA install prompt
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [canInstall, setCanInstall] = useState(false);

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
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        showToast('កម្មវិធីត្រូវបានដំឡើងរួចរាល់!', 'success');
      }
      setDeferredPrompt(null);
      setCanInstall(false);
    }
  };

  // Background Auto-Update: Every 10s, on window focus, and on visibility change
  useEffect(() => {
    // Initial fetch
    handleSyncAll(false);

    // Auto update every 10 seconds silently
    const timer = setInterval(() => {
      handleSyncAll(false);
    }, 10000);

    // Auto update when window regains focus or tab becomes visible
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleSyncAll(false);
      }
    };
    const onFocus = () => {
      handleSyncAll(false);
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  // Auto-sync whenever switching modules or tabs inside the app
  useEffect(() => {
    handleSyncAll(false);
  }, [mainModule, attendanceTab, salesStockTab]);

  const handleSyncAll = async (showFeedback = false) => {
    try {
      setIsSyncing(true);
      if (showFeedback) showToast('កំពុងទាញយកទិន្នន័យពី Google Sheet...', 'info');

      const [resUsers, resLeaves, resAttendance, resProducts] = await Promise.all([
        syncUsersFromSheet(),
        syncLeavesFromSheet(),
        syncAttendanceFromSheet(),
        syncProductsFromSheet(),
      ]);

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
      if (resProducts && resProducts.success && resProducts.data && resProducts.data.length > 0) {
        setProducts(resProducts.data);
      }

      if (showFeedback) {
        showToast('បានធ្វើបច្ចុប្បន្នភាពទិន្នន័យពី Google Sheet ជោគជ័យ!', 'success');
      }
    } catch (e: any) {
      if (showFeedback) {
        showToast('មិនអាចភ្ជាប់ Google Sheet (កំពុងប្រើ Offline Data)', 'info');
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // Auth Handlers
  const handleLogin = async (id: string, pass: string): Promise<boolean> => {
    let currentUsers = users;
    let found = currentUsers.find(
      u => u.id.trim().toLowerCase() === id.trim().toLowerCase() && u.password === pass
    );

    if (!found) {
      // Direct live check from Google Sheet
      const res = await syncUsersFromSheet();
      if (res.success && res.data) {
        setUsers(res.data);
        currentUsers = res.data;
        found = currentUsers.find(
          u => u.id.trim().toLowerCase() === id.trim().toLowerCase() && u.password === pass
        );
      }
    }

    if (found) {
      currentUserRef.current = found;
      setCurrentUser(found);
      saveCurrentSession(found);
      showToast(`សូមស្វាគមន៍ ${found.name}! ចូលប្រព័ន្ធជោគជ័យ`, 'success');
      return true;
    }
    return false;
  };

  const handleRegister = async (newUser: User) => {
    const updated = [...users, newUser];
    setUsers(updated);
    saveStoredUsers(updated);

    // Background push to sheet
    postToGoogleSheet({ type: 'user_action', user: newUser });
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

    const updated = [...attendance, newRecord];
    setAttendance(updated);
    saveStoredAttendance(updated);

    // Sync to Google Sheet and auto update state
    postToGoogleSheet({
      type: 'attendance',
      timestamp: newRecord.timestamp,
      userId: currentUser.id,
      userName: currentUser.name,
      userType: currentUser.type,
      action: action,
      details: newRecord.details,
      location: currentUser.location || '-',
      distanceMeters: Math.round(distanceMeters),
    });
    setTimeout(() => handleSyncAll(false), 1200);
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

    postToGoogleSheet({ type: 'sync_users', user: updatedUser });
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

    postToGoogleSheet({ type: 'sync_users', user: updatedUser });
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

    const updated = [...leaves, newLeave];
    setLeaves(updated);
    saveStoredLeaves(updated);

    showToast('សំណើច្បាប់ត្រូវបានបញ្ជូនជោគជ័យ!', 'success');
    setMainModule('attendance');
    setAttendanceTab('leave');

    postToGoogleSheet({ type: 'leave_request', leave: newLeave });
    setTimeout(() => handleSyncAll(false), 1200);
  };

  // Leave Approve / Reject
  const handleApproveLeave = async (leaveId: string) => {
    const target = leaves.find(l => l.id === leaveId);
    if (!target) return;

    const updatedLeave = { ...target, status: 'Approved' as const };
    const updated = leaves.map(l => (l.id === leaveId ? updatedLeave : l));
    setLeaves(updated);
    saveStoredLeaves(updated);
    showToast(`បានអនុម័ត (Approved) សំណើច្បាប់របស់ ${target.userName}!`, 'success');

    postToGoogleSheet({ type: 'leave_action', leave: updatedLeave });
    setTimeout(() => handleSyncAll(false), 1200);
  };

  const handleRejectLeave = async (leaveId: string) => {
    const target = leaves.find(l => l.id === leaveId);
    if (!target) return;

    const updatedLeave = { ...target, status: 'Rejected' as const };
    const updated = leaves.map(l => (l.id === leaveId ? updatedLeave : l));
    setLeaves(updated);
    saveStoredLeaves(updated);
    showToast(`បានបដិសេធ (Rejected) សំណើច្បាប់`, 'info');

    postToGoogleSheet({ type: 'leave_action', leave: updatedLeave });
    setTimeout(() => handleSyncAll(false), 1200);
  };

  // Staff Save & Delete
  const handleSaveUser = async (userData: User) => {
    const exists = users.some(u => u.id === userData.id);
    let updated: User[];
    if (exists) {
      updated = users.map(u => (u.id === userData.id ? userData : u));
    } else {
      updated = [...users, userData];
    }

    setUsers(updated);
    saveStoredUsers(updated);

    if (currentUserRef.current && currentUserRef.current.id === userData.id) {
      setCurrentUser(userData);
      saveCurrentSession(userData);
    }

    showToast('រក្សាទុកព័ត៌មានបុគ្គលិកបានជោគជ័យ!', 'success');
    removeDeletedUserId(userData.id);
    postToGoogleSheet({ type: 'sync_users', user: userData });
  };

  const handleDeleteUser = async (userId: string) => {
    const updated = users.filter(u => u.id !== userId);
    setUsers(updated);
    saveStoredUsers(updated);
    showToast('បានលុបទិន្នន័យបុគ្គលិកជោគជ័យ!', 'success');

    await deleteUserFromSheet(userId);
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
      // Send background updates to Google Sheet
      for (const u of importedUsers) {
        postToGoogleSheet({ type: 'sync_users', user: u });
      }
      setTimeout(() => handleSyncAll(false), 2000);
    }
  };

  // Open Map Picker helper
  const handleOpenMapPicker = (currentLoc: string, onPicked: (coords: string) => void) => {
    setMapInitialLoc(currentLoc || '11.556400,104.928200');
    setMapOnPickedCallback(() => onPicked);
    setMapPickerOpen(true);
  };

  // Sales Order & Stock Handlers
  const handleSubmitSalesOrder = async (
    order: SalesOrder
  ): Promise<{ success: boolean; error?: string }> => {
    // "ប្រសិនក្នុងថ្ងៃតែមួយ អោយចេញតែមួយ Row បានហើយ"
    // Find existing order on same date for same BA
    const existingIndex = salesOrders.findIndex(
      o => o.date === order.date && o.baId.trim().toUpperCase() === order.baId.trim().toUpperCase()
    );

    let consolidatedOrder: SalesOrder;
    let updatedOrders: SalesOrder[];

    if (existingIndex >= 0) {
      const existing = salesOrders[existingIndex];
      const mergedItemsMap = new Map<string, SalesOrderItem>();

      if (!existing.isNoSales && existing.items) {
        existing.items.forEach(it => {
          mergedItemsMap.set(it.productCode.toUpperCase(), { ...it });
        });
      }

      if (!order.isNoSales && order.items) {
        order.items.forEach(it => {
          const key = it.productCode.toUpperCase();
          const prev = mergedItemsMap.get(key);
          if (prev) {
            prev.quantity += it.quantity;
            prev.total += it.total;
          } else {
            mergedItemsMap.set(key, { ...it });
          }
        });
      }

      const mergedItems = Array.from(mergedItemsMap.values());
      const isNoSales = mergedItems.length === 0;
      const totalQty = mergedItems.reduce((sum, it) => sum + it.quantity, 0);
      const totalAmount = mergedItems.reduce((sum, it) => sum + it.total, 0);

      consolidatedOrder = {
        ...existing,
        timestamp: new Date().toISOString(),
        province: order.province || existing.province,
        baName: order.baName || existing.baName,
        isNoSales,
        items: mergedItems,
        totalItems: mergedItems.length,
        totalQty,
        totalAmount,
      };

      updatedOrders = [...salesOrders];
      updatedOrders[existingIndex] = consolidatedOrder;
    } else {
      consolidatedOrder = order;
      updatedOrders = [order, ...salesOrders];
    }

    // 1. Update local sales orders state & storage
    setSalesOrders(updatedOrders);
    saveStoredSalesOrders(updatedOrders);

    // 2. Automatically deduct ordered quantities from stock and update totalSold
    if (!order.isNoSales && order.items.length > 0) {
      const updatedProducts = products.map(p => {
        const itemSold = order.items.find(
          i => i.productCode.toUpperCase() === p.productCode.toUpperCase()
        );
        if (itemSold) {
          const newStock = Math.max(0, (p.stockQty || 0) - itemSold.quantity);
          const newSold = (p.totalSold || 0) + itemSold.quantity;
          return {
            ...p,
            stockQty: newStock,
            totalSold: newSold,
          };
        }
        return p;
      });
      setProducts(updatedProducts);
      saveStoredProducts(updatedProducts);
      // Keep Google Sheet "Product List" stock synchronized
      postProductListToSheet(updatedProducts, currentUser?.name || 'Admin');
    }

    // 3. Post to Google Sheet
    const res = await postSalesOrdersToSheet(consolidatedOrder);
    return res;
  };

  // Stock In & Adjustment Workflow:
  // 1. "សម្រាប់ ការថែម Stock មិនចាំបាច់ផ្ញើរទៅ Google sheet នោះទេ" -> Save as Pending, do not send to sheet
  const handleRequestStockAdjustment = async (
    productId: string,
    addedQty: number,
    type: StockAdjustmentType = 'Stock In',
    note?: string
  ) => {
    const targetProduct = products.find(p => p.id === productId);
    if (!targetProduct) return;

    const prevStock = targetProduct.stockQty || 0;
    const newStock = Math.max(0, prevStock + addedQty);
    const activeBaId = currentUser?.id || 'BA00001';
    const activeUserName = currentUser?.name || 'Staff';

    const newRecord: StockInRecord = {
      id: `STK_ADJ_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      timestamp: new Date().toISOString(),
      productCode: targetProduct.productCode,
      productName: targetProduct.name,
      addedQty,
      previousStock: prevStock,
      newStock,
      baId: activeBaId,
      requestedById: activeBaId,
      requestedBy: activeUserName,
      updatedBy: activeBaId, // "update by ID BA"
      status: 'Pending',
      type,
      note: note || '',
    };

    const updated = [newRecord, ...stockInRecords];
    setStockInRecords(updated);
    saveStoredStockInRecords(updated);

    showToast(
      `បានកត់ត្រាសំណើកែសម្រួលស្តុក (${addedQty > 0 ? '+' : ''}${addedQty} ${targetProduct.name}) ដោយ ID BA: ${activeBaId}! រង់ចាំ Admin ឬ Manager ពិនិត្យ Approval។`,
      'info'
    );
  };

  // 2. "ហើយ Admin និង Manager ជាអ្នក Approval រួចហើយបានផ្ញើ Report stock in ទៅ Google sheet"
  const handleApproveStockAdjustment = async (recordId: string) => {
    if (!currentUser || (currentUser.type !== 'Admin' && currentUser.type !== 'Manager')) {
      showToast('សិទ្ធិអនុម័ត (Approval) គឺសម្រាប់តែ Admin និង Manager ប៉ុណ្ណោះ!', 'error');
      return;
    }

    const targetRecord = stockInRecords.find(r => r.id === recordId);
    if (!targetRecord || targetRecord.status !== 'Pending') return;

    const requesterBaId =
      targetRecord.baId ||
      targetRecord.requestedById ||
      (targetRecord.updatedBy && targetRecord.updatedBy.startsWith('BA') ? targetRecord.updatedBy : '') ||
      currentUser.id;

    // 1. Calculate and update real product stock in inventory
    let updatedProducts = products;
    const targetProduct = products.find(
      p => p.productCode.toUpperCase() === targetRecord.productCode.toUpperCase()
    );

    if (targetProduct) {
      const finalStock = Math.max(0, (targetProduct.stockQty || 0) + targetRecord.addedQty);
      updatedProducts = products.map(p => {
        if (p.productCode.toUpperCase() === targetRecord.productCode.toUpperCase()) {
          return {
            ...p,
            stockQty: finalStock,
            stockIn: (p.stockIn || 0) + Math.max(0, targetRecord.addedQty),
          };
        }
        return p;
      });
      setProducts(updatedProducts);
      saveStoredProducts(updatedProducts);
    }

    // 2. Mark record as Approved
    const approvedRecord: StockInRecord = {
      ...targetRecord,
      baId: requesterBaId,
      updatedBy: requesterBaId, // Ensure column H "Updated By" in Google Sheet receives ID BA
      status: 'Approved',
      approvedBy: currentUser.name,
      approvedById: currentUser.id,
      approvedAt: new Date().toISOString(),
    };

    const updatedRecords = stockInRecords.map(r => (r.id === recordId ? approvedRecord : r));
    setStockInRecords(updatedRecords);
    saveStoredStockInRecords(updatedRecords);

    // 3. Post to Google Sheet "Stock In" sheet and "Product List" sheet
    showToast(
      `បានអនុម័ត (Approval) សំណើកែសម្រួលស្តុក ${approvedRecord.productCode} និងកំពុងបញ្ជូន Report ទៅ Google Sheet...`,
      'info'
    );

    try {
      await postStockInTransactionToSheet(approvedRecord);
      await postProductListToSheet(updatedProducts, currentUser.name);
      showToast(
        `បានបញ្ជូន Report Stock In ទៅកាន់ Google Sheet ជោគជ័យ!`,
        'success'
      );
    } catch (e) {
      console.error('Failed to sync approved stock to sheet:', e);
      showToast('បានអនុម័តក្នុងប្រព័ន្ធ (ការ sync ទៅ Google Sheet មានបញ្ហាបណ្តាញ)', 'info');
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
    setProducts(updated);
    saveStoredProducts(updated);

    // Sync to Google Sheet (Sheet: Product List)
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

  const handleSyncSalesMatrixToSheet = async () => {
    const res = await syncDailySaleOutMatrixToSheet(salesOrders, products);
    if (!res.success) {
      throw new Error(res.error || 'Failed to sync sales matrix to sheet');
    }
    showToast('បាន Sync របាយការណ៍ Sale Out (ជួរដេក) ទៅ Google Sheet ជោគជ័យ!', 'success');
  };

  const handleSyncStockInMatrixToSheet = async () => {
    const res = await syncDailyStockInMatrixToSheet(stockInRecords, products);
    if (!res.success) {
      throw new Error(res.error || 'Failed to sync stock in matrix to sheet');
    }
    showToast('បាន Sync របាយការណ៍ Stock In (ជួរដេក) ទៅ Google Sheet ជោគជ័យ!', 'success');
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
        onInstall={handleInstallApp}
        onOpenProfileModal={() => setProfileModalOpen(true)}
      />

      {/* Main Container */}
      {!currentUser ? (
        <AuthView
          users={users}
          onLogin={handleLogin}
          onShowToast={showToast}
        />
      ) : (
        <main className="flex-grow max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
          {/* Top Primary Module Switcher: 1. Attendance vs 2. Sale Order & Stock */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3 bg-white/90 backdrop-blur-xl p-1.5 sm:p-2 rounded-3xl border border-slate-200/90 shadow-sm">
            <button
              onClick={() => setMainModule('attendance')}
              className={`py-3 px-3 sm:px-5 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all duration-200 ${
                mainModule === 'attendance'
                  ? 'bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 text-white shadow-lg shadow-indigo-500/25 ring-2 ring-indigo-500/40'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
              <div className="text-left">
                <div className="leading-tight">១. វត្តមានការងារ (Attendance)</div>
                <div
                  className={`text-[10px] font-medium hidden sm:block ${
                    mainModule === 'attendance' ? 'text-indigo-200' : 'text-slate-400'
                  }`}
                >
                  Check-In, Check-Out, សំណើច្បាប់, របាយការណ៍ខែ
                </div>
              </div>
            </button>

            <button
              onClick={() => setMainModule('sales_stock')}
              className={`py-3 px-3 sm:px-5 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all duration-200 ${
                mainModule === 'sales_stock'
                  ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-600 text-white shadow-lg shadow-blue-500/25 ring-2 ring-blue-500/40'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
              <div className="text-left">
                <div className="leading-tight">២. Sale Order &amp; Stock</div>
                <div
                  className={`text-[10px] font-medium hidden sm:block ${
                    mainModule === 'sales_stock' ? 'text-blue-200' : 'text-slate-400'
                  }`}
                >
                  កត់ត្រាការលក់, គ្រប់គ្រងស្តុក, Sync Google Sheet
                </div>
              </div>
            </button>
          </div>

          {/* ========================================================= */}
          {/* LAYOUT 1: ATTENDANCE (វត្តមាន និងការគ្រប់គ្រងបុគ្គលិក) */}
          {/* ========================================================= */}
          {mainModule === 'attendance' && (
            <div className="space-y-4 sm:space-y-6">
              {/* System Notification Banner */}
              <div className="bg-gradient-to-r from-indigo-50 via-white to-purple-50 p-4 rounded-3xl border border-indigo-100/80 shadow-xs flex items-start gap-3 relative overflow-hidden">
                <div className="p-2.5 bg-gradient-to-tr from-indigo-600 to-purple-600 text-white rounded-2xl shadow-sm shrink-0">
                  <Info className="w-5 h-5" />
                </div>
                <div className="text-xs sm:text-sm text-slate-700 leading-relaxed flex-grow">
                  <p className="font-bold text-slate-900 mb-0.5">ព័ត៌មានប្រតិបត្តិការប្រព័ន្ធ BA:</p>
                  <p className="text-slate-600">
                    មន្ត្រី BA ទាំងអស់តម្រូវឱ្យ Check-In ក្នុងចំងាយ <b>១០ ម៉ែត្រ</b> ពីទីតាំងតូបដែលបានកំណត់។
                    រាល់សំណើច្បាប់ទាំង ៩ ប្រភេទ នឹងត្រូវបញ្ជូនទៅកាន់ Manager ពិនិត្យ និងអនុម័តជាស្វ័យប្រវត្តិ។
                  </p>
                </div>
              </div>

              {/* Top Dashboard Summary Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-white/95 backdrop-blur-xl p-4 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-3 transition-all hover:shadow-md">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
                    <LogIn className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-500 font-semibold">Check-In ប្រចាំខែ</p>
                    <h4 className="text-lg sm:text-xl font-extrabold text-slate-900">{checkInsCount}</h4>
                  </div>
                </div>

                <div className="bg-white/95 backdrop-blur-xl p-4 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-3 transition-all hover:shadow-md">
                  <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100">
                    <LogOut className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-500 font-semibold">Check-Out ប្រចាំខែ</p>
                    <h4 className="text-lg sm:text-xl font-extrabold text-slate-900">{checkOutsCount}</h4>
                  </div>
                </div>

                <div className="bg-white/95 backdrop-blur-xl p-4 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-3 transition-all hover:shadow-md">
                  <div className="p-3 bg-pink-50 text-pink-600 rounded-2xl border border-pink-100">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-500 font-semibold">សំណើច្បាប់ប្រចាំខែ</p>
                    <h4 className="text-lg sm:text-xl font-extrabold text-slate-900">{totalLeavesCount}</h4>
                  </div>
                </div>

                <div className="bg-white/95 backdrop-blur-xl p-4 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-3 transition-all hover:shadow-md">
                  <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-500 font-semibold">កំពុងរង់ចាំ (Pending)</p>
                    <h4 className="text-lg sm:text-xl font-extrabold text-amber-700">{pendingLeavesCount}</h4>
                  </div>
                </div>
              </div>

              {/* Top Operational Widgets: Check-In & Leave Request Buttons */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                <CheckInPanel
                  currentUser={currentUser}
                  todayRecords={todayRecords}
                  gpsTestMode={gpsTestMode}
                  onToggleGpsTestMode={handleToggleGpsTestMode}
                  onPerformCheckIn={handlePerformCheckIn}
                  onUpdateUserLocation={handleUpdateUserLocation}
                  onShowToast={showToast}
                />

                <div className="lg:col-span-2">
                  <LeaveButtonsBar
                    onSelectType={type => {
                      setActiveLeaveType(type);
                      setLeaveModalOpen(true);
                    }}
                  />
                </div>
              </div>

              {/* Attendance Tab Bar */}
              <div className="flex items-center justify-between bg-white/95 backdrop-blur-xl p-2 rounded-2xl border border-slate-200/80 shadow-xs overflow-x-auto">
                <div className="flex items-center gap-1.5 w-full sm:w-auto">
                  <button
                    onClick={() => setAttendanceTab('report')}
                    className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                      attendanceTab === 'report'
                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-500/20'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Calendar className="w-4 h-4" />
                    <span>របាយការណ៍ប្រចាំខែ (1-31)</span>
                  </button>

                  <button
                    onClick={() => setAttendanceTab('leave')}
                    className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                      attendanceTab === 'leave'
                        ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-md shadow-pink-500/20'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span>សំណើច្បាប់</span>
                    {pendingLeavesCount > 0 && (
                      <span className="px-1.5 py-0.2 bg-amber-400 text-slate-900 rounded-full text-[10px] font-extrabold">
                        {pendingLeavesCount}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => setAttendanceTab('staff')}
                    className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                      attendanceTab === 'staff'
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-700 text-white shadow-md shadow-purple-500/20'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>
                      {currentUser.type === 'Admin'
                        ? 'គ្រប់គ្រងបុគ្គលិក'
                        : currentUser.type === 'Manager'
                        ? 'កូនក្រុម'
                        : 'ព័ត៌មានបុគ្គលិក'}
                    </span>
                  </button>

                  <button
                    onClick={() => setAttendanceTab('history')}
                    className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                      attendanceTab === 'history'
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-md shadow-emerald-500/20'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <History className="w-4 h-4" />
                    <span>ប្រវត្តិវត្តមាន</span>
                  </button>
                </div>
              </div>

              {/* Attendance Active Views */}
              {attendanceTab === 'report' && (
                <MonthlyReportView
                  currentUser={currentUser}
                  users={users}
                  leaves={leaves}
                  attendance={attendance}
                />
              )}

              {attendanceTab === 'leave' && (
                <LeaveRequestsView
                  currentUser={currentUser}
                  users={users}
                  leaves={leaves}
                  onApprove={handleApproveLeave}
                  onReject={handleRejectLeave}
                  onOpenNewLeave={() => setLeaveModalOpen(true)}
                />
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
              {/* Sales & Stock System Banner */}
              <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-4 sm:p-5 rounded-3xl border border-blue-500/30 shadow-md flex items-start gap-3.5 relative overflow-hidden">
                <div className="p-3 bg-blue-600/30 border border-blue-400/40 text-blue-200 rounded-2xl shadow-inner shrink-0">
                  <ShoppingCart className="w-6 h-6" />
                </div>
                <div className="flex-grow">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-black text-sm sm:text-base tracking-tight text-white">
                      ប្រព័ន្ធកត់ត្រាការលក់ចេញប្រចាំថ្ងៃ &amp; គ្រប់គ្រងស្ដុកទំនិញ
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                      Google Sheets Connected
                    </span>
                  </div>
                  <p className="text-xs text-white/80 mt-1 leading-relaxed">
                    មន្ត្រី BA និង Manager អាចកត់ត្រាការបញ្ជាទិញប្រចាំថ្ងៃ ពិនិត្យស្តុកទំនិញជាក់ស្តែង និងបញ្ជូន Summary Report ទៅកាន់ Google Sheet ដោយផ្ទាល់។
                  </p>
                </div>
              </div>

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
              <div className="flex items-center justify-between bg-white/95 backdrop-blur-xl p-2 rounded-2xl border border-slate-200/80 shadow-xs overflow-x-auto">
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
                  onSyncSummaryToSheet={handleSyncSalesMatrixToSheet}
                  onShowToast={showToast}
                />
              )}

              {salesStockTab === 'stock' && (
                <StockManagementView
                  currentUser={currentUser}
                  products={products}
                  stockInRecords={stockInRecords}
                  onRequestStockAdjustment={handleRequestStockAdjustment}
                  onApproveStockAdjustment={handleApproveStockAdjustment}
                  onRejectStockAdjustment={handleRejectStockAdjustment}
                  onSaveProduct={handleSaveProduct}
                  onSyncStockReportToSheet={handleSyncStockInMatrixToSheet}
                  onShowToast={showToast}
                />
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
