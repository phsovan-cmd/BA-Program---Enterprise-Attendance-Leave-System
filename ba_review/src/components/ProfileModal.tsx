import React, { useState, useRef } from 'react';
import { User } from '../types';
import { X, Camera, Trash2, Check, User as UserIcon, Shield, MapPin, Calendar, UploadCloud } from 'lucide-react';
import { compressAndCropImage } from '../utils/image';

interface ProfileModalProps {
  isOpen: boolean;
  currentUser: User | null;
  onClose: () => void;
  onUpdateAvatar: (newAvatar: string | undefined) => Promise<void>;
  onChangePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  currentUser,
  onClose,
  onUpdateAvatar,
  onChangePassword,
  onShowToast,
}) => {
  const [previewAvatar, setPreviewAvatar] = useState<string | undefined>(currentUser?.avatar);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [oldPassword,setOldPassword] = useState('');
  const [newPassword,setNewPassword] = useState('');
  const [confirmPassword,setConfirmPassword] = useState('');
  const [changingPassword,setChangingPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state if currentUser changes
  React.useEffect(() => {
    if (isOpen && currentUser) {
      setPreviewAvatar(currentUser.avatar);
    }
  }, [isOpen, currentUser]);

  if (!isOpen || !currentUser) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessing(true);
      const compressedDataUrl = await compressAndCropImage(file, 256, 0.8);
      setPreviewAvatar(compressedDataUrl);
      onShowToast('បានជ្រើសរើសរូបភាព! សូមចុច "រក្សាទុករូបភាព"', 'info');
    } catch (err: any) {
      onShowToast(err.message || 'មិនអាចជ្រើសរូបភាពបានទេ', 'error');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemovePhoto = () => {
    setPreviewAvatar(undefined);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onUpdateAvatar(previewAvatar);
      onShowToast('បានផ្លាស់ប្តូររូបភាព Profile ជោគជ័យ!', 'success');
      onClose();
    } catch (err: any) {
      onShowToast('បរាជ័យក្នុងការផ្លាស់ប្តូររូបភាព Profile', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full border border-slate-100 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-white/10 rounded-xl">
              <UserIcon className="w-4 h-4 text-pink-300" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">កែប្រែរូបភាព Profile</h3>
              <p className="text-[10px] text-slate-300">ព័ត៌មានគណនី និងរូបតំណាងផ្ទាល់ខ្លួន</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-300 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex flex-col items-center text-center">
          {/* Avatar Preview */}
          <div className="relative group mb-4">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden ring-4 ring-indigo-100 shadow-lg bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white text-3xl font-extrabold select-none">
              {previewAvatar ? (
                <img
                  src={previewAvatar}
                  alt={currentUser.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{currentUser.name.charAt(0).toUpperCase()}</span>
              )}
            </div>

            {/* Quick action button overlay */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="ជ្រើសរើសរូបថត"
              className="absolute -bottom-2 -right-2 p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md border-2 border-white transition-all transform active:scale-95"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />

          {/* User Details summary */}
          <h4 className="text-base font-bold text-slate-800">{currentUser.name}</h4>
          <p className="text-xs font-semibold text-indigo-600 font-mono mt-0.5">{currentUser.id}</p>

          <div className="flex items-center gap-2 mt-2">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                currentUser.type === 'Admin'
                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                  : currentUser.type === 'Manager'
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}
            >
              {currentUser.type}
            </span>
            {currentUser.managerId && (
              <span className="text-[11px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-lg font-medium">
                {currentUser.managerId}
              </span>
            )}
          </div>

          {/* Action buttons to change or remove photo */}
          <div className="flex items-center gap-2 mt-5 w-full">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing || isSaving}
              className="flex-1 py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold border border-indigo-200 flex items-center justify-center gap-1.5 transition-all active:scale-98"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>{isProcessing ? 'កំពុងដំណើរការ...' : 'ជ្រើសរូបថតថ្មី'}</span>
            </button>

            {previewAvatar && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                disabled={isProcessing || isSaving}
                className="py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold border border-rose-200 flex items-center justify-center gap-1 transition-all active:scale-98"
                title="លុបរូបភាព (ត្រឡប់ទៅជាអក្សរដើម)"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">លុបរូប</span>
              </button>
            )}
          </div>

          {/* Change own password: no Admin approval required. */}
          <form className="mt-4 w-full text-left border border-indigo-100 rounded-xl p-3 space-y-2"
            onSubmit={async e=>{e.preventDefault();
              if(newPassword.length<8){onShowToast('Password ថ្មីយ៉ាងហោចណាស់ 8 តួអក្សរ','error');return;}
              if(newPassword!==confirmPassword){onShowToast('Confirm Password មិនដូចគ្នា','error');return;}
              setChangingPassword(true);
              try{await onChangePassword(oldPassword,newPassword);setOldPassword('');setNewPassword('');setConfirmPassword('');onShowToast('Password បាន Update ក្នុង Google Sheets','success');}
              catch(err:any){onShowToast(err?.message||'Change Password failed','error');}
              finally{setChangingPassword(false);}
            }}>
            <div className="text-sm font-bold text-indigo-900">ប្ដូរ Password ផ្ទាល់ខ្លួន</div>
            <input type="password" value={oldPassword} onChange={e=>setOldPassword(e.target.value)} placeholder="Current Password" required autoComplete="current-password" className="w-full p-2 border rounded-lg text-sm"/>
            <input type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} placeholder="New Password (min 8)" minLength={8} required autoComplete="new-password" className="w-full p-2 border rounded-lg text-sm"/>
            <input type="password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} placeholder="Confirm New Password" required autoComplete="new-password" className="w-full p-2 border rounded-lg text-sm"/>
            <button type="submit" disabled={changingPassword} className="w-full bg-indigo-600 text-white rounded-lg py-2 font-bold text-sm disabled:opacity-50">{changingPassword?'Saving...':'Change Password'}</button>
          </form>
          {/* Expandable Guide for Smart Phone & Computer Transfer */}
          <div className="mt-4 w-full text-left bg-slate-50 border border-slate-200/90 rounded-2xl p-3 text-xs">
            <details className="group">
              <summary className="flex items-center justify-between font-bold text-slate-800 cursor-pointer list-none select-none">
                <span className="flex items-center gap-1.5 text-indigo-700">
                  <span>💡</span>
                  <span>មគ្គុទេសក៍ទាញយករូបភាព (ទូរស័ព្ទ &amp; Computer)</span>
                </span>
                <span className="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <div className="mt-2.5 space-y-3 pt-2 border-t border-slate-200/70 text-[11px] leading-relaxed text-slate-600">
                <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-2xs">
                  <p className="font-bold text-indigo-900 mb-1">📱 ១. ពី Smart Phone ទៅកាន់ Computer</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li><strong className="text-slate-700">ប្រើប្រាស់ខ្សែ USB:</strong> ភ្ជាប់ទូរស័ព្ទជាមួយកុំព្យូទ័រ រួចជ្រើសរើស File Transfer (MTP) ឬ Trust នៅលើ iPhone ដើម្បី Copy រូបភាពចេញពី Folder DCIM។</li>
                    <li><strong className="text-slate-700">Cloud Storage:</strong> ប្រើ Google Photos, Google Drive ឬ iCloud ដើម្បី Upload រួច Download លើកុំព្យូទ័រ។</li>
                    <li><strong className="text-slate-700">Telegram / WhatsApp:</strong> ផ្ញើរូបភាពចូល Saved Messages រួចបើកកុំព្យូទ័រទាញយក។</li>
                  </ul>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-2xs">
                  <p className="font-bold text-indigo-900 mb-1">💻 ២. ពី Computer ទៅកាន់ Smart Phone</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li><strong className="text-slate-700">ខ្សែ USB:</strong> ភ្ជាប់ទូរស័ព្ទ និង Copy រូបភាពពីកុំព្យូទ័រចូលទូរស័ព្ទផ្ទាល់។</li>
                    <li><strong className="text-slate-700">Google Drive / Telegram:</strong> Upload ពីកុំព្យូទ័រឡើង Cloud / Telegram រួចបើកទូរស័ព្ទ Download ទុកក្នុងเครื่อง។</li>
                  </ul>
                </div>
              </div>
            </details>
          </div>

          <div className="mt-3 text-[11px] text-slate-400">
            រូបភាពនឹងត្រូវបានកាត់ និងបង្រួមទំហំដោយស្វ័យប្រវត្តិដើម្បីល្បឿនលឿន
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            បោះបង់
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || isProcessing}
            className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 rounded-xl shadow-md shadow-indigo-500/20 flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>{isSaving ? 'កំពុងរក្សាទុក...' : 'រក្សាទុករូបភាព'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
