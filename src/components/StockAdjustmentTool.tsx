import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Check, ClipboardCheck, Search, ShieldCheck} from 'lucide-react';
import type {Product, User} from '../types';

type Draft = Record<string, {qty: number; done: boolean; transactionId?: string}>;
interface Props {
 currentUser: User;
 products: Product[];
 onSubmitStockInBatch: (changes: {productId: string; qty: number; transactionId: string}[], note: string) => Promise<void>;
 onShowToast: (message: string, type: 'success'|'error'|'info') => void;
}
export const StockAdjustmentTool: React.FC<Props> = ({currentUser, products, onSubmitStockInBatch, onShowToast}) => {
 const storageKey = `ba-stock-adjustment-draft-${currentUser.id}`;
 const [draft, setDraft] = useState<Draft>(() => {
   try {return JSON.parse(localStorage.getItem(storageKey) || '{}');} catch {return {};}
 });
 const [term,setTerm] = useState('');
 const [count,setCount] = useState('1');
 // Four scheduled counts: configurable days of month, in Phnom Penh time.
 const COUNT_DAYS = [7,14,21,28];
 const todayKH = new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Phnom_Penh',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 const dayOfMonth = Number(todayKH.split('-')[2]);
 const isNoteMode = count === 'NOTE';
 const scheduledDay = isNoteMode ? null : COUNT_DAYS[Number(count)-1];
 const canSubmitToday = isNoteMode || dayOfMonth === scheduledDay;
 const [note,setNote] = useState('');
 const [busy,setBusy] = useState(false);
 const submitLock = useRef(false);
 useEffect(()=> {try {localStorage.setItem(storageKey, JSON.stringify(draft));} catch {}},[draft,storageKey]);
 const visible = useMemo(()=>products.filter(p=>`${p.productCode} ${p.name}`.toLowerCase().includes(term.toLowerCase())),[products,term]);
 const ready = products.filter(p=>draft[p.productCode]?.done && Number.isInteger(draft[p.productCode].qty) && draft[p.productCode].qty > 0);
 const update = (code:string, qty:number, done=false)=>setDraft(d=>({...d,[code]:{qty,done,transactionId:d[code]?.transactionId || `STK_ADJ_${Date.now()}_${Math.random().toString(36).slice(2,12)}`}}));
 const submit = async () => {
  if (!ready.length || submitLock.current) return;
  if (!canSubmitToday) { onShowToast(`Stock Count ${count} អាច Submit បានតែថ្ងៃទី ${scheduledDay} ប៉ុណ្ណោះ`, 'error'); return; }
  if (isNoteMode && !note.trim()) {onShowToast('សូមបំពេញ Stock Count Note', 'error'); return;}
  submitLock.current = true;
  setBusy(true);
  try {
   const changes = ready.map(p => ({productId:p.id,qty:draft[p.productCode].qty,transactionId:draft[p.productCode].transactionId || `STK_ADJ_${Date.now()}_${p.productCode}_${Math.random().toString(36).slice(2,10)}`}));
   setDraft(d => {const copy={...d};changes.forEach(c => { const product=products.find(p=>p.id===c.productId);if(product&&copy[product.productCode]) copy[product.productCode]={...copy[product.productCode],transactionId:c.transactionId}; });return copy;});
   await onSubmitStockInBatch(changes,`${isNoteMode ? 'Stock Count Note' : 'Stock Count '+count} | Batch:${changes[0].transactionId}${note.trim()?' | '+note.trim():''}`);
   setDraft(d=>{const next={...d};ready.forEach(p=>delete next[p.productCode]);return next;});
   onShowToast('បានបញ្ចូល Stock In ទៅ Google Sheets រួច', 'success');
  } catch(e) {onShowToast(e instanceof Error?e.message:'Submit មិនជោគជ័យ','error');}
  finally {submitLock.current = false;setBusy(false);}
 };
 return <section className="space-y-4">
  <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3">
   <div className="flex gap-2 items-center"><ShieldCheck className="text-pink-600"/><h2 className="font-extrabold text-slate-800">Stock Count – Stock In</h2></div>
   <p className="text-xs text-slate-500">បញ្ចូលចំនួននាំចូល (+) តាម SKU រួចចុច Done និង Submit ទៅ Google Sheets ដោយមិនចាំបាច់ Approval។</p>
   <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
    <label className="text-xs font-semibold">Stock Count Note
     <select value={count} onChange={e=>setCount(e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-200 p-2.5">{[1,2,3,4].map(n=><option value={n} key={n}>Stock Count {n} (ថ្ងៃទី {COUNT_DAYS[n-1]})</option>)}<option value="NOTE">Stock Count Note (ក្រៅវគ្គ)</option></select>
    </label>
    <label className="text-xs font-semibold sm:col-span-2">Additional Note
     <input value={note} onChange={e=>setNote(e.target.value)} placeholder="កំណត់ចំណាំបន្ថែម" className="mt-1 block w-full rounded-lg border border-slate-200 p-2.5"/>
    </label>
   </div>
   <p className={`text-xs font-semibold ${canSubmitToday?'text-emerald-700':'text-rose-600'}`}>{isNoteMode ? 'Stock Count Note: Submit បានគ្រប់ថ្ងៃ (មិនរាប់ក្នុង Stock Count 1–4)' : canSubmitToday ? `ថ្ងៃនេះជាថ្ងៃ Stock Count ${count} (ថ្ងៃទី ${scheduledDay})` : `Stock Count ${count} កំណត់ថ្ងៃទី ${scheduledDay} រៀងរាល់ខែ។ ថ្ងៃផ្សេងមិនអាច Submit បានទេ។`}</p>
   <div className="flex flex-wrap gap-2 items-center justify-between">
    <span className="text-xs font-semibold text-pink-700">{ready.length} SKU បាន Done</span>
    <button type="button" disabled={!ready.length||busy||!canSubmitToday||(isNoteMode&&!note.trim())} onClick={submit} className="ba-submit-3d rounded-xl px-4 py-2.5 bg-pink-600 text-white text-xs font-bold disabled:opacity-40 flex items-center gap-2"><ClipboardCheck size={16}/>{busy?'Submitting...':'Submit Stock In'}</button>
   </div>
  </div>
  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
   <div className="p-3 border-b border-slate-100 flex gap-2 items-center"><Search size={16}/><input value={term} onChange={e=>setTerm(e.target.value)} className="w-full outline-none text-sm" placeholder="Search Product / SKU"/></div>
   <div className="overflow-x-auto max-h-[60vh] overflow-y-auto"><table className="min-w-[420px] w-full text-[11px] sm:text-xs text-left"><thead className="bg-slate-50 sticky top-0 z-10"><tr>{['Product / SKU','Actual Stock','Stock In (+)','Action'].map(h=><th key={h} className={`p-2.5 font-bold ${h === 'Product / SKU' ? 'sticky left-0 z-20 bg-slate-50 min-w-[128px]' : ''}`}>{h}</th>)}</tr></thead><tbody>{visible.map(p=>{const d=draft[p.productCode];return <tr key={p.productCode} className="border-t border-slate-100 align-middle"><td className="p-1.5 sm:p-2 sticky left-0 z-[1] bg-white min-w-[128px] max-w-[172px]">
 <div className="flex items-center gap-1.5 sm:gap-2">
  <div className="h-7 w-7 sm:h-8 sm:w-8 shrink-0 rounded-md border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center">
   {p.imageUrl ? <img src={p.imageUrl} alt={p.name} loading="lazy" className="h-full w-full object-cover" onError={e => {e.currentTarget.style.display='none';}}/> : <span className="text-[10px] text-slate-400">No image</span>}
  </div>
  <div className="min-w-0 leading-tight"><strong className="block truncate text-[11px] sm:text-xs" title={p.name}>{p.name}</strong><span className="text-[10px] text-slate-400">{p.productCode}</span></div>
 </div>
</td><td className="p-1.5 sm:p-2 font-bold text-slate-700">{p.stockQty||0}</td><td className="p-1.5 sm:p-2"><div className="flex items-center gap-1"><input aria-label={`Stock In quantity for ${p.productCode}`} type="number" min="0" step="1" value={d?.qty ?? 0} onChange={e=>update(p.productCode,Number(e.target.value))} className="w-12 sm:w-14 border rounded-lg p-1.5 text-center"/><span className="text-[10px] sm:text-[11px] text-emerald-600 font-semibold min-w-0">{d?.done?'✓ Done':''}</span></div></td><td className="p-1.5 sm:p-2"><button type="button" disabled={!d||!Number.isInteger(d.qty)||d.qty<=0} onClick={()=>setDraft(old=>({...old,[p.productCode]:{qty:old[p.productCode].qty,done:!old[p.productCode].done}}))} className="text-pink-700 font-bold bg-pink-50 rounded-lg px-2 py-1.5 disabled:opacity-40 flex gap-1 items-center text-[11px] sm:text-xs"><Check size={13}/>{d?.done?'Undo':'Done'}</button></td></tr>})}</tbody></table></div>
  </div>
 </section>;
};
