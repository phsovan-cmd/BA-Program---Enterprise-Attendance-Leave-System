import React, { useMemo, useState } from 'react';
import { CalendarCheck2, Search } from 'lucide-react';
import type { User, AttendanceRecord, LeaveRequest, SalesOrder, StockInRecord } from '../types';
import { ReportMonthNavigation } from './ReportMonthNavigation';

interface Props {
  currentUser: User;
  users: User[];
  attendance: AttendanceRecord[];
  leaves: LeaveRequest[];
  salesOrders: SalesOrder[];
  stockInRecords: StockInRecord[];
}
const idKey = (value: string | undefined) => String(value || '').trim().toUpperCase();
const compactKey = (value: string | undefined) => idKey(value).replace(/[\s._-]+/g, '');
const staffRole = (u: User) => {
  const role = compactKey(u.type);
  return role === 'BASTAFF' || role === 'BA' || role === 'STAFF' || (!role && /^BA/i.test(u.id || ''));
};
const matchesManager = (ba: User, manager: User) => {
  const assigned = compactKey(ba.managerId);
  if (!assigned) return false;
  // BA List may store either the manager user ID, assigned manager code, or name.
  return [manager.id, manager.managerId, manager.name].some(v => !!compactKey(v) && compactKey(v) === assigned);
};
const pad = (value: number) => String(value).padStart(2, '0');
const STOCK_COUNT_DAYS = [7, 14, 21, 28] as const;
const KH_MONTHS = ['មករា','កុម្ភៈ','មីនា','មេសា','ឧសភា','មិថុនា','កក្កដា','សីហា','កញ្ញា','តុលា','វិច្ឆិកា','ធ្នូ'];
const khDigits = (value: number) => String(value).replace(/[0-9]/g, digit => '០១២៣៤៥៦៧៨៩'[Number(digit)]);
const currency = new Intl.NumberFormat('en-US', {style:'currency', currency:'USD', minimumFractionDigits:2, maximumFractionDigits:2});
const isoDay = (value: string | undefined) => {
  const raw = String(value || '');
  const match = raw.match(/\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : '';
};

export function BAMonthlyCombinedReport({currentUser, users, attendance, leaves, salesOrders, stockInRecords}: Props) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const isAdmin = currentUser.type === 'Admin';
  const isManager = currentUser.type === 'Manager';
  const canFilter = isAdmin || isManager;
  const [selectedManager, setSelectedManager] = useState('ALL');
  const [selectedBA, setSelectedBA] = useState('');
  const [query, setQuery] = useState('');
  // Manager scope is based on each BA's explicit Manager ID, not a shared region.
  const managerList = useMemo(() => users.filter(u => u.type === 'Manager')
    .sort((a,b) => a.id.localeCompare(b.id)), [users]);
  const permitted = useMemo(() => users.filter(u => {
    if (!staffRole(u)) return false;
    if (isAdmin) {
      if (selectedManager === 'ALL') return true;
      const manager = managerList.find(m => idKey(m.id) === idKey(selectedManager));
      return manager ? matchesManager(u, manager) : false;
    }
    if (isManager) return matchesManager(u, currentUser);
    return idKey(u.id) === idKey(currentUser.id);
  }).sort((a,b) => a.id.localeCompare(b.id)), [users,currentUser,isAdmin,isManager,selectedManager,managerList]);
  const target = canFilter ? (permitted.find(u => idKey(u.id) === idKey(selectedBA)) || permitted[0]) : currentUser;
  const baId = idKey(target?.id);
  const monthPrefix = `${year}-${pad(month+1)}-`;
  const daysInMonth = new Date(year,month+1,0).getDate();
  const values = useMemo(() => {
    const present = new Set<string>();
    const counts = new Map<string, Set<string>>();
    const sales = new Map<string,{orders:Set<string>,qty:number,amount:number}>();
    const noSalesDays = new Set<string>();
    const leaveDays = new Map<string,string>();
    for (const entry of attendance) {
      if (idKey(entry.userId) !== baId) continue;
      const day = isoDay(entry.timestamp);
      if (day.startsWith(monthPrefix) && (entry.action === 'IN' || entry.action === 'OUT')) present.add(day);
    }
    for (const entry of leaves) {
      if (idKey(entry.userId) !== baId || entry.status !== 'Approved') continue;
      const first = isoDay(entry.startDate),last = isoDay(entry.endDate);
      if (!first || !last) continue;
      for (let i=1;i<=daysInMonth;i++) {const date=`${monthPrefix}${pad(i)}`; if (date>=first&&date<=last) leaveDays.set(date, entry.type);}
    }
    const orderIds = new Set<string>();
    for (const order of salesOrders) {
      if(idKey(order.baId)!==baId) continue;
      const date=isoDay(order.date||order.timestamp);
      if(!date.startsWith(monthPrefix)) continue;
      const uniq = `${baId}|${order.id}`;
      if(orderIds.has(uniq)) continue;
      orderIds.add(uniq);
      if (order.isNoSales || order.items?.some(item=>idKey(item.productCode)==='NO_SALES')) {
        noSalesDays.add(date);
        continue;
      }
      if ((order.totalQty || 0) <= 0) continue;
      const row = sales.get(date) || {orders:new Set<string>(),qty:0,amount:0};
      row.orders.add(order.id);row.qty += order.totalQty || 0;row.amount += order.totalAmount || 0;
      sales.set(date,row);
    }
    for (const entry of stockInRecords) {
      if (idKey(entry.baId||entry.updatedBy)!==baId || entry.status === 'Rejected') continue;
      const date=isoDay(entry.date||entry.timestamp);
      if(!date.startsWith(monthPrefix)) continue;
      const note=String(entry.note||'');
      const source=String((entry as StockInRecord & {source?:string}).source||'');
      const match=note.match(/^Stock Count ([1-4])(?:\s*\||$)/i)||source.match(/Stock Count ([1-4])\b/i);
      const isNote=/^Stock Count Note(?:\s*\||$)/i.test(note)||/Stock Count Note\b/i.test(source)||/^SCN(?:\s*\||$)/i.test(note);
      const label=match?`SC${match[1]}`:(isNote?'SCN':'');
      if(label){if(!counts.has(date))counts.set(date,new Set());counts.get(date)!.add(label);}
    }
    return {present,counts,sales,noSalesDays,leaveDays};
  },[baId,monthPrefix,daysInMonth,attendance,leaves,salesOrders,stockInRecords]);
  const changeMonth=(step:number)=>{const d=new Date(year,month+step,1);setYear(d.getFullYear());setMonth(d.getMonth());};
  const rows=Array.from({length:daysInMonth},(_,i)=>{
    const day=i+1,date=`${monthPrefix}${pad(day)}`;
    return {day,date,stockCycle:STOCK_COUNT_DAYS.indexOf(day as typeof STOCK_COUNT_DAYS[number]) + 1,attendance:values.leaveDays.get(date) || (values.present.has(date)?'✓':''), sale:values.sales.get(date),noSale:values.noSalesDays.has(date),stock:Array.from(values.counts.get(date)||[]).sort()};
  });
  const visibleRows=rows.filter(r=>!query || String(r.day).includes(query.trim()));
  return <section className="rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden">
    <header className="p-4 sm:p-5 border-b border-slate-100 space-y-3">
      <div className="flex items-center gap-2"><CalendarCheck2 className="w-5 h-5 text-pink-600"/><h2 className="text-base sm:text-lg font-bold text-slate-900">របាយការណ៍ប្រចាំខែ (Monthly BA Report)</h2></div>
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <ReportMonthNavigation year={year} month={month} onChangeMonth={changeMonth} onCurrentMonth={()=>{const d=new Date();setYear(d.getFullYear());setMonth(d.getMonth());}} />
        {isAdmin && <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">Manager ID
          <select value={selectedManager} onChange={e=>{setSelectedManager(e.target.value);setSelectedBA('');}}
            className="rounded-xl border border-slate-200 bg-white p-2.5 max-w-64" aria-label="Filter by Manager ID">
            <option value="ALL">All Managers</option>
            {managerList.map(u=><option key={u.id} value={u.id}>{u.id} — {u.name}</option>)}
          </select>
        </label>}
        {canFilter && <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">BA Staff
          <select value={target?.id || ''} onChange={e=>setSelectedBA(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white p-2.5 max-w-64" aria-label="Filter BA Staff">
            {permitted.length === 0 && <option value="">No BA available</option>}
            {permitted.map(u=><option key={u.id} value={u.id}>{u.id} — {u.name}</option>)}
          </select>
        </label>}
      </div>
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="rounded-xl bg-pink-50 text-pink-700 px-3 py-2 text-xs sm:text-sm font-bold">BA ID: {target?.id || '—'} · {target?.name || 'No BA available'}</div>
        <label className="flex items-center gap-1.5 rounded-xl px-3 border border-slate-200"><Search className="w-3.5 h-3.5 text-slate-400"/><input aria-label="Search date" placeholder="Search date" value={query} onChange={e=>setQuery(e.target.value)} className="py-2 text-xs outline-none w-24"/></label>
      </div>
      <div className="flex flex-wrap gap-2 text-[11px] items-center" aria-label="Stock Count schedule legend">
        <span className="bg-indigo-100 text-indigo-800 rounded-lg px-2.5 py-1 font-bold">ថ្ងៃទី ៧ · ១៤ · ២១ · ២៨ = ថ្ងៃត្រូវរាប់ស្តុក</span>
        <span className="bg-emerald-100 text-emerald-800 rounded-lg px-2.5 py-1">✓ រាប់រួច</span>
        <span className="bg-amber-100 text-amber-800 rounded-lg px-2.5 py-1">មិនទាន់រាប់</span>
      </div>
    </header>
    <div className="max-h-[58vh] min-h-[180px] overflow-auto overscroll-contain" aria-label="Monthly BA report scrollable table">
      <table className="w-full min-w-[340px] text-[11px] sm:text-sm border-separate border-spacing-0 text-center">
        <thead className="sticky top-0 z-20 shadow-[0_2px_6px_rgba(15,23,42,0.08)]">
          <tr className="bg-indigo-100 text-indigo-950">
            <th scope="col" className="sticky left-0 z-30 bg-indigo-100 text-left px-2 sm:px-3 py-2.5 font-extrabold min-w-[96px] sm:min-w-[110px] whitespace-nowrap">កាលបរិច្ឆេទ</th>
            <th scope="col" className="px-1 sm:px-2 py-2.5 font-extrabold">វត្តមាន</th>
            <th scope="col" className="px-1 sm:px-2 py-2.5 font-extrabold">លក់ ($)</th>
            <th scope="col" className="px-1 sm:px-2 py-2.5 font-extrabold">ស្តុក</th>
          </tr>
        </thead>
        <tbody>{visibleRows.map((r,i)=><tr key={r.date} className={`${r.stockCycle>0?'bg-indigo-100/70':i%2===0?'bg-white':'bg-indigo-50/40'} hover:bg-pink-50/80 transition-colors`}>
          <th scope="row" className={`sticky left-0 z-10 px-2 sm:px-3 py-2.5 text-left whitespace-nowrap font-semibold text-slate-800 ${r.stockCycle>0?'bg-indigo-100':i%2===0?'bg-white':'bg-[#f6f7ff]'}`}>{khDigits(r.day)} {KH_MONTHS[month]}</th>
          <td className="px-1 sm:px-2 py-2">{r.attendance?<span className={`inline-flex rounded-lg px-2.5 py-1 font-bold ${r.attendance==='✓'?'bg-emerald-100 text-emerald-800':'bg-amber-100 text-amber-800'}`}>{r.attendance==='✓'?'✓':r.attendance}</span>:<span className="text-slate-300">–</span>}</td>
          <td className="px-1 sm:px-2 py-2">{r.sale?<span className="inline-flex rounded-lg bg-pink-100 text-pink-800 px-2.5 py-1 font-extrabold tabular-nums" title={`${r.sale.orders.size} orders · ${r.sale.qty} pcs`}>{currency.format(r.sale.amount)}</span>:r.noSale?<span className="inline-flex rounded-lg bg-slate-200 text-slate-700 px-2.5 py-1 font-bold" title="Submitted No Sales">SO</span>:<span className="text-slate-300">–</span>}</td>
          <td className={`px-1 sm:px-2 py-2 ${r.stockCycle>0 ? 'bg-indigo-100/70' : ''}`} title={r.stockCycle>0 ? `ថ្ងៃទី ${r.day}: Stock Count ${r.stockCycle} ត្រូវរាប់` : undefined}>
            {r.stock.length?<div className="flex justify-center flex-wrap gap-1">{r.stock.map(label=><span key={label} className={`rounded-lg px-2 py-1 font-bold ${label==='SCN'?'text-fuchsia-800 bg-fuchsia-100':'text-emerald-800 bg-emerald-100'}`}>{label}</span>)}</div>
            :r.stockCycle>0?<span className="inline-flex rounded-lg px-2 py-1 bg-amber-100 text-amber-800 font-bold" title={`Scheduled: Stock Count ${r.stockCycle} · No count recorded`}>SC{r.stockCycle} · –</span>
            :<span className="text-slate-300">–</span>}
          </td>
        </tr>)}
        {!target&&<tr><td colSpan={4} className="p-7 text-slate-500">No BA available</td></tr>}
        </tbody>
      </table>
    </div>
    <footer className="p-3 text-[11px] sm:text-xs text-slate-500 border-t border-slate-100 leading-relaxed">✓ = បាន Check In/Out · $ = ទឹកប្រាក់លក់ · SO = បាន Submit ថាមិនមានលក់ · ថ្ងៃ ៧/១៤/២១/២៨ = ថ្ងៃកំណត់ Stock Count · SC1–SC4 = Stock Count · SCN = Stock Count Note · – = មិនមានកំណត់ត្រា</footer>
  </section>;
}
