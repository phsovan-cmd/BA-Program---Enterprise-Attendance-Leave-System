import React, { useState, useMemo } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  Download,
  Send,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle,
  Edit2,
  DollarSign,
  Layers,
  Sparkles,
  X,
  FileSpreadsheet,
  RefreshCw,
  Eye,
  TrendingDown,
  ShieldCheck,
  Clock,
  Check,
  XCircle,
  HelpCircle,
  Sliders,
  History,
} from 'lucide-react';
import { User, Product, StockInRecord, StockAdjustmentType, StockAdjustmentStatus } from '../types';

interface StockManagementViewProps {
  currentUser: User;
  products: Product[];
  stockInRecords: StockInRecord[];
  onRequestStockAdjustment: (
    productId: string,
    addedQty: number,
    type: StockAdjustmentType,
    note?: string
  ) => Promise<void>;
  onApproveStockAdjustment: (recordId: string) => Promise<void>;
  onRejectStockAdjustment: (recordId: string, reason?: string) => Promise<void>;
  onSaveProduct: (product: Product) => Promise<void>;
  onSyncStockReportToSheet: () => Promise<void>;
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const StockManagementView: React.FC<StockManagementViewProps> = ({
  currentUser,
  products,
  stockInRecords,
  onRequestStockAdjustment,
  onApproveStockAdjustment,
  onRejectStockAdjustment,
  onSaveProduct,
  onSyncStockReportToSheet,
  onShowToast,
}) => {
  const isManagerOrAdmin = currentUser.type === 'Admin' || currentUser.type === 'Manager';

  // Sub-tabs: 'inventory' | 'adjustments'
  const [activeTab, setActiveTab] = useState<'inventory' | 'adjustments'>('inventory');

  // Filters for Inventory Tab
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [stockStatusFilter, setStockStatusFilter] = useState<'ALL' | 'IN_STOCK' | 'LOW' | 'OUT'>('ALL');
  const [isSyncing, setIsSyncing] = useState(false);

  // Filters for Adjustments / Approval Tab
  const [adjustmentStatusFilter, setAdjustmentStatusFilter] = useState<'ALL' | 'Pending' | 'Approved' | 'Rejected'>('ALL');
  const [adjustmentSearch, setAdjustmentSearch] = useState('');

  // Modals
  const [isStockInModalOpen, setIsStockInModalOpen] = useState(false);
  const [selectedProductForStockIn, setSelectedProductForStockIn] = useState<Product | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<StockAdjustmentType>('Stock In');
  const [stockInQty, setStockInQty] = useState<number>(10);
  const [stockInNote, setStockInNote] = useState<string>('');
  const [isSubmittingAdjustment, setIsSubmittingAdjustment] = useState(false);

  // Reject Modal
  const [rejectingRecordId, setRejectingRecordId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');

  // Add / Edit Product Modal
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formPrice, setFormPrice] = useState('0');
  const [formStock, setFormStock] = useState('0');
  const [formMinAlert, setFormMinAlert] = useState('5');
  const [formImage, setFormImage] = useState('');

  // Extract categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  // KPIs
  const totalSKUs = products.length;
  const totalStockUnits = useMemo(
    () => products.reduce((sum, p) => sum + (p.stockQty || 0), 0),
    [products]
  );
  const totalStockValue = useMemo(
    () => products.reduce((sum, p) => sum + (p.stockQty || 0) * (p.price || 0), 0),
    [products]
  );
  const totalUnitsSold = useMemo(
    () => products.reduce((sum, p) => sum + (p.totalSold || 0), 0),
    [products]
  );
  const lowStockCount = useMemo(
    () => products.filter(p => (p.stockQty || 0) <= (p.minAlertQty || 5)).length,
    [products]
  );

  // Pending adjustments count
  const pendingAdjustmentsCount = useMemo(() => {
    return stockInRecords.filter(r => r.status === 'Pending').length;
  }, [stockInRecords]);

  // Filtered Products for Inventory Tab
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (selectedCategory !== 'ALL' && p.category !== selectedCategory) {
        return false;
      }
      const minAlert = p.minAlertQty || 5;
      if (stockStatusFilter === 'OUT' && (p.stockQty || 0) > 0) return false;
      if (stockStatusFilter === 'LOW' && ((p.stockQty || 0) > minAlert || (p.stockQty || 0) === 0)) return false;
      if (stockStatusFilter === 'IN_STOCK' && (p.stockQty || 0) <= minAlert) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          p.productCode.toLowerCase().includes(q) ||
          p.name.toLowerCase().includes(q) ||
          (p.category && p.category.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [products, selectedCategory, stockStatusFilter, searchQuery]);

  // Filtered Stock Adjustments for Approval Tab
  const filteredAdjustments = useMemo(() => {
    return stockInRecords.filter(r => {
      if (adjustmentStatusFilter !== 'ALL' && r.status !== adjustmentStatusFilter) {
        return false;
      }
      if (adjustmentSearch.trim()) {
        const q = adjustmentSearch.toLowerCase();
        return (
          r.productCode.toLowerCase().includes(q) ||
          r.productName.toLowerCase().includes(q) ||
          (r.baId && r.baId.toLowerCase().includes(q)) ||
          (r.requestedById && r.requestedById.toLowerCase().includes(q)) ||
          (r.requestedBy && r.requestedBy.toLowerCase().includes(q)) ||
          r.updatedBy.toLowerCase().includes(q) ||
          (r.approvedBy && r.approvedBy.toLowerCase().includes(q)) ||
          (r.note && r.note.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [stockInRecords, adjustmentStatusFilter, adjustmentSearch]);

  // Open Stock In / Adjustment Modal
  const handleOpenStockIn = (product?: Product, defaultType: StockAdjustmentType = 'Stock In') => {
    const target = product || products[0] || null;
    setSelectedProductForStockIn(target);
    setAdjustmentType(defaultType);
    setStockInQty(10);
    setStockInNote(
      defaultType === 'Stock In'
        ? 'នាំចូលបន្ថែមប្រចាំខែ'
        : defaultType === 'Damage'
        ? 'កាត់ស្តុកខូចខាត'
        : defaultType === 'Return'
        ? 'ទំនិញប្តូរត្រឡប់'
        : 'កែសម្រួលស្តុកជាក់ស្តែង'
    );
    setIsStockInModalOpen(true);
  };

  // Submit Stock In / Adjustment Request (Pending Approval)
  const handleConfirmStockIn = async () => {
    if (!selectedProductForStockIn) return;
    if (stockInQty === 0) {
      onShowToast('សូមបញ្ចូលចំនួនកែសម្រួលឱ្យខុសពី ០!', 'error');
      return;
    }

    try {
      setIsSubmittingAdjustment(true);
      // For damage, the quantity should be negative
      const finalQty = adjustmentType === 'Damage' ? -Math.abs(stockInQty) : Math.abs(stockInQty);
      await onRequestStockAdjustment(
        selectedProductForStockIn.id,
        finalQty,
        adjustmentType,
        stockInNote
      );
      setIsStockInModalOpen(false);
    } catch (e) {
      onShowToast('មិនអាចកត់ត្រាសំណើកែសម្រួលស្តុកបានទេ', 'error');
    } finally {
      setIsSubmittingAdjustment(false);
    }
  };

  // Trigger Approval
  const handleApproveAction = async (recordId: string) => {
    try {
      await onApproveStockAdjustment(recordId);
    } catch (e) {
      onShowToast('មានបញ្ហាក្នុងការអនុម័ត!', 'error');
    }
  };

  // Trigger Rejection
  const handleConfirmReject = async () => {
    if (!rejectingRecordId) return;
    try {
      await onRejectStockAdjustment(rejectingRecordId, rejectReason || 'បដិសេធដោយ Admin/Manager');
      setRejectingRecordId(null);
      setRejectReason('');
    } catch (e) {
      onShowToast('មានបញ្ហាក្នុងការបដិសេធ!', 'error');
    }
  };

  // Open Add/Edit Product Modal
  const handleOpenEditProduct = (prod?: Product) => {
    if (prod) {
      setEditingProduct(prod);
      setFormCode(prod.productCode);
      setFormName(prod.name);
      setFormCategory(prod.category || '');
      setFormPrice(String(prod.price));
      setFormStock(String(prod.stockQty));
      setFormMinAlert(String(prod.minAlertQty || 5));
      setFormImage(prod.imageUrl || '');
    } else {
      setEditingProduct(null);
      setFormCode(`PM${String(products.length + 1).padStart(4, '0')}`);
      setFormName('');
      setFormCategory(categories[0] || 'Skin Care');
      setFormPrice('15.00');
      setFormStock('50');
      setFormMinAlert('5');
      setFormImage('https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&auto=format&fit=crop&q=60');
    }
    setIsProductModalOpen(true);
  };

  // Save Product
  const handleSaveProductSubmit = async () => {
    if (!formCode.trim() || !formName.trim()) {
      onShowToast('សូមបញ្ចូលកូដទំនិញ និងឈ្មោះផលិតផល!', 'error');
      return;
    }

    const priceNum = parseFloat(formPrice) || 0;
    const stockNum = parseInt(formStock, 10) || 0;
    const minAlertNum = parseInt(formMinAlert, 10) || 5;

    const targetProduct: Product = {
      id: editingProduct ? editingProduct.id : `PROD_${Date.now()}`,
      productCode: formCode.trim().toUpperCase(),
      name: formName.trim(),
      category: formCategory.trim() || 'ទូទៅ',
      price: priceNum,
      imageUrl: formImage.trim() || 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&auto=format&fit=crop&q=60',
      stockQty: stockNum,
      initialStock: editingProduct ? editingProduct.initialStock ?? stockNum : stockNum,
      stockIn: editingProduct ? editingProduct.stockIn ?? 0 : 0,
      totalSold: editingProduct ? editingProduct.totalSold ?? 0 : 0,
      minAlertQty: minAlertNum,
    };

    await onSaveProduct(targetProduct);
    setIsProductModalOpen(false);
    onShowToast(`រក្សាទុកផលិតផល ${targetProduct.productCode} ជោគជ័យ!`, 'success');
  };

  // Sync Stock Summary to Google Sheet
  const handleTriggerSyncToSheet = async () => {
    setIsSyncing(true);
    try {
      await onSyncStockReportToSheet();
      onShowToast('បានបញ្ជូនរបាយការណ៍ស្ដុកទៅ Google Sheets រួចរាល់!', 'success');
    } catch (e) {
      onShowToast('បរាជ័យក្នុងការ sync ទៅ Google Sheets', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Export Stock CSV
  const handleExportStockCSV = () => {
    const headers = [
      'កូដទំនិញ (SKU)',
      'ឈ្មោះផលិតផល',
      'ប្រភេទ',
      'តម្លៃរាយ ($)',
      'ស្តុកដើម',
      'នាំចូលសរុប',
      'លក់ចេញសរុប',
      'ស្តុកជាក់ស្តែង',
      'តម្លៃស្តុកសរុប ($)',
      'ស្ថានភាព',
    ];

    const rows = filteredProducts.map(p => {
      const minAlert = p.minAlertQty || 5;
      const status =
        (p.stockQty || 0) === 0
          ? 'អស់ពីស្តុក'
          : (p.stockQty || 0) <= minAlert
          ? 'ស្តុកជិតអស់'
          : 'មានស្តុកគ្រប់គ្រាន់';
      const val = (p.stockQty || 0) * (p.price || 0);

      return [
        `"${p.productCode}"`,
        `"${p.name.replace(/"/g, '""')}"`,
        `"${p.category || '-'}"`,
        `"${p.price.toFixed(2)}"`,
        `"${p.initialStock ?? p.stockQty}"`,
        `"${p.stockIn ?? 0}"`,
        `"${p.totalSold ?? 0}"`,
        `"${p.stockQty}"`,
        `"${val.toFixed(2)}"`,
        `"${status}"`,
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Stock_Inventory_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowToast('បានទាញយកតារាងស្តុកជា CSV ជោគជ័យ!', 'success');
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 sm:p-5 rounded-3xl border border-indigo-500/20 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-2xl shadow-inner text-white">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-black tracking-tight">
                គ្រប់គ្រងស្ដុកទំនិញ (Stock &amp; Adjustment Approval)
              </h2>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-500/30 border border-indigo-400/30 text-indigo-200">
                {totalSKUs} មុខទំនិញ
              </span>
              {pendingAdjustmentsCount > 0 && (
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-300 border border-amber-400/30 animate-pulse flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{pendingAdjustmentsCount} សំណើរង់ចាំ Approval</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              ការថែមស្តុក/Adjustment តម្រូវឱ្យ Admin &amp; Manager Approval រួចទើបផ្ញើ Report ទៅសន្លឹក "Stock In" ក្នុង Google Sheet
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => handleOpenStockIn()}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
          >
            <ArrowDownRight className="w-4 h-4" />
            <span>+ ស្នើសុំ Stock In / Adjustment</span>
          </button>

          {currentUser.type === 'Admin' && (
            <button
              onClick={() => handleOpenEditProduct()}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>បន្ថែមទំនិញថ្មី</span>
            </button>
          )}

          <button
            onClick={handleTriggerSyncToSheet}
            disabled={isSyncing}
            className="px-3 py-2 bg-white/10 hover:bg-white/20 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 border border-white/15 transition-all"
            title="ផ្ញើរបាយការណ៍សរុបទៅ Sheet Stock In"
          >
            <Send className="w-3.5 h-3.5 text-indigo-300" />
            <span>{isSyncing ? 'កំពុងផ្ញើ...' : 'Sync ស្តុកសរុប'}</span>
          </button>
        </div>
      </div>

      {/* Sub-Tabs: Inventory vs Approvals */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'inventory'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>តារាងស្តុកទំនិញ (Current Inventory)</span>
        </button>

        <button
          onClick={() => setActiveTab('adjustments')}
          className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'adjustments'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>សំណើកែសម្រួល &amp; Approval (Stock Adjustments)</span>
          {pendingAdjustmentsCount > 0 && (
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                activeTab === 'adjustments'
                  ? 'bg-amber-400 text-slate-900'
                  : 'bg-amber-500 text-white'
              }`}
            >
              {pendingAdjustmentsCount}
            </span>
          )}
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: INVENTORY STOCK VIEW */}
      {/* ======================================================== */}
      {activeTab === 'inventory' && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white/95 backdrop-blur-xl p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-500">ស្តុកនៅសល់សរុប</p>
                <h4 className="text-base sm:text-lg font-black text-slate-900">{totalStockUnits} ប្រអប់</h4>
              </div>
            </div>

            <div className="bg-white/95 backdrop-blur-xl p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-500">តម្លៃស្តុកសរុប</p>
                <h4 className="text-base sm:text-lg font-black text-emerald-600">${totalStockValue.toFixed(2)}</h4>
              </div>
            </div>

            <div className="bg-white/95 backdrop-blur-xl p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                <ArrowUpRight className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-500">លក់ចេញសរុប</p>
                <h4 className="text-base sm:text-lg font-black text-blue-600">{totalUnitsSold} ប្រអប់</h4>
              </div>
            </div>

            <div className="bg-white/95 backdrop-blur-xl p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
              <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-500">ស្តុកជិតអស់</p>
                <h4 className="text-base sm:text-lg font-black text-amber-600">{lowStockCount} មុខ</h4>
              </div>
            </div>
          </div>

          {/* Filter & Toolbar */}
          <div className="bg-white/95 backdrop-blur-xl p-4 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="ស្វែងរកតាម SKU, ឈ្មោះ, ប្រភេទ..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
              >
                <option value="ALL">គ្រប់ប្រភេទ</option>
                {categories.map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <select
                value={stockStatusFilter}
                onChange={e => setStockStatusFilter(e.target.value as any)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
              >
                <option value="ALL">គ្រប់ស្ថានភាពស្តុក</option>
                <option value="IN_STOCK">🟢 មានស្តុកគ្រប់គ្រាន់</option>
                <option value="LOW">🟡 ស្តុកជិតអស់ (Low Stock)</option>
                <option value="OUT">🔴 អស់ពីស្តុក (Out of Stock)</option>
              </select>
            </div>

            <div className="flex items-center gap-2 self-end md:self-auto">
              <button
                onClick={handleExportStockCSV}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>ទាញយក CSV</span>
              </button>
            </div>
          </div>

          {/* Main Stock Table */}
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            {filteredProducts.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs">
                មិនមានទិន្នន័យទំនិញដែលត្រូវគ្នានឹងការស្វែងរកឡើយ
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 sticky top-0">
                    <tr>
                      <th className="py-3 px-3">ទំនិញ / SKU</th>
                      <th className="py-3 px-3">ប្រភេទ</th>
                      <th className="py-3 px-3">តម្លៃរាយ</th>
                      <th className="py-3 px-3 text-center">ស្តុកដើម</th>
                      <th className="py-3 px-3 text-center">នាំចូល</th>
                      <th className="py-3 px-3 text-center">លក់ចេញ</th>
                      <th className="py-3 px-3 text-center">ស្តុកជាក់ស្តែង</th>
                      <th className="py-3 px-3">តម្លៃស្តុក</th>
                      <th className="py-3 px-3">ស្ថានភាព</th>
                      <th className="py-3 px-3 text-right">សកម្មភាព</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredProducts.map(p => {
                      const minAlert = p.minAlertQty || 5;
                      const currentStock = p.stockQty || 0;
                      const isOut = currentStock === 0;
                      const isLow = currentStock <= minAlert && !isOut;
                      const stockVal = currentStock * (p.price || 0);

                      // Check if product has pending adjustment
                      const hasPending = stockInRecords.some(
                        r => r.productCode.toUpperCase() === p.productCode.toUpperCase() && r.status === 'Pending'
                      );

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                          {/* Product Thumbnail & Title */}
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={p.imageUrl || 'https://via.placeholder.com/80'}
                                alt={p.name}
                                className="w-9 h-9 object-cover rounded-xl border border-slate-200 shrink-0"
                              />
                              <div className="min-w-0 max-w-xs">
                                <p className="font-bold text-slate-900 truncate text-xs" title={p.name}>
                                  {p.name}
                                </p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="text-[10px] font-mono font-semibold text-slate-400">
                                    {p.productCode}
                                  </span>
                                  {hasPending && (
                                    <span className="text-[9px] px-1.5 py-0.2 rounded-full font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                      មានសំណើរង់ចាំ
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-3 text-slate-600 font-medium">
                            {p.category || '-'}
                          </td>

                          <td className="py-3 px-3 font-bold text-slate-800 font-mono">
                            ${p.price.toFixed(2)}
                          </td>

                          <td className="py-3 px-3 text-center text-slate-500 font-semibold font-mono">
                            {p.initialStock ?? p.stockQty}
                          </td>

                          <td className="py-3 px-3 text-center font-bold text-emerald-600 font-mono">
                            +{p.stockIn ?? 0}
                          </td>

                          <td className="py-3 px-3 text-center font-bold text-rose-600 font-mono">
                            -{p.totalSold ?? 0}
                          </td>

                          <td className="py-3 px-3 text-center">
                            <span
                              className={`font-black text-sm px-2.5 py-1 rounded-xl font-mono ${
                                isOut
                                  ? 'bg-rose-100 text-rose-800'
                                  : isLow
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {currentStock}
                            </span>
                          </td>

                          <td className="py-3 px-3 font-bold text-slate-800 font-mono">
                            ${stockVal.toFixed(2)}
                          </td>

                          <td className="py-3 px-3">
                            {isOut ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800">
                                អស់ពីស្តុក
                              </span>
                            ) : isLow ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800">
                                ជិតអស់ ({currentStock})
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                                គ្រប់គ្រាន់
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenStockIn(p, 'Stock In')}
                                className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1"
                                title="ស្នើសុំនាំចូលស្តុក"
                              >
                                <Plus className="w-3 h-3" />
                                <span>កែស្តុក</span>
                              </button>
                              {currentUser.type === 'Admin' && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditProduct(p)}
                                  className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                                  title="កែប្រែព័ត៌មានទំនិញ"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ======================================================== */}
      {/* TAB 2: STOCK ADJUSTMENTS & APPROVAL WORKFLOW VIEW */}
      {/* ======================================================== */}
      {activeTab === 'adjustments' && (
        <div className="space-y-4">
          {/* Policy Information Card */}
          <div className="p-4 bg-gradient-to-r from-amber-50 via-indigo-50 to-emerald-50 rounded-2xl border border-amber-200/80 text-xs text-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span className="font-extrabold text-slate-900 text-sm">
                  គោលការណ៍ Approval ស្តុកទំនិញ (Stock In &amp; Adjustment Policy)
                </span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                • <strong>ការថែម/កែសម្រួលស្តុក៖</strong> រក្សាទុកក្នុងប្រព័ន្ធជាសំណើ (Pending) ដោយ<strong>មិនផ្ញើទៅ Google Sheet</strong> ភ្លាមៗឡើយ។<br />
                • <strong>Admin និង Manager៖</strong> ជាអ្នកពិនិត្យមើល និងចុច <strong>Approval (អនុម័ត)</strong>។<br />
                • <strong>ពេល Approval៖</strong> ប្រព័ន្ធនឹងកែប្រែចំនួនស្តុកជាក់ស្តែង រួច<strong>ផ្ញើ Report Stock In ទៅ Google Sheet (Tab "Stock In")</strong> ដោយស្វ័យប្រវត្តិ!
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleOpenStockIn()}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>+ បង្កើតសំណើកែស្តុក</span>
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white/95 backdrop-blur-xl p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="ស្វែងរកតាម SKU, ឈ្មោះ, អ្នកស្នើសុំ..."
                  value={adjustmentSearch}
                  onChange={e => setAdjustmentSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                <button
                  onClick={() => setAdjustmentStatusFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${
                    adjustmentStatusFilter === 'ALL'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ទាំងអស់ ({stockInRecords.length})
                </button>
                <button
                  onClick={() => setAdjustmentStatusFilter('Pending')}
                  className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 ${
                    adjustmentStatusFilter === 'Pending'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'text-amber-700 hover:text-amber-800'
                  }`}
                >
                  <Clock className="w-3 h-3" />
                  <span>រង់ចាំ Approval ({pendingAdjustmentsCount})</span>
                </button>
                <button
                  onClick={() => setAdjustmentStatusFilter('Approved')}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${
                    adjustmentStatusFilter === 'Approved'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-emerald-700 hover:text-emerald-800'
                  }`}
                >
                  បានអនុម័ត
                </button>
                <button
                  onClick={() => setAdjustmentStatusFilter('Rejected')}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${
                    adjustmentStatusFilter === 'Rejected'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-rose-700 hover:text-rose-800'
                  }`}
                >
                  បានបដិសេធ
                </button>
              </div>
            </div>

            <div className="text-[11px] font-semibold text-slate-500 self-end sm:self-auto">
              សរុប {filteredAdjustments.length} កំណត់ត្រា
            </div>
          </div>

          {/* Adjustments List / Table */}
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            {filteredAdjustments.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs">
                មិនមានសំណើកែសម្រួលស្តុកក្នុងប្រភេទនេះឡើយ
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 sticky top-0">
                    <tr>
                      <th className="py-3 px-3">កាលបរិច្ឆេទ &amp; ម៉ោង</th>
                      <th className="py-3 px-3">មុខទំនិញ</th>
                      <th className="py-3 px-3">ប្រភេទសំណើ</th>
                      <th className="py-3 px-3 text-center">បម្រែបម្រួល Qty</th>
                      <th className="py-3 px-3 text-center">ស្តុកមុន &gt; ក្រោយ</th>
                      <th className="py-3 px-3">អ្នកស្នើសុំ</th>
                      <th className="py-3 px-3">ស្ថានភាព &amp; អ្នក Approval</th>
                      <th className="py-3 px-3">កំណត់ចំណាំ</th>
                      <th className="py-3 px-3 text-right">សកម្មភាព (Admin/Manager)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAdjustments.map(rec => {
                      const isPending = rec.status === 'Pending';
                      const isApproved = rec.status === 'Approved';
                      const isRejected = rec.status === 'Rejected';
                      const isPositive = rec.addedQty > 0;

                      return (
                        <tr
                          key={rec.id}
                          className={`hover:bg-slate-50/70 transition-colors ${
                            isPending ? 'bg-amber-50/30' : ''
                          }`}
                        >
                          {/* Date & Timestamp */}
                          <td className="py-3 px-3 font-mono text-slate-600">
                            <div className="font-bold text-slate-800">{rec.date}</div>
                            <div className="text-[10px] text-slate-400">
                              {rec.timestamp ? rec.timestamp.split('T')[1]?.slice(0, 5) : '-'}
                            </div>
                          </td>

                          {/* Product */}
                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-900">{rec.productName}</div>
                            <div className="font-mono text-[10px] font-semibold text-slate-400">
                              {rec.productCode}
                            </div>
                          </td>

                          {/* Adjustment Type */}
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              {rec.type || 'Stock In'}
                            </span>
                          </td>

                          {/* Added Qty */}
                          <td className="py-3 px-3 text-center font-mono font-black text-sm">
                            <span
                              className={
                                isPositive
                                  ? 'text-emerald-600'
                                  : 'text-rose-600'
                              }
                            >
                              {isPositive ? `+${rec.addedQty}` : rec.addedQty}
                            </span>
                          </td>

                          {/* Previous & New Stock */}
                          <td className="py-3 px-3 text-center font-mono">
                            <span className="text-slate-500">{rec.previousStock}</span>
                            <span className="mx-1 text-slate-300">→</span>
                            <span className="font-bold text-indigo-700">{rec.newStock}</span>
                          </td>

                          {/* Requester with ID BA */}
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-[11px] px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
                                {rec.baId || rec.requestedById || (rec.updatedBy && rec.updatedBy.startsWith('BA') ? rec.updatedBy : 'BA Staff')}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-600 font-medium mt-0.5">
                              {rec.requestedBy || 'Staff'}
                            </div>
                          </td>

                          {/* Status Badge & Approver */}
                          <td className="py-3 px-3">
                            {isPending && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                                <Clock className="w-3 h-3" />
                                <span>រង់ចាំ Approval</span>
                              </span>
                            )}
                            {isApproved && (
                              <div>
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                                  <CheckCircle className="w-3 h-3" />
                                  <span>Approved</span>
                                </span>
                                {rec.approvedBy && (
                                  <p className="text-[10px] text-slate-500 mt-0.5">
                                    ដោយ៖ <strong className="text-slate-700">{rec.approvedBy}</strong>
                                  </p>
                                )}
                              </div>
                            )}
                            {isRejected && (
                              <div>
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                                  <XCircle className="w-3 h-3" />
                                  <span>Rejected</span>
                                </span>
                                {rec.rejectedReason && (
                                  <p className="text-[10px] text-rose-600 mt-0.5">
                                    {rec.rejectedReason}
                                  </p>
                                )}
                              </div>
                            )}
                          </td>

                          {/* Note */}
                          <td className="py-3 px-3 text-slate-600 max-w-xs truncate" title={rec.note}>
                            {rec.note || '-'}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-3 text-right">
                            {isPending ? (
                              isManagerOrAdmin ? (
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleApproveAction(rec.id)}
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-xs transition-transform active:scale-95"
                                    title="អនុម័ត និងផ្ញើ Report ទៅ Google Sheet"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Approval</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setRejectingRecordId(rec.id);
                                      setRejectReason('');
                                    }}
                                    className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-[11px] font-bold transition-colors"
                                    title="បដិសេធសំណើ"
                                  >
                                    <span>បដិសេធ</span>
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[10px] text-slate-400 font-medium">
                                  រង់ចាំ Admin/Manager
                                </span>
                              )
                            ) : (
                              <span className="text-[10px] text-slate-400 font-medium">
                                {isApproved ? 'បាន Sync ទៅ Sheet រួច' : 'មិនបានកែស្តុក'}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: STOCK ADJUSTMENT / STOCK IN (PENDING APPROVAL) */}
      {/* ======================================================== */}
      {isStockInModalOpen && selectedProductForStockIn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-5 border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-600" />
                  <span>ស្នើសុំកែសម្រួលស្តុក (Stock Adjustment)</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  {selectedProductForStockIn.name} ({selectedProductForStockIn.productCode})
                </p>
              </div>
              <button
                onClick={() => setIsStockInModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Informational notice */}
            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
              <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">មិនទាន់ផ្ញើទៅ Google Sheet ភ្លាមៗទេ:</p>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  សំណើនេះនឹងស្ថិតក្នុងស្ថានភាព <strong>Pending</strong>។ នៅពេល Admin ឬ Manager ចុច <strong>Approval</strong> រួច ទើបប្រព័ន្ធធ្វើការកាត់ស្តុកពិតប្រាកដ និងផ្ញើរបាយការណ៍ទៅសន្លឹក "Stock In" ក្នុង Google Sheet។
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              {/* Requester ID BA Info */}
              <div className="flex items-center justify-between p-2.5 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs">
                <span className="text-slate-500 font-medium">អ្នកស្នើសុំ (ID BA):</span>
                <span className="font-mono font-bold text-indigo-700">
                  {currentUser.id}{' '}
                  <span className="text-slate-600 font-sans font-normal">({currentUser.name})</span>
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">ជ្រើសរើសទំនិញ</label>
                <select
                  value={selectedProductForStockIn.id}
                  onChange={e => {
                    const found = products.find(p => p.id === e.target.value);
                    if (found) setSelectedProductForStockIn(found);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.productCode} - {p.name} (ស្តុកបច្ចុប្បន្ន: {p.stockQty})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">ប្រភេទនៃការកែសម្រួលស្តុក</label>
                <select
                  value={adjustmentType}
                  onChange={e => setAdjustmentType(e.target.value as StockAdjustmentType)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none"
                >
                  <option value="Stock In">📦 នាំចូលទំនិញថ្មី (Stock In +)</option>
                  <option value="Adjustment">⚖️ កែសម្រួលចំនួនស្តុក (Inventory Adjustment +)</option>
                  <option value="Damage">⚠️ ទំនិញខូចខាត/ផុតកំណត់ (Damage/Expired -)</option>
                  <option value="Return">🔄 អតិថិជនដូរត្រឡប់ (Return +)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  {adjustmentType === 'Damage' ? 'ចំនួនខូចខាតដែលត្រូវកាត់ (- ប្រអប់)' : 'ចំនួនដែលត្រូវបន្ថែម (+ ប្រអប់)'}
                </label>
                <input
                  type="number"
                  min="1"
                  value={stockInQty}
                  onChange={e => setStockInQty(Math.max(1, parseInt(e.target.value, 10) || 0))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  មូលហេតុ / កំណត់ចំណាំ / លេខវិក្កយបត្រ
                </label>
                <input
                  type="text"
                  value={stockInNote}
                  onChange={e => setStockInNote(e.target.value)}
                  placeholder="ឧ. នាំចូលបន្ថែមពីឃ្លាំងធំ / រាប់ឃើញខ្វះ / ..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Calculated preview */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>ស្តុកបច្ចុប្បន្ន:</span>
                  <span className="font-mono font-bold">{selectedProductForStockIn.stockQty || 0} ប្រអប់</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>បម្រែបម្រួលសំណើ:</span>
                  <span
                    className={`font-mono font-bold ${
                      adjustmentType === 'Damage' ? 'text-rose-600' : 'text-emerald-600'
                    }`}
                  >
                    {adjustmentType === 'Damage' ? `-${stockInQty}` : `+${stockInQty}`} ប្រអប់
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200 font-bold text-slate-900">
                  <span>ស្តុកថ្មីក្រោយ Admin/Manager អនុម័ត:</span>
                  <span className="font-mono text-indigo-700 font-black">
                    {adjustmentType === 'Damage'
                      ? Math.max(0, (selectedProductForStockIn.stockQty || 0) - stockInQty)
                      : (selectedProductForStockIn.stockQty || 0) + stockInQty}{' '}
                    ប្រអប់
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setIsStockInModalOpen(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                បោះបង់
              </button>
              <button
                type="button"
                disabled={isSubmittingAdjustment}
                onClick={handleConfirmStockIn}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50"
              >
                {isSubmittingAdjustment ? 'កំពុងកត់ត្រា...' : 'បញ្ជូនសំណើកែស្តុក'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: REJECT REASON */}
      {/* ======================================================== */}
      {rejectingRecordId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-xl max-w-sm w-full p-5 border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <XCircle className="w-4 h-4 text-rose-600" />
                <span>បដិសេធសំណើកែស្តុក</span>
              </h3>
              <button
                onClick={() => setRejectingRecordId(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-600">
                តើអ្នកពិតជាចង់បដិសេធសំណើកែសម្រួលស្តុកនេះមែនទេ? ស្តុកទំនិញនឹងមិនត្រូវបានកែប្រែឡើយ។
              </p>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  មូលហេតុនៃការបដិសេធ (Reason)
                </label>
                <input
                  type="text"
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  placeholder="ឧ. ចំនួនមិនត្រឹមត្រូវ / មិនមានវិក្កយបត្របញ្ជាក់..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setRejectingRecordId(null)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                ថយក្រោយ
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md"
              >
                បញ្ជាក់ការបដិសេធ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADD / EDIT PRODUCT */}
      {/* ======================================================== */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-5 border border-slate-100 space-y-3.5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                {editingProduct ? 'កែប្រែព័ត៌មានទំនិញ' : 'បន្ថែមផលិតផលថ្មី'}
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">កូដទំនិញ (SKU Code) *</label>
                <input
                  type="text"
                  value={formCode}
                  onChange={e => setFormCode(e.target.value.toUpperCase())}
                  placeholder="ឧ. PM0005"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">ឈ្មោះផលិតផល *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="ឧ. Peter&Moré_Collagen"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">ប្រភេទ (Category)</label>
                  <input
                    type="text"
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value)}
                    placeholder="ឧ. ខូឡាជេន"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">តម្លៃលក់រាយ ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formPrice}
                    onChange={e => setFormPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">ស្តុកបច្ចុប្បន្ន (ប្រអប់)</label>
                  <input
                    type="number"
                    value={formStock}
                    onChange={e => setFormStock(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">កម្រិតស្តុកជិតអស់ (Min Alert)</label>
                  <input
                    type="number"
                    value={formMinAlert}
                    onChange={e => setFormMinAlert(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">តំណភ្ជាប់រូបភាព (Image URL)</label>
                <input
                  type="text"
                  value={formImage}
                  onChange={e => setFormImage(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                បោះបង់
              </button>
              <button
                type="button"
                onClick={handleSaveProductSubmit}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md"
              >
                រក្សាទុក
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
