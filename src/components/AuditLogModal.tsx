import React, { useState, useMemo } from 'react';
import { useLeaves } from '../context/LeavesContext';
import { useAuth } from '../context/AuthContext';
import { AuditLogEntry, UserRole } from '../types';
import { 
  X, 
  ShieldCheck, 
  Download, 
  Search, 
  Filter, 
  User, 
  Clock, 
  FileText, 
  CheckCircle2, 
  Calendar, 
  Printer, 
  Trash2,
  Activity,
  UserCheck,
  Building
} from 'lucide-react';

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuditLogModal: React.FC<AuditLogModalProps> = ({ isOpen, onClose }) => {
  const { auditLogs, exportAuditLogs } = useLeaves();
  const { currentUser, isAdmin } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [userFilter, setUserFilter] = useState<string>('ALL');
  const [actionFilter, setActionFilter] = useState<string>('ALL');

  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => {
      const matchSearch = 
        !searchTerm.trim() ||
        log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.employeeName && log.employeeName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.actionType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.formattedDate.includes(searchTerm);

      const matchUser = userFilter === 'ALL' || log.userId === userFilter;
      const matchAction = actionFilter === 'ALL' || log.actionType === actionFilter;

      return matchSearch && matchUser && matchAction;
    });
  }, [auditLogs, searchTerm, userFilter, actionFilter]);

  // Statistics
  const totalCount = auditLogs.length;
  const adminOpsCount = auditLogs.filter(l => l.userId === 'admin' || l.userRole === 'admin').length;
  const assistantOpsCount = auditLogs.filter(l => l.userId === 'assistant' || l.userRole === 'assistant').length;
  const leaveIssuedCount = auditLogs.filter(l => l.actionType === 'إصدار رخصة عطلة').length;

  if (!isOpen) return null;

  const getActionBadgeColor = (action: AuditLogEntry['actionType']) => {
    switch (action) {
      case 'إصدار رخصة عطلة':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'خصم عطلة':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'تسجيل مداومة':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'تعديل بيانات وأرصدة موظف':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'إضافة موظف جديد':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'حذف موظف':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'إضافة مخلفات':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'تسوية رصيد':
        return 'bg-slate-100 text-slate-800 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <ShieldCheck className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight">سجل الرقابة الإدارية وتتبع العمليات</h2>
                <span className="bg-emerald-500/20 text-emerald-200 text-xs px-2.5 py-0.5 rounded-full border border-emerald-400/30">
                  نظام التتبع والمسؤولية
                </span>
              </div>
              <p className="text-xs text-emerald-200/80">
                تسجيل ومتابعة جميع الإجراءات (خصم، إصدار رخص، تعديل أرصدة) مع إظهار الحساب الذي نفّذ كل عملية
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={exportAuditLogs}
              className="bg-emerald-600/60 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border border-emerald-400/30"
              title="تصدير السجل كملف Excel"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تصدير Excel</span>
            </button>
            <button
              onClick={handlePrint}
              className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="طباعة التقرير"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة</span>
            </button>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stats Summary Strip */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
          <div className="bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] text-slate-500 block font-medium">إجمالي العمليات</span>
            <span className="text-xl font-bold text-slate-800">{totalCount}</span>
          </div>
          <div className="bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] text-emerald-700 block font-medium">عمليات مسؤول المصلحة</span>
            <span className="text-xl font-bold text-emerald-800">{adminOpsCount}</span>
          </div>
          <div className="bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] text-teal-700 block font-medium">عمليات مساعدة المسؤول</span>
            <span className="text-xl font-bold text-teal-800">{assistantOpsCount}</span>
          </div>
          <div className="bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] text-purple-700 block font-medium">رخص العطل الصادرة</span>
            <span className="text-xl font-bold text-purple-800">{leaveIssuedCount}</span>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="p-4 border-b border-slate-200 bg-white flex flex-col sm:flex-row items-center gap-3 shrink-0">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="بحث في سجل العمليات، اسم الموظف، التفاصيل، التاريخ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-9 pl-4 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden bg-slate-50 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* User Filter */}
            <div className="flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                className="text-xs px-2.5 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-hidden"
              >
                <option value="ALL">جميع الحسابات</option>
                <option value="admin">مسؤول المصلحة</option>
                <option value="assistant">مساعدة المسؤول</option>
              </select>
            </div>

            {/* Action Filter */}
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="text-xs px-2.5 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-hidden"
              >
                <option value="ALL">جميع أنواع الإجراءات</option>
                <option value="إصدار رخصة عطلة">إصدار رخصة عطلة</option>
                <option value="خصم عطلة">خصم عطلة</option>
                <option value="تسجيل مداومة">تسجيل مداومة</option>
                <option value="تعديل بيانات وأرصدة موظف">تعديل بيانات وأرصدة موظف</option>
                <option value="إضافة مخلفات">إضافة مخلفات</option>
                <option value="تسوية رصيد">تسوية رصيد</option>
                <option value="إضافة موظف جديد">إضافة موظف جديد</option>
                <option value="حذف موظف">حذف موظف</option>
              </select>
            </div>
          </div>
        </div>

        {/* Audit Log Entries List / Table */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Activity className="w-12 h-12 mx-auto mb-3 opacity-30 text-emerald-700" />
              <p className="text-sm font-semibold text-slate-600">لا توجد عمليات مسجلة تطابق معايير البحث</p>
              <p className="text-xs text-slate-400 mt-1">سيتم تسجيل أي إجراء تلقائياً فور القيام به في المنصة</p>
            </div>
          ) : (
            filteredLogs.map((log) => {
              const isLogAdmin = log.userId === 'admin' || log.userRole === 'admin';
              return (
                <div
                  key={log.id}
                  className="bg-white rounded-xl border border-slate-200 p-3.5 hover:shadow-sm transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  {/* Right side: Action badge & User info */}
                  <div className="flex items-start sm:items-center gap-3">
                    {/* User Avatar Badge */}
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold shrink-0 ${
                        isLogAdmin ? 'bg-emerald-800' : 'bg-teal-700'
                      }`}
                      title={log.userRoleTitle}
                    >
                      {isLogAdmin ? 'مس' : 'سع'}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] border ${getActionBadgeColor(log.actionType)}`}>
                          {log.actionType}
                        </span>

                        <span className="font-bold text-slate-800">
                          {log.userName}
                        </span>

                        <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-sm">
                          {log.userRoleTitle}
                        </span>

                        {log.employeeName && (
                          <span className="text-slate-600 font-medium bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-sm border border-emerald-100">
                            الموظف: {log.employeeName}
                          </span>
                        )}
                      </div>

                      <p className="text-slate-700 text-xs leading-relaxed">
                        {log.details}
                      </p>
                    </div>
                  </div>

                  {/* Left side: Date & Time */}
                  <div className="flex items-center gap-1 text-slate-400 shrink-0 text-[11px] pr-12 sm:pr-0">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="font-mono text-slate-600">{log.formattedDate}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>
              عرض <strong className="text-slate-700">{filteredLogs.length}</strong> عملية من أصل <strong className="text-slate-700">{totalCount}</strong> مسجلة في الذاكرة المحلية
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
