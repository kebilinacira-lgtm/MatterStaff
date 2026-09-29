import React, { useState, useRef } from 'react';
import { useLeaves } from '../context/LeavesContext';
import { 
  X, 
  FileSpreadsheet, 
  Download, 
  Upload, 
  Database, 
  CheckCircle2, 
  AlertCircle,
  FileCode,
  Trash2,
  RotateCcw,
  Calculator,
  FileDown
} from 'lucide-react';

interface ExcelManagerModalProps {
  onClose: () => void;
}

export const ExcelManagerModal: React.FC<ExcelManagerModalProps> = ({ onClose }) => {
  const { 
    exportToExcel, 
    downloadTemplateExcel,
    importFromExcel, 
    exportBackupJSON, 
    importBackupJSON, 
    clearAllEmployees,
    loadCleanSampleData,
    auditAndRecalculateAll,
    employees 
  } = useLeaves();

  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setFeedback(null);
    try {
      const res = await importFromExcel(file);
      setFeedback({ type: 'success', message: `تم استيراد ${res.count} موظف بنجاح مع تدقيق الحسابات تلقائياً!` });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'فشل استيراد ملف الإكسل، يرجى التحقق من صلب الملف' });
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleJsonUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const success = importBackupJSON(text);
        if (success) {
          setFeedback({ type: 'success', message: 'تم استرجاع النسخة الاحتياطية وتدقيق الحسابات بنجاح!' });
        } else {
          setFeedback({ type: 'error', message: 'ملف النسخة الاحتياطية غير صالح' });
        }
      } catch {
        setFeedback({ type: 'error', message: 'حدث خطأ أثناء قراءة ملف النسخة الاحتياطية' });
      }
    };
    reader.readAsText(file);
    if (jsonInputRef.current) jsonInputRef.current.value = '';
  };

  const handleAuditMath = () => {
    const result = auditAndRecalculateAll();
    if (result.fixedCount > 0) {
      setFeedback({ 
        type: 'success', 
        message: `تم فحص ${result.auditedCount} سجلاً بنجاح (يتضمن ${result.fixedCount} سجلاً بتسويات ومخلفات سنوات سابقة مقيدة في الملاحظات الرسمية).` 
      });
    } else {
      setFeedback({ 
        type: 'success', 
        message: `ممتاز! جميع سجلات الموظفين (${result.auditedCount}) متطابقة ومنضبطة نظامياً بنسبة 100%.` 
      });
    }
  };

  const handleClear = () => {
    clearAllEmployees();
    setFeedback({ type: 'success', message: 'تم تفريغ السجل بالكامل. يمكنك الآن استيراد ملف الكلية الرسمي من الصفر.' });
  };

  const handleLoadSample = () => {
    loadCleanSampleData();
    setFeedback({ type: 'success', message: 'تم استرجاع سجل كلية الرياضيات وعلوم المادة الأصلي (118 موظفاً) مطابقاً للملف الرسمي 100% دون أي تعديل.' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden border border-slate-200 my-8">
        <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">إدارة ملفات الإكسل وتدقيق البيانات</h2>
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
            <span>{feedback.message}</span>
          </div>
        )}

        <div className="p-6 space-y-6 text-xs max-h-[75vh] overflow-y-auto">
          {/* Section 1: Excel Operations */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                <span>التعامل مع ملفات مايكروسوفت إكسل (Excel .xlsx)</span>
              </h3>
              <button
                onClick={downloadTemplateExcel}
                className="text-xs text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                title="تحميل ملف إكسل رسمي فارغ بمسميات الأعمدة المعتمدة بالكلية"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>تحميل نموذج إكسل فارغ</span>
              </button>
            </div>
            <p className="text-slate-500 leading-relaxed">
              يمكنك تصدير جدول العطل كاملاً إلى ملف إكسل رسمي، أو استيراد ملف إكسل الكلية المعتمد مع ضمان التدقيق الحسابي التلقائي.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Export Excel */}
              <button
                onClick={exportToExcel}
                id="export-excel-btn"
                className="p-4 rounded-xl border border-emerald-300 bg-emerald-50/50 hover:bg-emerald-100/60 text-emerald-900 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer text-center group"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold block text-sm">تصدير إلى ملف Excel</span>
                  <span className="text-[11px] text-emerald-700">تنزيل {employees.length} موظفاً بجدول رسمي</span>
                </div>
              </button>

              {/* Import Excel */}
              <label
                className="p-4 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-800 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer text-center group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleExcelUpload}
                  className="hidden"
                />
                <div className="w-10 h-10 rounded-full bg-slate-800 text-white flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold block text-sm">استيراد ملف Excel</span>
                  <span className="text-[11px] text-slate-500">
                    {loading ? 'جاري الفحص والاستيراد...' : 'اختر ملف .xlsx لتحديث البيانات'}
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Section 2: Mathematical Audit */}
          <div className="border-t border-slate-200 pt-5 space-y-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Calculator className="w-4 h-4 text-blue-600" />
              <span>فحص وتدقيق الحسابات الرياضية التلقائي</span>
            </h3>
            <p className="text-slate-500 leading-relaxed">
              يقوم النظام بالتحقق فوراً من صحة المعادلة القانونية لكل موظف (المجموع = السنوية + التعويضية + الإضافات) وإصلاح أي فروق حسابية.
            </p>
            <button
              onClick={handleAuditMath}
              className="w-full py-2.5 px-4 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-blue-900 font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              <span>فحص وتصحيح الحسابات لجميع الموظفين الآن</span>
            </button>
          </div>

          {/* Section 3: Reset & Clear (Fresh Start for Director presentation) */}
          <div className="border-t border-slate-200 pt-5 space-y-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 text-rose-800">
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>التحكم في قاعدة البيانات وسرية المعلومات</span>
            </h3>
            <p className="text-slate-500 leading-relaxed">
              إذا أردت البدء من الصفر واستيراد ملف الإكسل المعتمد من مدير الكلية دون أي بيانات سابقة، يمكنك تصفير السجل:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                onClick={handleClear}
                className="py-2.5 px-3 rounded-xl border border-rose-300 bg-rose-50/60 hover:bg-rose-100 text-rose-900 font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center"
              >
                <Trash2 className="w-4 h-4 text-rose-600 shrink-0" />
                <span>تفريغ السجل بالكامل (قاعدة فارغة)</span>
              </button>

              <button
                onClick={handleLoadSample}
                className="py-2.5 px-3 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center"
              >
                <RotateCcw className="w-4 h-4 text-slate-600 shrink-0" />
                <span>استرجاع سجل الكلية الأصلي (118 موظفاً)</span>
              </button>
            </div>
          </div>

          {/* Section 4: Backup */}
          <div className="border-t border-slate-200 pt-5 space-y-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-600" />
              <span>النسخ الاحتياطي والأمان (الشبكة المحلية Intranet)</span>
            </h3>
            <p className="text-slate-500 leading-relaxed">
              حفظ نسخة طبق الأصل لنقلها بأمان بين حواسيب مصلحة المستخدمين وأمانة الكلية.
            </p>

            <div className="flex flex-wrap gap-3 pt-1">
              <button
                onClick={exportBackupJSON}
                id="export-backup-btn"
                className="flex-1 py-2.5 px-3 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <FileCode className="w-4 h-4" />
                <span>حفظ نسخة احتياطية (JSON)</span>
              </button>

              <label className="flex-1 py-2.5 px-3 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer">
                <input
                  ref={jsonInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleJsonUpload}
                  className="hidden"
                />
                <Upload className="w-4 h-4" />
                <span>استرجاع نسخة احتياطية</span>
              </label>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-bold cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
