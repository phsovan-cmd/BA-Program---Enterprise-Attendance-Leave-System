import React, { useState, useEffect, useRef } from 'react';
import { User, UserType, UserStatus, MANAGER_IDS } from '../types';
import { UserCheck, X, MapPin, Navigation, Save, Shield, Camera, Trash2, UploadCloud } from 'lucide-react';
import { getCurrentPosition } from '../utils/geo';
import { compressAndCropImage } from '../utils/image';

interface UserModalProps {
  isOpen: boolean;
  userToEdit: User | null;
  onClose: () => void;
  onSave: (userData: User) => Promise<void>;
  onOpenMapPicker: (currentLoc: string, onPicked: (coords: string) => void) => void;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const UserModal: React.FC<UserModalProps> = ({
  isOpen,
  userToEdit,
  onClose,
  onSave,
  onOpenMapPicker,
  onShowToast,
}) => {
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [status, setStatus] = useState<UserStatus>('Active');
  const [type, setType] = useState<UserType>('BA Staff');
  const [managerId, setManagerId] = useState('');
  const [avatar, setAvatar] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isProcessingAvatar, setIsProcessingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const isEditing = !!userToEdit;

  useEffect(() => {
    if (isOpen) {
      if (userToEdit) {
        setId(userToEdit.id);
        setName(userToEdit.name);
        setPassword('');
        setLocation(userToEdit.location || '11.556400,104.928200');
        setStartDate(userToEdit.startDate || new Date().toISOString().split('T')[0]);
        setStatus(userToEdit.status || 'Active');
        setType(userToEdit.type || 'BA Staff');
        setManagerId(userToEdit.managerId || '');
        setAvatar(userToEdit.avatar);
      } else {
        const genId = 'BA' + String(Math.floor(10000 + Math.random() * 90000));
        setId(genId);
        setName('');
        setPassword('123456');
        setLocation('11.556400,104.928200');
        setStartDate(new Date().toISOString().split('T')[0]);
        setStatus('Active');
        setType('BA Staff');
        setManagerId('');
        setAvatar(undefined);
      }
    }
  }, [isOpen, userToEdit]);

  if (!isOpen) return null;

  const handleGetGps = async () => {
    try {
      setIsLocating(true);
      const pos = await getCurrentPosition();
      const coords = `${pos.lat.toFixed(6)},${pos.lng.toFixed(6)}`;
      setLocation(coords);
      onShowToast('ទាញយក GPS បានជោគជ័យ!', 'success');
    } catch (err: any) {
      onShowToast(err.message || 'មិនអាចទាញយក GPS បានទេ', 'error');
    } finally {
      setIsLocating(false);
    }
  };

  const handlePickMap = () => {
    onOpenMapPicker(location || '11.556400,104.928200', picked => {
      setLocation(picked);
    });
  };

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessingAvatar(true);
      const compressed = await compressAndCropImage(file, 256, 0.8);
      setAvatar(compressed);
      onShowToast('បានបញ្ចូលរូបភាព Profile!', 'success');
    } catch (err: any) {
      onShowToast(err.message || 'មិនអាចជ្រើសរូបភាពបានទេ', 'error');
    } finally {
      setIsProcessingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id.trim() || !name.trim()) return;

    try {
      setIsSubmitting(true);
      await onSave({
        id: id.trim(),
        name: name.trim(),
        password: password ? password.trim() : userToEdit?.password || '123456',
        location: location.trim() || '11.556400,104.928200',
        startDate: startDate || new Date().toISOString().split('T')[0],
        status,
        type,
        managerId: type === 'Admin' ? '' : managerId,
        avatar: avatar || undefined,
      });
      onClose();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Could not save BA List to Google Sheets');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full border border-slate-100 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                {isEditing ? 'កែប្រែព័ត៌មានបុគ្គលិក' : 'បន្ថែមបុគ្គលិកថ្មី'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {isEditing ? `កែប្រែគណនី: ${userToEdit.id}` : 'បង្កើតគណនីបុគ្គលិក BA ឬអ្នកគ្រប់គ្រង'}
              </p>
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
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5 max-h-[80vh] overflow-y-auto">
          {/* Avatar Picture Picker */}
          <div className="flex items-center gap-3.5 p-3 bg-slate-50 border border-slate-200/80 rounded-2xl">
            <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-extrabold text-xl shadow-xs ring-2 ring-indigo-200 shrink-0">
              {avatar ? (
                <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span>{name ? name.charAt(0).toUpperCase() : '?'}</span>
              )}
            </div>

            <div className="flex-1">
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                រូបភាព Profile (Avatar Photo)
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={isProcessingAvatar}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-indigo-700 text-xs font-semibold rounded-xl border border-slate-200 flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{isProcessingAvatar ? 'ដំណើរការ...' : avatar ? 'ប្តូររូបថត' : 'ដាក់រូបថត'}</span>
                </button>

                {avatar && (
                  <button
                    type="button"
                    onClick={() => setAvatar(undefined)}
                    disabled={isProcessingAvatar}
                    className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold rounded-xl border border-rose-200 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>លុបរូប</span>
                  </button>
                )}
              </div>
              <input
                type="file"
                ref={avatarInputRef}
                onChange={handleAvatarFileChange}
                accept="image/*"
                className="hidden"
              />
            </div>
          </div>
          {/* ID & Name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                អត្តលេខ (User ID) *
              </label>
              <input
                type="text"
                required
                disabled={isEditing}
                value={id}
                onChange={e => setId(e.target.value)}
                placeholder="BA00001"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold disabled:bg-slate-100 disabled:text-slate-500 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                ឈ្មោះពេញ (Full Name) *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="កញ្ញា ម៉ារី"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              ពាក្យសម្ងាត់ (Password) {isEditing ? '(ទុកទំនេរប្រសិនបើមិនប្តូរ)' : '*'}
            </label>
            <input
              type="password"
              required={!isEditing}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              ទីតាំងតូបដែលត្រូវឈរ (Store GPS Location) *
            </label>
            <input
              type="text"
              required
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="11.556400,104.928200"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={handleGetGps}
                disabled={isLocating}
                className="flex-1 py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Navigation className={`w-3.5 h-3.5 text-indigo-600 ${isLocating ? 'animate-spin' : ''}`} />
                <span>{isLocating ? 'ទាញយក GPS...' : 'យក GPS បច្ចុប្បន្ន'}</span>
              </button>
              <button
                type="button"
                onClick={handlePickMap}
                className="flex-1 py-1.5 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-xl border border-indigo-200 flex items-center justify-center gap-1.5 transition-colors"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>ជ្រើសលើផែនទី</span>
              </button>
            </div>
          </div>

          {/* Start Date & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                ថ្ងៃចូលបម្រើការងារ *
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                ស្ថានភាព (Status) *
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as UserStatus)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Active">Active (សកម្ម)</option>
                <option value="Pending">Pending (រង់ចាំ)</option>
                <option value="Inactive">Inactive (អសកម្ម)</option>
              </select>
            </div>
          </div>

          {/* Type & Manager ID */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                តួនាទី (Type) *
              </label>
              <select
                value={type}
                onChange={e => setType(e.target.value as UserType)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="BA Staff">BA Staff</option>
                <option value="Manager">Manager</option>
                <option value="Admin">Admin</option>
              </select>
            </div>

            {type !== 'Admin' && (
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Manager ID *
                </label>
                <select
                  required
                  value={managerId}
                  onChange={e => setManagerId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- ជ្រើសរើស Manager --</option>
                  {MANAGER_IDS.map(m => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs sm:text-sm font-medium transition-colors"
            >
              បោះបង់
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md shadow-indigo-500/20 flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'កំពុងរក្សាទុក...' : 'រក្សាទុកទិន្នន័យ'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
