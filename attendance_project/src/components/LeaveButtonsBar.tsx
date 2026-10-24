import React from 'react';
import { CalendarOff, Sparkles } from 'lucide-react';
import { LEAVE_TYPES, LeaveType } from '../types';

interface LeaveButtonsBarProps {
  onSelectType: (type: LeaveType) => void;
}

export const LeaveButtonsBar: React.FC<LeaveButtonsBarProps> = ({ onSelectType }) => {
  return (
    <div className="bg-white/95 backdrop-blur-xl p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-gradient-to-tr from-pink-500 to-rose-500 text-white rounded-xl shadow-sm">
            <CalendarOff className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm sm:text-base tracking-tight">
              ស្នើសុំច្បាប់សម្រាក (Leave Requests)
            </h3>
            <p className="text-[11px] text-slate-400">ជ្រើសរើសប្រភេទច្បាប់មួយក្នុងចំណោម ៩ ប្រភេទ</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 bg-pink-50 text-pink-700 rounded-full text-[11px] font-semibold border border-pink-200">
          <Sparkles className="w-3 h-3 text-pink-500" />
          <span>៩ ប្រភេទស្ដង់ដារ</span>
        </div>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-9 gap-2">
        {LEAVE_TYPES.map(item => (
          <button
            key={item.code}
            type="button"
            onClick={() => onSelectType(item.code)}
            title={`${item.code} - ${item.labelKh} (${item.description})`}
            className="group relative flex flex-col items-center justify-center py-2.5 px-2 bg-gradient-to-b from-slate-50 to-white hover:from-pink-50/70 hover:to-pink-50/30 border border-slate-200 hover:border-pink-300 rounded-2xl shadow-sm hover:shadow transition-all duration-200 active:scale-95"
          >
            <span className="font-bold text-sm sm:text-base text-slate-800 group-hover:text-pink-600 transition-colors">
              {item.code}
            </span>
            <span className="text-[9px] sm:text-[10px] text-slate-400 group-hover:text-pink-500 truncate max-w-full font-medium">
              {item.code === 'AL'
                ? 'ប្រចាំឆ្នាំ'
                : item.code === 'SL'
                ? 'ច្បាប់ឈឺ'
                : item.code === 'Off'
                ? 'ថ្ងៃសម្រាក'
                : item.code === 'TI'
                ? 'បញ្ហាបច្ចេកទេស'
                : item.code === 'CS'
                ? 'ហាងបិទ'
                : item.code === 'UL'
                ? 'អត់មានប្រាក់បៀវត្ស'
                : item.code === 'SPL'
                ? 'ច្បាប់ពិសេស'
                : item.code === 'C-O'
                ? 'ប្ដូរវេន'
                : 'បុណ្យ'}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
