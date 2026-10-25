import React, { useState } from 'react';
import { LogIn, Key, User, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { User as UserType } from '../types';

interface AuthViewProps {
  users: UserType[];
  onLogin: (userId: string, pass: string) => Promise<boolean>;
  onRegister?: (newUser: UserType) => Promise<void>;
  onOpenMapPicker?: (currentLoc: string, onPicked: (coords: string) => void) => void;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const AuthView: React.FC<AuthViewProps> = ({
  onLogin,
  onShowToast,
}) => {
  // Login form state - starts strictly empty requiring user entry
  const [loginId, setLoginId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = loginId.trim();
    const cleanPass = loginPassword.trim();

    if (!cleanId) {
      onShowToast('សូមបញ្ចូល អត្តលេខ (User ID)!', 'error');
      return;
    }
    if (!cleanPass) {
      onShowToast('សូមបញ្ចូល ពាក្យសម្ងាត់ (Password)!', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const ok = await onLogin(cleanId, cleanPass);
      if (!ok) {
        onShowToast('អត្តលេខ (User ID) ឬ ពាក្យសម្ងាត់ (Password) មិនត្រឹមត្រូវ!', 'error');
      }
    } catch (error) {
      console.error('Login request failed:', error);
      onShowToast('មិនអាចភ្ជាប់ Google Sheets បានទេ។ សូមពិនិត្យ Internet និង Apps Script deployment។', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center p-3 sm:p-6">
      <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden p-3 sm:p-4">
        {/* Banner Header with Morea Logo */}
        <div className="bg-gradient-to-tr from-pink-600 via-rose-600 to-purple-600 p-6 text-white text-center relative rounded-2xl shadow-lg mb-4">
          <div className="w-16 h-16 mx-auto mb-3 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center p-1 border border-white/30 shadow-inner">
            <img src={`${import.meta.env.BASE_URL}icon.svg`} alt="Morea Logo" className="w-full h-full rounded-full shadow" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-normal leading-relaxed">
            ចូលប្រើប្រាស់ប្រព័ន្ធ
          </h1>
          <p className="text-sm text-pink-100 mt-1 leading-relaxed">
            Morea BA Program - ប្រព័ន្ធគ្រប់គ្រងវត្តមានបុគ្គលិក
          </p>
        </div>

        {/* Security Notice */}
        <div className="mx-2 mb-4 p-2.5 bg-indigo-50/80 border border-indigo-100 rounded-xl flex items-center gap-2 text-indigo-700 text-xs">
          <ShieldCheck className="w-4 h-4 shrink-0 text-indigo-600" />
          <span>សូមបញ្ចូល User ID និង Password របស់អ្នកដើម្បីចូលប្រើ</span>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLoginSubmit} className="p-1 sm:p-2 space-y-4" autoComplete="off">
          <div>
            <label className="block text-xs font-semibold text-slate-700 tracking-normal mb-1.5">
              អត្តលេខ (User ID) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                autoComplete="off"
                placeholder="ឧទាហរណ៍: BA00001, SM0003..."
                value={loginId}
                onChange={e => setLoginId(e.target.value)}
                className="w-full pl-10 pr-3.5 py-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all font-medium font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 tracking-normal mb-1.5">
              ពាក្យសម្ងាត់ (Password) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                title={showPassword ? 'លាក់ពាក្យសម្ងាត់' : 'បង្ហាញពាក្យសម្ងាត់'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:opacity-95 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 mt-2 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>{isSubmitting ? 'កំពុងផ្ទៀងផ្ទាត់...' : 'ចូលប្រព័ន្ធ (Log In)'}</span>
          </button>
        </form>


      </div>
    </div>
  );
};
