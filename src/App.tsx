import React, { useState } from 'react';
import { LeavesProvider, useLeaves } from './context/LeavesContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { DashboardStats } from './components/DashboardStats';
import { EmployeesTable } from './components/EmployeesTable';
import { AnalyticsView } from './components/AnalyticsView';
import { LocalNetworkGuide } from './components/LocalNetworkGuide';
import { EmployeeDetailModal } from './components/EmployeeDetailModal';
import { AddEmployeeModal } from './components/AddEmployeeModal';
import { QuickLeaveModal } from './components/QuickLeaveModal';
import { PrintDocumentModal } from './components/PrintDocumentModal';
import { ExcelManagerModal } from './components/ExcelManagerModal';
import { DocumentScannerModal } from './components/DocumentScannerModal';
import { EditEmployeeBalancesModal } from './components/EditEmployeeBalancesModal';
import { LoginModal } from './components/LoginModal';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { AuditLogModal } from './components/AuditLogModal';
import { ConflictAlertBanner } from './components/ConflictAlertBanner';
import { Employee } from './types';
import { 
  Users, 
  LayoutDashboard, 
  BarChart2, 
  Printer, 
  Wifi, 
  Building2,
  Calendar,
  CheckCircle2,
  Camera,
  ShieldCheck
} from 'lucide-react';

function MainContent() {
  const { employees } = useLeaves();
  const { currentUser } = useAuth();

  // Active view tab
  const [activeTab, setActiveTab] = useState<'employees' | 'dashboard' | 'analytics' | 'print' | 'guide'>('employees');

  // Modal States
  const [detailEmployee, setDetailEmployee] = useState<Employee | null>(null);
  const [editBalanceEmployee, setEditBalanceEmployee] = useState<Employee | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isQuickLeaveOpen, setIsQuickLeaveOpen] = useState(false);
  const [isExcelOpen, setIsExcelOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [printEmployee, setPrintEmployee] = useState<Employee | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerEmployee, setScannerEmployee] = useState<Employee | null>(null);
  const [scannerRefreshKey, setScannerRefreshKey] = useState(0);

  // Auth & System Modals
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isAuditLogOpen, setIsAuditLogOpen] = useState(false);

  const handleOpenDetail = (emp: Employee) => {
    setDetailEmployee(emp);
  };

  const handleOpenPrintForEmp = (emp: Employee) => {
    setPrintEmployee(emp);
    setIsPrintOpen(true);
  };

  const handleOpenScanner = (emp?: Employee | null) => {
    setScannerEmployee(emp || null);
    setIsScannerOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans selection:bg-emerald-200">
      {/* Top Application Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddModal={() => setIsAddOpen(true)}
        onOpenQuickLeave={() => setIsQuickLeaveOpen(true)}
        onOpenExcelModal={() => setIsExcelOpen(true)}
        onOpenPrintModal={() => {
          setPrintEmployee(null);
          setIsPrintOpen(true);
        }}
        onOpenScannerModal={() => handleOpenScanner(null)}
        onOpenAuditLog={() => setIsAuditLogOpen(true)}
        onOpenChangePassword={() => setIsChangePasswordOpen(true)}
        onOpenLogin={() => setIsLoginOpen(true)}
      />

      {/* Live Conflict Warning Banner (تنبيه وإنذار الدخول المتزامن في نفس اللحظة) */}
      <ConflictAlertBanner />

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Primary Clear Navigation Tabs with Large Simple Icons */}
        <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-2 font-bold">
          
          {/* 1. Employees Directory */}
          <button
            onClick={() => setActiveTab('employees')}
            id="tab-btn-employees"
            className={`flex items-center gap-3 px-5 py-3 rounded-xl transition-all cursor-pointer text-sm ${
              activeTab === 'employees'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950'
            }`}
          >
            <Users className="w-5 h-5 text-emerald-300" />
            <span>سجل الموظفين والأرصدة</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
              activeTab === 'employees' ? 'bg-emerald-800 text-white' : 'bg-slate-100 text-slate-700'
            }`}>
              {employees.length}
            </span>
          </button>

          {/* 2. Leave License Printing */}
          <button
            onClick={() => {
              setPrintEmployee(null);
              setIsPrintOpen(true);
            }}
            id="tab-btn-print"
            className="flex items-center gap-3 px-5 py-3 rounded-xl text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 border border-transparent hover:border-emerald-200 transition-all cursor-pointer text-sm"
          >
            <Printer className="w-5 h-5 text-emerald-700" />
            <span>إصدار رخصة عطلة (FOR.GRH.010)</span>
          </button>

          {/* 3. Dashboard & Statistics */}
          <button
            onClick={() => setActiveTab('dashboard')}
            id="tab-btn-dashboard"
            className={`flex items-center gap-3 px-5 py-3 rounded-xl transition-all cursor-pointer text-sm ${
              activeTab === 'dashboard'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950'
            }`}
          >
            <BarChart2 className="w-5 h-5 text-emerald-300" />
            <span>لوحة الإحصائيات والمؤشرات</span>
          </button>

          {/* 4. Audit Log Quick Tab for Manager */}
          <button
            onClick={() => setIsAuditLogOpen(true)}
            id="tab-btn-audit-log"
            className="flex items-center gap-2 px-4 py-3 rounded-xl text-slate-700 hover:bg-slate-100 hover:text-slate-950 border border-slate-200 transition-all cursor-pointer text-sm"
          >
            <ShieldCheck className="w-5 h-5 text-emerald-700" />
            <span>سجل الرقابة والعمليات</span>
          </button>

          {/* 5. LAN & Guide */}
          <button
            onClick={() => setActiveTab('guide')}
            id="tab-btn-guide"
            className={`flex items-center gap-3 px-5 py-3 rounded-xl transition-all cursor-pointer text-sm mr-auto ${
              activeTab === 'guide'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Wifi className="w-5 h-5 text-emerald-400" />
            <span>دليل الشبكة المحلية (LAN)</span>
          </button>
        </div>

        {/* TAB 1: EMPLOYEES DIRECTORY */}
        {activeTab === 'employees' && (
          <div className="space-y-4">
            {/* Clean Employees Table */}
            <EmployeesTable
              key={`emp-table-${scannerRefreshKey}`}
              onOpenDetail={handleOpenDetail}
              onOpenEmployeeDetail={handleOpenDetail}
              onOpenEditBalances={(emp) => setEditBalanceEmployee(emp)}
              onOpenPrint={handleOpenPrintForEmp}
              onOpenPrintModalForEmployee={handleOpenPrintForEmp}
              onOpenLeaveModalForEmployee={(emp) => {
                setDetailEmployee(emp);
                setIsQuickLeaveOpen(true);
              }}
              onOpenScanner={(emp) => handleOpenScanner(emp)}
              onOpenScannerModalForEmployee={(emp) => handleOpenScanner(emp)}
              onOpenScannerModalGeneral={() => handleOpenScanner(null)}
            />
          </div>
        )}

        {/* TAB 2: DASHBOARD & ANALYTICS VIEW */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <DashboardStats onOpenLeaveModal={() => setIsQuickLeaveOpen(true)} />
            <AnalyticsView onOpenEmployeeDetail={handleOpenDetail} />
          </div>
        )}

        {/* TAB 3: LOCAL NETWORK INTRANET GUIDE */}
        {activeTab === 'guide' && (
          <LocalNetworkGuide />
        )}
      </main>

      {/* Institutional Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-6 text-center text-xs text-slate-500 print:hidden">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-bold text-slate-700">
              جامعة قاصدي مرباح ورقلة — كلية الرياضيات وعلوم المادة
            </span>
          </div>
          <div className="text-slate-500">
            مصلحة المستخدمين • منصة إدارة ومتابعة عطل ومداومات الموظفين • شبكة داخلية محلية
          </div>
          <div className="font-mono text-[11px] text-slate-400">
            الإصدار 2026 v2.0 • وضع عدم الاتصال (Offline-Ready)
          </div>
        </div>
      </footer>

      {/* MODALS */}
      {/* 1. Employee Detail / History / Action Modal */}
      {detailEmployee && (
        <EmployeeDetailModal
          employee={detailEmployee}
          onClose={() => setDetailEmployee(null)}
          onOpenPrint={handleOpenPrintForEmp}
          onOpenScanner={(emp) => handleOpenScanner(emp)}
        />
      )}

      {/* 2. Direct Edit Employee Balances & Info Modal */}
      {editBalanceEmployee && (
        <EditEmployeeBalancesModal
          employee={editBalanceEmployee}
          isOpen={!!editBalanceEmployee}
          onClose={() => setEditBalanceEmployee(null)}
        />
      )}

      {/* 3. Add Employee Modal */}
      {isAddOpen && (
        <AddEmployeeModal onClose={() => setIsAddOpen(false)} />
      )}

      {/* 4. Quick Leave / Permanence Modal */}
      {isQuickLeaveOpen && (
        <QuickLeaveModal onClose={() => setIsQuickLeaveOpen(false)} />
      )}

      {/* 5. Excel Manager & Backup Modal */}
      {isExcelOpen && (
        <ExcelManagerModal onClose={() => setIsExcelOpen(false)} />
      )}

      {/* 6. Print Official Documents Modal */}
      {isPrintOpen && (
        <PrintDocumentModal
          initialEmployee={printEmployee}
          onClose={() => setIsPrintOpen(false)}
        />
      )}

      {/* 7. Document Scanner & Digital Archiving Modal (استنساخ الأوراق ضوئياً) */}
      {isScannerOpen && (
        <DocumentScannerModal
          initialEmployee={scannerEmployee}
          onClose={() => setIsScannerOpen(false)}
          onSaved={() => {
            setScannerRefreshKey(prev => prev + 1);
          }}
        />
      )}

      {/* 8. Audit Log & Activity Trail Modal (سجل الرقابة وتتبع العمليات) */}
      <AuditLogModal
        isOpen={isAuditLogOpen}
        onClose={() => setIsAuditLogOpen(false)}
      />

      {/* 9. Change Password Modal (تغيير كلمة المرور) */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />

      {/* 10. Login Modal (نافذة تسجيل الدخول وحماية الحسابات) */}
      <LoginModal
        isOpen={!currentUser || isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        isDismissible={!!currentUser}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <LeavesProvider>
        <MainContent />
      </LeavesProvider>
    </AuthProvider>
  );
}
