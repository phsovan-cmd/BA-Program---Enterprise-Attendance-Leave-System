import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const MONTHS = ['មករា (Jan)', 'កុម្ភៈ (Feb)', 'មីនា (Mar)', 'មេសា (Apr)', 'ឧសភា (May)', 'មិថុនា (Jun)', 'កក្កដា (Jul)', 'សីហា (Aug)', 'កញ្ញា (Sep)', 'តុលា (Oct)', 'វិច្ឆិកា (Nov)', 'ធ្នូ (Dec)'];

interface Props {
  year: number;
  month: number; // zero-based
  onChangeMonth: (delta: number) => void;
  onCurrentMonth: () => void;
}

export function ReportMonthNavigation({year, month, onChangeMonth, onCurrentMonth}: Props) {
  return (
    <div className="flex items-center gap-2 shrink-0" aria-label="ជ្រើសខែរបាយការណ៍">
      <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
        <button type="button" onClick={() => onChangeMonth(-1)} aria-label="Previous month"
          className="p-2 hover:bg-white text-slate-700 hover:text-indigo-600 rounded-xl transition-all">
          <ChevronLeft className="w-4 h-4"/>
        </button>
        <span className="px-3 sm:px-4 py-1 text-center font-bold text-slate-800 text-xs sm:text-sm min-w-[132px] sm:min-w-[150px]">
          {MONTHS[month]} {year}
        </span>
        <button type="button" onClick={() => onChangeMonth(1)} aria-label="Next month"
          className="p-2 hover:bg-white text-slate-700 hover:text-indigo-600 rounded-xl transition-all">
          <ChevronRight className="w-4 h-4"/>
        </button>
      </div>
      <button type="button" onClick={onCurrentMonth}
        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors">
        ខែបច្ចុប្បន្ន
      </button>
    </div>
  );
}
