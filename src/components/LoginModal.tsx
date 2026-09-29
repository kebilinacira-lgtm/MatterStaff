import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, ShieldCheck, KeyRound, AlertCircle, Eye, EyeOff, ShieldAlert } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose?: () => void;
  isDismissible?: boolean;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  isDismissible = false,
}) => {
  const { login } = useAuth();

  const [selectedRole, setSelectedRole] = useState<'admin' | 'assistant'>('admin');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleQuickLogin = (role: 'admin' | 'assistant') => {
    setSelectedRole(role);
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('يرجى إدخال كلمة المرور');
      return;
    }

    setLoading(true);
    setError(null);

    const username = selectedRole === 'admin' ? 'admin' : 'assistant';
    const result = login(username, password);

    setLoading(false);
    if (result.success) {
      setPassword('');
      if (onClose) onClose();
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 overflow-y-auto" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header with Institutional Branding */}
        <div className="bg-gradient-to-br from-emerald-900 via-teal-900 to-emerald-950 text-white p-6 text-center relative">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shadow-inner">
            <Lock className="w-7 h-7 text-emerald-300" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">تسجيل الدخول إلى المنصة</h2>
          <p className="text-xs text-emerald-200/90 mt-1">
            جامعة قاصدي مرباح ورقلة • كلية الرياضيات وعلوم المادة
          </p>
          <p className="text-[11px] text-emerald-300/80 mt-0.5">
            مصلحة المستخدمين والموظفين الإداريين والتقنيين
          </p>

          {isDismissible && onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 left-4 text-white/70 hover:text-white text-xs bg-white/10 px-2.5 py-1 rounded-lg"
            >
              إلغاء
            </button>
          )}
        </div>

        {/* Account Selector */}
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              اختر الحساب المطلوب للدخول:
            </label>
            <div className="grid grid-cols-2 gap-3">
              
              {/* Head of Department (مسؤول المصلحة) */}
              <button
                type="button"
                onClick={() => handleQuickLogin('admin')}
                className={`p-3.5 rounded-xl border-2 text-right transition-all flex flex-col justify-between ${
                  selectedRole === 'admin'
                    ? 'border-emerald-700 bg-emerald-50/60 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                    selectedRole === 'admin' ? 'bg-emerald-800 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    مس
                  </div>
                  {selectedRole === 'admin' && (
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                  )}
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 block">مسؤول المصلحة</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">الصلاحيات الكاملة والرقابة</span>
                </div>
              </button>

              {/* Assistant (مساعدة المسؤول) */}
              <button
                type="button"
                onClick={() => handleQuickLogin('assistant')}
                className={`p-3.5 rounded-xl border-2 text-right transition-all flex flex-col justify-between ${
                  selectedRole === 'assistant'
                    ? 'border-teal-700 bg-teal-50/60 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                    selectedRole === 'assistant' ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    سع
                  </div>
                  {selectedRole === 'assistant' && (
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-600"></span>
                  )}
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 block">مساعدة المسؤول</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">إصدار الرخص والتعديل</span>
                </div>
              </button>

            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  كلمة المرور للحساب ({selectedRole === 'admin' ? 'مسؤول المصلحة' : 'مساعدة المسؤول'})
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const defaultPass = selectedRole === 'admin' ? 'admin2026' : 'aide2026';
                    setPassword(defaultPass);
                    setError(null);
                  }}
                  className="text-[11px] text-emerald-700 hover:text-emerald-900 font-bold hover:underline cursor-pointer flex items-center gap-1"
                >
                  <span>استخدام الافتراضية:</span>
                  <code className="bg-emerald-100 text-emerald-900 px-1.5 py-0.5 rounded text-[10px] font-mono">
                    {selectedRole === 'admin' ? 'admin2026' : 'aide2026'}
                  </code>
                </button>
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoFocus
                  placeholder="أدخل كلمة المرور السرية..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pr-10 pl-11 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  title={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 px-3.5 py-2.5 rounded-xl flex items-center gap-2 text-xs">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>دخول بكلمة المرور</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const username = selectedRole === 'admin' ? 'admin' : 'assistant';
                  const defaultPass = selectedRole === 'admin' ? 'admin2026' : 'aide2026';
                  const result = login(username, defaultPass);
                  if (result.success && onClose) {
                    onClose();
                  }
                }}
                className="w-full py-2.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>دخول مباشر وسريع</span>
              </button>
            </div>

          </form>

          {/* Security & Confidentiality Notice */}
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div className="space-y-0.5 text-[11px] leading-relaxed">
              <span className="font-bold text-slate-800 block">نظام محمي ومشفر:</span>
              <p className="text-slate-500">
                بيانات الدخول سرية وخاصة بكل مستخدم. يمكن تغيير كلمة المرور في أي وقت بعد الدخول من القائمة العلوية.
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
