import React, { useState } from 'react';
import { Check, X, Clock, Calendar, Search, Filter, AlertCircle } from 'lucide-react';
import { User, LeaveRequest, LeaveType, LeaveStatus, LEAVE_TYPES } from '../types';
import { isUserUnderManager } from './AttendanceHistoryView';

interface LeaveRequestsViewProps {
  currentUser: User;
  users: User[];
  leaves: LeaveRequest[];
  onApprove: (leaveId: string) => Promise<void>;
  onReject: (leaveId: string) => Promise<void>;
  onOpenNewLeave: () => void;
}

export const LeaveRequestsView: React.FC<LeaveRequestsViewProps> = ({
  currentUser,
  users,
  leaves,
  onApprove,
  onReject,
  onOpenNewLeave,
}) => {
  const [statusFilter, setStatusFilter] = useState<'ALL' | LeaveStatus>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | LeaveType>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Determine allowed leaves based on role
  let visibleLeaves = leaves;

  if (currentUser.type === 'BA Staff') {
    visibleLeaves = leaves.filter(l => l.userId.trim() === currentUser.id.trim());
  } else if (currentUser.type === 'Manager') {
    visibleLeaves = leaves.filter(l => {
      const staffObj = users.find(u => u.id.trim().toUpperCase() === l.userId.trim().toUpperCase());
      if (staffObj) {
        return isUserUnderManager(currentUser, staffObj);
      }
      return l.userId.trim().toUpperCase() === currentUser.id.trim().toUpperCase();
    });
  }

  // Apply filters
  if (statusFilter !== 'ALL') {
    visibleLeaves = visibleLeaves.filter(l => l.status === statusFilter);
  }

  if (typeFilter !== 'ALL') {
    visibleLeaves = visibleLeaves.filter(l => l.type === typeFilter);
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    visibleLeaves = visibleLeaves.filter(
      l =>
        l.userId.toLowerCase().includes(q) ||
        l.userName.toLowerCase().includes(q) ||
        l.reason.toLowerCase().includes(q)
    );
  }

  // Sort: Pending first, then by date desc
  visibleLeaves = [...visibleLeaves].sort((a, b) => {
    if (a.status === 'Pending' && b.status !== 'Pending') return -1;
    if (a.status !== 'Pending' && b.status === 'Pending') return 1;
    return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
  });

  const handleAction = async (action: 'approve' | 'reject', leaveId: string) => {
    try {
      setProcessingId(leaveId);
      if (action === 'approve') {
        await onApprove(leaveId);
      } else {
        await onReject(leaveId);
      }
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="bg-white/95 backdrop-blur-xl rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
      {/* Header and Toolbar */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
              <span>បញ្ជីសំណើសុំច្បាប់សម្រាក</span>
              <span className="text-[11px] bg-pink-50 text-pink-700 px-2.5 py-0.5 rounded-xl font-bold border border-pink-200">
                {visibleLeaves.length} សំណើ
              </span>
            </h2>
            <p className="text-[11px] text-slate-500">
              {currentUser.type === 'Admin'
                ? 'គ្រប់គ្រងសំណើច្បាប់របស់បុគ្គលិកទាំងអស់ក្នុងប្រព័ន្ធ'
                : currentUser.type === 'Manager'
                ? 'អនុម័ត ឬបដិសេធសំណើរបស់កូនក្រុមក្រោមការគ្រប់គ្រង'
                : 'សំណើច្បាប់សម្រាកផ្ទាល់ខ្លួនរបស់អ្នក'}
            </p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-pink-500 outline-none"
          >
            <option value="ALL">គ្រប់ស្ថានភាព</option>
            <option value="Pending">កំពុងរង់ចាំ (Pending)</option>
            <option value="Approved">បានអនុម័ត (Approved)</option>
            <option value="Rejected">បានបដិសេធ (Rejected)</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value as any)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-pink-500 outline-none"
          >
            <option value="ALL">គ្រប់ប្រភេទច្បាប់</option>
            {LEAVE_TYPES.map(t => (
              <option key={t.code} value={t.code}>
                {t.code} - {t.labelEn}
              </option>
            ))}
          </select>

          {/* Search Box */}
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="ស្វែងរក ID, ឈ្មោះ, មូលហេតុ..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-pink-500 outline-none"
            />
          </div>

          <button
            onClick={onOpenNewLeave}
            className="px-3.5 py-1.5 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
          >
            + សុំច្បាប់ថ្មី
          </button>
        </div>
      </div>

      {/* Table with Sticky Header */}
      <div className="overflow-auto w-full max-h-[620px] border-t border-slate-200 relative">
        <table className="w-full text-left text-xs sm:text-sm border-collapse">
          <thead className="sticky top-0 z-20 bg-slate-100/95 backdrop-blur-xs border-b border-slate-200 shadow-xs">
            <tr className="text-slate-600 text-[11px] uppercase font-bold tracking-wider">
              <th className="py-3 px-4 text-center w-12 bg-slate-100">Nº</th>
              <th className="py-3 px-4 bg-slate-100">បុគ្គលិក (Staff)</th>
              <th className="py-3 px-4 bg-slate-100">ប្រភេទ (Type)</th>
              <th className="py-3 px-4 bg-slate-100">កាលបរិច្ឆេទ (Dates)</th>
              <th className="py-3 px-4 bg-slate-100">មូលហេតុ (Reason)</th>
              <th className="py-3 px-4 bg-slate-100">ស្ថានភាព (Status)</th>
              <th className="py-3 px-4 text-right bg-slate-100">សកម្មភាព (Actions)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visibleLeaves.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <AlertCircle className="w-6 h-6 text-slate-300" />
                    <span>មិនមានសំណើច្បាប់សម្រាកនៅឡើយទេ</span>
                  </div>
                </td>
              </tr>
            ) : (
              visibleLeaves.map((leave, idx) => {
                const staffObj = users.find(u => u.id === leave.userId);
                const sMgr = staffObj?.managerId || leave.managerId;
                const canApprove =
                  ((currentUser.type === 'Admin') ||
                    (currentUser.type === 'Manager' &&
                      sMgr &&
                      sMgr.trim().toUpperCase() === currentUser.managerId?.trim().toUpperCase())) &&
                  leave.status === 'Pending';

                const isBusy = processingId === leave.id;

                return (
                  <tr key={leave.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 text-center font-semibold text-slate-400 text-xs">
                      {idx + 1}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800">{leave.userName}</div>
                      <div className="text-[11px] font-mono text-indigo-600 font-semibold">
                        {leave.userId}{' '}
                        {sMgr && <span className="text-slate-400">({sMgr})</span>}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 bg-pink-100 text-pink-700 rounded-lg text-xs font-bold border border-pink-200">
                        {leave.type}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-700 text-xs flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {leave.startDate} <span className="text-slate-400">➔</span> {leave.endDate}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4 max-w-xs">
                      <p className="text-xs text-slate-600 line-clamp-2" title={leave.reason}>
                        {leave.reason}
                      </p>
                    </td>

                    <td className="py-3 px-4">
                      {leave.status === 'Approved' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold border border-emerald-200">
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>Approved</span>
                        </span>
                      ) : leave.status === 'Rejected' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-100 text-rose-800 rounded-full text-xs font-bold border border-rose-200">
                          <X className="w-3 h-3 text-rose-600" />
                          <span>Rejected</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>Pending</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      {canApprove ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleAction('approve', leave.id)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1 transition-all active:scale-95 disabled:opacity-50"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleAction('reject', leave.id)}
                            className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1 transition-all active:scale-95 disabled:opacity-50"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">-</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
