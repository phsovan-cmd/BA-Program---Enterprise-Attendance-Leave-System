import React from 'react';
import { Box, LogOut, RefreshCw, Download, UserCheck, Shield } from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  currentUser: User | null;
  isSyncing: boolean;
  onSync: () => void;
  onLogout: () => void;
  canInstall: boolean;
  onInstall: () => void;
  onOpenProfileModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  isSyncing,
  onSync,
  onLogout,
  canInstall,
  onInstall,
  onOpenProfileModal,
}) => {
  return (
    <nav className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Branding with Morea Icon */}
          <div className="flex items-center space-x-3">
            <img
              src="/icon.svg"
              alt="Morea Logo"
              className="w-10 h-10 rounded-full shadow-md shadow-pink-500/20 ring-2 ring-pink-100 shrink-0"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight leading-none">
                  BA Program
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-pink-50 text-pink-700 rounded-md border border-pink-200 hidden sm:inline">
                  Morea
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-normal">
                ប្រព័ន្ធគ្រប់គ្រងវត្តមាន បុគ្គលិក BA Program
              </span>
            </div>
          </div>

          {/* Right Action Items */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live Auto-Update Status Indicator */}
            <div
              title="ទិន្នន័យ Update ស្វ័យប្រវត្តិតាមពេលវេលាជាក់ស្តែង (Auto-Update Enabled)"
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50/80 text-emerald-700 border border-emerald-200/80 rounded-xl text-xs font-semibold select-none shadow-2xs"
            >
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 ${isSyncing ? 'duration-500' : 'duration-1000'}`}></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[11px] font-bold hidden sm:inline">
                {isSyncing ? 'Updating...' : 'Auto Update'}
              </span>
            </div>

            {/* Install PWA button */}
            {canInstall && (
              <button
                onClick={onInstall}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl shadow-xs transition-all hover:opacity-90"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">ដំឡើង App</span>
              </button>
            )}

            {/* Current User Badge with Avatar */}
            {currentUser && (
              <button
                type="button"
                onClick={onOpenProfileModal}
                title="ចុចដើម្បីកែប្រែរូបភាព Profile (ពី Smart Phone ឬ Computer)"
                className="flex items-center gap-2 px-2.5 py-1.5 bg-indigo-50/70 hover:bg-indigo-100/80 rounded-2xl border border-indigo-200/80 shadow-2xs transition-all active:scale-98 group cursor-pointer text-left"
              >
                <div className="relative w-8 h-8 rounded-xl overflow-hidden bg-gradient-to-tr from-indigo-700 via-purple-700 to-indigo-800 text-white flex items-center justify-center font-bold text-xs shadow-xs ring-1 ring-indigo-300 shrink-0">
                  {currentUser.avatar ? (
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs">📷</span>
                  )}
                  {/* Subtle hover camera overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <span className="text-[10px] text-white font-bold">📷</span>
                  </div>
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-extrabold text-indigo-700 leading-tight group-hover:text-purple-700 transition-colors">
                    {currentUser.name}
                  </p>
                  <p className="text-[10px] text-indigo-600 font-extrabold uppercase tracking-wider flex items-center gap-1">
                    <span>{currentUser.type}</span>
                    {currentUser.managerId && (
                      <span className="text-slate-400 font-normal">({currentUser.managerId})</span>
                    )}
                  </p>
                </div>
              </button>
            )}

            {/* Logout Button */}
            {currentUser && (
              <button
                onClick={onLogout}
                className="inline-flex items-center gap-1.5 p-2 sm:px-3 sm:py-2 text-xs font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-all border border-rose-200 active:scale-95"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline font-semibold">ចាកចេញ</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
