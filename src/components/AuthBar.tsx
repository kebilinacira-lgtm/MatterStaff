import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLeaves } from '../context/LeavesContext';
import { 
  ShieldCheck, 
  UserCheck, 
  KeyRound, 
  LogOut, 
  RotateCcw, 
  Activity, 
  ChevronDown,
  Lock,
  User
} from 'lucide-react';

interface AuthBarProps {
  onOpenAuditLog: () => void;
  onOpenChangePassword: () => void;
  onOpenLogin: () => void;
  onOpenPWAInstallGuide?: () => void;
}

export const AuthBar: React.FC<AuthBarProps> = ({
  onOpenAuditLog,
  onOpenChangePassword,
  onOpenLogin,
}) => {
  const { currentUser, logout, switchUser, isAdmin } = useAuth();
  const { auditLogs } = useLeaves();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!currentUser) {
    return (
      <div className="flex items-center gap-2" dir="rtl">
        <button
          onClick={onOpenLogin}
          className="bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
        >
          <Lock className="w-3.5 h-3.5" />
          <span>تسجيل الدخول</span>
        </button>
      </div>
    );
  }

  const isCurrentAdmin = currentUser.role === 'admin';

  return (
    <div className="relative flex items-center gap-2" dir="rtl">
      
      {/* Audit Log Button with live badge */}
      <button
        onClick={onOpenAuditLog}
        className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-semibold px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
        title="فتح سجل الرقابة وتتبع العمليات"
      >
        <Activity className="w-3.5 h-3.5 text-emerald-700" />
        <span className="hidden md:inline">سجل الرقابة</span>
        <span className="bg-emerald-700 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full min-w-4 text-center">
          {auditLogs.length}
        </span>
      </button>

      {/* User Badge & Dropdown Trigger */}
      <div className="relative">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
            isCurrentAdmin
              ? 'bg-emerald-800 text-white border-emerald-900 hover:bg-emerald-900'
              : 'bg-teal-700 text-white border-teal-800 hover:bg-teal-800'
          }`}
        >
          <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center font-bold text-[10px]">
            {isCurrentAdmin ? 'مس' : 'سع'}
          </div>
          <div className="text-right">
            <span className="font-bold block leading-tight">{currentUser.name}</span>
          </div>
          <ChevronDown className="w-3.5 h-3.5 opacity-75" />
        </button>

        {/* Dropdown Menu */}
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
            <div className="absolute left-0 top-full mt-1.5 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95">
              
              <div className="px-4 py-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-800 block">{currentUser.name}</span>
                <span className="text-[11px] text-emerald-700 font-medium block">{currentUser.roleTitle}</span>
                <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                  اسم الحساب: @{currentUser.username}
                </span>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenAuditLog();
                  }}
                  className="w-full text-right px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Activity className="w-4 h-4 text-emerald-700" />
                  <span>سجل الرقابة والعمليات ({auditLogs.length})</span>
                </button>

                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenChangePassword();
                  }}
                  className="w-full text-right px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <KeyRound className="w-4 h-4 text-slate-600" />
                  <span>تغيير كلمة المرور</span>
                </button>

                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenLogin();
                  }}
                  className="w-full text-right px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4 text-teal-700" />
                  <span>تبديل الحساب ({isCurrentAdmin ? 'مساعدة المسؤول' : 'مسؤول المصلحة'})</span>
                </button>
              </div>

              <div className="border-t border-slate-100 pt-1 mt-1">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    logout();
                    onOpenLogin();
                  }}
                  className="w-full text-right px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  <span>تسجيل الخروج من التطبيق</span>
                </button>
              </div>

            </div>
          </>
        )}
      </div>

    </div>
  );
};
