import React from 'react';
import { useLeaves } from '../context/LeavesContext';
import { Users, Calendar, Clock, AlertTriangle, Baby, Award } from 'lucide-react';

export const DashboardStats: React.FC = () => {
  const { employees, setSelectedStatus, setSelectedBalanceFilter, setActiveTab } = useLeaves();

  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(e => e.status === 'نشط').length;
  const maternityOrNursing = employees.filter(e => e.status === 'عطلة أمومة' || !!e.maternityNursingHours).length;
  const transferredOrDisposal = employees.filter(e => e.status === 'محول' || e.status === 'وضع تحت التصرف').length;

  const totalAnnual = employees.reduce((acc, e) => acc + (e.annualLeave || 0), 0);
  const totalCompensatory = employees.reduce((acc, e) => acc + (e.compensatoryLeave || 0), 0);
  const highBalanceCount = employees.filter(e => e.totalRemaining >= 50).length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      {/* Total Staff */}
      <div 
        onClick={() => { setSelectedStatus('ALL'); setSelectedBalanceFilter('ALL'); }}
        className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs hover:border-emerald-500 cursor-pointer transition-all group"
      >
        <div className="flex items-center justify-between text-slate-500 mb-1.5">
          <span className="text-xs font-semibold text-slate-600">إجمالي الموظفين</span>
          <Users className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
        </div>
        <div className="text-2xl font-black text-slate-800 tracking-tight">{totalEmployees}</div>
        <div className="text-[11px] text-emerald-700 font-medium mt-1">
          {activeEmployees} في الخدمة الفعلية
        </div>
      </div>

      {/* Annual Leaves Total */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between text-slate-500 mb-1.5">
          <span className="text-xs font-semibold text-slate-600">رصيد العطل السنوية</span>
          <Calendar className="w-4 h-4 text-emerald-600" />
        </div>
        <div className="text-2xl font-black text-emerald-700 tracking-tight">{totalAnnual.toLocaleString()}</div>
        <div className="text-[11px] text-slate-500 font-medium mt-1">
          يوماً مستحقاً إجمالاً
        </div>
      </div>

      {/* Compensatory Total */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between text-slate-500 mb-1.5">
          <span className="text-xs font-semibold text-slate-600">العطل التعويضية</span>
          <Clock className="w-4 h-4 text-amber-600" />
        </div>
        <div className="text-2xl font-black text-amber-700 tracking-tight">{totalCompensatory.toLocaleString()}</div>
        <div className="text-[11px] text-slate-500 font-medium mt-1">
          نظير المداومة والخدمة
        </div>
      </div>

      {/* High Accumulated Leave Alert */}
      <div 
        onClick={() => { setSelectedBalanceFilter('high'); setActiveTab('table'); }}
        className="bg-white p-3.5 rounded-xl border border-amber-200 bg-amber-50/40 shadow-2xs hover:border-amber-400 cursor-pointer transition-all"
        title="انقر لتصفية الموظفين ذوي الأرصدة الكبيرة"
      >
        <div className="flex items-center justify-between text-amber-800 mb-1.5">
          <span className="text-xs font-semibold">أرصدة كبرى (≥50يوم)</span>
          <AlertTriangle className="w-4 h-4 text-amber-600" />
        </div>
        <div className="text-2xl font-black text-amber-800 tracking-tight">{highBalanceCount}</div>
        <div className="text-[11px] text-amber-700 font-medium mt-1">
          يتطلب تخطيط الخروج
        </div>
      </div>

      {/* Maternity & Nursing Hours */}
      <div 
        onClick={() => { setSelectedStatus('عطلة أمومة'); setActiveTab('table'); }}
        className="bg-white p-3.5 rounded-xl border border-rose-200 bg-rose-50/30 shadow-2xs hover:border-rose-400 cursor-pointer transition-all"
      >
        <div className="flex items-center justify-between text-rose-800 mb-1.5">
          <span className="text-xs font-semibold">أمومة / ساعات رضاعة</span>
          <Baby className="w-4 h-4 text-rose-600" />
        </div>
        <div className="text-2xl font-black text-rose-800 tracking-tight">{maternityOrNursing}</div>
        <div className="text-[11px] text-rose-700 font-medium mt-1">
          متابعة الرخص القانونية
        </div>
      </div>

      {/* Transfers & Special Status */}
      <div 
        onClick={() => { setSelectedStatus('وضع تحت التصرف'); setActiveTab('table'); }}
        className="bg-white p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/30 shadow-2xs hover:border-indigo-400 cursor-pointer transition-all"
      >
        <div className="flex items-center justify-between text-indigo-800 mb-1.5">
          <span className="text-xs font-semibold">تحويل / تحت التصرف</span>
          <Award className="w-4 h-4 text-indigo-600" />
        </div>
        <div className="text-2xl font-black text-indigo-800 tracking-tight">{transferredOrDisposal}</div>
        <div className="text-[11px] text-indigo-700 font-medium mt-1">
          كلية الطب، المحروقات، إلخ
        </div>
      </div>
    </div>
  );
};
