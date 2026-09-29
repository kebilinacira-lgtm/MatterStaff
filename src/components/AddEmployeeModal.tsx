import React, { useState } from 'react';
import { useLeaves } from '../context/LeavesContext';
import { EmployeeStatus } from '../types';
import { X, UserPlus, Building, Briefcase } from 'lucide-react';

interface AddEmployeeModalProps {
  onClose: () => void;
}

export const AddEmployeeModal: React.FC<AddEmployeeModalProps> = ({ onClose }) => {
  const { addEmployee } = useLeaves();

  const [fullName, setFullName] = useState('');
  const [rank, setRank] = useState('متصرف');
  const [department, setDepartment] = useState('مصلحة المستخدمين');
  const [annualLeave, setAnnualLeave] = useState<number>(30);
  const [exceptionalLeave, setExceptionalLeave] = useState<number>(10);
  const [compensatoryLeave, setCompensatoryLeave] = useState<number>(0);
  const [additions, setAdditions] = useState<number>(0);
  const [status, setStatus] = useState<EmployeeStatus>('نشط');
  const [maternityNursingHours, setMaternityNursingHours] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !rank.trim()) {
      alert('يرجى ملء الاسم واللقب والرتبة');
      return;
    }

    addEmployee({
      fullName: fullName.trim(),
      rank: rank.trim(),
      department: department.trim(),
      annualLeave,
      exceptionalLeave,
      compensatoryLeave,
      additions,
      status,
      maternityNursingHours: maternityNursingHours.trim() || undefined,
      notes: notes.trim() || 'موظف جديد مضاف إلى السجل',
    });

    onClose();
  };

  const commonRanks = [
    'متصرف مستشار',
    'متصرف رئيسي',
    'متصرف محلل',
    'متصرف',
    'مساعد متصرف',
    'ملحق رئيسي للإدارة',
    'ملحق إدارة',
    'عون إدارة رئيسي',
    'مهندس دولة رئيسي في الإعلام الآلي',
    'مهندس دولة في الإعلام الآلي',
    'مساعد مهندس في الإعلام الآلي',
    'تقني سامي في الإعلام الآلي',
    'مهندس دولة للمخابر الجامعية',
    'ملحق للمخابر الجامعية',
    'تقني سامي للمخابر الجامعية',
    'محاسب إداري رئيسي',
    'محاسب إداري',
    'كاتب مديرية',
    'عون حفظ بيانات',
    'محافظ بالمكتبات الجامعية',
    'ملحق بالمكتبات الجامعية',
    'وثائقي أمين محفوظات رئيسي',
    'سائق سيارة من الصنف الأول',
    'عامل مهني خارج الصنف',
    'عامل مهني من المستوى الأول',
    'عامل مهني من المستوى الثاني',
    'حارس',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-200 my-8">
        <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">إضافة موظف جديد إلى السجل</h2>
              <p className="text-xs text-slate-300">مصلحة المستخدمين — كلية الرياضيات وعلوم المادة</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[500px] overflow-y-auto text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">الاسم واللقب بالكامل *</label>
              <input
                type="text"
                required
                id="add-emp-name"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="مثال: أحمد قاصدي"
                className="w-full border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">الرتبة الوظيفية *</label>
              <input
                type="text"
                list="rank-suggestions"
                required
                id="add-emp-rank"
                value={rank}
                onChange={e => setRank(e.target.value)}
                placeholder="اختر أو اكتب الرتبة..."
                className="w-full border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500"
              />
              <datalist id="rank-suggestions">
                {commonRanks.map(r => (
                  <option key={r} value={r} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">المصلحة / القسم التابع له</label>
              <input
                type="text"
                value={department}
                onChange={e => setDepartment(e.target.value)}
                placeholder="مثال: مصلحة المستخدمين، مخابر الفيزياء..."
                className="w-full border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">الحالة الإدارية</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as EmployeeStatus)}
                className="w-full border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500"
              >
                <option value="نشط">نشط في الخدمة الفعلية</option>
                <option value="في عطلة">في عطلة</option>
                <option value="وضع تحت التصرف">وضع تحت التصرف</option>
                <option value="محول">محول خارج الكلية</option>
                <option value="عطلة أمومة">عطلة أمومة</option>
                <option value="عطلة مرضية">عطلة مرضية</option>
              </select>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-3">
            <h3 className="font-bold text-slate-800 mb-2">الأرصدة الأولية للعطل (بالأيام):</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-200">
                <label className="block text-[11px] font-bold text-emerald-900 mb-1">عطلة سنوية</label>
                <input
                  type="number"
                  min="0"
                  max="300"
                  value={annualLeave}
                  onChange={e => setAnnualLeave(Number(e.target.value))}
                  className="w-full text-center bg-white border border-emerald-300 rounded-lg p-1.5 font-black text-emerald-800 text-sm"
                />
              </div>

              <div className="bg-amber-50/60 p-2.5 rounded-xl border border-amber-200">
                <label className="block text-[11px] font-bold text-amber-900 mb-1">عطلة تعويضية</label>
                <input
                  type="number"
                  min="0"
                  max="200"
                  value={compensatoryLeave}
                  onChange={e => setCompensatoryLeave(Number(e.target.value))}
                  className="w-full text-center bg-white border border-amber-300 rounded-lg p-1.5 font-black text-amber-800 text-sm"
                />
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">عطلة استثنائية</label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={exceptionalLeave}
                  onChange={e => setExceptionalLeave(Number(e.target.value))}
                  className="w-full text-center bg-white border border-slate-300 rounded-lg p-1.5 font-bold text-slate-800 text-sm"
                />
              </div>

              <div className="bg-teal-50 p-2.5 rounded-xl border border-teal-200">
                <label className="block text-[11px] font-bold text-teal-900 mb-1">إضافات / مخلفات</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={additions}
                  onChange={e => setAdditions(Number(e.target.value))}
                  className="w-full text-center bg-white border border-teal-300 rounded-lg p-1.5 font-bold text-teal-800 text-sm"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">ساعات الرضاعة / عطلة أمومة (اختياري)</label>
            <input
              type="text"
              value={maternityNursingHours}
              onChange={e => setMaternityNursingHours(e.target.value)}
              placeholder="مثال: ساعتان رضاعة يومياً حتى 31/12/2026"
              className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">ملاحظات إدارية</label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="ملاحظات حول الرصيد أو التحويل أو أصل المخلفات..."
              className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-emerald-500 font-mono"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              id="confirm-add-emp-btn"
              className="px-5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-xs cursor-pointer"
            >
              إضافة الموظف للسجل
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
