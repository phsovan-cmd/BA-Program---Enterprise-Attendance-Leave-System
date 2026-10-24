import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Download, Printer, Search, Calendar, Info, Check, Clock, UserCheck } from 'lucide-react';
import { User, LeaveRequest, AttendanceRecord, MANAGER_IDS } from '../types';
import { formatDateToYMD } from '../utils/date';
import { isUserUnderManager } from './AttendanceHistoryView';

interface MonthlyReportViewProps {
  currentUser: User;
  users: User[];
  leaves: LeaveRequest[];
  attendance: AttendanceRecord[];
}

export const MonthlyReportView: React.FC<MonthlyReportViewProps> = ({
  currentUser,
  users,
  leaves,
  attendance,
}) => {
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth()); // 0-11
  const [searchQuery, setSearchQuery] = useState('');
  const [managerFilter, setManagerFilter] = useState('ALL');
  const [selectedCellDetail, setSelectedCellDetail] = useState<{
    staff: User;
    day: number;
    dateStr: string;
    leave?: LeaveRequest;
    attendanceIn?: AttendanceRecord;
    attendanceOut?: AttendanceRecord;
  } | null>(null);

  // Month navigation
  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();

  // Filter staff based on user role and filters
  let baStaffs = users.filter(u => !u.type || u.type === 'BA Staff');

  if (currentUser.type === 'BA Staff') {
    baStaffs = baStaffs.filter(u => u.id.trim() === currentUser.id.trim());
  } else if (currentUser.type === 'Manager') {
    baStaffs = baStaffs.filter(u => isUserUnderManager(currentUser, u));
  }

  if (managerFilter !== 'ALL') {
    baStaffs = baStaffs.filter(
      u => u.managerId && u.managerId.trim().toUpperCase() === managerFilter.trim().toUpperCase()
    );
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    baStaffs = baStaffs.filter(
      u => u.id.toLowerCase().includes(q) || (u.name && u.name.toLowerCase().includes(q))
    );
  }

  // Month Names in Khmer & English
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

  // Helper to find attendance or leave for a specific staff on day
  const getDayStatus = (staffId: string, day: number) => {
    const fDay = String(day).padStart(2, '0');
    const fMonth = String(selectedMonth + 1).padStart(2, '0');
    const targetIsoDate = `${selectedYear}-${fMonth}-${fDay}`;
    const targetSlashDate = `${fDay}/${fMonth}/${selectedYear}`;
    const targetSlashDateUS = `${fMonth}/${fDay}/${selectedYear}`;

    // 1. Check approved leave
    const approvedLeave = leaves.find(l => {
      if (!l.userId || l.status !== 'Approved') return false;
      if (l.userId.trim().toLowerCase() !== staffId.trim().toLowerCase()) return false;
      if (!l.startDate || !l.endDate) return false;

      const sDateStr = formatDateToYMD(l.startDate);
      const eDateStr = formatDateToYMD(l.endDate);
      if (!sDateStr || !eDateStr) return false;

      return targetIsoDate >= sDateStr && targetIsoDate <= eDateStr;
    });

    if (approvedLeave) {
      return { type: 'LEAVE', leave: approvedLeave };
    }

    // 2. Check attendance records
    const dayRecords = attendance.filter(a => {
      if (!a.userId || a.userId.trim().toLowerCase() !== staffId.trim().toLowerCase()) return false;
      const ts = a.timestamp || '';
      const formattedTs = formatDateToYMD(ts);
      return (
        formattedTs === targetIsoDate ||
        ts.includes(targetIsoDate) ||
        ts.includes(targetSlashDate) ||
        ts.includes(targetSlashDateUS)
      );
    });

    const hasIn = dayRecords.some(r => r.action === 'IN' || !!r.checkIn);
    const hasOut = dayRecords.some(r => r.action === 'OUT' || !!r.checkOut);

    if (hasIn && hasOut) {
      return {
        type: 'FULL',
        recIn: dayRecords.find(r => r.action === 'IN' || !!r.checkIn),
        recOut: dayRecords.find(r => r.action === 'OUT' || !!r.checkOut),
      };
    } else if (hasIn) {
      return {
        type: 'IN_ONLY',
        recIn: dayRecords.find(r => r.action === 'IN' || !!r.checkIn),
      };
    }

    return { type: 'NONE' };
  };

  // Export to CSV
  const handleExportCsv = () => {
    const fMonth = String(selectedMonth + 1).padStart(2, '0');
    let csvContent = '\uFEFF'; // UTF-8 BOM
    csvContent += `របាយការណ៍វត្តមានប្រចាំខែ: ${monthNamesKh[selectedMonth]} ឆ្នាំ ${selectedYear}\n`;
    
    // Header
    const headerCols = ['BA ID', 'ឈ្មោះបុគ្គលិក', 'Manager ID'];
    for (let d = 1; d <= daysInMonth; d++) {
      headerCols.push(`ថ្ងៃទី${d}`);
    }
    headerCols.push('វត្តមានសរុប (ថ្ងៃ)', 'សុំច្បាប់ (ថ្ងៃ)', 'ថ្ងៃសម្រាក Off (ថ្ងៃ)');
    csvContent += headerCols.join(',') + '\n';

    // Rows
    baStaffs.forEach(staff => {
      let presentCount = 0;
      let leaveCount = 0;
      let offCount = 0;
      const rowCols = [`"${staff.id}"`, `"${staff.name}"`, `"${staff.managerId || '-'}"`];

      for (let d = 1; d <= daysInMonth; d++) {
        const res = getDayStatus(staff.id, d);
        if (res.type === 'FULL') {
          rowCols.push('"✓"');
          presentCount++;
        } else if (res.type === 'IN_ONLY') {
          rowCols.push('"O"');
          presentCount++;
        } else if (res.type === 'LEAVE') {
          rowCols.push(`"${res.leave?.type}"`);
          if (res.leave?.type === 'Off') {
            offCount++;
          } else {
            leaveCount++;
          }
        } else {
          rowCols.push('""');
        }
      }

      rowCols.push(`"${presentCount}"`, `"${leaveCount}"`, `"${offCount}"`);
      csvContent += rowCols.join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `BA_Report_${selectedYear}_${fMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Top Filter & Month Selector */}
      <div className="bg-white/95 backdrop-blur-xl p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Month Navigation */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              onClick={handlePrevMonth}
              title="ខែមុន"
              className="p-2 hover:bg-white text-slate-700 hover:text-indigo-600 rounded-xl transition-all shadow-xs"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-4 py-1 text-center font-bold text-slate-800 text-xs sm:text-sm min-w-[150px]">
              {monthNamesKh[selectedMonth]} {selectedYear}
            </div>
            <button
              onClick={handleNextMonth}
              title="ខែបន្ទាប់"
              className="p-2 hover:bg-white text-slate-700 hover:text-indigo-600 rounded-xl transition-all shadow-xs"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => {
              setSelectedYear(today.getFullYear());
              setSelectedMonth(today.getMonth());
            }}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
          >
            ខែបច្ចុប្បន្ន
          </button>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>✓ ពេញលេញ (Check-In & Out)</span>
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-xl border border-amber-200 font-semibold">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span>O Check-In តែមួយ</span>
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-pink-50 text-pink-700 rounded-xl border border-pink-200 font-semibold">
            <span className="w-2 h-2 rounded-full bg-pink-500"></span>
            <span>ច្បាប់ (AL, SL, UL, CS...)</span>
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-cyan-50 text-cyan-800 rounded-xl border border-cyan-200 font-semibold">
            <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
            <span>Off (ថ្ងៃសម្រាក - ដាច់ដោយឡែក)</span>
          </span>
        </div>

        {/* Action Buttons: Export & Print */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">ទាញយក</span> CSV
          </button>
          <button
            onClick={() => window.print()}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">បោះពុម្ព</span>
          </button>
        </div>
      </div>

      {/* Main Table Container with Smooth Frozen Panes */}
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden print-area">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-2">
              <span>របាយការណ៍ការងារប្រចាំថ្ងៃ </span>
              <span className="text-[11px] bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-xl font-bold border border-indigo-200">
                {baStaffs.length} នាក់
              </span>
            </h2>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {currentUser.type === 'Admin' && (
              <select
                value={managerFilter}
                onChange={e => setManagerFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="ALL">គ្រប់ Manager</option>
                {MANAGER_IDS.map(m => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            )}

            <div className="relative flex-1 sm:w-60">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="ស្វែងរក BA ID ឬ ឈ្មោះ..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Scrollable Matrix */}
        <div className="overflow-x-auto max-h-[620px] relative">
          <table className="w-full text-left text-xs border-collapse">
            {/* Frozen Table Header */}
            <thead className="sticky top-0 z-30 bg-slate-50 shadow-xs border-b border-slate-200">
              <tr>
                {/* Frozen Corner Column */}
                <th className="sticky left-0 z-40 bg-slate-100 p-3 font-bold text-slate-700 min-w-[170px] max-w-[200px] border-r border-slate-200 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)]">
                  BA ID &amp; ឈ្មោះ
                </th>
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                  const dateObj = new Date(selectedYear, selectedMonth, day);
                  const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
                  const isCurrentDay =
                    day === today.getDate() &&
                    selectedMonth === today.getMonth() &&
                    selectedYear === today.getFullYear();

                  return (
                    <th
                      key={day}
                      className={`p-2 text-center text-xs font-bold min-w-[36px] border-r border-slate-200/60 ${
                        isCurrentDay
                          ? 'bg-indigo-100 text-indigo-800 ring-1 ring-indigo-400'
                          : isWeekend
                          ? 'bg-slate-100/70 text-slate-500'
                          : 'text-slate-600'
                      }`}
                    >
                      <span>{day}</span>
                    </th>
                  );
                })}
                {/* Summary columns */}
                <th className="p-2 text-center text-xs font-bold text-emerald-800 bg-emerald-50 min-w-[65px] border-r border-slate-200">
                  វត្តមាន
                </th>
                <th className="p-2 text-center text-xs font-bold text-pink-800 bg-pink-50 min-w-[65px] border-r border-slate-200" title="ច្បាប់ (AL, SL, UL, CS... មិនរាប់បញ្ចូល Off ទេ)">
                  ច្បាប់
                </th>
                <th className="p-2 text-center text-xs font-bold text-cyan-800 bg-cyan-50 min-w-[65px]" title="ថ្ងៃសម្រាកប្រចាំសប្តាហ៍ (ដាច់ដោយឡែក)">
                  Off (សម្រាក)
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-100 text-xs">
              {baStaffs.length === 0 ? (
                <tr>
                  <td colSpan={daysInMonth + 4} className="text-center py-12 text-slate-400">
                    មិនមានទិន្នន័យ BA Staff ត្រូវនឹងលក្ខខណ្ឌស្វែងរកឡើយ
                  </td>
                </tr>
              ) : (
                baStaffs.map(staff => {
                  let presentTotal = 0;
                  let leaveTotal = 0;
                  let offTotal = 0;

                  return (
                    <tr key={staff.id} className="hover:bg-indigo-50/20 transition-colors">
                      {/* Frozen First Column */}
                      <td className="sticky left-0 z-20 bg-white p-3 font-medium border-r border-slate-200 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)]">
                        <div className="font-bold text-indigo-600 flex items-center justify-between">
                          <span>{staff.id}</span>
                          {staff.managerId && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                              {staff.managerId}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-600 truncate max-w-[150px]">
                          {staff.name}
                        </div>
                      </td>

                      {/* Day 1 to 31 cells */}
                      {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                        const status = getDayStatus(staff.id, day);
                        const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(
                          2,
                          '0'
                        )}-${String(day).padStart(2, '0')}`;

                        if (status.type === 'FULL') {
                          presentTotal++;
                          return (
                            <td
                              key={day}
                              onClick={() =>
                                setSelectedCellDetail({
                                  staff,
                                  day,
                                  dateStr,
                                  attendanceIn: status.recIn,
                                  attendanceOut: status.recOut,
                                })
                              }
                              title={`Check-In & Out: ${status.recIn?.timestamp || ''}`}
                              className="p-1.5 text-center font-bold text-emerald-600 border-r border-slate-100 hover:bg-emerald-50/50 cursor-pointer select-none"
                            >
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 text-xs shadow-2xs">
                                ✓
                              </span>
                            </td>
                          );
                        } else if (status.type === 'IN_ONLY') {
                          presentTotal++;
                          return (
                            <td
                              key={day}
                              onClick={() =>
                                setSelectedCellDetail({
                                  staff,
                                  day,
                                  dateStr,
                                  attendanceIn: status.recIn,
                                })
                              }
                              title="Check-In តែមួយគត់ (ខ្វះ Check-Out)"
                              className="p-1.5 text-center font-bold text-amber-600 border-r border-slate-100 hover:bg-amber-50/50 cursor-pointer select-none"
                            >
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-amber-100 text-amber-700 text-xs shadow-2xs font-bold">
                                O
                              </span>
                            </td>
                          );
                        } else if (status.type === 'LEAVE') {
                          const isOff = status.leave?.type === 'Off';
                          if (isOff) {
                            offTotal++;
                          } else {
                            leaveTotal++;
                          }

                          return (
                            <td
                              key={day}
                              onClick={() =>
                                setSelectedCellDetail({
                                  staff,
                                  day,
                                  dateStr,
                                  leave: status.leave,
                                })
                              }
                              title={
                                isOff
                                  ? `ថ្ងៃសម្រាកប្រចាំសប្តាហ៍ (Off): ${status.leave?.reason || 'ថ្ងៃសម្រាក'}`
                                  : `ច្បាប់សម្រាក (${status.leave?.type}): ${status.leave?.reason || ''}`
                              }
                              className={`p-1.5 text-center border-r border-slate-100 cursor-pointer select-none ${
                                isOff ? 'hover:bg-cyan-100/50' : 'hover:bg-pink-100/50'
                              }`}
                            >
                              <span
                                className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded-md font-bold text-[10px] shadow-2xs border ${
                                  isOff
                                    ? 'bg-cyan-100 text-cyan-800 border-cyan-300 font-extrabold'
                                    : 'bg-pink-100 text-pink-700 border-pink-200'
                                }`}
                              >
                                {status.leave?.type}
                              </span>
                            </td>
                          );
                        }

                        return (
                          <td
                            key={day}
                            className="p-1.5 text-center text-slate-300 border-r border-slate-100"
                          >
                            -
                          </td>
                        );
                      })}

                      {/* Summary per staff */}
                      <td className="p-2 text-center font-bold text-emerald-700 bg-emerald-50/50 border-r border-slate-200">
                        {presentTotal}
                      </td>
                      <td className="p-2 text-center font-bold text-pink-700 bg-pink-50/50 border-r border-slate-200">
                        {leaveTotal}
                      </td>
                      <td className="p-2 text-center font-bold text-cyan-700 bg-cyan-50/50">
                        {offTotal}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cell Detail Popup Modal */}
      {selectedCellDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-xl max-w-sm w-full p-5 border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">{selectedCellDetail.staff.name}</h4>
                <p className="text-[11px] text-indigo-600 font-mono font-semibold">
                  {selectedCellDetail.staff.id} • ថ្ងៃទី {selectedCellDetail.day}/
                  {selectedMonth + 1}/{selectedYear}
                </p>
              </div>
              <button
                onClick={() => setSelectedCellDetail(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              {selectedCellDetail.leave ? (
                <div
                  className={`p-3 rounded-2xl border ${
                    selectedCellDetail.leave.type === 'Off'
                      ? 'bg-cyan-50 border-cyan-200'
                      : 'bg-pink-50 border-pink-200'
                  }`}
                >
                  <span
                    className={`font-bold block mb-1 ${
                      selectedCellDetail.leave.type === 'Off'
                        ? 'text-cyan-800'
                        : 'text-pink-700'
                    }`}
                  >
                    {selectedCellDetail.leave.type === 'Off'
                      ? 'ថ្ងៃសម្រាកប្រចាំសប្តាហ៍: Off (Approved)'
                      : `ច្បាប់ឈប់សម្រាក: ${selectedCellDetail.leave.type} (Approved)`}
                  </span>
                  <p className="text-slate-600 mb-1">
                    <span className="text-slate-400">កាលបរិច្ឆេទ: </span>
                    {selectedCellDetail.leave.startDate} ➔ {selectedCellDetail.leave.endDate}
                  </p>
                  <p className="text-slate-600">
                    <span className="text-slate-400">មូលហេតុ: </span>
                    {selectedCellDetail.leave.reason || (selectedCellDetail.leave.type === 'Off' ? 'ថ្ងៃសម្រាកប្រចាំសប្តាហ៍' : '-')}
                  </p>
                </div>
              ) : selectedCellDetail.attendanceIn || selectedCellDetail.attendanceOut ? (
                <div className="space-y-2">
                  {selectedCellDetail.attendanceIn && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl">
                      <span className="font-bold text-emerald-800 flex items-center gap-1.5 mb-1">
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span>Check-In:</span>
                      </span>
                      <p className="text-slate-700 font-mono">
                        {selectedCellDetail.attendanceIn.timestamp}
                      </p>
                      {selectedCellDetail.attendanceIn.distanceMeters !== undefined && (
                        <p className="text-slate-500 text-[11px] mt-0.5">
                          ចម្ងាយពីតូប: ~{Math.round(selectedCellDetail.attendanceIn.distanceMeters)} ម៉ែត្រ
                        </p>
                      )}
                    </div>
                  )}

                  {selectedCellDetail.attendanceOut ? (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl">
                      <span className="font-bold text-rose-800 flex items-center gap-1.5 mb-1">
                        <Check className="w-4 h-4 text-rose-600" />
                        <span>Check-Out:</span>
                      </span>
                      <p className="text-slate-700 font-mono">
                        {selectedCellDetail.attendanceOut.timestamp}
                      </p>
                    </div>
                  ) : (
                    <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-2xl text-amber-700">
                      មិនទាន់មានទិន្នន័យ Check-Out នៅឡើយ
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded-2xl text-center text-slate-400">
                  មិនមានទិន្នន័យវត្តមានសម្រាប់ថ្ងៃនេះ
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedCellDetail(null)}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
            >
              បិទ
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
