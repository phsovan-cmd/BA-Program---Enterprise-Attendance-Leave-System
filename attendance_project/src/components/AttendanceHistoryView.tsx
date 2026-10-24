import React, { useState, useMemo } from 'react';
import {
  History,
  Search,
  Filter,
  Download,
  Calendar,
  ChevronLeft,
  ChevronRight,
  MapPin,
  LogIn,
  LogOut,
  Shield,
  Briefcase,
  UserCheck,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Table as TableIcon,
  LayoutGrid,
  RefreshCw,
} from 'lucide-react';
import { User, AttendanceRecord, MANAGER_IDS } from '../types';
import { formatDateToYMD } from '../utils/date';

interface AttendanceHistoryViewProps {
  currentUser: User;
  users: User[];
  attendance: AttendanceRecord[];
  onShowToast?: (message: string, type: 'success' | 'error' | 'info') => void;
}

// Subordinate matching helper
export const isUserUnderManager = (manager: User, targetUser: User): boolean => {
  if (!manager || !targetUser) return false;
  if (targetUser.id.trim().toUpperCase() === manager.id.trim().toUpperCase()) return true;

  const staffManagerId = (targetUser.managerId || '').trim().toUpperCase();
  if (!staffManagerId) return false;

  const mgrId = (manager.id || '').trim().toUpperCase();
  const mgrName = (manager.name || '').trim().toUpperCase();
  const mgrManagerId = (manager.managerId || '').trim().toUpperCase();

  return (
    (mgrManagerId !== '' && staffManagerId === mgrManagerId) ||
    (mgrId !== '' && staffManagerId === mgrId) ||
    (mgrName !== '' && staffManagerId === mgrName)
  );
};

export const AttendanceHistoryView: React.FC<AttendanceHistoryViewProps> = ({
  currentUser,
  users,
  attendance,
  onShowToast,
}) => {
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth()); // 0-11
  const [isAllTime, setIsAllTime] = useState(false);
  const [isTodayOnly, setIsTodayOnly] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStaffFilter, setSelectedStaffFilter] = useState<string>('ALL');
  const [selectedManagerFilter, setSelectedManagerFilter] = useState<string>('ALL');
  const [actionFilter, setActionFilter] = useState<'ALL' | 'IN' | 'OUT'>('ALL');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Month navigation
  const handlePrevMonth = () => {
    setIsAllTime(false);
    setIsTodayOnly(false);
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    setIsAllTime(false);
    setIsTodayOnly(false);
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const handleResetToCurrentMonth = () => {
    setIsAllTime(false);
    setIsTodayOnly(false);
    setSelectedYear(today.getFullYear());
    setSelectedMonth(today.getMonth());
  };

  const monthNamesKh = [
    'មករា (Jan)',
    'កុម្ភៈ (Feb)',
    'មីនា (Mar)',
    'មេសា (Apr)',
    'ឧសភា (May)',
    'មិថុនា (Jun)',
    'កក្កដា (Jul)',
    'សីហា (Aug)',
    'កញ្ញា (Sep)',
    'តុលា (Oct)',
    'វិច្ឆិកា (Nov)',
    'ធ្នូ (Dec)',
  ];

  // Helper map for fast user lookup
  const userMap = useMemo(() => {
    const map = new Map<string, User>();
    users.forEach(u => {
      map.set(u.id.trim().toUpperCase(), u);
    });
    return map;
  }, [users]);

  // Determine allowed staff list based on role
  const accessibleStaffList = useMemo(() => {
    if (currentUser.type === 'Admin') {
      return users;
    }
    if (currentUser.type === 'Manager') {
      return users.filter(u => isUserUnderManager(currentUser, u));
    }
    // BA Staff can only access themselves
    return users.filter(u => u.id.trim().toUpperCase() === currentUser.id.trim().toUpperCase());
  }, [currentUser, users]);

  // Set of allowed user IDs (in uppercase)
  const allowedUserIdsSet = useMemo(() => {
    return new Set(accessibleStaffList.map(u => u.id.trim().toUpperCase()));
  }, [accessibleStaffList]);

  // Format today's YMD
  const todayYMD = useMemo(() => {
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
      today.getDate()
    ).padStart(2, '0')}`;
  }, [today]);

  // Filter attendance records by role permissions first, then by user-selected filters
  const filteredAttendance = useMemo(() => {
    return attendance.filter(rec => {
      const recUserId = (rec.userId || '').trim().toUpperCase();

      // 1. Role-based permission enforcement
      if (currentUser.type === 'BA Staff') {
        // Strict isolation: BA Staff only sees their own
        if (recUserId !== currentUser.id.trim().toUpperCase()) {
          return false;
        }
      } else if (currentUser.type === 'Manager') {
        // Manager only sees self and supervised team members
        if (!allowedUserIdsSet.has(recUserId)) {
          return false;
        }
      }
      // Admin has access to all records

      // 2. Date / Month Filter
      if (isTodayOnly) {
        const ymd = formatDateToYMD(rec.timestamp);
        if (ymd !== todayYMD && !rec.timestamp?.includes(todayYMD)) {
          return false;
        }
      } else if (!isAllTime) {
        const ymd = formatDateToYMD(rec.timestamp);
        if (ymd) {
          const parts = ymd.split('-');
          if (parts.length >= 2) {
            const y = parseInt(parts[0], 10);
            const m = parseInt(parts[1], 10) - 1;
            if (y !== selectedYear || m !== selectedMonth) {
              return false;
            }
          }
        } else {
          const d = new Date(rec.timestamp);
          if (!isNaN(d.getTime())) {
            if (d.getFullYear() !== selectedYear || d.getMonth() !== selectedMonth) {
              return false;
            }
          }
        }
      }

      // 3. Action filter (IN / OUT)
      if (actionFilter !== 'ALL') {
        if (rec.action !== actionFilter) {
          return false;
        }
      }

      // 4. Staff filter
      if (selectedStaffFilter !== 'ALL') {
        if (recUserId !== selectedStaffFilter.trim().toUpperCase()) {
          return false;
        }
      }

      // 5. Manager / Branch filter (for Admin)
      if (currentUser.type === 'Admin' && selectedManagerFilter !== 'ALL') {
        const staffObj = userMap.get(recUserId);
        const staffManagerId = (staffObj?.managerId || '').trim().toUpperCase();
        if (staffManagerId !== selectedManagerFilter.trim().toUpperCase()) {
          return false;
        }
      }

      // 6. Search Query (Name, ID, details, location)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const staffObj = userMap.get(recUserId);
        const staffName = (staffObj?.name || rec.userName || '').toLowerCase();
        const staffId = recUserId.toLowerCase();
        const locationStr = (rec.location || '').toLowerCase();
        const detailsStr = (rec.details || '').toLowerCase();

        const match =
          staffName.includes(q) ||
          staffId.includes(q) ||
          locationStr.includes(q) ||
          detailsStr.includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [
    attendance,
    currentUser,
    allowedUserIdsSet,
    isTodayOnly,
    isAllTime,
    selectedYear,
    selectedMonth,
    actionFilter,
    selectedStaffFilter,
    selectedManagerFilter,
    searchQuery,
    userMap,
    todayYMD,
  ]);

  // Sort descending by timestamp (newest records first)
  const sortedRecords = useMemo(() => {
    return [...filteredAttendance].sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      if (isNaN(timeA) && isNaN(timeB)) return 0;
      if (isNaN(timeA)) return 1;
      if (isNaN(timeB)) return -1;
      return timeB - timeA;
    });
  }, [filteredAttendance]);

  // Statistics
  const checkInsCount = useMemo(
    () => sortedRecords.filter(r => r.action === 'IN').length,
    [sortedRecords]
  );
  const checkOutsCount = useMemo(
    () => sortedRecords.filter(r => r.action === 'OUT').length,
    [sortedRecords]
  );
  const uniqueStaffCount = useMemo(() => {
    const s = new Set(sortedRecords.map(r => r.userId.trim().toUpperCase()));
    return s.size;
  }, [sortedRecords]);

  // Export to CSV formatted for Khmer Unicode & Excel
  const handleExportCSV = () => {
    if (sortedRecords.length === 0) {
      if (onShowToast) onShowToast('មិនមានទិន្នន័យដើម្បីទាញយកទេ', 'info');
      return;
    }

    const headers = [
      'កាលបរិច្ឆេទ & ម៉ោង (Timestamp)',
      'លេខកូដបុគ្គលិក (Staff ID)',
      'ឈ្មោះបុគ្គលិក (Staff Name)',
      'តួនាទី (Role)',
      'Manager ID',
      'សកម្មភាព (Action)',
      'ចម្ងាយ (Distance)',
      'ទីតាំង (Coordinates)',
      'ព័ត៌មានលម្អិត (Details)',
    ];

    const rows = sortedRecords.map(r => {
      const u = userMap.get((r.userId || '').trim().toUpperCase());
      const distance = r.distanceMeters !== undefined ? `${Math.round(r.distanceMeters)}m` : '-';
      const role = u?.type || r.userType || 'BA Staff';
      const mgr = u?.managerId || '-';
      const name = u?.name || r.userName || '-';

      return [
        `"${r.timestamp || ''}"`,
        `"${r.userId || ''}"`,
        `"${name.replace(/"/g, '""')}"`,
        `"${role}"`,
        `"${mgr}"`,
        `"${r.action}"`,
        `"${distance}"`,
        `"${r.location || '-'}"`,
        `"${(r.details || '').replace(/"/g, '""')}"`,
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const filename = `Attendance_History_${currentUser.type}_${selectedYear}_${
      selectedMonth + 1
    }.csv`;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (onShowToast) {
      onShowToast(`បានទាញយកទិន្នន័យវត្តមានជា CSV (${sortedRecords.length} កំណត់ត្រា)`, 'success');
    }
  };

  // Helper for displaying human-readable timestamp
  const formatKhmerDateTime = (ts: string) => {
    if (!ts) return { date: '-', time: '-' };
    const d = new Date(ts);
    if (isNaN(d.getTime())) {
      return { date: ts, time: '' };
    }
    const dateStr = d.toLocaleDateString('km-KH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    const timeStr = d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
    return { date: dateStr, time: timeStr };
  };

  return (
    <div className="space-y-4">
      {/* Role-Aware Scope Banner */}
      <div
        className={`p-4 sm:p-5 rounded-3xl border shadow-sm relative overflow-hidden transition-all ${
          currentUser.type === 'Admin'
            ? 'bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white border-purple-500/30'
            : currentUser.type === 'Manager'
            ? 'bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white border-blue-500/30'
            : 'bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white border-emerald-500/30'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start gap-3.5">
            <div
              className={`p-3 rounded-2xl shadow-inner shrink-0 ${
                currentUser.type === 'Admin'
                  ? 'bg-purple-600/30 border border-purple-400/40 text-purple-200'
                  : currentUser.type === 'Manager'
                  ? 'bg-blue-600/30 border border-blue-400/40 text-blue-200'
                  : 'bg-emerald-600/30 border border-emerald-400/40 text-emerald-200'
              }`}
            >
              {currentUser.type === 'Admin' ? (
                <Shield className="w-6 h-6" />
              ) : currentUser.type === 'Manager' ? (
                <Briefcase className="w-6 h-6" />
              ) : (
                <UserCheck className="w-6 h-6" />
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight">
                  {currentUser.type === 'Admin' && 'ប្រវត្តិវត្តមានបុគ្គលិកទូទាំងស្ថាប័ន (All Staff)'}
                  {currentUser.type === 'Manager' &&
                    `ប្រវត្តិវត្តមានកូនក្រុម និងផ្ទាល់ខ្លួន (${currentUser.name})`}
                  {currentUser.type === 'BA Staff' &&
                    `ប្រវត្តិវត្តមានផ្ទាល់ខ្លួន (${currentUser.name})`}
                </h2>
                <span
                  className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                    currentUser.type === 'Admin'
                      ? 'bg-purple-500/20 border-purple-400/30 text-purple-200'
                      : currentUser.type === 'Manager'
                      ? 'bg-blue-500/20 border-blue-400/30 text-blue-200'
                      : 'bg-emerald-500/20 border-emerald-400/30 text-emerald-200'
                  }`}
                >
                  សិទ្ធិ: {currentUser.type}
                </span>
                {currentUser.type === 'Manager' && currentUser.managerId && (
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-white/10 rounded-full border border-white/20 text-white/90">
                    តំបន់/សាខា: {currentUser.managerId}
                  </span>
                )}
              </div>
              <p className="text-xs text-white/80 mt-1 leading-relaxed">
                {currentUser.type === 'Admin' &&
                  'សិទ្ធិ Admin: អាចពិនិត្យ ស្វែងរក និងទាញយកប្រវត្តិចុះវត្តមានរបស់បុគ្គលិក និង Manager ទាំងអស់។'}
                {currentUser.type === 'Manager' &&
                  `សិទ្ធិ Manager: តាមដានវត្តមានរបស់កូនក្រុមក្រោមឱវាទ (${accessibleStaffList.length} នាក់) និងប្រវត្តិចុះវត្តមានផ្ទាល់ខ្លួន។`}
                {currentUser.type === 'BA Staff' &&
                  'សិទ្ធិ BA Staff: ពិនិត្យប្រវត្តិចុះវត្តមាន Check-In និង Check-Out ផ្ទាល់ខ្លួនរបស់អ្នក។'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 bg-white/15 hover:bg-white/25 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-2 border border-white/20 transition-all shadow-sm"
              title="ទាញយកជា Excel CSV"
            >
              <Download className="w-4 h-4 text-emerald-300" />
              <span>ទាញយក Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white/95 backdrop-blur-xl p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-slate-100 text-slate-700 rounded-xl">
            <History className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500">កំណត់ត្រាសរុប</p>
            <h4 className="text-base sm:text-xl font-extrabold text-slate-900">
              {sortedRecords.length}
            </h4>
          </div>
        </div>

        <div className="bg-white/95 backdrop-blur-xl p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
            <LogIn className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500">ចូលធ្វើការ (IN)</p>
            <h4 className="text-base sm:text-xl font-extrabold text-emerald-600">
              {checkInsCount}
            </h4>
          </div>
        </div>

        <div className="bg-white/95 backdrop-blur-xl p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl border border-rose-100">
            <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500">ចេញពីធ្វើការ (OUT)</p>
            <h4 className="text-base sm:text-xl font-extrabold text-rose-600">
              {checkOutsCount}
            </h4>
          </div>
        </div>

        <div className="bg-white/95 backdrop-blur-xl p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
            <Users className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500">
              {currentUser.type === 'BA Staff' ? 'ស្ថានភាពផ្ទាល់ខ្លួន' : 'បុគ្គលិកសកម្ម'}
            </p>
            <h4 className="text-base sm:text-xl font-extrabold text-indigo-600">
              {currentUser.type === 'BA Staff' ? '១ នាក់' : `${uniqueStaffCount} នាក់`}
            </h4>
          </div>
        </div>
      </div>

      {/* Control Panel: Filters, Date Navigation, & Search */}
      <div className="bg-white/95 backdrop-blur-xl p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Month Navigator & Quick Toggles */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 hover:bg-white rounded-lg text-slate-600 transition-colors"
                title="ខែមុន"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="px-3 text-xs font-bold text-slate-800 flex items-center gap-1.5 min-w-[130px] justify-center">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                <span>
                  {monthNamesKh[selectedMonth]} {selectedYear}
                </span>
              </div>
              <button
                onClick={handleNextMonth}
                className="p-1.5 hover:bg-white rounded-lg text-slate-600 transition-colors"
                title="ខែបន្ទាប់"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => {
                setIsTodayOnly(prev => !prev);
                setIsAllTime(false);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                isTodayOnly
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              📅 ថ្ងៃនេះ (Today)
            </button>

            <button
              onClick={() => {
                setIsAllTime(prev => !prev);
                setIsTodayOnly(false);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                isAllTime
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              🌐 គ្រប់ពេលវេលា (All)
            </button>

            {(selectedMonth !== today.getMonth() ||
              selectedYear !== today.getFullYear() ||
              isAllTime ||
              isTodayOnly) && (
              <button
                onClick={handleResetToCurrentMonth}
                className="px-2 py-1 text-[11px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1"
                title="ត្រឡប់មកខែបច្ចុប្បន្ន"
              >
                <RefreshCw className="w-3 h-3" />
                <span>ខែនេះ</span>
              </button>
            )}
          </div>

          {/* View mode toggle (Cards vs Table) */}
          <div className="flex items-center gap-2 self-end lg:self-auto">
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              <button
                onClick={() => setViewMode('cards')}
                className={`px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                  viewMode === 'cards'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>ផ្ទាំងកាត (Cards)</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                  viewMode === 'table'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>តារាង (Table)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Search & Filter Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 pt-2 border-t border-slate-100">
          {/* Search box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="ស្វែងរកតាម ឈ្មោះ, ID, ទីតាំង..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
          </div>

          {/* Staff Filter Dropdown (For Admin and Manager) */}
          {currentUser.type !== 'BA Staff' ? (
            <div>
              <select
                value={selectedStaffFilter}
                onChange={e => setSelectedStaffFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              >
                <option value="ALL">
                  {currentUser.type === 'Admin'
                    ? `👥 បុគ្គលិកទាំងអស់ (${accessibleStaffList.length})`
                    : `👥 ទាំងអស់ក្នុងក្រុម (${accessibleStaffList.length})`}
                </option>
                {accessibleStaffList.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.id}) - {u.type}
                    {u.id === currentUser.id ? ' [ខ្ញុំផ្ទាល់]' : ''}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex items-center px-3 py-2 bg-emerald-50/60 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800">
              <UserCheck className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
              <span>
                {currentUser.name} ({currentUser.id})
              </span>
            </div>
          )}

          {/* Action Filter (ALL / IN / OUT) */}
          <div>
            <select
              value={actionFilter}
              onChange={e => setActionFilter(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            >
              <option value="ALL">🔄 សកម្មភាពទាំងអស់ (IN & OUT)</option>
              <option value="IN">🟢 ចូលធ្វើការ (Check-In តែប៉ុណ្ណោះ)</option>
              <option value="OUT">🔴 ចេញពីធ្វើការ (Check-Out តែប៉ុណ្ណោះ)</option>
            </select>
          </div>

          {/* Manager / Branch Filter (Admin only) */}
          {currentUser.type === 'Admin' && (
            <div>
              <select
                value={selectedManagerFilter}
                onChange={e => setSelectedManagerFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              >
                <option value="ALL">🏢 គ្រប់ Manager / តំបន់ (All)</option>
                {MANAGER_IDS.map(mId => (
                  <option key={mId} value={mId}>
                    តំបន់ / Manager: {mId}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Main Records Display */}
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl border border-slate-200/80 shadow-xs p-4 sm:p-5">
        <div className="flex items-center justify-between pb-3 border-b mb-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-slate-800 text-sm sm:text-base">
              បញ្ជីកំណត់ត្រាវត្តមាន ({sortedRecords.length} កំណត់ត្រា)
            </h3>
          </div>
          <div className="text-xs text-slate-500 font-medium">
            {isTodayOnly ? 'ប្រចាំថ្ងៃនេះ' : isAllTime ? 'គ្រប់ពេលវេលា' : `${monthNamesKh[selectedMonth]} ${selectedYear}`}
          </div>
        </div>

        {sortedRecords.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
              <History className="w-7 h-7" />
            </div>
            <h4 className="text-sm font-bold text-slate-700 mb-1">
              មិនមានកំណត់ត្រាវត្តមានដែលត្រូវគ្នានឹងលក្ខខណ្ឌជ្រើសរើសទេ
            </h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
              {currentUser.type === 'BA Staff'
                ? 'មិនទាន់មានកំណត់ត្រា Check-In ឬ Check-Out សម្រាប់ខែនេះនៅឡើយទេ។ ចុចប៊ូតុង Check-In នៅទំព័រដើមដើម្បីចាប់ផ្តើម!'
                : 'សូមសាកល្បងផ្លាស់ប្តូរខែ ជ្រើសរើសបុគ្គលិកផ្សេង ឬដោះលែងតម្រងស្វែងរក។'}
            </p>
            {(searchQuery ||
              actionFilter !== 'ALL' ||
              selectedStaffFilter !== 'ALL' ||
              selectedManagerFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActionFilter('ALL');
                  setSelectedStaffFilter('ALL');
                  setSelectedManagerFilter('ALL');
                }}
                className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-colors"
              >
                សម្អាតតម្រងទាំងអស់ (Reset Filters)
              </button>
            )}
          </div>
        ) : viewMode === 'cards' ? (
          /* Cards View */
          <div className="space-y-2.5">
            {sortedRecords.map((rec, idx) => {
              const staffUser = userMap.get((rec.userId || '').trim().toUpperCase());
              const displayName = staffUser?.name || rec.userName || rec.userId;
              const displayRole = staffUser?.type || rec.userType || 'BA Staff';
              const displayManager = staffUser?.managerId || '-';
              const isSelf =
                currentUser &&
                (rec.userId || '').trim().toUpperCase() === currentUser.id.trim().toUpperCase();
              const { date, time } = formatKhmerDateTime(rec.timestamp);

              const isCheckIn = rec.action === 'IN';
              const distance = rec.distanceMeters;
              const isNearby = distance !== undefined && distance <= 15;

              return (
                <div
                  key={rec.id || `${rec.userId}-${rec.timestamp}-${idx}`}
                  className="p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 hover:border-indigo-300 hover:shadow-sm bg-white/70 hover:bg-indigo-50/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3.5"
                >
                  {/* Left: Avatar & Staff Details */}
                  <div className="flex items-start sm:items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-xs ${
                        isCheckIn
                          ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white'
                          : 'bg-gradient-to-tr from-rose-600 to-pink-500 text-white'
                      }`}
                    >
                      {staffUser?.avatar ? (
                        <img
                          src={staffUser.avatar}
                          alt={displayName}
                          className="w-full h-full object-cover rounded-2xl"
                        />
                      ) : (
                        <span>{isCheckIn ? 'IN' : 'OUT'}</span>
                      )}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-bold text-slate-900 text-xs sm:text-sm">
                          {displayName}
                        </span>
                        <span className="text-[11px] font-mono text-slate-500 font-semibold">
                          ({rec.userId})
                        </span>
                        {isSelf && (
                          <span className="text-[10px] bg-indigo-100 text-indigo-700 font-extrabold px-2 py-0.5 rounded-full">
                            ខ្ញុំផ្ទាល់
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            displayRole === 'Admin'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : displayRole === 'Manager'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {displayRole}
                        </span>
                        {displayManager !== '-' && (
                          <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full border border-slate-200">
                            {displayManager}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-extrabold px-2 py-0.5 rounded-lg ${
                            isCheckIn
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {isCheckIn ? (
                            <>
                              <LogIn className="w-3 h-3 text-emerald-600" />
                              <span>បាន Check-In ចូលធ្វើការ</span>
                            </>
                          ) : (
                            <>
                              <LogOut className="w-3 h-3 text-rose-600" />
                              <span>បាន Check-Out ចេញពីធ្វើការ</span>
                            </>
                          )}
                        </span>

                        <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>
                            {date} • <b className="font-mono text-slate-700">{time}</b>
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: GPS Location & Distance details */}
                  <div className="flex flex-wrap sm:flex-col sm:items-end gap-2 text-xs text-slate-600 pl-14 sm:pl-0">
                    <div className="flex items-center gap-2">
                      {distance !== undefined && (
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl font-bold text-[11px] border ${
                            isNearby
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {isNearby ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <AlertCircle className="w-3 h-3 text-amber-600" />
                          )}
                          <span>ចម្ងាយ: ~{Math.round(distance)}ម</span>
                        </span>
                      )}

                      {rec.location && (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                            rec.location
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-800 bg-indigo-50/60 hover:bg-indigo-100 px-2 py-1 rounded-xl transition-colors font-mono"
                          title="បើកទីតាំងលើ Google Maps"
                        >
                          <MapPin className="w-3 h-3 text-indigo-600 shrink-0" />
                          <span className="truncate max-w-[130px]">{rec.location}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>

                    {rec.details && (
                      <p className="text-[11px] text-slate-400 truncate max-w-xs italic">
                        {rec.details}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Table View */
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="py-3 px-3">សកម្មភាព</th>
                  <th className="py-3 px-3">បុគ្គលិក</th>
                  <th className="py-3 px-3">ID</th>
                  <th className="py-3 px-3">តួនាទី</th>
                  <th className="py-3 px-3">Manager</th>
                  <th className="py-3 px-3">កាលបរិច្ឆេទ & ម៉ោង</th>
                  <th className="py-3 px-3">ចម្ងាយ</th>
                  <th className="py-3 px-3">ទីតាំង (GPS)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedRecords.map((rec, idx) => {
                  const staffUser = userMap.get((rec.userId || '').trim().toUpperCase());
                  const displayName = staffUser?.name || rec.userName || rec.userId;
                  const displayRole = staffUser?.type || rec.userType || 'BA Staff';
                  const displayManager = staffUser?.managerId || '-';
                  const { date, time } = formatKhmerDateTime(rec.timestamp);
                  const isCheckIn = rec.action === 'IN';
                  const distance = rec.distanceMeters;

                  return (
                    <tr
                      key={rec.id || `${rec.userId}-${rec.timestamp}-${idx}`}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-extrabold ${
                            isCheckIn
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {isCheckIn ? 'IN (Check-In)' : 'OUT (Check-Out)'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">
                        {displayName}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600 font-bold">
                        {rec.userId}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                          {displayRole}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">
                        {displayManager}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">
                        <span>{date} </span>
                        <b className="text-slate-800">{time}</b>
                      </td>
                      <td className="py-2.5 px-3 font-mono">
                        {distance !== undefined ? (
                          <span
                            className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                              distance <= 15
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            ~{Math.round(distance)}ម
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        {rec.location ? (
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                              rec.location
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:underline flex items-center gap-1 font-mono text-[11px]"
                          >
                            <MapPin className="w-3 h-3" />
                            <span className="truncate max-w-[120px]">{rec.location}</span>
                          </a>
                        ) : (
                          '-'
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
  );
};
