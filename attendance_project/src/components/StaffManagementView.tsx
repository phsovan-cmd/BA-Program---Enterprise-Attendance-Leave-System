import React, { useState } from 'react';
import { User, UserType, MANAGER_IDS } from '../types';
import { Plus, Search, Edit2, Trash2, MapPin, Shield, Users, UserCheck, AlertTriangle, FileSpreadsheet, Snowflake, Pin } from 'lucide-react';
import { isUserUnderManager } from './AttendanceHistoryView';

interface StaffManagementViewProps {
  currentUser: User;
  users: User[];
  onOpenAddModal: () => void;
  onOpenEditModal: (user: User) => void;
  onDeleteUser: (userId: string) => Promise<void>;
  onOpenMapPicker: (currentLoc: string, onPicked: (coords: string) => void) => void;
  onOpenUploadModal?: () => void;
}

export const StaffManagementView: React.FC<StaffManagementViewProps> = ({
  currentUser,
  users,
  onOpenAddModal,
  onOpenEditModal,
  onDeleteUser,
  onOpenMapPicker,
  onOpenUploadModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | UserType>('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [managerFilter, setManagerFilter] = useState('ALL');
  const [freezeMode, setFreezeMode] = useState<'all' | 'header' | 'none'>('all');

  // Filter staff according to permissions
  let filtered = users;

  if (currentUser.type === 'Manager') {
    filtered = users.filter(u => isUserUnderManager(currentUser, u));
  } else if (currentUser.type === 'BA Staff') {
    filtered = users.filter(u => u.id === currentUser.id);
  }

  if (roleFilter !== 'ALL') {
    filtered = filtered.filter(u => u.type === roleFilter);
  }

  if (statusFilter !== 'ALL') {
    filtered = filtered.filter(u => u.status === statusFilter);
  }

  if (managerFilter !== 'ALL') {
    filtered = filtered.filter(u => (u.managerId || '').trim().toUpperCase() === managerFilter.trim().toUpperCase());
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(
      u =>
        u.id.toLowerCase().includes(q) ||
        u.name.toLowerCase().includes(q) ||
        (u.managerId && u.managerId.toLowerCase().includes(q)) ||
        (u.location && u.location.toLowerCase().includes(q))
    );
  }

  const [userToDelete, setUserToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDeleteAction = async () => {
    if (!userToDelete) return;
    try {
      setIsDeleting(true);
      await onDeleteUser(userToDelete.id);
      setUserToDelete(null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-white/95 backdrop-blur-xl rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
      {/* Header and Toolbar */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
            <span>
              {currentUser.type === 'Admin'
                ? 'បញ្ជីបុគ្គលិក និងអ្នកគ្រប់គ្រងទាំងអស់'
                : 'បញ្ជីកូនក្រុមក្រោមការគ្រប់គ្រង'}
            </span>
            <span className="text-[11px] bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-xl font-bold border border-indigo-200">
              {filtered.length} នាក់
            </span>
          </h2>
          <p className="text-[11px] text-slate-500">
            {currentUser.type === 'Admin'
              ? 'គ្រប់គ្រងអត្តលេខ ទីតាំងតូបដែលត្រូវឈរ និងសិទ្ធិចូលប្រើប្រាស់'
              : 'មើលព័ត៌មានបុគ្គលិកក្រោមក្រុមការងាររបស់អ្នក'}
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {currentUser.type === 'Admin' && (
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value as any)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="ALL">គ្រប់ Type</option>
              <option value="Admin">Admin</option>
              <option value="Manager">Manager</option>
              <option value="BA Staff">BA Staff</option>
            </select>
          )}

          {currentUser.type === 'Admin' && (
            <select
              value={managerFilter}
              onChange={e => setManagerFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="ALL">គ្រប់ Manager</option>
              {MANAGER_IDS.map(m => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          )}

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="ALL">គ្រប់ Status</option>
            <option value="Active">Active (សកម្ម)</option>
            <option value="Pending">Pending (រង់ចាំ)</option>
            <option value="Inactive">Inactive (អសកម្ម)</option>
          </select>

          {/* Search Box */}
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="ស្វែងរក ID ឬ ឈ្មោះ..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          {/* Freeze Pane Selector */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100/70 transition-colors">
            <Snowflake className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <select
              value={freezeMode}
              onChange={e => setFreezeMode(e.target.value as 'all' | 'header' | 'none')}
              className="bg-transparent font-medium text-slate-700 text-xs outline-none cursor-pointer"
              title="កំណត់ Freeze Panes (បង្កកក្បាលតារាង និងជួរឈរ)"
            >
              <option value="all">Freeze: Header &amp; ID</option>
              <option value="header">Freeze: Header Only</option>
              <option value="none">Freeze: Off</option>
            </select>
          </div>

          {currentUser.type === 'Admin' && (
            <>
              {onOpenUploadModal && (
                <button
                  onClick={onOpenUploadModal}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-all"
                  title="Upload User ID / BA List ពី Excel ឬ CSV"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Upload User ID</span>
                </button>
              )}

              <button
                onClick={onOpenAddModal}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>បន្ថែមបុគ្គលិក</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Table with Freeze Panes (Sticky Header and Sticky Columns) */}
      <div className="overflow-auto w-full max-h-[calc(100vh-270px)] sm:max-h-[620px] border-t border-slate-200 relative">
        <table className="w-full text-left text-xs sm:text-sm border-collapse">
          <thead className={freezeMode !== 'none' ? 'sticky top-0 z-30 bg-slate-100/95 backdrop-blur-xs border-b border-slate-200 shadow-xs' : 'bg-slate-50 border-b border-slate-200'}>
            <tr className="text-slate-600 text-[11px] uppercase font-bold tracking-wider">
              <th className={`py-3 px-3 text-center w-12 min-w-[48px] max-w-[48px] ${freezeMode === 'all' ? 'sticky left-0 top-0 z-40 bg-slate-100 border-r border-slate-200' : ''}`}>
                Nº
              </th>
              <th className={`py-3 px-4 min-w-[120px] ${freezeMode === 'all' ? 'sticky left-12 top-0 z-40 bg-slate-100 border-r border-slate-200 shadow-[3px_0_6px_-2px_rgba(0,0,0,0.1)]' : ''}`}>
                អត្តលេខ (ID)
              </th>
              <th className="py-3 px-4 min-w-[180px]">ឈ្មោះ (Name)</th>
              <th className="py-3 px-4 min-w-[170px]">ទីតាំងតូប (Location)</th>
              <th className="py-3 px-4 min-w-[110px]">ស្ថានភាព (Status)</th>
              <th className="py-3 px-4 min-w-[100px]">តួនាទី (Type)</th>
              <th className="py-3 px-4 min-w-[110px]">Manager ID</th>
              <th className="py-3 px-4 text-right min-w-[90px]">សកម្មភាព</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  មិនមានទិន្នន័យបុគ្គលិកត្រូវនឹងការស្វែងរកឡើយ
                </td>
              </tr>
            ) : (
              filtered.map((user, idx) => (
                <tr key={user.id} className="group hover:bg-slate-50/80 transition-colors">
                  <td className={`py-3 px-3 text-center font-semibold text-slate-400 text-xs w-12 min-w-[48px] max-w-[48px] ${freezeMode === 'all' ? 'sticky left-0 z-20 bg-white group-hover:bg-slate-50 border-r border-slate-100' : ''}`}>
                    {idx + 1}
                  </td>

                  <td className={`py-3 px-4 font-bold text-indigo-600 font-mono min-w-[120px] ${freezeMode === 'all' ? 'sticky left-12 z-20 bg-white group-hover:bg-slate-50 border-r border-slate-100 shadow-[3px_0_6px_-2px_rgba(0,0,0,0.06)]' : ''}`}>
                    {user.id}
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl overflow-hidden bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-xs ring-1 ring-slate-200 shrink-0 shadow-2xs">
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                          <span>{user.name.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800 leading-tight">{user.name}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">ចូល: {user.startDate}</div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-600">
                      <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span className="truncate max-w-[120px]">{user.location}</span>
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                        user.status === 'Active'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : user.status === 'Inactive'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {user.status}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${
                        user.type === 'Admin'
                          ? 'bg-purple-100 text-purple-700 border border-purple-200'
                          : user.type === 'Manager'
                          ? 'bg-blue-100 text-blue-700 border border-blue-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {user.type}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-mono font-semibold">
                      {user.managerId || '-'}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-right">
                    {currentUser.type === 'Admin' ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onOpenEditModal(user)}
                          title="កែប្រែព័ត៌មាន"
                          className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setUserToDelete({ id: user.id, name: user.name })}
                          title="លុបបុគ្គលិក"
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors cursor-pointer active:scale-95"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs">-</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer with Freeze Status */}
      <div className="py-2.5 px-4 bg-slate-50/90 border-t border-slate-200 flex flex-wrap items-center justify-between text-[11px] text-slate-500 font-medium">
        <div className="flex items-center gap-2">
          <span>បង្ហាញសរុប <strong className="text-slate-700 font-bold">{filtered.length}</strong> / {users.length} នាក់</span>
          {freezeMode !== 'none' && (
            <span className="inline-flex items-center gap-1 text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100 text-[10px]">
              <Snowflake className="w-3 h-3 text-indigo-500" />
              <span>Freeze Panes សកម្ម</span>
            </span>
          )}
        </div>
        <div className="text-slate-400 text-[10px]">
          {freezeMode === 'all'
            ? '📌 ក្បាលតារាង (Header) និងជួរឈរ (Nº, ID) ត្រូវបានបង្កកនៅនឹងថ្កល់'
            : freezeMode === 'header'
            ? '📌 ក្បាលតារាង (Header) ត្រូវបានបង្កកនៅនឹងថ្កល់'
            : 'មិនមានការបង្កក (Scroll សេរី)'}
        </div>
      </div>

      {/* In-App 3D Confirmation Dialog for Deletion */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 animate-pop-in-3d">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 text-white flex items-center justify-center mx-auto mb-3.5 icon-box-3d">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-slate-900 text-center mb-1">
              បញ្ជាក់ការលុបទិន្នន័យបុគ្គលិក
            </h3>
            
            <p className="text-xs text-slate-600 text-center mb-5 leading-relaxed">
              តើលោកអ្នកពិតជាចង់លុបទិន្នន័យបុគ្គលិក <strong className="text-slate-800">«{userToDelete.name}»</strong> (អត្តលេខ: <strong className="text-indigo-600 font-mono">{userToDelete.id}</strong>) មែនទេ?
              <br />
              <span className="text-rose-500 text-[11px] block mt-1.5 font-medium">
                * សកម្មភាពនេះនឹងលុបចេញពីប្រព័ន្ធ និង Google Sheet!
              </span>
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setUserToDelete(null)}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-all cursor-pointer"
              >
                បោះបង់
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDeleteAction}
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
