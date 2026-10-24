import React, { useState } from 'react';
import { LogIn, LogOut, MapPin, Navigation, CheckCircle } from 'lucide-react';
import { User, AttendanceRecord } from '../types';
import { calculateDistanceMeters, getCurrentPosition, parseCoordinates } from '../utils/geo';

interface CheckInPanelProps {
  currentUser: User;
  todayRecords: AttendanceRecord[];
  gpsTestMode?: boolean;
  onToggleGpsTestMode?: (enabled: boolean) => void;
  onPerformCheckIn: (action: 'IN' | 'OUT', distanceMeters: number) => Promise<void>;
  onUpdateUserLocation?: (newLocation: string) => Promise<void>;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const CheckInPanel: React.FC<CheckInPanelProps> = ({
  currentUser,
  todayRecords,
  gpsTestMode = false,
  onPerformCheckIn,
  onShowToast,
}) => {
  const [checking, setChecking] = useState(false);
  const [lastMeasuredDistance, setLastMeasuredDistance] = useState<number | null>(null);

  // Check today's status
  const hasCheckedInToday = todayRecords.some(r => r.action === 'IN' || !!r.checkIn);
  const hasCheckedOutToday = todayRecords.some(r => r.action === 'OUT' || !!r.checkOut);

  const latestIn = todayRecords.filter(r => r.action === 'IN' || !!r.checkIn).slice(-1)[0];
  const latestOut = todayRecords.filter(r => r.action === 'OUT' || !!r.checkOut).slice(-1)[0];

  const handleAction = async (action: 'IN' | 'OUT') => {
    if (checking) return;

    // Prevent duplicate check-in
    if (action === 'IN' && hasCheckedInToday) {
      onShowToast('លោកអ្នកបាន Check In សម្រាប់ថ្ងៃនេះរួចរាល់ហើយ មិនអាចចុច Check In ម្ដងទៀតទេ!', 'info');
      return;
    }

    // Prevent premature or duplicate check-out
    if (action === 'OUT') {
      if (!hasCheckedInToday) {
        onShowToast('សូមធ្វើការ Check In ជាមុនសិន ទើបអាច Check Out បាន!', 'error');
        return;
      }
      if (hasCheckedOutToday) {
        onShowToast('លោកអ្នកបាន Check Out សម្រាប់ថ្ងៃនេះរួចរាល់ហើយ មិនអាចចុច Check Out ម្ដងទៀតទេ!', 'info');
        return;
      }
    }

    try {
      setChecking(true);
      const storeCoords = parseCoordinates(currentUser.location);

      if (!storeCoords && !gpsTestMode) {
        onShowToast('គណនីរបស់អ្នកពុំទាន់មានទីតាំងតូប (Location) ស្ដង់ដារទេ!', 'error');
        return;
      }

      onShowToast('កំពុងពិនិត្យទីតាំង GPS ឧបករណ៍...', 'info');
      let measuredDist = 0;

      if (!gpsTestMode && storeCoords) {
        const devicePos = await getCurrentPosition();
        measuredDist = calculateDistanceMeters(
          storeCoords.lat,
          storeCoords.lng,
          devicePos.lat,
          devicePos.lng
        );
        setLastMeasuredDistance(measuredDist);

        const ALLOWED_DISTANCE = 10; // 10 meters rule
        if (measuredDist > ALLOWED_DISTANCE) {
          onShowToast(
            `មិនអាច Check-${action} បានទេ! អ្នកនៅឆ្ងាយពីតូប ${Math.round(
              measuredDist
            )} ម៉ែត្រ (ហាមឃាត់លើសពី ${ALLOWED_DISTANCE}ម)`,
            'error'
          );
          return;
        }
      } else {
        measuredDist = 3.5;
        setLastMeasuredDistance(measuredDist);
      }

      await onPerformCheckIn(action, measuredDist);
      onShowToast(`Check-${action} បានជោគជ័យ! (ចម្ងាយ ${Math.round(measuredDist)}ម)`, 'success');
    } catch (err: any) {
      onShowToast(err.message || `បរាជ័យក្នុងការ Check-${action}`, 'error');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="bg-white/95 backdrop-blur-xl p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-sm transition-all hover:shadow-md flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-tr from-emerald-500 to-teal-500 text-white rounded-xl shadow-sm">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm sm:text-base tracking-tight">
                ចុះវត្តមាន (Check-In / Out)
              </h3>
              <p className="text-[11px] text-slate-400">ស្កេន GPS ក្នុងរង្វង់ ១០ ម៉ែត្រពីទីតាំងតូប</p>
            </div>
          </div>

          {/* Status Badge */}
          {hasCheckedInToday && hasCheckedOutToday ? (
            <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>បានពេញលេញ</span>
            </span>
          ) : hasCheckedInToday ? (
            <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-bold border border-amber-200">
              <LogIn className="w-3.5 h-3.5 text-amber-600" />
              <span>បាន Check-In</span>
            </span>
          ) : (
            <span className="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-semibold border border-slate-200">
              មិនទាន់ Check-In
            </span>
          )}
        </div>

        {/* Distance Info Box */}
        <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl mb-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 flex items-center gap-1.5 font-medium">
              <Navigation className="w-3.5 h-3.5 text-indigo-500" />
              <span>ទីតាំងតូបដែលបានកំណត់:</span>
            </span>
            <span className="font-mono text-slate-700 font-semibold text-[11px] truncate max-w-[150px]">
              {currentUser.location || 'មិនទាន់មាន'}
            </span>
          </div>

          {lastMeasuredDistance !== null && (
            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
              <span className="text-slate-500">ចម្ងាយវាស់បានចុងក្រោយ:</span>
              <span
                className={`font-bold text-[11px] px-2 py-0.5 rounded-lg ${
                  lastMeasuredDistance <= 10
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-rose-100 text-rose-700'
                }`}
              >
                {Math.round(lastMeasuredDistance)} ម៉ែត្រ{' '}
                {lastMeasuredDistance <= 10 ? '(ត្រឹមត្រូវ ✓)' : '(លើសពី ១០ម ✗)'}
              </span>
            </div>
          )}

          {/* Check in / out timestamps today */}
          <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
            <div className="bg-white px-2.5 py-1.5 rounded-xl border border-slate-200">
              <span className="text-slate-400 block text-[10px]">Check-In:</span>
              <span className="font-semibold text-emerald-700">
                {latestIn?.checkIn ? latestIn.checkIn : latestIn?.timestamp ? latestIn.timestamp.split(' ')[1] || latestIn.timestamp : '--:--'}
              </span>
            </div>
            <div className="bg-white px-2.5 py-1.5 rounded-xl border border-slate-200">
              <span className="text-slate-400 block text-[10px]">Check-Out:</span>
              <span className="font-semibold text-rose-700">
                {latestOut?.checkOut ? latestOut.checkOut : latestOut?.timestamp ? latestOut.timestamp.split(' ')[1] || latestOut.timestamp : '--:--'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Check In Button: Disabled once already checked in today */}
        <button
          type="button"
          disabled={checking || hasCheckedInToday}
          onClick={() => handleAction('IN')}
          className={`py-3 px-3 font-bold text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-1.5 transition-all ${
            hasCheckedInToday
              ? 'bg-emerald-50 text-emerald-700 border-2 border-emerald-300 shadow-none cursor-not-allowed opacity-90'
              : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md shadow-emerald-500/20 active:scale-95'
          } disabled:pointer-events-none`}
        >
          {hasCheckedInToday ? (
            <>
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="truncate">បាន Check In រួច ✓</span>
            </>
          ) : (
            <>
              <LogIn className={`w-4 h-4 shrink-0 ${checking ? 'animate-spin' : ''}`} />
              <span>Check In</span>
            </>
          )}
        </button>

        {/* Check Out Button: Disabled until checked in, and disabled once already checked out */}
        <button
          type="button"
          disabled={checking || !hasCheckedInToday || hasCheckedOutToday}
          onClick={() => handleAction('OUT')}
          className={`py-3 px-3 font-bold text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-1.5 transition-all ${
            hasCheckedOutToday
              ? 'bg-rose-50 text-rose-700 border-2 border-rose-300 shadow-none cursor-not-allowed opacity-90'
              : !hasCheckedInToday
              ? 'bg-slate-100 text-slate-400 border border-slate-200 shadow-none cursor-not-allowed'
              : 'bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white shadow-md shadow-rose-500/20 active:scale-95'
          } disabled:pointer-events-none`}
        >
          {hasCheckedOutToday ? (
            <>
              <CheckCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="truncate">បាន Check Out រួច ✓</span>
            </>
          ) : !hasCheckedInToday ? (
            <>
              <LogOut className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="truncate">រង់ចាំ Check In</span>
            </>
          ) : (
            <>
              <LogOut className={`w-4 h-4 shrink-0 ${checking ? 'animate-spin' : ''}`} />
              <span>Check Out</span>
            </>
          )}
        </button>
      </div>

      {/* Completion Banner */}
      {hasCheckedInToday && hasCheckedOutToday && (
        <div className="mt-3 p-2.5 bg-gradient-to-r from-emerald-50 via-teal-50 to-green-50 border border-emerald-200/90 rounded-2xl flex items-center justify-center gap-2 text-emerald-800 text-xs font-bold shadow-xs">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>វត្តមានថ្ងៃនេះបានបញ្ចប់ពេញលេញ (Check In & Out រួចរាល់ ✓)</span>
        </div>
      )}
    </div>
  );
};
