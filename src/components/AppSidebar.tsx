import React from 'react';
import { LayoutDashboard, CalendarCheck, CalendarDays, ClipboardList, Users, History, ShoppingCart, Boxes, Package, SlidersHorizontal, ChevronLeft, ChevronRight, Menu, X, LogOut, UserCircle, RefreshCw } from 'lucide-react';
import type { User } from '../types';

type Page = 'overview' | 'attendance' | 'leave' | 'staff' | 'history' | 'sales' | 'stock' | 'adjustment' | 'products';
interface Props {
  currentUser: User;
  activePage: Page;
  onNavigate: (page: Page) => void;
  collapsed: boolean;
  onCollapse: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
  onOpenMobile: () => void;
  onSync: () => void;
  onProfile: () => void;
  onLogout: () => void;
  isSyncing: boolean;
}
const sections = [
  { title: 'MAIN MENU', items: [
    { id: 'overview', label: 'Dashboard', sub: 'ផ្ទាំងដើម', Icon: LayoutDashboard },
    { id: 'attendance', label: 'Attendance', sub: 'វត្តមាន', Icon: CalendarCheck },
    { id: 'leave', label: 'Leave Requests', sub: 'សំណើច្បាប់', Icon: ClipboardList },
    { id: 'history', label: 'History', sub: 'ប្រវត្តិវត្តមាន', Icon: History },
  ] },
  { title: 'SALES & INVENTORY', items: [
    { id: 'sales', label: 'Sale Out', sub: 'ការលក់', Icon: ShoppingCart },
    { id: 'stock', label: 'Stock In', sub: 'គ្រប់គ្រងស្តុក', Icon: Boxes },
    { id: 'adjustment', label: 'Stock Count', sub: 'កត់ត្រាស្តុកនាំចូល', Icon: SlidersHorizontal },
    { id: 'products', label: 'Products', sub: 'បញ្ជីទំនិញ', Icon: Package },
  ] },
  { title: 'MANAGEMENT', items: [
    { id: 'staff', label: 'Staff Management', sub: 'គ្រប់គ្រងបុគ្គលិក', Icon: Users },
  ] },
] as const;

export const AppSidebar: React.FC<Props> = ({ currentUser, activePage, onNavigate, collapsed, onCollapse, mobileOpen, onMobileClose, onOpenMobile, onSync, onProfile, onLogout, isSyncing }) => {
  const pick = (p: Page) => { onNavigate(p); onMobileClose(); };
  return <>
    {mobileOpen && <button type="button" aria-label="Close menu" onClick={onMobileClose} className="fixed inset-0 z-40 bg-slate-950/65 lg:hidden" />}
    <aside id="ba-main-sidebar" aria-label="Main sidebar" className={`fixed left-0 top-0 bottom-0 z-50 flex flex-col bg-[#151b2e] text-slate-200 shadow-2xl transition-all duration-200 lg:top-16 lg:z-30 ${collapsed ? 'lg:w-[76px]' : 'lg:w-[260px]'} w-[260px] ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
      <div className="flex items-center justify-between px-4 h-16 shrink-0 border-b border-white/10 lg:h-12">
        {!collapsed && <span className="text-xs font-bold tracking-[.16em] text-slate-400">BA MANAGEMENT</span>}
        <button type="button" aria-label="Collapse sidebar" onClick={onCollapse} className="hidden lg:flex p-2 rounded-lg hover:bg-white/10 ml-auto">{collapsed ? <ChevronRight size={19}/> : <ChevronLeft size={19}/>}</button>
        <button type="button" aria-label="Close sidebar" onClick={onMobileClose} className="lg:hidden p-2 rounded-lg hover:bg-white/10 ml-auto"><X size={20}/></button>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {sections.map(section => <div key={section.title}>
          {!collapsed && <div className="px-3 mb-2 text-[10px] tracking-[.14em] font-extrabold text-slate-400">{section.title}</div>}
          <div className="space-y-1">
            {section.items.map(item => {
              const active = activePage === item.id;
              return <button type="button" key={item.id} onClick={() => pick(item.id)} title={item.label} aria-current={active ? 'page' : undefined}
                className={`w-full flex items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors ${active ? 'bg-gradient-to-r from-fuchsia-500/20 to-indigo-500/10 text-white font-semibold border-l-[3px] border-pink-400 ring-1 ring-inset ring-white/10' : 'hover:bg-white/10 text-slate-300 border-l-[3px] border-transparent'}`}>
                <item.Icon className={`w-5 h-5 shrink-0 ${active ? 'text-pink-300' : 'text-slate-400'}`} />
                {!collapsed && <span className="min-w-0"><span className="block text-[13px] leading-tight">{item.label}</span><span className="block text-[10px] text-slate-400 mt-0.5">{item.sub}</span></span>}
              </button>;
            })}
          </div>
        </div>)}
      </div>
      <div className="border-t border-white/10 px-3 py-3 space-y-1">
        <button type="button" onClick={onSync} className="w-full flex items-center gap-3 rounded-xl p-3 hover:bg-white/10 text-left" title="Sync Data"><RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''}/>{!collapsed && <span className="text-xs">Sync Google Sheets</span>}</button>
        <button type="button" onClick={onProfile} className="w-full flex items-center gap-3 rounded-xl p-3 hover:bg-white/10 text-left" title="Profile"><UserCircle size={18}/>{!collapsed && <span className="text-xs truncate">{currentUser.name}</span>}</button>
        <button type="button" onClick={onLogout} className="w-full flex items-center gap-3 rounded-xl p-3 text-rose-300 hover:bg-rose-500/10 text-left" title="Logout"><LogOut size={18}/>{!collapsed && <span className="text-xs">ចាកចេញ / Logout</span>}</button>
      </div>
    </aside>
  </>;
};
