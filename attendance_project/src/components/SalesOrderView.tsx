import React, { useState, useMemo, useEffect } from 'react';
import {
  ShoppingCart,
  Search,
  CheckCircle,
  AlertCircle,
  Eye,
  Send,
  Calendar,
  MapPin,
  User as UserIcon,
  Flame,
  Plus,
  Minus,
  X,
  FileSpreadsheet,
  Download,
  Clock,
  Sparkles,
  Lock,
  Layers,
  History,
  TrendingUp,
} from 'lucide-react';
import { User, Product, SalesOrder, SalesOrderItem, CAMBODIAN_PROVINCES, MANAGER_IDS } from '../types';

interface SalesOrderViewProps {
  currentUser: User;
  users: User[];
  products: Product[];
  salesOrders: SalesOrder[];
  onSubmitSalesOrder: (order: SalesOrder) => Promise<{ success: boolean; error?: string }>;
  onSyncSummaryToSheet: () => Promise<void>;
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const SalesOrderView: React.FC<SalesOrderViewProps> = ({
  currentUser,
  users,
  products,
  salesOrders,
  onSubmitSalesOrder,
  onSyncSummaryToSheet,
  onShowToast,
}) => {
  // Auto Today's date formatted as YYYY-MM-DD
  const todayStr = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }, []);

  // Active view tab: 'new_order' vs 'history_summary'
  const [subTab, setSubTab] = useState<'new_order' | 'history_summary'>('new_order');

  // Form states
  const [selectedBaId, setSelectedBaId] = useState<string>(
    currentUser.type === 'BA Staff' ? currentUser.id : ''
  );
  const [selectedProvince, setSelectedProvince] = useState<string>(
    currentUser.managerId || 'DTPP1'
  );
  // Auto Today (read-only date)
  const selectedDate = todayStr;
  const [isNoSales, setIsNoSales] = useState<boolean>(false);
  const [orderQuantities, setOrderQuantities] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Search & Filters in Product Grid
  const [productSearch, setProductSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Modals
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState<boolean>(false);

  // History & Summary filters
  const [historySearch, setHistorySearch] = useState<string>('');
  const [historyBaFilter, setHistoryBaFilter] = useState<string>('ALL');
  const [historyDateFilter, setHistoryDateFilter] = useState<string>('');

  // Extract categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  // Check if chosen BA already submitted today
  const targetBaUser = useMemo(() => {
    if (!selectedBaId) return null;
    return users.find(u => u.id.trim().toUpperCase() === selectedBaId.trim().toUpperCase()) || null;
  }, [selectedBaId, users]);

  // Auto-load Manager ID into selectedProvince whenever chosen BA changes
  useEffect(() => {
    if (targetBaUser?.managerId) {
      setSelectedProvince(targetBaUser.managerId.trim());
    } else if (currentUser?.managerId) {
      setSelectedProvince(currentUser.managerId.trim());
    }
  }, [selectedBaId, targetBaUser, currentUser]);

  const hasAlreadySubmittedToday = useMemo(() => {
    if (!selectedBaId) return false;
    return salesOrders.some(
      o =>
        o.baId.trim().toUpperCase() === selectedBaId.trim().toUpperCase() &&
        o.date === selectedDate
    );
  }, [salesOrders, selectedBaId, selectedDate]);

  // Handlers for quantity counter
  const handleUpdateQty = (productCode: string, delta: number) => {
    setOrderQuantities(prev => {
      const cur = prev[productCode] || 0;
      const next = Math.max(0, cur + delta);
      return { ...prev, [productCode]: next };
    });
  };

  const handleSetQty = (productCode: string, valStr: string) => {
    const val = parseInt(valStr, 10);
    const next = isNaN(val) || val < 0 ? 0 : val;
    setOrderQuantities(prev => ({ ...prev, [productCode]: next }));
  };

  // Selected items calculation
  const selectedItems = useMemo<SalesOrderItem[]>(() => {
    if (isNoSales) return [];
    const items: SalesOrderItem[] = [];
    products.forEach(p => {
      const qty = orderQuantities[p.productCode] || 0;
      if (qty > 0) {
        items.push({
          productCode: p.productCode,
          productName: p.name,
          price: p.price,
          quantity: qty,
          total: qty * p.price,
          imageUrl: p.imageUrl,
        });
      }
    });
    return items;
  }, [isNoSales, products, orderQuantities]);

  const totalItemsCount = selectedItems.length;
  const totalQuantitiesCount = selectedItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmountResult = selectedItems.reduce((sum, item) => sum + item.total, 0);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (selectedCategory !== 'ALL' && p.category !== selectedCategory) {
        return false;
      }
      if (productSearch.trim()) {
        const q = productSearch.toLowerCase();
        return (
          p.productCode.toLowerCase().includes(q) ||
          p.name.toLowerCase().includes(q) ||
          (p.category && p.category.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [products, selectedCategory, productSearch]);

  // Submit Order Handler
  const handleSubmitOrder = async () => {
    if (!selectedBaId) {
      onShowToast('សូមជ្រើសរើសឈ្មោះ BA ជាមុនសិន!', 'error');
      return;
    }
    if (!selectedProvince) {
      onShowToast('សូមជ្រើសរើស ខេត្ត/ក្រុង!', 'error');
      return;
    }
    if (!isNoSales && selectedItems.length === 0) {
      onShowToast('សូមជ្រើសរើសបរិមាណផលិតផលយ៉ាងហោចណាស់ ១ មុខ ឬធីក "លក់មិនបាន"!', 'error');
      return;
    }

    const baUser = users.find(u => u.id.trim().toUpperCase() === selectedBaId.trim().toUpperCase());
    const baName = baUser ? baUser.name : selectedBaId;

    const newOrder: SalesOrder = {
      id: `SO_${Date.now()}`,
      date: selectedDate,
      timestamp: new Date().toISOString(),
      baId: selectedBaId,
      baName: baName,
      province: selectedProvince,
      isNoSales: isNoSales,
      items: selectedItems,
      totalItems: isNoSales ? 0 : totalItemsCount,
      totalQty: isNoSales ? 0 : totalQuantitiesCount,
      totalAmount: isNoSales ? 0 : totalAmountResult,
      status: 'Submitted',
    };

    setIsSubmitting(true);
    try {
      const res = await onSubmitSalesOrder(newOrder);
      if (res.success) {
        onShowToast('រក្សាទុក និងផ្ញើរបាយការណ៍លក់ទៅ Google Sheet ជោគជ័យ!', 'success');
        setIsSummaryModalOpen(false);
        // Reset quantities
        setOrderQuantities({});
        setIsNoSales(false);
      } else {
        onShowToast(`បញ្ហាក្នុងការផ្ញើទិន្នន័យ: ${res.error || 'សូមព្យាយាមម្តងទៀត'}`, 'error');
      }
    } catch (e: any) {
      onShowToast('មិនអាចផ្ញើទិន្នន័យបានទេ សូមពិនិត្យ Internet របស់អ្នក!', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered History Orders
  const filteredOrders = useMemo(() => {
    return salesOrders.filter(order => {
      // Role scope: if BA staff, only own orders
      if (currentUser.type === 'BA Staff') {
        if (order.baId.trim().toUpperCase() !== currentUser.id.trim().toUpperCase()) {
          return false;
        }
      }
      if (historyBaFilter !== 'ALL') {
        if (order.baId.trim().toUpperCase() !== historyBaFilter.trim().toUpperCase()) {
          return false;
        }
      }
      if (historyDateFilter) {
        if (order.date !== historyDateFilter) {
          return false;
        }
      }
      if (historySearch.trim()) {
        const q = historySearch.toLowerCase();
        return (
          order.baName.toLowerCase().includes(q) ||
          order.baId.toLowerCase().includes(q) ||
          order.province.toLowerCase().includes(q) ||
          order.items.some(i => i.productCode.toLowerCase().includes(q) || i.productName.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [salesOrders, currentUser, historyBaFilter, historyDateFilter, historySearch]);

  const historyTotalRevenue = useMemo(() => {
    return filteredOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  }, [filteredOrders]);

  const historyTotalUnits = useMemo(() => {
    return filteredOrders.reduce((sum, o) => sum + (o.totalQty || 0), 0);
  }, [filteredOrders]);

  // Daily Consolidated Matrix Rows (1 single row per Date + BA as requested by user)
  const dailyMatrixRows = useMemo(() => {
    const map = new Map<string, {
      id: string;
      date: string;
      baId: string;
      baName: string;
      province: string;
      isNoSales: boolean;
      productQuantities: Record<string, number>;
      totalQty: number;
      totalAmount: number;
    }>();

    filteredOrders.forEach(order => {
      const key = `${order.date}_${order.baId.trim().toUpperCase()}`;
      if (!map.has(key)) {
        const prodQtys: Record<string, number> = {};
        products.forEach(p => {
          prodQtys[p.productCode] = 0;
        });
        map.set(key, {
          id: order.id,
          date: order.date,
          baId: order.baId,
          baName: order.baName,
          province: order.province,
          isNoSales: order.isNoSales,
          productQuantities: prodQtys,
          totalQty: 0,
          totalAmount: 0,
        });
      }

      const row = map.get(key)!;
      if (!order.isNoSales && order.items) {
        order.items.forEach(it => {
          row.productQuantities[it.productCode] = (row.productQuantities[it.productCode] || 0) + it.quantity;
        });
        row.isNoSales = false;
      }
      row.totalQty += order.totalQty || 0;
      row.totalAmount += order.totalAmount || 0;
    });

    return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
  }, [filteredOrders, products]);

  // Export Sales History to CSV (Horizontal Matrix format matching Google Sheet)
  const handleExportHistoryCSV = () => {
    if (dailyMatrixRows.length === 0) {
      onShowToast('គ្មានទិន្នន័យដើម្បីទាញយកឡើយ', 'info');
      return;
    }

    // Col A: កាលបរិច្ឆេទ, Col B: BA Name, Col C: Province, Col D+: Product columns...
    const prodHeaders = products.map(p => `${p.productCode}-${p.name}`);
    const headers = ['កាលបរិច្ឆេទ', 'BA Name', 'Province', ...prodHeaders, 'សរុបបរិមាណ (ប្រអប់)', 'ទឹកប្រាក់សរុប ($)'];

    const rows = dailyMatrixRows.map(r => [
      `"${r.date}"`,
      `"${r.baName} (${r.baId})"`,
      `"${r.province}"`,
      ...products.map(p => `"${r.productQuantities[p.productCode] || 0}"`),
      `"${r.totalQty}"`,
      `"${r.totalAmount.toFixed(2)}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Sales_Order_Matrix_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowToast('បានទាញយកតារាង Sale Out ជា CSV (ជួរដេក) ជោគជ័យ!', 'success');
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & Sub-Tabs */}
      <div className="bg-white/95 backdrop-blur-xl p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-indigo-600 to-blue-600 text-white rounded-2xl shadow-md">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-slate-800 tracking-tight">
                របាយការណ៍លក់ចេញប្រចាំថ្ងៃ (Sales Order)
              </h2>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-700 border border-blue-400/30">
                Sheet: Sale Out
              </span>
            </div>
            <p className="text-xs text-slate-500">
              កត់ត្រាការលក់ប្រចាំថ្ងៃរបស់ BA Staff និង sync ទៅកាន់សន្លឹក "Sale Out" ក្នុង Google Sheet "BA Control"
            </p>
          </div>
        </div>

        {/* Sub-tab pills */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200 self-start md:self-auto text-xs font-bold">
          <button
            onClick={() => setSubTab('new_order')}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-2 transition-all ${
              subTab === 'new_order'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>កត់ត្រាការលក់ (New Order)</span>
          </button>
          <button
            onClick={() => setSubTab('history_summary')}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-2 transition-all ${
              subTab === 'history_summary'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>ប្រវត្តិ & Summary ({salesOrders.length})</span>
          </button>
        </div>
      </div>

      {subTab === 'new_order' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Column: Input Form & Sticky Summary Bar */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white/95 backdrop-blur-xl p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-3.5">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b pb-2.5">
                <UserIcon className="w-4 h-4 text-indigo-600" />
                <span>ព័ត៌មានអ្នកលក់ និងទីតាំង</span>
              </h3>

              {/* BA Selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  ឈ្មោះបុគ្គលិក BA <span className="text-rose-500">*</span>
                </label>
                {currentUser.type === 'BA Staff' ? (
                  <div className="px-3.5 py-2 bg-indigo-50 border border-indigo-200 rounded-xl text-xs font-bold text-indigo-800 flex items-center justify-between">
                    <span>{currentUser.name} ({currentUser.id})</span>
                    <span className="text-[10px] bg-indigo-200/70 text-indigo-900 px-2 py-0.5 rounded-full font-bold">
                      BA របស់ខ្ញុំ
                    </span>
                  </div>
                ) : (
                  <select
                    value={selectedBaId}
                    onChange={e => setSelectedBaId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="">-- ជ្រើសរើសឈ្មោះ BA --</option>
                    {users
                      .filter(u => u.type === 'BA Staff' || !u.type)
                      .map(u => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.id})
                        </option>
                      ))}
                  </select>
                )}
              </div>

              {/* Province / Manager ID Selector */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-700">
                    ខេត្ត / ក្រុង (Manager ID) <span className="text-rose-500">*</span>
                  </label>
                  {targetBaUser?.managerId ? (
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5 text-indigo-500" />
                      Auto: {targetBaUser.managerId}
                    </span>
                  ) : null}
                </div>
                <select
                  value={selectedProvince}
                  onChange={e => setSelectedProvince(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <optgroup label="Manager ID (ស្វ័យប្រវត្តិតាម BA)">
                    {MANAGER_IDS.map(m => (
                      <option key={m} value={m}>
                        {m} {targetBaUser?.managerId?.toUpperCase() === m.toUpperCase() ? '✓ (Manager របស់ BA នេះ)' : ''}
                      </option>
                    ))}
                  </optgroup>
                  {targetBaUser?.managerId && !MANAGER_IDS.includes(targetBaUser.managerId.toUpperCase()) && (
                    <option value={targetBaUser.managerId}>{targetBaUser.managerId}</option>
                  )}
                  <optgroup label="ខេត្ត / ក្រុង">
                    {CAMBODIAN_PROVINCES.map(prov => (
                      <option key={prov} value={prov}>
                        {prov}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Date (Auto Today - Cannot Select) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-700">
                    កាលបរិច្ឆេទរបាយការណ៍ <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" />
                    Auto Today (ថ្ងៃនេះ)
                  </span>
                </div>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    value={todayStr}
                    readOnly
                    disabled
                    title="កាលបរិច្ឆេទត្រូវបានកំណត់ស្វ័យប្រវត្តិជាថ្ងៃនេះ (មិនអាចជ្រើសរើសបានទេ)"
                    className="w-full pl-9 pr-3 py-2 bg-slate-100/90 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-not-allowed select-none outline-none shadow-xs"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  * មិនអាចជ្រើសរើសបានទេ ប្រព័ន្ធកំណត់ស្វ័យប្រវត្តិតាមថ្ងៃនេះ
                </p>
              </div>

              {/* No Sales Checkbox */}
              <div className="p-3 bg-rose-50/70 border border-rose-200/80 rounded-2xl flex items-center justify-between">
                <label htmlFor="noSalesCheck" className="text-xs font-bold text-rose-800 cursor-pointer flex items-center gap-2">
                  <input
                    id="noSalesCheck"
                    type="checkbox"
                    checked={isNoSales}
                    onChange={e => {
                      setIsNoSales(e.target.checked);
                      if (e.target.checked) {
                        setOrderQuantities({});
                      }
                    }}
                    className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500 cursor-pointer"
                  />
                  <span>លក់មិនបាន (No Sales ថ្ងៃនេះ)</span>
                </label>
                {isNoSales && (
                  <span className="text-[10px] font-bold bg-rose-200 text-rose-900 px-2 py-0.5 rounded-full">
                    សូន្យ
                  </span>
                )}
              </div>

              {/* Notice */}
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-center text-amber-800 text-[11px] font-bold">
                🙏 សូមធ្វើរបាយការណ៍លក់មុនម៉ោងសម្រាក់ពីការងារ 🙏
              </div>

              {/* Freeze warning if already submitted */}
              {hasAlreadySubmittedToday && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl flex items-start gap-2 text-xs text-blue-800">
                  <Lock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">បានបញ្ជូនរួចរាល់សម្រាប់ថ្ងៃនេះ!</p>
                    <p className="text-[11px] text-blue-600 mt-0.5">
                      BA នេះបានធ្វើរបាយការណ៍រួចហើយ អ្នកនៅតែអាចបញ្ជូនបន្ថែមទៀតបានបើមានការលក់ថ្មី។
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Total Summary Sticky Card */}
            <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 text-white p-4 sm:p-5 rounded-3xl shadow-md border border-indigo-500/20 space-y-3">
              <div className="flex items-center justify-between border-b border-indigo-700/50 pb-2.5">
                <span className="text-xs font-bold text-indigo-200">សរុបការបញ្ជាទិញ (Order Summary)</span>
                <button
                  type="button"
                  onClick={() => setIsSummaryModalOpen(true)}
                  disabled={isNoSales || totalItemsCount === 0}
                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1 shadow-sm"
                >
                  <Eye className="w-3 h-3" />
                  <span>មើលលម្អិត</span>
                </button>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between items-center text-slate-300">
                  <span>មុខទំនិញសរុប:</span>
                  <span className="font-extrabold text-white text-sm">{isNoSales ? 0 : totalItemsCount} មុខ</span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span>ចំនួនសរុប:</span>
                  <span className="font-extrabold text-white text-sm">{isNoSales ? 0 : totalQuantitiesCount} ប្រអប់</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-indigo-800 text-sm">
                  <span className="font-bold text-indigo-300">ទឹកប្រាក់សរុប:</span>
                  <span className="font-black text-emerald-400 text-lg">
                    ${isNoSales ? '0.00' : totalAmountResult.toFixed(2)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSubmitOrder}
                disabled={isSubmitting || (!isNoSales && totalItemsCount === 0)}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:from-slate-700 disabled:to-slate-800 disabled:cursor-not-allowed text-white font-black text-xs sm:text-sm rounded-2xl shadow-lg transition-all active:scale-98 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>កំពុងរក្សាទុកទៅ Google Sheet...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>រក្សាទុកទៅ Google Sheets</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: Product Catalog Grid */}
          <div className="lg:col-span-2 space-y-3.5">
            {/* Filter Bar */}
            <div className="bg-white/95 backdrop-blur-xl p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center gap-2.5">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="ស្វែងរកតាមកូដទំនិញ ឬ ឈ្មោះផលិតផល..."
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                  disabled={isNoSales}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-50"
                />
              </div>

              <div className="w-full sm:w-auto">
                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  disabled={isNoSales}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-50"
                >
                  <option value="ALL">គ្រប់ប្រភេទ ({products.length})</option>
                  {categories.map(c => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Products List / Grid */}
            {isNoSales ? (
              <div className="bg-white/95 backdrop-blur-xl p-12 rounded-3xl border border-slate-200/80 text-center space-y-2">
                <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto font-bold text-lg">
                  ✕
                </div>
                <h4 className="font-bold text-slate-800 text-sm">បានជ្រើសរើសរបៀប "លក់មិនបាន (No Sales)"</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  បញ្ជីផលិតផលត្រូវបានលាក់ជាបណ្តោះអាសន្ន។ អ្នកអាចចុចប៊ូតុង "រក្សាទុកទៅ Google Sheets" ដើម្បីកត់ត្រារបាយការណ៍ No Sales សម្រាប់ថ្ងៃនេះ។
                </p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="bg-white/95 backdrop-blur-xl p-12 rounded-3xl border border-slate-200/80 text-center text-slate-400 text-xs">
                មិនមានផលិតផលត្រូវនឹងលក្ខខណ្ឌស្វែងរកឡើយ
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                {filteredProducts.map((p, idx) => {
                  const currentQty = orderQuantities[p.productCode] || 0;
                  const isTopSeller = (p.totalSold || 0) >= 30 || idx < 2;

                  return (
                    <div
                      key={p.id}
                      className={`bg-white rounded-2xl border p-3 flex flex-col justify-between transition-all duration-200 ${
                        currentQty > 0
                          ? 'border-indigo-500 shadow-md ring-1 ring-indigo-500/30 bg-indigo-50/10'
                          : 'border-slate-200/90 hover:border-slate-300 hover:shadow-xs'
                      }`}
                    >
                      <div>
                        {/* Hot Badge */}
                        {isTopSeller && (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-600 text-white rounded-md text-[9px] font-black uppercase mb-1.5 shadow-2xs">
                            <Flame className="w-2.5 h-2.5 fill-current" />
                            <span>លក់ដាច់បំផុត</span>
                          </div>
                        )}

                        {/* Image Thumbnail with zoom on click */}
                        <div
                          onClick={() => setZoomedImage(p.imageUrl || 'https://via.placeholder.com/300')}
                          className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 mb-2 cursor-pointer group"
                        >
                          <img
                            src={p.imageUrl || 'https://via.placeholder.com/300'}
                            alt={p.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <Eye className="w-5 h-5 drop-shadow" />
                          </div>
                        </div>

                        {/* Product Title & Code */}
                        <h4 className="font-bold text-xs text-slate-900 line-clamp-2 leading-tight min-h-[32px] mb-1" title={p.name}>
                          {p.name}
                        </h4>
                        <p className="text-[10px] font-mono font-semibold text-slate-400 truncate mb-1">
                          {p.productCode}
                        </p>

                        {/* Price & Stock info */}
                        <div className="flex items-center justify-between mb-2.5 text-xs">
                          <span className="font-black text-emerald-600 text-sm">
                            ${p.price.toFixed(2)}
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                            (p.stockQty ?? 0) <= (p.minAlertQty ?? 5)
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            ស្តុក: {p.stockQty ?? 0}
                          </span>
                        </div>
                      </div>

                      {/* Counter Controls */}
                      <div className="flex items-center justify-between bg-slate-100 p-1 rounded-xl border border-slate-200">
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(p.productCode, -1)}
                          disabled={currentQty <= 0}
                          className="w-7 h-7 rounded-lg bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 font-bold flex items-center justify-center shadow-xs transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>

                        <input
                          type="number"
                          min="0"
                          value={currentQty}
                          onChange={e => handleSetQty(p.productCode, e.target.value)}
                          onFocus={e => e.target.select()}
                          className="w-10 text-center bg-transparent font-black text-xs text-slate-800 outline-none"
                        />

                        <button
                          type="button"
                          onClick={() => handleUpdateQty(p.productCode, 1)}
                          className="w-7 h-7 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 font-bold flex items-center justify-center shadow-xs transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* History & Summary View */
        <div className="space-y-4">
          {/* Top KPI Cards for Sales History */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white/95 backdrop-blur-xl p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-500">របាយការណ៍សរុប</p>
                <h4 className="text-lg font-extrabold text-slate-900">{filteredOrders.length}</h4>
              </div>
            </div>

            <div className="bg-white/95 backdrop-blur-xl p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-500">ចំណូលលក់សរុប</p>
                <h4 className="text-lg font-extrabold text-emerald-600">${historyTotalRevenue.toFixed(2)}</h4>
              </div>
            </div>

            <div className="bg-white/95 backdrop-blur-xl p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-500">បរិមាណលក់សរុប</p>
                <h4 className="text-lg font-extrabold text-blue-600">{historyTotalUnits} ប្រអប់</h4>
              </div>
            </div>

            <div className="bg-white/95 backdrop-blur-xl p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-500">Google Sheets Sync</p>
                <h4 className="text-xs font-bold text-slate-700">ដំណើរការស្វ័យប្រវត្តិ</h4>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white/95 backdrop-blur-xl p-4 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="ស្វែងរកតាម BA, ខេត្ត, ទំនិញ..."
                  value={historySearch}
                  onChange={e => setHistorySearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              {currentUser.type !== 'BA Staff' && (
                <select
                  value={historyBaFilter}
                  onChange={e => setHistoryBaFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
                >
                  <option value="ALL">គ្រប់ BA Staff</option>
                  {users
                    .filter(u => u.type === 'BA Staff' || !u.type)
                    .map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.id})
                      </option>
                    ))}
                </select>
              )}

              <input
                type="date"
                value={historyDateFilter}
                onChange={e => setHistoryDateFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
              />

              {historyDateFilter && (
                <button
                  onClick={() => setHistoryDateFilter('')}
                  className="px-2 py-1 text-slate-500 hover:text-slate-800 text-xs font-bold"
                >
                  លុបថ្ងៃ
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 self-end md:self-auto">
              <button
                onClick={handleExportHistoryCSV}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>ទាញយក CSV</span>
              </button>
              <button
                onClick={onSyncSummaryToSheet}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Sync ទៅ Google Sheet</span>
              </button>
            </div>
          </div>

          {/* Matrix Report Table matching Google Sheet format */}
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                <span className="font-extrabold text-xs text-slate-800">
                  របាយការណ៍លក់ចេញជាជួរដេក (Sale Out Matrix Report - ១ ថ្ងៃ ១ Row)
                </span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                  {dailyMatrixRows.length} ថ្ងៃ / Rows
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
                * រាល់ការលក់ក្នុងថ្ងៃតែមួយត្រូវបានបូកសរុបបញ្ចូលគ្នាក្នុង ១ Row តែមួយ
              </span>
            </div>

            {dailyMatrixRows.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs">
                មិនមានកំណត់ត្រាការលក់ដែលត្រូវគ្នានឹងការស្វែងរកឡើយ
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 sticky top-0 z-10">
                    <tr>
                      <th className="py-3 px-3 min-w-[105px]">កាលបរិច្ឆេទ</th>
                      <th className="py-3 px-3 min-w-[130px]">BA Name</th>
                      <th className="py-3 px-3 min-w-[110px]">Province</th>
                      {products.map(p => (
                        <th
                          key={p.id}
                          className="py-3 px-2 text-center min-w-[120px] max-w-[160px] truncate bg-indigo-50/40 border-l border-slate-200"
                          title={`${p.productCode}-${p.name}`}
                        >
                          <div className="font-bold text-[11px] text-indigo-950 truncate">
                            {p.productCode}
                          </div>
                          <div className="text-[9px] text-slate-500 font-normal truncate">
                            {p.name}
                          </div>
                        </th>
                      ))}
                      <th className="py-3 px-3 text-center min-w-[90px] font-black border-l border-slate-200 bg-emerald-50/50 text-emerald-900">
                        សរុប Qty
                      </th>
                      <th className="py-3 px-3 text-right min-w-[100px] font-black bg-emerald-50/50 text-emerald-900">
                        ទឹកប្រាក់សរុប
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dailyMatrixRows.map((row, idx) => (
                      <tr
                        key={`${row.date}_${row.baId}_${idx}`}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        {/* Col A: Date */}
                        <td className="py-3 px-3 font-mono font-bold text-slate-800">
                          {row.date}
                        </td>

                        {/* Col B: BA Name */}
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900">{row.baName}</div>
                          <div className="text-[10px] text-indigo-600 font-mono font-semibold">
                            {row.baId}
                          </div>
                        </td>

                        {/* Col C: Province */}
                        <td className="py-3 px-3 text-slate-700 font-medium">
                          {row.province}
                        </td>

                        {/* Col D+: Product columns */}
                        {products.map(p => {
                          const qty = row.productQuantities[p.productCode] || 0;
                          return (
                            <td
                              key={p.id}
                              className="py-3 px-2 text-center font-mono border-l border-slate-100"
                            >
                              {row.isNoSales ? (
                                <span className="text-[10px] text-slate-400">-</span>
                              ) : qty > 0 ? (
                                <span className="font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-lg text-xs">
                                  {qty}
                                </span>
                              ) : (
                                <span className="text-slate-300 font-medium">0</span>
                              )}
                            </td>
                          );
                        })}

                        {/* Total Qty */}
                        <td className="py-3 px-3 text-center font-black font-mono text-slate-800 text-sm border-l border-slate-200 bg-emerald-50/20">
                          {row.isNoSales ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">
                              No Sales
                            </span>
                          ) : (
                            `${row.totalQty}`
                          )}
                        </td>

                        {/* Total Revenue */}
                        <td className="py-3 px-3 text-right font-black font-mono text-emerald-600 text-sm bg-emerald-50/20">
                          ${row.totalAmount.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Summary Modal (Cart Review) */}
      {isSummaryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-5 border border-slate-100 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  បញ្ជីទំនិញដែលបានជ្រើសរើស ({selectedItems.length} មុខ)
                </h3>
                <p className="text-[11px] text-slate-500">
                  {selectedProvince} • {selectedDate}
                </p>
              </div>
              <button
                onClick={() => setIsSummaryModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {selectedItems.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-2xl border border-slate-100"
                >
                  <img
                    src={item.imageUrl || 'https://via.placeholder.com/150'}
                    alt={item.productName}
                    className="w-10 h-10 object-cover rounded-xl shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{item.productName}</p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {item.productCode} • ${item.price.toFixed(2)}/ប្រអប់
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-indigo-700">{item.quantity} ប្រអប់</p>
                    <p className="text-xs font-bold text-emerald-600">${item.total.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t pt-3 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-bold text-slate-700">ទឹកប្រាក់សរុប:</span>
                <span className="font-black text-emerald-600 text-base">
                  ${totalAmountResult.toFixed(2)}
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsSummaryModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
                >
                  កែសម្រួលបន្ថែម
                </button>
                <button
                  type="button"
                  onClick={handleSubmitOrder}
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>បញ្ជូនទៅ Google Sheets</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Zoom Modal */}
      {zoomedImage && (
        <div
          onClick={() => setZoomedImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in"
        >
          <div className="relative max-w-lg w-full" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setZoomedImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-slate-200 p-1"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={zoomedImage}
              alt="Zoomed"
              className="w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl bg-white"
            />
          </div>
        </div>
      )}
    </div>
  );
};
