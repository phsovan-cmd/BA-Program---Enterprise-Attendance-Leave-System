import React, { useState, useEffect } from 'react';
import { Calendar, X, Clock, FileText, Send } from 'lucide-react';
import { LeaveType, LEAVE_TYPES } from '../types';

interface LeaveModalProps {
  isOpen: boolean;
  initialType: LeaveType;
  onClose: () => void;
  onSubmit: (data: {
    type: LeaveType;
    startDate: string;
    endDate: string;
    reason: string;
  }) => Promise<void>;
}

export const LeaveModal: React.FC<LeaveModalProps> = ({
  isOpen,
  initialType,
  onClose,
  onSubmit,
}) => {
  const [selectedType, setSelectedType] = useState<LeaveType>(initialType);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedType(initialType);
      const today = new Date().toISOString().split('T')[0];
      setStartDate(today);
      setEndDate(today);
      setReason('');
    }
  }, [isOpen, initialType]);

  if (!isOpen) return null;

  const currentTypeMeta = LEAVE_TYPES.find(t => t.code === selectedType) || LEAVE_TYPES[0];

  // Calculate days count
  const calculateDays = () => {
    if (!startDate || !endDate) return 1;
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    if (isNaN(start) || isNaN(end) || end < start) return 1;
    const diff = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 1;
  };

  const daysCount = calculateDays();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason.trim()) return;

    try {
      setIsSubmitting(true);
      await onSubmit({
        type: selectedType,
        startDate,
        endDate,
        reason: reason.trim(),
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-slate-100 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="px-3 py-1 bg-pink-100 text-pink-700 rounded-xl text-xs font-bold border border-pink-200">
              {selectedType}
            </span>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-800">
                ស្នើសុំច្បាប់ឈប់សម្រាក
              </h3>
              <p className="text-[11px] text-slate-500">{currentTypeMeta.labelKh}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
          {/* Leave Type Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              ប្រភេទច្បាប់ (Leave Type) *
            </label>
            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value as LeaveType)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-pink-500 focus:bg-white transition-all outline-none"
            >
              {LEAVE_TYPES.map(t => (
                <option key={t.code} value={t.code}>
                  {t.code} - {t.labelKh} ({t.labelEn})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-pink-600 mt-1 italic">{currentTypeMeta.description}</p>
          </div>

          {/* Dates Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                កាលបរិច្ឆេទចាប់ផ្តើម *
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={e => {
                    setStartDate(e.target.value);
                    if (e.target.value > endDate) setEndDate(e.target.value);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-pink-500 focus:bg-white outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                កាលបរិច្ឆេទបញ្ចប់ *
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  min={startDate}
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-pink-500 focus:bg-white outline-none"
                />
              </div>
            </div>
          </div>

          {/* Days summary badge */}
          <div className="flex items-center justify-between px-3.5 py-2 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs">
            <span className="text-slate-600 font-medium flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-indigo-500" />
              <span>រយៈពេលឈប់សម្រាកសរុប:</span>
            </span>
            <span className="font-bold text-indigo-700 bg-white px-2.5 py-0.5 rounded-lg border border-indigo-200 shadow-xs">
              {daysCount} ថ្ងៃ
            </span>
          </div>

          {/* Reason textarea */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              មូលហេតុនៃការសុំច្បាប់ *
            </label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="សូមបញ្ជាក់មូលហេតុឱ្យបានច្បាស់លាស់..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-pink-500 focus:bg-white transition-all outline-none resize-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs sm:text-sm font-medium transition-colors"
            >
              បោះបង់
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md shadow-pink-500/20 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              <Send className={`w-4 h-4 ${isSubmitting ? 'animate-bounce' : ''}`} />
              <span>{isSubmitting ? 'កំពុងបញ្ជូន...' : 'បញ្ជូនសំណើ'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
