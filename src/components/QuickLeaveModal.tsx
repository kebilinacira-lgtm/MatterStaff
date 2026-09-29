import React, { useState, useMemo } from 'react';
import { useLeaves } from '../context/LeavesContext';
import { LeaveType, LeaveRequestForm } from '../types';
import { X, CalendarCheck, Search, CheckCircle2, AlertCircle, Eye, Printer } from 'lucide-react';
import { ScanProofAttachment, ProofAttachmentValue } from './ScanProofAttachment';

interface QuickLeaveModalProps {
  onClose: () => void;
  preSelectedEmployeeId?: number;
}

export const QuickLeaveModal: React.FC<QuickLeaveModalProps> = ({
  onClose,
  preSelectedEmployeeId,
}) => {
  const { employees, recordLeave, recordPermanence } = useLeaves();

  const [mode, setMode] = useState<'leave' | 'permanence'>('leave');
  const [empSearch, setEmpSearch] = useState('');
  const [selectedEmpId, setSelectedEmpId] = useState<number>(
    preSelectedEmployeeId || (employees.length > 0 ? employees[0].id : 1)
  );

  // Leave Form
  const [leaveType, setLeaveType] = useState<LeaveType>('سنوية');
  const [days, setDays] = useState<number>(2);
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState<string>('عطلة سنوية عادية');
  const [interim, setInterim] = useState<string>('');

  // Permanence Form
  const [permDate, setPermDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [permDays, setPermDays] = useState<number>(2);
  const [permNote, setPermNote] = useState<string>('مداومة رسمية بالكلية');

  // Scanned Proof State (Mandatory as per administration instructions)
  const [proof, setProof] = useState<ProofAttachmentValue>({
    hasProof: false,
  });
  const [previewImage, setPreviewImage] = useState<{ url: string; title?: string } | null>(null);

  // Feedback
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const selectedEmp = useMemo(() => {
    return employees.find(e => e.id === selectedEmpId) || employees[0];
  }, [employees, selectedEmpId]);

  const filteredEmployees = useMemo(() => {
    if (!empSearch.trim()) return employees;
    const t = empSearch.toLowerCase().trim();
    return employees.filter(e => e.fullName.toLowerCase().includes(t) || e.rank.toLowerCase().includes(t));
  }, [employees, empSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmp) return;

    // Strict validation: proof is mandatory
    if (!proof.hasProof || !proof.proofDataUrl) {
      setFeedback({
        type: 'error',
        text: 'تنبيه إداري إلزامي: يجب إرفاق وثيقة ممسوحة ضوئياً تثبت موافقة وتأشيرة المسؤول المباشر قبل تسجيل العملية لتفادي أي التباس.',
      });
      return;
    }

    if (mode === 'leave') {
      const req: LeaveRequestForm = {
        employeeId: selectedEmp.id,
        employeeName: selectedEmp.fullName,
        rank: selectedEmp.rank,
        leaveType,
        startDate,
        endDate,
        durationDays: days,
        reason,
        interimEmployeeName: interim,
        year: new Date(startDate).getFullYear(),
        hasProof: true,
        proofDocId: proof.proofDocId,
        proofTitle: proof.proofTitle || `موافقة المسؤول على رخصة عطلة ${leaveType}`,
        proofDataUrl: proof.proofDataUrl,
      };

      const res = recordLeave(req);
      if (res.success) {
        setFeedback({ type: 'success', text: `${res.message} (تم ربط وتوثيق وثيقة الموافقة الممسوحة بنجاح)` });
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setFeedback({ type: 'error', text: res.message });
      }
    } else {
      recordPermanence(selectedEmp.id, permDays, permDate, permNote, {
        hasProof: true,
        proofDocId: proof.proofDocId,
        proofTitle: proof.proofTitle || `سند مداومة وموافقة رسمية (${permDate})`,
        proofDataUrl: proof.proofDataUrl,
      });
      setFeedback({ type: 'success', text: `تم تسجيل المداومة بنجاح وإضافة ${permDays} يوم وتوثيق سند الإثبات للموظف ${selectedEmp.fullName}.` });
      setTimeout(() => {
        onClose();
      }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden border border-slate-200 my-8">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">تسجيل عملية عطلة أو مداومة</h2>
              <p className="text-xs text-slate-300">مصلحة المستخدمين — جامعة قاصدي مرباح ورقلة</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Operation Mode Selector */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-bold p-2 gap-2">
          <button
            type="button"
            onClick={() => setMode('leave')}
            className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
              mode === 'leave'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            خصم رخصة عطلة (سنوية / تعويضية / استثنائية)
          </button>
          <button
            type="button"
            onClick={() => setMode('permanence')}
            className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
              mode === 'permanence'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            تسجيل مداومة (+2 يوم تعويضي)
          </button>
        </div>

        {feedback && (
          <div
            className={`mx-5 mt-4 p-3 rounded-xl flex items-center gap-2 text-xs font-semibold ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Choose Employee */}
          <div>
            <label className="block font-bold text-slate-800 mb-1">اختر الموظف المعني بالعملية:</label>
            <div className="space-y-1.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="ابحث لتصفية القائمة بالاسم..."
                  value={empSearch}
                  onChange={e => setEmpSearch(e.target.value)}
                  className="w-full pr-8 pl-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white"
                />
              </div>

              <select
                id="select-employee-dropdown"
                value={selectedEmpId}
                onChange={e => setSelectedEmpId(Number(e.target.value))}
                className="w-full border border-slate-300 rounded-lg p-2.5 font-bold text-slate-900 bg-white focus:ring-2 focus:ring-emerald-500"
              >
                {filteredEmployees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.id} - {emp.fullName} ({emp.rank}) — رصيد متبقي: {emp.totalRemaining} يوم
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Selected Employee Snapshot Card */}
          {selectedEmp && (
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 block">{selectedEmp.fullName}</span>
                <span className="text-[11px] text-slate-500">{selectedEmp.rank}</span>
              </div>
              <div className="flex gap-2 text-center text-[11px]">
                <div className="bg-white px-2 py-1 rounded-md border border-slate-200">
                  <span className="text-slate-400 block text-[9px]">سنوية</span>
                  <span className="font-black text-emerald-800">{selectedEmp.annualLeave}</span>
                </div>
                <div className="bg-white px-2 py-1 rounded-md border border-slate-200">
                  <span className="text-slate-400 block text-[9px]">تعويضية</span>
                  <span className="font-black text-amber-800">{selectedEmp.compensatoryLeave}</span>
                </div>
                <div className="bg-white px-2 py-1 rounded-md border border-slate-200">
                  <span className="text-slate-400 block text-[9px]">المجموع</span>
                  <span className="font-black text-teal-900">{selectedEmp.totalRemaining}</span>
                </div>
              </div>
            </div>
          )}

          {/* Mode: Leave */}
          {mode === 'leave' && (
            <div className="space-y-3 pt-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">نوع العطلة:</label>
                  <select
                    value={leaveType}
                    onChange={e => setLeaveType(e.target.value as LeaveType)}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="سنوية">عطلة سنوية</option>
                    <option value="تعويضية">عطلة تعويضية</option>
                    <option value="استثنائية">عطلة استثنائية (زواج، ختان...)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">عدد الأيام:</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={days}
                    onChange={e => setDays(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">تاريخ البداية:</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">تاريخ النهاية:</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">سبب أو مناسبة العطلة:</label>
                <input
                  type="text"
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="عطلة صيفية سنوية، زواج المعني، ختان، راحة..."
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">الموظف المستخلف (اختياري):</label>
                <input
                  type="text"
                  value={interim}
                  onChange={e => setInterim(e.target.value)}
                  placeholder="اسم الموظف المستخلف أثناء فترة العطلة..."
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          {/* Mode: Permanence */}
          {mode === 'permanence' && (
            <div className="space-y-3 pt-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">عدد الأيام المكتسبة:</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={permDays}
                    onChange={e => setPermDays(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">المعتاد: 02 يومان للمداومة الواحدة</span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">تاريخ يوم المداومة:</label>
                  <input
                    type="date"
                    value={permDate}
                    onChange={e => setPermDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">ملاحظة أو مصلحة المداومة:</label>
                <input
                  type="text"
                  value={permNote}
                  onChange={e => setPermNote(e.target.value)}
                  placeholder="مداومة عطلة نهاية الأسبوع، مداومة العطلة الصيفية..."
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          )}

          {/* Mandatory Scanned Proof Attachment Section */}
          <ScanProofAttachment
            employeeId={selectedEmp?.id}
            employeeName={selectedEmp?.fullName}
            value={proof}
            onChange={setProof}
            required={true}
            titleLabel={
              mode === 'leave'
                ? 'وثيقة إثبات موافقة المسؤول المباشر على العطلة (مسح ضوئي 📸)'
                : 'سند المداومة المؤشر والموقع من طرف الإدارة (مسح ضوئي 📸)'
            }
            description={
              mode === 'leave'
                ? 'إلزامـي: التقط صورة للرخصة الورقية الموقعة أو ارفع الملف الممسوح ضوئياً لإثبات الموافقة وتفادي أي التباس.'
                : 'إلزامـي: التقط صورة لجدول أو سند المداومة المؤشر من رئيس المصلحة أو عميد الكلية.'
            }
            onPreview={(url, title) => setPreviewImage({ url, title })}
          />

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
              id="quick-submit-btn"
              className={`px-5 py-2 rounded-lg font-bold text-white shadow-xs cursor-pointer ${
                mode === 'leave' ? 'bg-emerald-700 hover:bg-emerald-800' : 'bg-amber-600 hover:bg-amber-700'
              }`}
            >
              {mode === 'leave' ? 'تأكيد خصم العطلة بالوثيقة المرفقة' : 'تسجيل المداومة بالوثيقة المرفقة'}
            </button>
          </div>
        </form>

        {/* Full Image Preview Modal */}
        {previewImage && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80">
            <div className="bg-white rounded-xl max-w-2xl w-full p-4 overflow-hidden text-right" dir="rtl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <span className="font-bold text-sm text-slate-900">{previewImage.title || 'معاينة الوثيقة الممسوحة'}</span>
                <button
                  type="button"
                  onClick={() => setPreviewImage(null)}
                  className="p-1 rounded hover:bg-slate-100 text-slate-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="py-4 flex justify-center bg-slate-100 rounded-lg my-2 max-h-[60vh] overflow-auto">
                <img
                  src={previewImage.url}
                  alt="وثيقة الموافقة"
                  className="max-h-[55vh] object-contain rounded shadow"
                />
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setPreviewImage(null)}
                  className="px-4 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-bold"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
