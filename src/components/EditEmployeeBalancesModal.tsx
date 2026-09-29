import React, { useState, useEffect } from 'react';
import { Employee, EmployeeStatus } from '../types';
import { useLeaves } from '../context/LeavesContext';
import { useAuth } from '../context/AuthContext';
import { X, Save, AlertCircle, CheckCircle2, User, Award, Building, Calendar, ShieldCheck, Plus, Minus } from 'lucide-react';

interface EditEmployeeBalancesModalProps {
  employee: Employee | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EditEmployeeBalancesModal: React.FC<EditEmployeeBalancesModalProps> = ({
  employee,
  isOpen,
  onClose,
}) => {
  const { updateEmployeeBalancesAndInfo } = useLeaves();
  const { currentUser } = useAuth();

  const [fullName, setFullName] = useState('');
  const [rank, setRank] = useState('');
  const [department, setDepartment] = useState('');
  const [status, setStatus] = useState<EmployeeStatus>('نشط');
  const [annualLeave, setAnnualLeave] = useState<number>(30);
  const [compensatoryLeave, setCompensatoryLeave] = useState<number>(0);
  const [additions, setAdditions] = useState<number>(0);
  const [exceptionalLeave, setExceptionalLeave] = useState<number>(10);
  const [notes, setNotes] = useState('');
  const [maternityNursingHours, setMaternityNursingHours] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (employee) {
      setFullName(employee.fullName || '');
      setRank(employee.rank || '');
      setDepartment(employee.department || 'كلية الرياضيات وعلوم المادة');
      setStatus(employee.status || 'نشط');
      setAnnualLeave(employee.annualLeave ?? 0);
      setCompensatoryLeave(employee.compensatoryLeave ?? 0);
      setAdditions(employee.additions ?? 0);
      setExceptionalLeave(employee.exceptionalLeave ?? 10);
      setNotes(employee.notes || '');
      setMaternityNursingHours(employee.maternityNursingHours || '');
      setSuccessMessage(null);
    }
  }, [employee, isOpen]);

  if (!isOpen || !employee) return null;

  const totalCalculated = Number(annualLeave) + Number(compensatoryLeave) + Number(additions);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      alert('يرجى كتابة الاسم واللقب');
      return;
    }

    updateEmployeeBalancesAndInfo(employee.id, {
      fullName: fullName.trim(),
      rank: rank.trim(),
      department: department.trim(),
      status,
      annualLeave: Math.max(0, Number(annualLeave) || 0),
      compensatoryLeave: Math.max(0, Number(compensatoryLeave) || 0),
      additions: Math.max(0, Number(additions) || 0),
      exceptionalLeave: Math.min(10, Math.max(0, Number(exceptionalLeave) || 0)),
      notes: notes.trim(),
      maternityNursingHours: maternityNursingHours.trim(),
    });

    setSuccessMessage('تم حفظ التعديلات بنجاح وتحديث الرصيد وسجل الرقابة الإدارية!');
    setTimeout(() => {
      setSuccessMessage(null);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <User className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h2 className="text-lg font-bold">تعديل بيانات ورصيد الموظف</h2>
              <p className="text-xs text-emerald-200/90">
                الموظف: <span className="font-semibold text-white">{employee.fullName}</span> (رقم #{employee.id})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Audit Context Notice */}
        <div className="bg-emerald-50 border-b border-emerald-100 px-6 py-2.5 flex items-center justify-between text-xs text-emerald-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>
              منفّذ التعديل الحالي: <strong className="font-bold">{currentUser?.name || 'مستخدم المنصة'}</strong> ({currentUser?.roleTitle})
            </span>
          </div>
          <span className="text-emerald-600">تسجيل فوري في سجل الرقابة</span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {successMessage && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-3 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="text-sm font-medium">{successMessage}</span>
            </div>
          )}

          {/* Section 1: Basic Identity */}
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-700" />
              البيانات الإدارية والشخصية
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  الاسم واللقب <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden font-medium"
                />
              </div>

              <div className="md:col-span-1">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  الرتبة الوظيفية
                </label>
                <input
                  type="text"
                  value={rank}
                  onChange={(e) => setRank(e.target.value)}
                  placeholder="مثال: متصرف رئيسي"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden font-medium"
                />
              </div>

              <div className="md:col-span-1">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  الحالة الإدارية
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as EmployeeStatus)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden font-medium bg-white"
                >
                  <option value="نشط">نشط</option>
                  <option value="في عطلة">في عطلة</option>
                  <option value="وضع تحت التصرف">وضع تحت التصرف</option>
                  <option value="محول">محول</option>
                  <option value="عطلة أمومة">عطلة أمومة</option>
                  <option value="عطلة مرضية">عطلة مرضية</option>
                  <option value="وفاة">وفاة</option>
                  <option value="مؤرشف">مؤرشف</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Department & Nursing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                المصلحة / القسم
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="مثال: مصلحة المستخدمين، قسم الفيزياء..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ساعات الرضاعة / عطلة الأمومة (اختياري)
              </label>
              <input
                type="text"
                value={maternityNursingHours}
                onChange={(e) => setMaternityNursingHours(e.target.value)}
                placeholder="مثال: ساعتان يومياً من 14:00 إلى 16:00"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden"
              />
            </div>
          </div>

          {/* Section 3: Leave Balances with Interactive Increments */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-700" />
                تعديل وتحديد أرصدة العطل (أيام)
              </h3>
              <span className="text-xs text-slate-500">
                يمكنك التعديل يدوياً أو بواسطة أزرار الإضافة/الخصم
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* Annual Leave */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-800">
                    العطلة السنوية
                  </label>
                  <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                    الأصلية 30 يوم
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAnnualLeave(prev => Math.max(0, Number(prev) - 1))}
                    className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold"
                    title="خصم يوم"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="number"
                    min="0"
                    max="120"
                    value={annualLeave}
                    onChange={(e) => setAnnualLeave(Number(e.target.value) || 0)}
                    className="w-full text-center text-lg font-bold text-slate-800 py-1 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setAnnualLeave(prev => Number(prev) + 1)}
                    className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold"
                    title="إضافة يوم"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Compensatory Leave */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-800">
                    العطلة التعويضية
                  </label>
                  <span className="text-[11px] font-medium text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">
                    المداومات
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCompensatoryLeave(prev => Math.max(0, Number(prev) - 1))}
                    className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold"
                    title="خصم يوم"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="number"
                    min="0"
                    max="90"
                    value={compensatoryLeave}
                    onChange={(e) => setCompensatoryLeave(Number(e.target.value) || 0)}
                    className="w-full text-center text-lg font-bold text-teal-800 py-1 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setCompensatoryLeave(prev => Number(prev) + 1)}
                    className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold"
                    title="إضافة يوم"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Additions / Backlog */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-800">
                    الإضافات والمخلفات
                  </label>
                  <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                    مرحل / سنوات سابقة
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAdditions(prev => Math.max(0, Number(prev) - 1))}
                    className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold"
                    title="خصم يوم"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="number"
                    min="0"
                    max="90"
                    value={additions}
                    onChange={(e) => setAdditions(Number(e.target.value) || 0)}
                    className="w-full text-center text-lg font-bold text-amber-800 py-1 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setAdditions(prev => Number(prev) + 1)}
                    className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold"
                    title="إضافة يوم"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>

            {/* Total Balance Ribbon */}
            <div className="bg-emerald-800 text-white p-4 rounded-xl flex items-center justify-between shadow-xs">
              <div>
                <span className="text-xs text-emerald-200 font-medium block">
                  الباقي من مجموع العطل (المعادلة الحسابية المعتمدة):
                </span>
                <span className="text-xs text-emerald-100/90">
                  {annualLeave} يوم (سنوية) + {compensatoryLeave} يوم (تعويضية) + {additions} يوم (إضافات)
                </span>
              </div>
              <div className="text-left">
                <span className="text-3xl font-extrabold tracking-tight">
                  {totalCalculated}
                </span>
                <span className="text-xs text-emerald-200 mr-1 font-semibold">يوماً متبقياً</span>
              </div>
            </div>

            {/* Exceptional Leave Remaining */}
            <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200 text-xs">
              <span className="font-semibold text-slate-700">
                رصيد العطل الاستثنائية المتبقي (أعياد، زواج، ولادة، وفاة):
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={exceptionalLeave}
                  onChange={(e) => setExceptionalLeave(Math.min(10, Math.max(0, Number(e.target.value) || 0)))}
                  className="w-16 text-center font-bold py-1 border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
                <span className="text-slate-500">من أصل 10 أيام سنوياً</span>
              </div>
            </div>

          </div>

          {/* Section 4: Administrative Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ملاحظات إدارية وسجل العطل
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="اكتب أي ملاحظة تخص وضعية الموظف أو سبب التعديل المؤقت..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-sm font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              حفظ التعديلات في السجل والرصيد
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
