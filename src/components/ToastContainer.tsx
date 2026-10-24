import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}

// Play subtle 3D pop/ping sound via Web Audio API
function play3DSound(type: 'success' | 'error' | 'info') {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (type === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.12); // G5
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc.start(now);
      osc.stop(now + 0.28);
    } else if (type === 'error') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(329.63, now); // E4
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.15); // A3
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.1); // E5
      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.start(now);
      osc.stop(now + 0.22);
    }
  } catch (e) {
    // Non-blocking if audio not allowed without user interaction
  }
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  // 3D haptic feedback and audio chime on arrival of new toast
  useEffect(() => {
    if (toasts.length > 0) {
      const latest = toasts[toasts.length - 1];
      play3DSound(latest.type);

      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate([40, 50, 40]);
        } catch (e) {}
      }
    }
  }, [toasts.length]);

  return (
    <div className="fixed top-5 right-4 left-4 sm:left-auto sm:max-w-md z-50 flex flex-col gap-3 pointer-events-none">
      {toasts.map(toast => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';

        const toastTypeClass = isSuccess
          ? 'toast-3d-success'
          : isError
          ? 'toast-3d-error'
          : 'toast-3d-info';

        const iconBgClass = isSuccess
          ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white'
          : isError
          ? 'bg-gradient-to-tr from-rose-600 to-pink-500 text-white'
          : 'bg-gradient-to-tr from-indigo-600 to-purple-600 text-white';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3.5 p-3.5 rounded-2xl text-xs sm:text-sm font-semibold toast-3d animate-pop-in-3d cursor-default ${toastTypeClass}`}
          >
            {/* 3D Elevated Icon Capsule */}
            <div className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center icon-box-3d ${iconBgClass}`}>
              {isSuccess && <CheckCircle2 className="w-5 h-5 text-white" />}
              {isError && <AlertCircle className="w-5 h-5 text-white" />}
              {!isSuccess && !isError && <Info className="w-5 h-5 text-white" />}
            </div>

            <div className="flex-1 text-slate-800 leading-snug pt-0.5">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span
                  className={`text-[10px] font-extrabold uppercase tracking-wider ${
                    isSuccess
                      ? 'text-emerald-700'
                      : isError
                      ? 'text-rose-700'
                      : 'text-indigo-700'
                  }`}
                >
                  {isSuccess
                    ? 'ជោគជ័យ (Success)'
                    : isError
                    ? 'កំហុស (Alert)'
                    : 'ដំណឹង (Notification)'}
                </span>
              </div>
              <p className="text-slate-700 font-medium text-xs sm:text-[13px]">{toast.message}</p>
            </div>

            <button
              onClick={() => onRemove(toast.id)}
              className="shrink-0 p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
