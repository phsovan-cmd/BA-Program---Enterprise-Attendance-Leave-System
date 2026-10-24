import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { User, UserType, UserStatus, MANAGER_IDS } from '../types';
import { formatDateToYMD } from '../utils/date';
import {
  X,
  UploadCloud,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Trash2,
  FileText,
  Users,
  Info,
  Check,
  ChevronRight,
} from 'lucide-react';

interface ParsedUserRow {
  raw: any;
  user: User;
  isValid: boolean;
  error?: string;
  isExisting: boolean;
}

interface UploadUsersModalProps {
  isOpen: boolean;
  existingUsers: User[];
  onClose: () => void;
  onImport: (usersToImport: User[], syncToSheet: boolean) => Promise<void>;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const UploadUsersModal: React.FC<UploadUsersModalProps> = ({
  isOpen,
  existingUsers,
  onClose,
  onImport,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'file' | 'paste'>('file');
  const [fileName, setFileName] = useState<string>('');
  const [parsedRows, setParsedRows] = useState<ParsedUserRow[]>([]);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<{ current: number; total: number } | null>(null);
  const [syncToSheet, setSyncToSheet] = useState(true);
  const [pasteText, setPasteText] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'valid' | 'invalid' | 'new' | 'update'>('all');
  const [searchFilter, setSearchFilter] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Helper to parse dates like "03 January 2025" or Excel numbers or YYYY-MM-DD
  const parseAnyDate = (val: any): string => {
    if (!val) return new Date().toISOString().split('T')[0];
    const s = String(val).trim();

    // Check if it's already YYYY-MM-DD
    const ymd = formatDateToYMD(s);
    if (ymd && ymd.length === 10 && ymd.includes('-')) return ymd;

    // Excel serial number
    if (/^\d{5}$/.test(s)) {
      const serial = parseInt(s, 10);
      const parsedDate = XLSX.SSF.parse_date_code(serial);
      if (parsedDate) {
        const y = parsedDate.y;
        const m = String(parsedDate.m).padStart(2, '0');
        const d = String(parsedDate.d).padStart(2, '0');
        return `${y}-${m}-${d}`;
      }
    }

    const d = new Date(s);
    if (!isNaN(d.getTime())) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    }

    return new Date().toISOString().split('T')[0];
  };

  const parseStatus = (val: any): UserStatus => {
    const s = String(val || '').toLowerCase().trim();
    if (s.includes('pend') || s.includes('រង់ចាំ')) return 'Pending';
    if (s.includes('inact') || s.includes('អសកម្ម') || s.includes('ឈប់') || s.includes('block')) return 'Inactive';
    return 'Active';
  };

  const parseType = (val: any): UserType => {
    const s = String(val || '').toLowerCase().trim();
    if (s.includes('admin') || s.includes('អ្នកគ្រប់គ្រងប្រព័ន្ធ')) return 'Admin';
    if (s.includes('manager') || s.includes('ប្រធាន')) return 'Manager';
    return 'BA Staff';
  };

  const parseManagerId = (val: any): string => {
    if (!val) return '';
    const s = String(val).trim().toUpperCase();
    // Match against known manager IDs or keep cleaned
    const found = MANAGER_IDS.find(m => m.toUpperCase() === s);
    return found || s;
  };

  // Convert row array into User object using header map
  const processRawRows = (rows: any[][]) => {
    if (!rows || rows.length === 0) {
      onShowToast('ឯកសារគ្មានទិន្នន័យទេ!', 'error');
      return;
    }

    // Find header row by looking for keywords
    let headerRowIndex = -1;
    let colMap: { [key: string]: number } = {};

    for (let i = 0; i < Math.min(rows.length, 10); i++) {
      const r = rows[i].map(c => String(c || '').toLowerCase().trim());
      const hasId = r.some(c => c.includes('អត្តលេខ') || c.includes('user id') || c === 'id');
      const hasName = r.some(c => c.includes('ឈ្មោះ') || c.includes('name'));

      if (hasId || hasName) {
        headerRowIndex = i;
        r.forEach((colName, idx) => {
          if (colName.includes('អត្តលេខ') || colName.includes('user id') || colName === 'id') {
            colMap['id'] = idx;
          } else if (colName.includes('ឈ្មោះ') || colName.includes('name')) {
            colMap['name'] = idx;
          } else if (colName.includes('ពាក្យសម្ងាត់') || colName.includes('password') || colName.includes('pass')) {
            colMap['password'] = idx;
          } else if (
            colName.includes('ទីតាំង') ||
            colName.includes('location') ||
            colName.includes('gps') ||
            colName.includes('តូប')
          ) {
            colMap['location'] = idx;
          } else if (colName.includes('ថ្ងៃចូល') || colName.includes('start date') || colName.includes('date')) {
            colMap['startDate'] = idx;
          } else if (colName.includes('ស្ថានភាព') || colName.includes('status')) {
            colMap['status'] = idx;
          } else if (colName.includes('តួនាទី') || colName.includes('type') || colName.includes('role')) {
            colMap['type'] = idx;
          } else if (colName.includes('manager') || colName.includes('មេដឹកនាំ')) {
            colMap['managerId'] = idx;
          }
        });
        break;
      }
    }

    // If no header found, use default column order from the screenshot:
    // 0: ID, 1: Name, 2: Password, 3: Location, 4: Start Date, 5: Status, 6: Type, 7: Manager ID
    const dataRows = headerRowIndex >= 0 ? rows.slice(headerRowIndex + 1) : rows;

    const getIdIdx = colMap['id'] ?? 0;
    const getNameIdx = colMap['name'] ?? 1;
    const getPassIdx = colMap['password'] ?? 2;
    const getLocIdx = colMap['location'] ?? 3;
    const getDateIdx = colMap['startDate'] ?? 4;
    const getStatusIdx = colMap['status'] ?? 5;
    const getTypeIdx = colMap['type'] ?? 6;
    const getManagerIdx = colMap['managerId'] ?? 7;

    const parsed: ParsedUserRow[] = [];

    dataRows.forEach((row, idx) => {
      // Skip completely empty row
      if (!row || row.every(c => c === null || c === undefined || String(c).trim() === '')) {
        return;
      }

      const rawId = row[getIdIdx];
      const rawName = row[getNameIdx];
      const rawPass = row[getPassIdx];
      const rawLoc = row[getLocIdx];
      const rawDate = row[getDateIdx];
      const rawStatus = row[getStatusIdx];
      const rawType = row[getTypeIdx];
      const rawMgr = row[getManagerIdx];

      const cleanId = rawId !== undefined && rawId !== null ? String(rawId).trim() : '';
      const cleanName = rawName !== undefined && rawName !== null ? String(rawName).trim() : '';
      // Keep leading zero in password like '0713963995'
      const cleanPass = rawPass !== undefined && rawPass !== null ? String(rawPass).trim() : '123456';
      const cleanLoc = rawLoc !== undefined && rawLoc !== null ? String(rawLoc).trim() : '11.556400, 104.928200';
      const cleanDate = parseAnyDate(rawDate);
      const cleanStatus = parseStatus(rawStatus);
      const cleanType = parseType(rawType);
      const cleanMgr = parseManagerId(rawMgr);

      let isValid = true;
      let error = '';

      if (!cleanId) {
        isValid = false;
        error = 'ខ្វះអត្តលេខ (User ID)';
      } else if (!cleanName) {
        isValid = false;
        error = 'ខ្វះឈ្មោះបុគ្គលិក';
      }

      const isExisting = existingUsers.some(u => u.id.trim().toUpperCase() === cleanId.toUpperCase());

      const user: User = {
        id: cleanId,
        name: cleanName || cleanId,
        password: cleanPass || '123456',
        location: cleanLoc || '11.556400, 104.928200',
        startDate: cleanDate,
        status: cleanStatus,
        type: cleanType,
        managerId: cleanMgr,
      };

      parsed.push({
        raw: row,
        user,
        isValid,
        error,
        isExisting,
      });
    });

    if (parsed.length === 0) {
      onShowToast('រកមិនឃើញទិន្នន័យត្រឹមត្រូវក្នុងឯកសារឡើយ', 'error');
    } else {
      setParsedRows(parsed);
      onShowToast(`បានអានទិន្នន័យចំនួន ${parsed.length} ជួរដេក!`, 'success');
    }
  };

  // Handle file upload (.xlsx, .xls, .csv)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessingFile(true);
      setFileName(file.name);

      const buffer = await file.arrayBuffer();
      // raw: false ensures strings keep leading zeros e.g. passwords/phone numbers
      const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      const jsonData = XLSX.utils.sheet_to_json<any[]>(worksheet, {
        header: 1,
        raw: false,
        defval: '',
      });

      processRawRows(jsonData);
    } catch (err: any) {
      console.error(err);
      onShowToast(`មិនអាចអានឯកសារបានឡើយ: ${err.message || 'កំហុសមិនស្គាល់'}`, 'error');
    } finally {
      setIsProcessingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Handle Drag & Drop
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    try {
      setIsProcessingFile(true);
      setFileName(file.name);
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json<any[]>(worksheet, {
        header: 1,
        raw: false,
        defval: '',
      });
      processRawRows(jsonData);
    } catch (err: any) {
      console.error(err);
      onShowToast(`កំហុសក្នុងការអានឯកសារ: ${err.message || ''}`, 'error');
    } finally {
      setIsProcessingFile(false);
    }
  };

  // Handle Direct Paste (Tab or Comma separated)
  const handleParsePaste = () => {
    if (!pasteText.trim()) {
      onShowToast('សូមបិទភ្ជាប់ (Paste) ទិន្នន័យជាមុនសិន!', 'error');
      return;
    }

    try {
      setIsProcessingFile(true);
      setFileName('ចម្លងពីតារាង (Clipboard)');
      const lines = pasteText
        .split(/\r?\n/)
        .map(l => l.trim())
        .filter(Boolean);

      const rows: string[][] = lines.map(line => {
        if (line.includes('\t')) {
          return line.split('\t').map(c => c.trim());
        } else if (line.includes(',')) {
          // simple csv split
          return line.split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
        }
        return line.split(/\s{2,}/).map(c => c.trim());
      });

      processRawRows(rows);
    } catch (err: any) {
      onShowToast('មិនអាចបំប្លែងទិន្នន័យបានឡើយ', 'error');
    } finally {
      setIsProcessingFile(false);
    }
  };

  // Download Sample Excel Template matching user screenshot exactly
  const handleDownloadTemplate = () => {
    const headers = [
      'អត្តលេខ (User ID)',
      'ឈ្មោះពេញ (Full Name)',
      'ពាក្យសម្ងាត់ (Password)',
      'ទីតាំងតូបដែលត្រូវឈរ (Store GPS Location)',
      'ថ្ងៃចូលបម្រើការងារ (Start Date)',
      'ស្ថានភាព (Status)',
      'តួនាទី (Type)',
      'Manager ID',
    ];

    const sampleRows = [
      [
        'BA0016',
        'ឡាន ស្រីឡី',
        '0713963995',
        '13.603822, 102.969162',
        '03 January 2025',
        'Active (សកម្ម)',
        'BA Staff',
        'DTBM',
      ],
      [
        'BA0132',
        'ស៊ីង ស៊ីនួន',
        '092628539',
        '13.669255, 102.587782',
        '04 September 2025',
        'Active (សកម្ម)',
        'BA Staff',
        'DTBM',
      ],
      [
        'BA0196',
        'ជឿន រតនា',
        '0968727352',
        '13.655349, 102.563258',
        '04 May 2026',
        'Active (សកម្ម)',
        'BA Staff',
        'DTBM',
      ],
      [
        'BA0207',
        'ជុំ លីហួង',
        '0765087648',
        '13.6561817, 102.56407464',
        '25 July 2026',
        'Active (សកម្ម)',
        'BA Staff',
        'DTBM',
      ],
      [
        'BA0020',
        'ពៅ ណាវុធ',
        '0972988193',
        '12.539497, 103.919715',
        '14 December 2024',
        'Active (សកម្ម)',
        'BA Staff',
        'DTKCH',
      ],
      [
        'SM0001',
        'ប្រធាន DTBM',
        '123456',
        '13.603822, 102.969162',
        '01 January 2025',
        'Active (សកម្ម)',
        'Manager',
        'DTBM',
      ],
    ];

    const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);

    // Set column widths
    ws['!cols'] = [
      { wch: 18 }, // ID
      { wch: 22 }, // Name
      { wch: 20 }, // Pass
      { wch: 30 }, // Location
      { wch: 22 }, // Date
      { wch: 16 }, // Status
      { wch: 14 }, // Type
      { wch: 14 }, // Manager ID
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'BA List');
    XLSX.writeFile(wb, 'BA_List_Template.xlsx');
    onShowToast('បានទាញយកគំរូ Excel (BA_List_Template.xlsx) ដោយជោគជ័យ!', 'success');
  };

  // Remove row from preview
  const handleRemoveRow = (index: number) => {
    setParsedRows(prev => prev.filter((_, i) => i !== index));
  };

  // Perform bulk import
  const handleExecuteImport = async () => {
    const validRows = parsedRows.filter(r => r.isValid);
    if (validRows.length === 0) {
      onShowToast('មិនមានទិន្នន័យត្រឹមត្រូវសម្រាប់បញ្ចូលទេ!', 'error');
      return;
    }

    try {
      setIsImporting(true);
      const usersToImport = validRows.map(r => r.user);
      setImportProgress({ current: 0, total: usersToImport.length });

      await onImport(usersToImport, syncToSheet);

      onShowToast(`បានបញ្ចូល/កែប្រែទិន្នន័យបុគ្គលិកចំនួន ${usersToImport.length} នាក់ជោគជ័យ!`, 'success');
      onClose();
    } catch (e: any) {
      console.error(e);
      onShowToast(`ការបញ្ចូលបានបរាជ័យ: ${e.message || 'កំហុសបច្ចេកទេស'}`, 'error');
    } finally {
      setIsImporting(false);
      setImportProgress(null);
    }
  };

  // Summary counts
  const totalCount = parsedRows.length;
  const validCount = parsedRows.filter(r => r.isValid).length;
  const invalidCount = totalCount - validCount;
  const newCount = parsedRows.filter(r => r.isValid && !r.isExisting).length;
  const updateCount = parsedRows.filter(r => r.isValid && r.isExisting).length;

  // Filtered rows for preview
  const displayedRows = parsedRows.filter(r => {
    if (filterMode === 'valid' && !r.isValid) return false;
    if (filterMode === 'invalid' && r.isValid) return false;
    if (filterMode === 'new' && (!r.isValid || r.isExisting)) return false;
    if (filterMode === 'update' && (!r.isValid || !r.isExisting)) return false;

    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      return (
        r.user.id.toLowerCase().includes(q) ||
        r.user.name.toLowerCase().includes(q) ||
        (r.user.managerId && r.user.managerId.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden my-auto">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
              <FileSpreadsheet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">ផ្ទុកឡើងទិន្នន័យ User ID (Excel / CSV)</h2>
              <p className="text-xs text-white/80">
                បន្ថែម ឬធ្វើបច្ចុប្បន្នភាពបុគ្គលិក BA List ច្រើននាក់ក្នុងពេលតែមួយ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isImporting}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {/* Top Actions & Template download */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                <Info className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-emerald-950">គំរូតារាង BA List (Excel Template)</h4>
                <p className="text-[11px] text-emerald-800">
                  ទាញយកគំរូឯកសារ Excel ដែលមានក្បាលជួរដេក និងទិន្នន័យត្រឹមត្រូវតាមប្រព័ន្ធ
                </p>
              </div>
            </div>
            <button
              onClick={handleDownloadTemplate}
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ទាញយកគំរូ (.xlsx)</span>
            </button>
          </div>

          {/* Mode Selector Tabs */}
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab('file')}
              className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'file'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <UploadCloud className="w-4 h-4" />
              <span>ជ្រើសរើសឯកសារ Excel / CSV</span>
            </button>
            <button
              onClick={() => setActiveTab('paste')}
              className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'paste'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>ចម្លងទិន្នន័យដាក់ផ្ទាល់ (Paste Tabular Data)</span>
            </button>
          </div>

          {/* Tab 1: File Upload */}
          {activeTab === 'file' && (
            <div
              onDragOver={e => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-6 sm:p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                fileName
                  ? 'border-emerald-400 bg-emerald-50/40'
                  : 'border-slate-300 hover:border-emerald-500 hover:bg-slate-50/60'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-inner">
                {isProcessingFile ? (
                  <RefreshCw className="w-7 h-7 animate-spin" />
                ) : (
                  <UploadCloud className="w-7 h-7" />
                )}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">
                  {fileName ? `ឯកសារបានជ្រើស៖ ${fileName}` : 'ចុចទីនេះ ឬ ទម្លាក់ឯកសារ Excel / CSV មកទីនេះ'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  គាំទ្រឯកសារ .xlsx, .xls, .csv (រក្សាទុកលេខទូរស័ព្ទ និងលេខកូដដែលមានលេខ 0 នៅខាងមុខ)
                </p>
              </div>
              {fileName && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-semibold">
                  <Check className="w-3.5 h-3.5" />
                  អានទិន្នន័យរួចរាល់
                </span>
              )}
            </div>
          )}

          {/* Tab 2: Paste Data */}
          {activeTab === 'paste' && (
            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span>បិទភ្ជាប់ទិន្នន័យចម្លងពី Excel ឬ Google Sheet (Ctrl+V)៖</span>
                <span className="text-[11px] text-slate-400">គាំទ្រ Tab ឬ Comma Delimited</span>
              </label>
              <textarea
                rows={5}
                value={pasteText}
                onChange={e => setPasteText(e.target.value)}
                placeholder="អត្តលេខ	ឈ្មោះពេញ	ពាក្យសម្ងាត់	ទីតាំងតូបដែលត្រូវឈរ	ថ្ងៃចូលបម្រើការងារ	ស្ថានភាព	តួនាទី	Manager ID&#10;BA0016	ឡាន ស្រីឡី	0713963995	13.603822, 102.969162	03 January 2025	Active	BA Staff	DTBM&#10;BA0132	ស៊ីង ស៊ីនួន	092628539	13.669255, 102.587782	04 September 2025	Active	BA Staff	DTBM"
                className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none"
              />
              <button
                type="button"
                onClick={handleParsePaste}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>បំប្លែងទិន្នន័យ (Parse Data)</span>
              </button>
            </div>
          )}

          {/* Preview Section */}
          {parsedRows.length > 0 && (
            <div className="space-y-3 pt-2">
              {/* Stat Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                <button
                  type="button"
                  onClick={() => setFilterMode('all')}
                  className={`p-2.5 rounded-2xl border transition-all ${
                    filterMode === 'all'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="text-base font-extrabold">{totalCount}</div>
                  <div className="text-[10px] font-medium opacity-80">សរុបទាំងអស់</div>
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('valid')}
                  className={`p-2.5 rounded-2xl border transition-all ${
                    filterMode === 'valid'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                  }`}
                >
                  <div className="text-base font-extrabold">{validCount}</div>
                  <div className="text-[10px] font-medium opacity-80">ត្រឹមត្រូវ (Ready)</div>
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('new')}
                  className={`p-2.5 rounded-2xl border transition-all ${
                    filterMode === 'new'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-indigo-50 border-indigo-200 text-indigo-800 hover:bg-indigo-100'
                  }`}
                >
                  <div className="text-base font-extrabold">{newCount}</div>
                  <div className="text-[10px] font-medium opacity-80">បុគ្គលិកថ្មី (New)</div>
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('update')}
                  className={`p-2.5 rounded-2xl border transition-all ${
                    filterMode === 'update'
                      ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                      : 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
                  }`}
                >
                  <div className="text-base font-extrabold">{updateCount}</div>
                  <div className="text-[10px] font-medium opacity-80">កែប្រែ (Update)</div>
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('invalid')}
                  className={`p-2.5 rounded-2xl border transition-all col-span-2 sm:col-span-1 ${
                    filterMode === 'invalid'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                      : 'bg-rose-50 border-rose-200 text-rose-800 hover:bg-rose-100'
                  }`}
                >
                  <div className="text-base font-extrabold">{invalidCount}</div>
                  <div className="text-[10px] font-medium opacity-80">កំហុស (Error)</div>
                </button>
              </div>

              {/* Search filter in preview */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-700">
                  បង្ហាញទិន្នន័យត្រួតពិនិត្យ ({displayedRows.length} ជួរ)
                </span>
                <input
                  type="text"
                  placeholder="ស្វែងរកតាម ID ឬ ឈ្មោះ..."
                  value={searchFilter}
                  onChange={e => setSearchFilter(e.target.value)}
                  className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Table Preview */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 sticky top-0 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">ស្ថានភាព</th>
                      <th className="p-2.5">អត្តលេខ</th>
                      <th className="p-2.5">ឈ្មោះ</th>
                      <th className="p-2.5">Password</th>
                      <th className="p-2.5">Store GPS</th>
                      <th className="p-2.5">ថ្ងៃចូលធ្វើការ</th>
                      <th className="p-2.5">Status</th>
                      <th className="p-2.5">Type</th>
                      <th className="p-2.5">Manager ID</th>
                      <th className="p-2.5 text-center">សកម្មភាព</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayedRows.map((r, i) => (
                      <tr
                        key={i}
                        className={`hover:bg-slate-50 transition-colors ${
                          !r.isValid ? 'bg-rose-50/50' : r.isExisting ? 'bg-amber-50/30' : ''
                        }`}
                      >
                        <td className="p-2.5 whitespace-nowrap">
                          {!r.isValid ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-lg">
                              <AlertCircle className="w-3 h-3" />
                              {r.error || 'ខុស'}
                            </span>
                          ) : r.isExisting ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-lg">
                              កែប្រែ
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-lg">
                              <CheckCircle2 className="w-3 h-3" />
                              ថ្មី
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 font-bold text-slate-900 whitespace-nowrap">{r.user.id}</td>
                        <td className="p-2.5 font-medium text-slate-800 whitespace-nowrap">{r.user.name}</td>
                        <td className="p-2.5 font-mono text-slate-600 whitespace-nowrap">{r.user.password}</td>
                        <td className="p-2.5 font-mono text-slate-500 text-[11px] max-w-[120px] truncate">
                          {r.user.location}
                        </td>
                        <td className="p-2.5 text-slate-600 whitespace-nowrap">{r.user.startDate}</td>
                        <td className="p-2.5 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              r.user.status === 'Active'
                                ? 'bg-emerald-100 text-emerald-800'
                                : r.user.status === 'Pending'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {r.user.status}
                          </span>
                        </td>
                        <td className="p-2.5 whitespace-nowrap font-medium text-slate-700">{r.user.type}</td>
                        <td className="p-2.5 whitespace-nowrap font-bold text-indigo-700">
                          {r.user.managerId || '-'}
                        </td>
                        <td className="p-2.5 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleRemoveRow(i)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                            title="លុបជួរដេកនេះ"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer & Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 select-none">
            <input
              type="checkbox"
              checked={syncToSheet}
              onChange={e => setSyncToSheet(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
            />
            <span>ធ្វើសមកាលកម្មទៅ Google Sheet ភ្លាមៗ (Auto Sync to Sheet)</span>
          </label>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isImporting}
              className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
            >
              បោះបង់
            </button>
            <button
              type="button"
              onClick={handleExecuteImport}
              disabled={isImporting || validCount === 0}
              className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all disabled:opacity-50 disabled:pointer-events-none"
            >
              {isImporting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>កំពុងបញ្ចូល ({validCount})...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>បញ្ជាក់ការបញ្ចូល ({validCount} នាក់)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
