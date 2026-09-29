import React from 'react';
import { useLeaves } from '../context/LeavesContext';
import { 
  UserPlus, 
  Printer, 
  CalendarPlus, 
  FileSpreadsheet, 
  RotateCcw
} from 'lucide-react';
import { UNIV_LOGO_BASE64 } from '../assets/logoBase64';
import { AuthBar } from './AuthBar';

interface HeaderProps {
  onOpenAddModal: () => void;
  onOpenExcelModal: () => void;
  onOpenQuickLeaveModal?: () => void;
  onOpenQuickLeave?: () => void;
  onOpenPrintModal?: () => void;
  onOpenScannerModal?: () => void;
  onOpenAuditLog: () => void;
  onOpenChangePassword: () => void;
  onOpenLogin: () => void;
  onOpenPWAInstallGuide?: () => void;
  activeTab?: string;
  setActiveTab?: (tab: any) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAddModal,
  onOpenExcelModal,
  onOpenQuickLeaveModal,
  onOpenQuickLeave,
  onOpenPrintModal,
  onOpenAuditLog,
  onOpenChangePassword,
  onOpenLogin,
}) => {
  const { resetToOriginalData } = useLeaves();
  const handleQuickLeave = onOpenQuickLeaveModal || onOpenQuickLeave;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        
        {/* Top Info & Auth Bar Row */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-2.5">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">الجمهورية الجزائرية الديمقراطية الشعبية</span>
            <span>•</span>
            <span>وزارة التعليم العالي والبحث العلمي</span>
          </div>
          
          <AuthBar
            onOpenAuditLog={onOpenAuditLog}
            onOpenChangePassword={onOpenChangePassword}
            onOpenLogin={onOpenLogin}
          />
        </div>

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          
          {/* Official Faculty & Department Identity */}
          <div className="flex items-center gap-3.5">
            <img
              src={UNIV_LOGO_BASE64}
              alt="شعار جامعة قاصدي مرباح ورقلة"
              className="w-14 h-14 object-contain shrink-0"
            />
            <div>
              <p className="text-xs sm:text-sm font-bold text-slate-700">
                جامعة قاصدي مرباح ورقلة — كلية الرياضيات وعلوم المادة
              </p>
              <h1 className="text-lg sm:text-2xl font-black text-emerald-900 tracking-tight flex items-center gap-2">
                <span>مصلحة المستخدمين</span>
                <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  فرع الموظفين
                </span>
                {typeof window !== 'undefined' && window.electronAPI?.isElectron && (
                  <span className="text-xs font-bold bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full border border-indigo-200 inline-flex items-center gap-1.5" title="المنصة تعمل عبر بيئة سطح المكتب Electron">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse"></span>
                    <span>سطح المكتب Electron</span>
                  </span>
                )}
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                إدارة أرصدة العطل السنوية والتعويضية وإصدار الرخص الرسمية
              </p>
            </div>
          </div>

          {/* Large, Clear Action Buttons with Prominent Simple Icons */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-start lg:justify-end">
            
            {/* 1. Add Employee - Large Green Button */}
            <button
              onClick={onOpenAddModal}
              id="add-employee-btn"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-xs transition-all cursor-pointer active:scale-98"
            >
              <UserPlus className="w-5 h-5 text-emerald-100" />
              <span>إضافة موظف</span>
            </button>

            {/* 2. Issue Leave License - Large Clear Official Button */}
            {onOpenPrintModal && (
              <button
                onClick={onOpenPrintModal}
                id="header-print-btn"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-xs transition-all cursor-pointer active:scale-98"
              >
                <Printer className="w-5 h-5 text-amber-300" />
                <span>إصدار رخصة عطلة</span>
              </button>
            )}

            {/* 3. Register Leave or Permanence - Large Clear Button */}
            <button
              onClick={handleQuickLeave}
              id="quick-leave-btn"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 text-emerald-900 border border-emerald-300 font-bold text-sm transition-all cursor-pointer active:scale-98"
            >
              <CalendarPlus className="w-5 h-5 text-emerald-700" />
              <span>تسجيل عطلة / مداومة</span>
            </button>

            {/* 4. Excel Import/Export */}
            <button
              onClick={onOpenExcelModal}
              id="excel-manager-btn"
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold text-sm transition-all cursor-pointer active:scale-98"
              title="تصدير واستيراد ملفات الإكسل"
            >
              <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
              <span>تصدير Excel</span>
            </button>

            {/* 5. Reset Data */}
            <button
              onClick={resetToOriginalData}
              id="reset-data-btn"
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
              title="استرجاع بيانات الكلية الأصلية"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

          </div>
        </div>
      </div>
    </header>
  );
};
