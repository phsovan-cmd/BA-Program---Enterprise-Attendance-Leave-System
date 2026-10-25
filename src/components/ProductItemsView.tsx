import React, { useState, useMemo, useRef } from 'react';
import {
  Package,
  Plus,
  Upload,
  Download,
  FileSpreadsheet,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Edit2,
  Trash2,
  Lock,
  ShieldCheck,
  Image as ImageIcon,
  DollarSign,
  Layers,
  Sparkles,
  X,
  FileText,
  Copy,
  ChevronRight,
  Send,
  Eye,
  Check,
} from 'lucide-react';
import { User, Product } from '../types';

interface ProductItemsViewProps {
  currentUser: User;
  products: Product[];
  onSaveProduct: (product: Product) => Promise<void>;
  onBulkSaveProducts: (newProducts: Product[]) => Promise<void>;
  onDeleteProduct: (productId: string) => Promise<void>;
  onSyncProductListToSheet: () => Promise<void>;
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

interface ParsedUploadItem {
  id: string;
  productCode: string;
  name: string;
  category: string;
  price: number;
  stockQty: number;
  initialStock: number;
  minAlertQty: number;
  imageUrl: string;
  isValid: boolean;
  error?: string;
  selected: boolean;
}

export const ProductItemsView: React.FC<ProductItemsViewProps> = ({
  currentUser,
  products,
  onSaveProduct,
  onBulkSaveProducts,
  onDeleteProduct,
  onSyncProductListToSheet,
  onShowToast,
}) => {
  const isAdmin = currentUser.type === 'Admin';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Single Item Modal states
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formPrice, setFormPrice] = useState('0');
  const [formStock, setFormStock] = useState('0');
  const [formMinAlert, setFormMinAlert] = useState('5');
  const [formImage, setFormImage] = useState('');
  const [formIsHot, setFormIsHot] = useState(false);
  const [isSavingItem, setIsSavingItem] = useState(false);
  const saveItemLock = useRef(false);

  // Delete Confirmation Modal states
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Bulk Upload Modal states
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadTab, setUploadTab] = useState<'file' | 'paste'>('file');
  const [pasteData, setPasteData] = useState('');
  const [parsedItems, setParsedItems] = useState<ParsedUploadItem[]>([]);
  const [isProcessingUpload, setIsProcessingUpload] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageUploadRef = useRef<HTMLInputElement>(null);

  // Confirm delete product handler without blocking window.confirm
  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;
    try {
      setIsDeleting(true);
      await onDeleteProduct(productToDelete.id);
      setProductToDelete(null);
    } catch (e) {
      console.error(e);
      onShowToast('មានបញ្ហាក្នុងការលុបទំនិញ!', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Extract Categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (selectedCategory !== 'ALL' && p.category !== selectedCategory) {
        return false;
      }
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
  }, [products, selectedCategory, searchQuery]);

  // Open Form for Adding New Product
  const handleOpenAddForm = () => {
    if (!isAdmin) {
      onShowToast('សិទ្ធិបន្ថែមទំនិញអនុញ្ញាតសម្រាប់តែ Admin ប៉ុណ្ណោះ!', 'error');
      return;
    }
    setEditingProduct(null);
    setFormCode('');
    setFormName('');
    setFormCategory('Cleanser');
    setFormPrice('15.00');
    setFormStock('50');
    setFormMinAlert('5');
    setFormImage('https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&auto=format&fit=crop&q=60');
    setFormIsHot(false);
    setIsItemModalOpen(true);
  };

  // Open Form for Editing Product
  const handleOpenEditForm = (product: Product) => {
    if (!isAdmin) {
      onShowToast('សិទ្ធិកែប្រែទំនិញអនុញ្ញាតសម្រាប់តែ Admin ប៉ុណ្ណោះ!', 'error');
      return;
    }
    setEditingProduct(product);
    setFormCode(product.productCode);
    setFormName(product.name);
    setFormCategory(product.category || 'ទូទៅ');
    setFormPrice(String(product.price));
    setFormStock(String(product.stockQty));
    setFormMinAlert(String(product.minAlertQty || 5));
    setFormImage(product.imageUrl || '');
    setFormIsHot(product.isHot || false);
    setIsItemModalOpen(true);
  };

  // Save Single Product
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saveItemLock.current) return;
    if (!isAdmin) return;

    if (!formCode.trim()) {
      onShowToast('សូមបញ្ចូលកូដទំនិញ (Product Code / SKU)!', 'error');
      return;
    }
    if (!formName.trim()) {
      onShowToast('សូមបញ្ចូលឈ្មោះទំនិញ!', 'error');
      return;
    }

    const priceNum = parseFloat(formPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      onShowToast('សូមបញ្ចូលតម្លៃទំនិញឱ្យបានត្រឹមត្រូវ!', 'error');
      return;
    }

    const stockNum = parseInt(formStock, 10);
    const minAlertNum = parseInt(formMinAlert, 10);

    const productPayload: Product = {
      id: editingProduct ? editingProduct.id : `PROD_${Date.now()}`,
      productCode: formCode.trim().toUpperCase(),
      name: formName.trim(),
      category: formCategory.trim() || 'ទូទៅ',
      price: priceNum,
      stockQty: isNaN(stockNum) ? 0 : Math.max(0, stockNum),
      initialStock: editingProduct ? (editingProduct.initialStock ?? stockNum) : stockNum,
      stockIn: editingProduct ? (editingProduct.stockIn ?? 0) : 0,
      totalSold: editingProduct ? (editingProduct.totalSold ?? 0) : 0,
      minAlertQty: isNaN(minAlertNum) ? 5 : Math.max(1, minAlertNum),
      imageUrl:
        formImage.trim() ||
        'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&auto=format&fit=crop&q=60',
      isHot: formIsHot,
    };

    try {
      saveItemLock.current = true;
      setIsSavingItem(true);
      await onSaveProduct(productPayload);
      setIsItemModalOpen(false);
      onShowToast(
        editingProduct
          ? `បានកែប្រែទំនិញ ${productPayload.productCode} ជោគជ័យ!`
          : `បានបញ្ចូលទំនិញថ្មី ${productPayload.productCode} ជោគជ័យ!`,
        'success'
      );
    } catch (err: any) {
      onShowToast('បរាជ័យក្នុងការរក្សាទុកទំនិញ!', 'error');
    } finally {
      saveItemLock.current = false;
      setIsSavingItem(false);
    }
  };

  // Handle local image file upload converting to base64
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      onShowToast('សូមជ្រើសរើសប្រភេទ File រូបភាព (JPG, PNG, WebP)!', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFormImage(reader.result);
        onShowToast('បានបញ្ចូលរូបភាពជោគជ័យ!', 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  // Download CSV Template
  const handleDownloadTemplate = () => {
    const headers = ['ProductCode', 'Name', 'Category', 'Price', 'StockQty', 'MinAlertQty', 'ImageUrl'];
    const sampleRows = [
      ['CERAVE-FOAM-473ML', 'CeraVe Foaming Cleanser 473ml', 'Cleanser', '16.50', '50', '5', 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500'],
      ['LAROCHE-DUO-40ML', 'La Roche-Posay Effaclar Duo+ 40ml', 'Treatment', '21.00', '30', '5', 'https://images.unsplash.com/photo-1567928815104-b7980ee5032e?w=500'],
      ['ANESSA-SUN-60ML', 'Anessa Perfect UV Sunscreen Milk 60ml', 'Sunscreen', '28.00', '40', '8', 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=500'],
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...sampleRows.map(r => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'Product_List_Template_BA_Control.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowToast('បានទាញយកគំរូ CSV Template ជោគជ័យ!', 'success');
  };

  // Parse Text Lines from CSV or Paste Area
  const parseRawLines = (text: string) => {
    const lines = text
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(l => l.length > 0);

    if (lines.length === 0) {
      setParsedItems([]);
      return;
    }

    const results: ParsedUploadItem[] = [];

    // Check if line 0 is header
    const firstLineLower = lines[0].toLowerCase();
    const isHeader =
      firstLineLower.includes('code') ||
      firstLineLower.includes('sku') ||
      firstLineLower.includes('name') ||
      firstLineLower.includes('product') ||
      firstLineLower.includes('price');

    const dataLines = isHeader ? lines.slice(1) : lines;

    dataLines.forEach((line, index) => {
      // Support Tab, Comma, or Semicolon
      let cols: string[] = [];
      if (line.includes('\t')) {
        cols = line.split('\t').map(c => c.trim());
      } else if (line.includes(',')) {
        cols = line.split(',').map(c => c.replace(/^["']|["']$/g, '').trim());
      } else if (line.includes(';')) {
        cols = line.split(';').map(c => c.replace(/^["']|["']$/g, '').trim());
      } else {
        cols = [line.trim()];
      }

      const productCode = (cols[0] || '').toUpperCase();
      const name = cols[1] || productCode;
      const category = cols[2] || 'ទូទៅ';
      const price = parseFloat(cols[3] || '0') || 0;
      const stockQty = parseInt(cols[4] || '0', 10) || 0;
      const minAlertQty = parseInt(cols[5] || '5', 10) || 5;
      const imageUrl = cols[6] || 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500';

      const isValid = Boolean(productCode && name && !isNaN(price) && price >= 0);
      const errorMsg = !productCode
        ? 'ខ្វះ Product Code'
        : !name
        ? 'ខ្វះឈ្មោះទំនិញ'
        : price < 0
        ? 'តម្លៃមិនត្រឹមត្រូវ'
        : undefined;

      results.push({
        id: `UPLOAD_${Date.now()}_${index}`,
        productCode,
        name,
        category,
        price,
        stockQty,
        initialStock: stockQty,
        minAlertQty,
        imageUrl,
        isValid,
        error: errorMsg,
        selected: isValid,
      });
    });

    setParsedItems(results);
  };

  // File Upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = ev => {
      const content = ev.target?.result as string;
      if (content) {
        parseRawLines(content);
        onShowToast(`បានអានឯកសារ ${file.name} រួចរាល់!`, 'info');
      }
    };
    reader.readAsText(file);
  };

  // Confirm Bulk Upload
  const handleConfirmBulkUpload = async () => {
    if (!isAdmin) {
      onShowToast('សិទ្ធិ Upload ទំនិញអនុញ្ញាតសម្រាប់តែ Admin ប៉ុណ្ណោះ!', 'error');
      return;
    }

    const itemsToImport = parsedItems.filter(i => i.selected && i.isValid);
    if (itemsToImport.length === 0) {
      onShowToast('សូមជ្រើសរើសទំនិញដែលត្រឹមត្រូវយ៉ាងតិច ១ មុខដើម្បី Upload!', 'error');
      return;
    }

    try {
      setIsProcessingUpload(true);
      const newProducts: Product[] = itemsToImport.map(item => ({
        id: `PROD_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        productCode: item.productCode,
        name: item.name,
        category: item.category,
        price: item.price,
        stockQty: item.stockQty,
        initialStock: item.initialStock,
        stockIn: 0,
        totalSold: 0,
        minAlertQty: item.minAlertQty,
        imageUrl: item.imageUrl,
      }));

      await onBulkSaveProducts(newProducts);
      setIsUploadModalOpen(false);
      setParsedItems([]);
      setPasteData('');
      onShowToast(`បាន Upload និងបន្ថែមទំនិញចំនួន ${newProducts.length} មុខដោយជោគជ័យ!`, 'success');
    } catch (err: any) {
      onShowToast('មានបញ្ហាក្នុងការ Upload ទំនិញ!', 'error');
    } finally {
      setIsProcessingUpload(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Admin Action Bar: Add Form & Upload Form */}
      <div className="bg-white/95 backdrop-blur-xl p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              សិទ្ធិប្រតិបត្តិការទំនិញ:
            </span>
            {isAdmin ? (
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Admin (Full Access)
              </span>
            ) : (
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1">
                <Lock className="w-3 h-3 text-slate-400" />
                Staff (Read Only)
              </span>
            )}
          </div>

          {/* Admin Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {isAdmin ? (
              <>
                <button
                  onClick={handleOpenAddForm}
                  className="px-3.5 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all duration-150 active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ បញ្ចូលទំនិញថ្មី</span>
                </button>

                <button
                  onClick={() => {
                    setIsUploadModalOpen(true);
                    setParsedItems([]);
                    setPasteData('');
                  }}
                  className="px-3.5 py-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all duration-150 active:scale-95"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload ទំនិញជាបណ្តុំ (Excel/CSV)</span>
                </button>

                <button
                  onClick={handleDownloadTemplate}
                  className="px-3 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 border border-slate-300 transition-all duration-150"
                  title="ទាញយកគំរូ CSV"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  <span className="hidden sm:inline">គំរូ CSV</span>
                </button>
              </>
            ) : (
              <div className="text-[11px] text-slate-500 flex items-center gap-1 italic">
                <Lock className="w-3.5 h-3.5 text-amber-500" />
                សូមទាក់ទង Admin ដើម្បីបន្ថែម ឬ Upload ទំនិញ
              </div>
            )}
          </div>
        </div>

        {/* Filters & Search */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2 border-t border-slate-100">
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="ស្វែងរកតាម Product Code, ឈ្មោះផលិតផល, ប្រភេទ..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 rounded-2xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
            />
          </div>

          <div className="sm:col-span-4">
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 rounded-2xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
            >
              <option value="ALL">គ្រប់ប្រភេទផលិតផលទាំងអស់ ({products.length})</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2 flex items-center justify-end gap-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'grid'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              title="Card Grid"
            >
              <Layers className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'table'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              title="Table View"
            >
              <FileSpreadsheet className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Catalog Display: Grid Cards or Table */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white/95 rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h4 className="font-bold text-slate-800 text-sm sm:text-base">រកមិនឃើញមុខទំនិញដែលស្វែងរក</h4>
          <p className="text-xs text-slate-500 mt-1">
            សូមសាកល្បងបញ្ចូលពាក្យគន្លឹះផ្សេង ឬចុច "+ បញ្ចូលទំនិញថ្មី" សម្រាប់ Admin
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {filteredProducts.map(p => (
            <div
              key={p.id}
              className="bg-white rounded-3xl p-3 border border-slate-200/90 shadow-xs flex flex-col justify-between hover:shadow-md transition-all duration-200 group relative overflow-hidden"
            >
              {p.isHot && (
                <div className="absolute top-2 left-2 z-10 bg-gradient-to-r from-amber-500 to-rose-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-sm flex items-center gap-0.5">
                  <Sparkles className="w-2.5 h-2.5" />
                  HOT
                </div>
              )}

              <div className="relative aspect-square w-full rounded-2xl bg-slate-100 overflow-hidden mb-2.5">
                <img
                  src={p.imageUrl || 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500'}
                  alt={p.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              </div>

              <div className="space-y-1 flex-grow">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  {p.category || 'ទូទៅ'}
                </span>
                <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 line-clamp-1" title={p.name}>
                  {p.name}
                </h4>
                <div className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg inline-block">
                  {p.productCode}
                </div>
              </div>

              <div className="pt-2.5 mt-2 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-400 font-medium">តម្លៃលក់</div>
                  <div className="text-sm font-black text-emerald-600">${p.price.toFixed(2)}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 font-medium">ស្តុកជាក់ស្តែង</div>
                  <div className="text-xs font-bold text-slate-800">{p.stockQty} កំប៉ុង</div>
                </div>
              </div>

              {/* Action Buttons for Admin */}
              {isAdmin && (
                <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-end gap-1.5">
                  <button
                    onClick={() => handleOpenEditForm(p)}
                    className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                    title="កែប្រែទំនិញ"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setProductToDelete(p)}
                    className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer active:scale-95"
                    title="លុបទំនិញ"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <th className="p-3 w-12 text-center">ល.រ</th>
                  <th className="p-3">រូបភាព</th>
                  <th className="p-3">កូដទំនិញ (SKU)</th>
                  <th className="p-3">ឈ្មោះផលិតផល</th>
                  <th className="p-3">ប្រភេទ</th>
                  <th className="p-3 text-right">តម្លៃលក់ ($)</th>
                  <th className="p-3 text-right">ស្តុកជាក់ស្តែង</th>
                  <th className="p-3 text-right">លក់បាន</th>
                  {isAdmin && <th className="p-3 text-center w-24">សកម្មភាព</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((p, idx) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 text-center font-bold text-slate-400">{idx + 1}</td>
                    <td className="p-3">
                      <img
                        src={p.imageUrl || 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500'}
                        alt={p.name}
                        className="w-10 h-10 object-cover rounded-xl border border-slate-200"
                      />
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-800">{p.productCode}</td>
                    <td className="p-3 font-bold text-slate-900">{p.name}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 font-medium text-xs">
                        {p.category || 'ទូទៅ'}
                      </span>
                    </td>
                    <td className="p-3 text-right font-black text-emerald-600">${p.price.toFixed(2)}</td>
                    <td className="p-3 text-right font-bold text-slate-800">{p.stockQty}</td>
                    <td className="p-3 text-right font-bold text-indigo-600">{p.totalSold || 0}</td>
                    {isAdmin && (
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditForm(p)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                            title="កែប្រែ"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setProductToDelete(p)}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer active:scale-95"
                            title="លុប"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: FORM បញ្ចូលទំនិញថ្មី / កែប្រែ (Admin Single Product Form) */}
      {/* ========================================================================= */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-100 my-8 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    {editingProduct ? 'កែប្រែព័ត៌មានទំនិញ' : 'Form បញ្ចូលមុខទំនិញថ្មី (Admin)'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    ព័ត៌មាននេះនឹងត្រូវបាន sync ទៅសន្លឹក "Product List" ក្នុង Google Sheet
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsItemModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  កូដទំនិញ / SKU <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="ឧទាហរណ៍: CERAVE-FOAM-473ML"
                  value={formCode}
                  onChange={e => setFormCode(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ឈ្មោះផលិតផល <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="ឧទាហរណ៍: CeraVe Foaming Facial Cleanser 473ml"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ប្រភេទ (Category)</label>
                  <input
                    type="text"
                    placeholder="Cleanser, Serum..."
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    តម្លៃលក់ ($ USD) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={formPrice}
                      onChange={e => setFormPrice(e.target.value)}
                      className="w-full pl-7 pr-3 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-bold text-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ចំនួនស្តុកជាក់ស្តែង</label>
                  <input
                    type="number"
                    min="0"
                    value={formStock}
                    onChange={e => setFormStock(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">កម្រិតរោទ៍ជិតអស់ស្តុក</label>
                  <input
                    type="number"
                    min="1"
                    value={formMinAlert}
                    onChange={e => setFormMinAlert(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-bold text-amber-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">រូបភាពផលិតផល</label>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                    <img
                      src={formImage || 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500'}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-grow space-y-1.5">
                    <input
                      type="url"
                      placeholder="បញ្ចូល Image URL..."
                      value={formImage}
                      onChange={e => setFormImage(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => imageUploadRef.current?.click()}
                        className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center gap-1 border border-slate-300"
                      >
                        <ImageIcon className="w-3 h-3 text-slate-500" />
                        Upload File រូបភាព
                      </button>
                      <input
                        ref={imageUploadRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageFileChange}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="hotItemCheck"
                  checked={formIsHot}
                  onChange={e => setFormIsHot(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="hotItemCheck" className="text-xs font-bold text-slate-700 cursor-pointer">
                  ដាក់ជាទំនិញពេញនិយម (Hot Selling Badge)
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsItemModalOpen(false)}
                  className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  disabled={isSavingItem}
                  className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 disabled:opacity-50"
                >
                  {isSavingItem ? 'កំពុងរក្សាទុក...' : 'រក្សាទុកទំនិញ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: FORM UPLOAD ទំនិញជាបណ្តុំ (Excel / CSV / Direct Paste for Admin) */}
      {/* ========================================================================= */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-5 sm:p-6 shadow-2xl border border-slate-100 my-8 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    Form Upload បញ្ជីមុខទំនិញ (Admin Only)
                  </h3>
                  <p className="text-xs text-slate-500">
                    បញ្ចូលទំនិញច្រើនមុខក្នុងពេលតែមួយតាមរយៈ CSV / Excel file ឬ Copy-Paste
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Upload Method Tabs */}
            <div className="flex gap-2 border-b border-slate-100 pb-2">
              <button
                onClick={() => setUploadTab('file')}
                className={`px-4 py-2 rounded-2xl font-bold text-xs flex items-center gap-1.5 transition-all ${
                  uploadTab === 'file'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Upload ឯកសារ (CSV / Excel)</span>
              </button>

              <button
                onClick={() => setUploadTab('paste')}
                className={`px-4 py-2 rounded-2xl font-bold text-xs flex items-center gap-1.5 transition-all ${
                  uploadTab === 'paste'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy-Paste ទិន្នន័យផ្ទាល់</span>
              </button>

              <div className="ml-auto">
                <button
                  onClick={handleDownloadTemplate}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 border border-slate-200"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>ទាញយកគំរូ CSV</span>
                </button>
              </div>
            </div>

            {/* Tab 1: File Upload */}
            {uploadTab === 'file' && (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-3xl p-6 sm:p-8 text-center bg-slate-50/50 hover:bg-blue-50/20 cursor-pointer transition-all"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv, .txt, .tsv"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <FileSpreadsheet className="w-10 h-10 text-blue-600 mx-auto mb-2" />
                <h4 className="font-extrabold text-sm text-slate-800">
                  ចុចទីនេះដើម្បីជ្រើសរើសឯកសារ CSV ឬ Excel (.csv, .tsv)
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  ទ្រង់ទ្រាយជួរឈរ: <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px]">ProductCode, Name, Category, Price, Stock, MinAlert, ImageUrl</code>
                </p>
              </div>
            )}

            {/* Tab 2: Direct Paste */}
            {uploadTab === 'paste' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-600 font-semibold">
                  <span>Paste ទិន្នន័យដែលបាន Copy ពី Excel ឬ Google Sheet ទីនេះ:</span>
                  <span className="text-[11px] text-slate-400">គាំទ្រ Tab ឬ Comma</span>
                </div>
                <textarea
                  rows={5}
                  value={pasteData}
                  onChange={e => {
                    setPasteData(e.target.value);
                    parseRawLines(e.target.value);
                  }}
                  placeholder="CERAVE-FOAM-473ML&#9;CeraVe Foaming Cleanser 473ml&#9;Cleanser&#9;16.50&#9;50&#9;5&#10;LAROCHE-DUO-40ML&#9;La Roche-Posay Effaclar Duo+ 40ml&#9;Treatment&#9;21.00&#9;30&#9;5"
                  className="w-full p-3 font-mono text-xs bg-slate-50 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 leading-relaxed"
                />
              </div>
            )}

            {/* Parsed Preview Table */}
            {parsedItems.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-black text-slate-800 flex items-center gap-2">
                    <span>លទ្ធផលផ្ទៀងផ្ទាត់ ({parsedItems.length} មុខ):</span>
                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[11px]">
                      ត្រឹមត្រូវ {parsedItems.filter(i => i.isValid).length}
                    </span>
                    {parsedItems.some(i => !i.isValid) && (
                      <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 text-[11px]">
                        ខុសទម្រង់ {parsedItems.filter(i => !i.isValid).length}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const allSelected = parsedItems.every(i => i.selected);
                      setParsedItems(parsedItems.map(i => ({ ...i, selected: !allSelected })));
                    }}
                    className="text-xs text-blue-600 font-bold hover:underline"
                  >
                    ជ្រើសរើសទាំងអស់ / ដោះទាំងអស់
                  </button>
                </div>

                <div className="max-h-60 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 sticky top-0 text-slate-600 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-2 w-8 text-center"></th>
                        <th className="p-2">កូដទំនិញ (SKU)</th>
                        <th className="p-2">ឈ្មោះទំនិញ</th>
                        <th className="p-2">ប្រភេទ</th>
                        <th className="p-2 text-right">តម្លៃ ($)</th>
                        <th className="p-2 text-right">ស្តុក</th>
                        <th className="p-2 text-center">ស្ថានភាព</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/60 bg-white">
                      {parsedItems.map((item, idx) => (
                        <tr key={item.id} className={!item.isValid ? 'bg-rose-50/50' : ''}>
                          <td className="p-2 text-center">
                            <input
                              type="checkbox"
                              checked={item.selected}
                              disabled={!item.isValid}
                              onChange={e => {
                                const checked = e.target.checked;
                                setParsedItems(
                                  parsedItems.map((pi, pidx) => (pidx === idx ? { ...pi, selected: checked } : pi))
                                );
                              }}
                              className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                          </td>
                          <td className="p-2 font-mono font-bold text-slate-800">{item.productCode || '-'}</td>
                          <td className="p-2 font-semibold text-slate-900">{item.name || '-'}</td>
                          <td className="p-2 text-slate-500">{item.category}</td>
                          <td className="p-2 text-right font-black text-emerald-600">
                            ${item.price.toFixed(2)}
                          </td>
                          <td className="p-2 text-right font-bold text-slate-700">{item.stockQty}</td>
                          <td className="p-2 text-center">
                            {item.isValid ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                <Check className="w-2.5 h-2.5" /> ត្រឹមត្រូវ
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                                {item.error || 'ខុស'}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                ជ្រើសរើសបាន:{' '}
                <b>{parsedItems.filter(i => i.selected && i.isValid).length}</b> មុខ
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  បិទ
                </button>
                <button
                  type="button"
                  disabled={isProcessingUpload || parsedItems.filter(i => i.selected && i.isValid).length === 0}
                  onClick={handleConfirmBulkUpload}
                  className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Upload className="w-4 h-4" />
                  <span>
                    {isProcessingUpload
                      ? 'កំពុង Upload...'
                      : `Upload និងបញ្ចូល (${parsedItems.filter(i => i.selected && i.isValid).length}) មុខ`}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: In-App 3D Confirmation Dialog for Product Deletion */}
      {/* ========================================================================= */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 animate-pop-in-3d">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 text-white flex items-center justify-center mx-auto mb-3.5 icon-box-3d">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-slate-900 text-center mb-1">
              បញ្ជាក់ការលុបទំនិញ
            </h3>

            {/* Product card summary inside modal */}
            <div className="my-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
              <img
                src={productToDelete.imageUrl || 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500'}
                alt={productToDelete.name}
                className="w-12 h-12 object-cover rounded-xl border border-slate-200 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <span className="font-mono text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                  {productToDelete.productCode}
                </span>
                <p className="font-bold text-xs text-slate-800 truncate mt-0.5">{productToDelete.name}</p>
                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-0.5">
                  <span className="font-bold text-emerald-600">${productToDelete.price.toFixed(2)}</span>
                  <span>ស្តុក: {productToDelete.stockQty} កំប៉ុង</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-600 text-center mb-5 leading-relaxed">
              តើលោកអ្នកពិតជាចង់លុបទំនិញ <strong className="text-slate-800">«{productToDelete.productCode}»</strong> ({productToDelete.name}) មែនទេ?
              <br />
              <span className="text-rose-500 text-[11px] block mt-1.5 font-medium">
                * ទិន្នន័យនេះនឹងត្រូវលុបចេញពីប្រព័ន្ធ និងធ្វើបច្ចុប្បន្នភាពទៅ Google Sheet "Product List" ភ្លាមៗ!
              </span>
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setProductToDelete(null)}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-all cursor-pointer"
              >
                បោះបង់
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDeleteProduct}
                className="py-2.5 px-4 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white font-bold text-xs rounded-xl shadow-md shadow-rose-500/25 flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <Trash2 className={`w-3.5 h-3.5 ${isDeleting ? 'animate-spin' : ''}`} />
                <span>{isDeleting ? 'កំពុងលុប...' : 'យល់ព្រមលុប'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
