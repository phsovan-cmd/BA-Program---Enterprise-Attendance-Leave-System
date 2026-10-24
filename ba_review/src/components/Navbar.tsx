import React from 'react';
import { Download, Menu, Bell, ClipboardCheck, X, Send } from 'lucide-react';
import { User, LeaveRequest } from '../types';
import { useState } from 'react';

interface NavbarProps {
  currentUser: User | null;
  isSyncing: boolean;
  onSync: () => void;
  onLogout: () => void;
  canInstall: boolean;
  isInstalled: boolean;
  onInstall: () => void;
  onOpenProfileModal?: () => void;
  onOpenMainMenu?: () => void;
  pendingLeaveRequests?: LeaveRequest[];
  onOpenPendingLeaves?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  isSyncing,
  onSync,
  onLogout,
  canInstall,
  isInstalled,
  onInstall,
  onOpenProfileModal,
  onOpenMainMenu,
  pendingLeaveRequests = [],
  onOpenPendingLeaves,
}) => {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [installHelpOpen, setInstallHelpOpen] = useState(false);
  const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
  const canApprove = currentUser?.type === 'Admin' || currentUser?.type === 'Manager';
  const pending = pendingLeaveRequests.filter(l => l.status === 'Pending');
  const goToLeaves = () => { setNotificationsOpen(false); onOpenPendingLeaves?.(); };
  return (
    <nav className="bg-white/95 backdrop-blur-md border-b border-pink-100 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Main Menu control in the top header; never overlaps BA content. */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {currentUser && (
              <button
                type="button"
                onClick={onOpenMainMenu}
                aria-label="Open Main Menu"
                aria-controls="ba-main-sidebar"
                className="lg:hidden flex items-center gap-2 shrink-0 rounded-xl bg-[#151b2e] px-3 py-2.5 text-white shadow-sm hover:bg-slate-800 active:scale-95"
              >
                <Menu size={20}/>
                <span className="text-xs font-bold">Main Menu</span>
              </button>
            )}
          {/* Logo & Branding with Morea Icon */}
          <div className="flex items-center space-x-3 min-w-0">
            <img
              src="/icon.svg"
              alt="Morea Logo"
              className="w-10 h-10 rounded-full shadow-md shadow-pink-500/20 ring-2 ring-pink-200 shrink-0"
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
              <span className="text-[11px] text-slate-500 font-normal hidden sm:block">
                ប្រព័ន្ធគ្រប់គ្រងវត្តមាន បុគ្គលិក BA Program
              </span>
            </div>
          </div>

          </div>

          {/* Right Action Items */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Hotline is available only before the user logs in. */}
            {!currentUser && <a
              href="https://t.me/SovannPheach"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Telegram Hotline @SovannPheach"
              title="Chat with Hotline • @SovannPheach"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#229ED9] text-white shadow-sm hover:bg-[#168AC1] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
            >
              <Send className="h-[18px] w-[18px] -rotate-12" aria-hidden="true" />
            </a>}
            {/* Install PWA button */}
            {!isInstalled && (
              <div className="relative">
                <button type="button" aria-label="Install BA Program" title="Install BA Program"
                  onClick={() => { if (canInstall) onInstall(); else setInstallHelpOpen(v => !v); }}
                  className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 text-xs font-semibold text-white bg-gradient-to-r from-pink-600 to-fuchsia-600 rounded-xl shadow-sm transition-all hover:opacity-90 focus-visible:outline-2 focus-visible:outline-pink-500">
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Install App</span>
                </button>
                {installHelpOpen && !canInstall && <div role="dialog" aria-label="Install App instructions" className="absolute right-0 top-12 z-[80] w-[min(90vw,300px)] rounded-2xl bg-white shadow-xl border border-slate-200 p-4 text-left">
                  <div className="flex justify-between gap-2"><strong className="text-sm text-slate-800">Install BA Program</strong><button type="button" aria-label="Close" onClick={()=>setInstallHelpOpen(false)}><X size={16}/></button></div>
                  <p className="text-xs text-slate-600 mt-2 leading-5">{isIOS ? 'នៅ Safari ចុច Share រួចជ្រើស Add to Home Screen។' : 'នៅ Chrome ឬ Edge ចុច Menu (⋮) រួចជ្រើស Install App ឬ Add to Home Screen។'}</p>
                  <p className="text-[11px] text-slate-500 mt-2">បើមិនឃើញ Install សូមបើក Link App ផ្ទាល់ក្នុង Browser (មិនមែន Preview)។ ត្រូវការ HTTPS និង PWA support។</p>
                </div>}
              </div>
            )}

            {canApprove && (
              <div className="relative">
                <button type="button" aria-label={`Pending leave requests: ${pending.length}`} aria-expanded={notificationsOpen}
                  onClick={() => setNotificationsOpen(v => !v)}
                  className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-pink-100 bg-white text-slate-700 shadow-sm hover:bg-pink-50 focus-visible:outline-2 focus-visible:outline-pink-500">
                  <Bell size={19} />
                  {pending.length > 0 && <span className="absolute -top-1.5 -right-1.5 flex min-w-[19px] h-[19px] items-center justify-center rounded-full bg-pink-600 px-1 text-[10px] font-bold text-white" aria-hidden="true">{pending.length > 99 ? '99+' : pending.length}</span>}
                </button>
                {notificationsOpen && (
                  <div className="absolute right-0 top-12 z-[70] w-[min(90vw,350px)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl" role="region" aria-label="Pending leave approvals">
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                      <div><div className="text-sm font-extrabold text-slate-800">សំណើច្បាប់រង់ចាំអនុម័ត</div><div className="text-xs text-slate-500">Leave Requests · {pending.length} Pending</div></div>
                      <button type="button" aria-label="Close notifications" onClick={() => setNotificationsOpen(false)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"><X size={16}/></button>
                    </div>
                    {pending.length === 0 ? <p className="px-4 py-5 text-sm text-slate-500">គ្មានសំណើច្បាប់កំពុងរង់ចាំអនុម័តទេ។</p> : (
                      <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                        {pending.slice(0, 15).map(leave => (
                          <button type="button" key={leave.id} onClick={goToLeaves} className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-pink-50">
                            <ClipboardCheck className="mt-0.5 h-4 w-4 shrink-0 text-pink-600"/>
                            <span className="min-w-0 flex-1"><span className="block truncate text-xs font-bold text-slate-800">{leave.userName || leave.userId} · {leave.type}</span><span className="block text-[11px] text-slate-500">{leave.startDate} → {leave.endDate}</span></span>
                            <span className="text-[10px] font-bold text-amber-700">Pending</span>
                          </button>
                        ))}
                      </div>
                    )}
                    <button type="button" onClick={goToLeaves} className="w-full border-t border-slate-100 bg-pink-50 px-4 py-3 text-center text-xs font-bold text-pink-700 hover:bg-pink-100">បើក Leave Requests</button>
                  </div>
                )}
              </div>
            )}
            {/* Profile, Sync, and Logout are available in Main Menu sidebar. */}
          </div>
        </div>
      </div>
    </nav>
  );
};
