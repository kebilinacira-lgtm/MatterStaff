import React, { useState, useEffect } from 'react';
import { Employee, LeaveType, LeaveRequestForm, ScannedDocument, LeaveTransaction } from '../types';
import { useLeaves } from '../context/LeavesContext';
import { getDocumentsByEmployee, deleteScannedDocument } from '../utils/documentStorage';
import { ScanProofAttachment, ProofAttachmentValue } from './ScanProofAttachment';
import { ProofViewerModal } from './ProofViewerModal';
import { 
  X, 
  User, 
  Calendar, 
  Clock, 
  Plus, 
  Minus, 
  History, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  Save,
  Trash2,
  CalendarCheck,
  Camera,
  FolderOpen,
  Printer,
  Download,
  Eye,
  Maximize2
} from 'lucide-react';

interface EmployeeDetailModalProps {
  employee: Employee;
  onClose: () => void;
  onOpenPrint: (emp: Employee) => void;
  onOpenScanner?: (emp: Employee) => void;
}

export const EmployeeDetailModal: React.FC<EmployeeDetailModalProps> = ({
  employee,
  onClose,
  onOpenPrint,
  onOpenScanner,
}) => {
  const { updateEmployee, updateEmployeeBalancesAndInfo, deleteEmployee, recordLeave, recordPermanence, attachProofToTransaction, addBacklog, adjustBalance } = useLeaves();

  const [activeTab, setActiveTab] = useState<'overview' | 'take_leave' | 'add_permanence' | 'add_backlog' | 'adjust' | 'edit' | 'documents'>('overview');
  
  // Feedback
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Scanned Documents State
  const [employeeDocs, setEmployeeDocs] = useState<ScannedDocument[]>([]);
  const [zoomDoc, setZoomDoc] = useState<ScannedDocument | null>(null);

  // Scanned Proof Attachment States (Mandatory verification rule)
  const [leaveProof, setLeaveProof] = useState<ProofAttachmentValue>({ hasProof: false });
  const [permProof, setPermProof] = useState<ProofAttachmentValue>({ hasProof: false });
  const [viewingProofTx, setViewingProofTx] = useState<LeaveTransaction | null>(null);
  const [attachingProofTx, setAttachingProofTx] = useState<LeaveTransaction | null>(null);
  const [retroProof, setRetroProof] = useState<ProofAttachmentValue>({ hasProof: false });

  const loadDocs = async () => {
    try {
      const docs = await getDocumentsByEmployee(employee.id);
      setEmployeeDocs(docs);
    } catch (err) {
      console.error('Failed to load employee documents', err);
    }
  };

  useEffect(() => {
    loadDocs();
  }, [employee.id]);

  // Leave Form State
  const [leaveType, setLeaveType] = useState<LeaveType>('سنوية');
  const [leaveDays, setLeaveDays] = useState<number>(1);
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [leaveReason, setLeaveReason] = useState<string>('عطلة سنوية عادية');
  const [interimEmployee, setInterimEmployee] = useState<string>('');

  // Permanence Form State
  const [permDays, setPermDays] = useState<number>(2);
  const [permDate, setPermDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [permNote, setPermNote] = useState<string>('مداومة رسمية بالكلية');

  // Backlog Form State
  const [backlogDays, setBacklogDays] = useState<number>(5);
  const [backlogYear, setBacklogYear] = useState<number>(2024);
  const [backlogNote, setBacklogNote] = useState<string>('مخلفات عطلة مرحلة');

  // Adjust Form State
  const [adjustType, setAdjustType] = useState<'annual' | 'compensatory' | 'exceptional'>('annual');
  const [adjustDelta, setAdjustDelta] = useState<number>(1);
  const [adjustIsAdd, setAdjustIsAdd] = useState<boolean>(true);
  const [adjustNote, setAdjustNote] = useState<string>('تسوية إدارية');

  // Edit Employee State (Full info & balances)
  const [editName, setEditName] = useState(employee.fullName);
  const [editRank, setEditRank] = useState(employee.rank);
  const [editDept, setEditDept] = useState(employee.department || '');
  const [editStatus, setEditStatus] = useState(employee.status);
  const [editNursing, setEditNursing] = useState(employee.maternityNursingHours || '');
  const [editNotes, setEditNotes] = useState(employee.notes || '');
  const [editAnnual, setEditAnnual] = useState<number>(employee.annualLeave ?? 30);
  const [editComp, setEditComp] = useState<number>(employee.compensatoryLeave ?? 0);
  const [editAdditions, setEditAdditions] = useState<number>(employee.additions ?? 0);
  const [editExceptional, setEditExceptional] = useState<number>(employee.exceptionalLeave ?? 10);

  useEffect(() => {
    setEditName(employee.fullName);
    setEditRank(employee.rank);
    setEditDept(employee.department || '');
    setEditStatus(employee.status);
    setEditNursing(employee.maternityNursingHours || '');
    setEditNotes(employee.notes || '');
    setEditAnnual(employee.annualLeave ?? 30);
    setEditComp(employee.compensatoryLeave ?? 0);
    setEditAdditions(employee.additions ?? 0);
    setEditExceptional(employee.exceptionalLeave ?? 10);
  }, [employee]);

  // Handle Leave Submit
  const handleTakeLeaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (leaveDays <= 0) {
      setFeedback({ type: 'error', text: 'يرجى إدخال عدد أيام صحيح أكبر من الصفر' });
      return;
    }

    if (!leaveProof.hasProof || !leaveProof.proofDataUrl) {
      setFeedback({
        type: 'error',
        text: 'تنبيه إداري إلزامي: يجب إرفاق وثيقة ممسوحة ضوئياً تثبت موافقة وتأشيرة المسؤول المباشر قبل تسجيل العطلة لتفادي أي التباس.',
      });
      return;
    }

    const req: LeaveRequestForm = {
      employeeId: employee.id,
      employeeName: employee.fullName,
      rank: employee.rank,
      leaveType,
      startDate,
      endDate,
      durationDays: leaveDays,
      reason: leaveReason,
      interimEmployeeName: interimEmployee,
      year: new Date(startDate).getFullYear(),
      hasProof: true,
      proofDocId: leaveProof.proofDocId,
      proofTitle: leaveProof.proofTitle || `موافقة المسؤول على رخصة عطلة ${leaveType}`,
      proofDataUrl: leaveProof.proofDataUrl,
    };

    const res = recordLeave(req);
    if (res.success) {
      setFeedback({ type: 'success', text: `${res.message} (تم ربط وتوثيق وثيقة الموافقة الممسوحة بنجاح)` });
      setLeaveProof({ hasProof: false });
      setTimeout(() => setFeedback(null), 4000);
      setActiveTab('overview');
    } else {
      setFeedback({ type: 'error', text: res.message });
    }
  };

  // Handle Permanence Submit
  const handlePermanenceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!permProof.hasProof || !permProof.proofDataUrl) {
      setFeedback({
        type: 'error',
        text: 'تنبيه إداري إلزامي: يجب إرفاق سند المداومة الممسوح ضوئياً والمؤشر من طرف الإدارة لتأكيد الإضافة.',
      });
      return;
    }

    recordPermanence(employee.id, permDays, permDate, permNote, {
      hasProof: true,
      proofDocId: permProof.proofDocId,
      proofTitle: permProof.proofTitle || `سند مداومة وموافقة رسمية (${permDate})`,
      proofDataUrl: permProof.proofDataUrl,
    });
    setFeedback({ type: 'success', text: `تم تسجيل المداومة بنجاح وإضافة ${permDays} يوم وتوثيق سند الإثبات بالملف.` });
    setPermProof({ hasProof: false });
    setTimeout(() => setFeedback(null), 4000);
    setActiveTab('overview');
  };

  // Handle attaching proof to an existing transaction
  const handleSaveRetroProof = (txId: string) => {
    if (!retroProof.hasProof || !retroProof.proofDataUrl) {
      setFeedback({ type: 'error', text: 'يرجى التقاط أو رفع وثيقة الإثبات الممسوحة أولاً.' });
      return;
    }

    attachProofToTransaction(employee.id, txId, {
      proofDocId: retroProof.proofDocId,
      proofTitle: retroProof.proofTitle || 'موافقة وتأشيرة الإدارة المؤكدة',
      proofDataUrl: retroProof.proofDataUrl,
      proofCategory: 'موافقة المسؤول المباشر',
    });

    setFeedback({ type: 'success', text: 'تم إرفاق وتوثيق وثيقة الموافقة الممسوحة بالعملية بنجاح ✅' });
    setAttachingProofTx(null);
    setRetroProof({ hasProof: false });
    setTimeout(() => setFeedback(null), 3500);
  };

  // Handle Backlog Submit
  const handleBacklogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addBacklog(employee.id, backlogDays, backlogYear, backlogNote);
    setFeedback({ type: 'success', text: `تمت إضافة ${backlogDays} يوم مخلفات لسنة ${backlogYear} بنجاح.` });
    setTimeout(() => setFeedback(null), 4000);
    setActiveTab('overview');
  };

  // Handle Manual Adjust Submit
  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const delta = adjustIsAdd ? Math.abs(adjustDelta) : -Math.abs(adjustDelta);
    adjustBalance(employee.id, adjustType, delta, adjustNote);
    setFeedback({ type: 'success', text: `تمت تسوية الرصيد بنجاح (${delta > 0 ? '+' : ''}${delta} يوم).` });
    setTimeout(() => setFeedback(null), 4000);
    setActiveTab('overview');
  };

  // Handle Edit Employee Submit (Including balances)
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateEmployeeBalancesAndInfo(employee.id, {
      fullName: editName.trim(),
      rank: editRank.trim(),
      department: editDept.trim(),
      status: editStatus,
      annualLeave: Math.max(0, Number(editAnnual) || 0),
      compensatoryLeave: Math.max(0, Number(editComp) || 0),
      additions: Math.max(0, Number(editAdditions) || 0),
      exceptionalLeave: Math.min(10, Math.max(0, Number(editExceptional) || 0)),
      maternityNursingHours: editNursing || undefined,
      notes: editNotes,
    });
    setFeedback({ type: 'success', text: 'تم تحديث بيانات ورصيد الموظف بنجاح وتسجيل العملية في سجل الرقابة' });
    setTimeout(() => setFeedback(null), 4000);
    setActiveTab('overview');
  };

  // Handle Delete
  const handleDelete = () => {
    if (window.confirm(`هل أنت متأكد من حذف الموظف "${employee.fullName}" من السجل؟`)) {
      deleteEmployee(employee.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden border border-slate-200 my-8">
        {/* Modal Top Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white p-5 flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-emerald-300">
              <User className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-sm font-mono">
                  رقم: {employee.id}
                </span>
                <h2 className="text-lg sm:text-xl font-bold">{employee.fullName}</h2>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                {employee.rank} • {employee.department || 'كلية الرياضيات وعلوم المادة'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenPrint(employee)}
              id="modal-print-btn"
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl border border-emerald-500 shadow-xs transition-colors cursor-pointer"
              title="طباعة رخصة العطلة الرسمية (FOR.GRH.010)"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>رخصة عطلة (A4) 📄</span>
            </button>

            <button
              onClick={() => {
                if (onOpenScanner) {
                  onOpenScanner(employee);
                } else {
                  setActiveTab('documents');
                }
              }}
              id="modal-scanner-btn"
              className="inline-flex items-center gap-1.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold px-3 py-1.5 rounded-xl border border-teal-500 shadow-xs transition-colors cursor-pointer"
              title="استنساخ ومسح أوراق الموظف ضوئياً عبر الكاميرا أو الحاسوب"
            >
              <Camera className="w-3.5 h-3.5 text-teal-200" />
              <span>استنساخ ضوئي 📸</span>
            </button>

            <button
              onClick={onClose}
              id="modal-close-btn"
              className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Balance Highlights Row */}
        <div className="grid grid-cols-5 bg-slate-50 border-b border-slate-200 divide-x divide-slate-200 text-center py-3">
          <div className="px-2">
            <span className="text-[11px] text-slate-500 block">العطلة السنوية</span>
            <span className="text-lg font-black text-emerald-700">{employee.annualLeave} يوم</span>
          </div>
          <div className="px-2">
            <span className="text-[11px] text-slate-500 block">العطلة التعويضية</span>
            <span className="text-lg font-black text-amber-700">{employee.compensatoryLeave} يوم</span>
          </div>
          <div className="px-2">
            <span className="text-[11px] text-slate-500 block">إضافات / مخلفات</span>
            <span className="text-lg font-black text-blue-700">{employee.additions || 0} يوم</span>
          </div>
          <div className="px-2">
            <span className="text-[11px] text-slate-500 block">العطلة الاستثنائية</span>
            <span className="text-lg font-black text-slate-700">{employee.exceptionalLeave} يوم</span>
          </div>
          <div className="px-2 bg-teal-50/50">
            <span className="text-[11px] text-teal-800 font-bold block">مجموع الباقي</span>
            <span className="text-lg font-black text-teal-900">{employee.totalRemaining} يوم</span>
          </div>
        </div>

        {/* Feedback Alert */}
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

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 px-5 pt-3 overflow-x-auto gap-2 text-xs font-bold">
          <button
            onClick={() => setActiveTab('overview')}
            id="tab-modal-overview"
            className={`pb-2.5 px-3 border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'overview'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            الملف والسجل
          </button>

          <button
            onClick={() => setActiveTab('take_leave')}
            id="tab-modal-take-leave"
            className={`pb-2.5 px-3 border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'take_leave'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            تسجيل استهلاك عطلة
          </button>

          <button
            onClick={() => setActiveTab('add_permanence')}
            id="tab-modal-add-perm"
            className={`pb-2.5 px-3 border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'add_permanence'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            تسجيل مداومة (+2 يوم)
          </button>

          <button
            onClick={() => setActiveTab('add_backlog')}
            id="tab-modal-add-backlog"
            className={`pb-2.5 px-3 border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'add_backlog'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            إضافة مخلفات سابقة
          </button>

          <button
            onClick={() => setActiveTab('adjust')}
            id="tab-modal-adjust"
            className={`pb-2.5 px-3 border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'adjust'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            تسوية يدوية
          </button>

          <button
            onClick={() => setActiveTab('edit')}
            id="tab-modal-edit"
            className={`pb-2.5 px-3 border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'edit'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            تعديل البيانات
          </button>

          <button
            onClick={() => setActiveTab('documents')}
            id="tab-modal-documents"
            className={`pb-2.5 px-3 border-b-2 whitespace-nowrap cursor-pointer transition-colors flex items-center gap-1.5 ${
              activeTab === 'documents'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>الأرشيف الضوئي للأوراق ({employeeDocs.length}) 📸</span>
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="p-5 max-h-[480px] overflow-y-auto">
          {/* TAB 1: OVERVIEW & HISTORY */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Detailed Notes / Status Info */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <h4 className="text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-emerald-600" />
                  <span>الملاحظات الرسمية وسجل الترحيل:</span>
                </h4>
                <p className="text-xs text-slate-700 leading-relaxed font-mono whitespace-pre-wrap bg-white p-2.5 rounded-lg border border-slate-200">
                  {employee.notes || 'لا توجد ملاحظات مسجلة حالياً.'}
                </p>

                {employee.maternityNursingHours && (
                  <div className="mt-2 text-xs bg-rose-50 text-rose-800 p-2 rounded-lg border border-rose-200 font-medium">
                    ساعات الرضاعة / وضعية الأمومة: {employee.maternityNursingHours}
                  </div>
                )}
              </div>

              {/* Scanned Documents Quick Box */}
              <div className="bg-teal-50/60 p-3.5 rounded-xl border border-teal-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-teal-600 text-white flex items-center justify-center shrink-0">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-teal-950">
                      الأوراق والملفات المستنسخة ضوئياً ({employeeDocs.length} وثيقة)
                    </h4>
                    <p className="text-[11px] text-teal-700 mt-0.5">
                      {employeeDocs.length > 0
                        ? `آخر وثيقة مسجلة: ${employeeDocs[0].title}`
                        : 'لم يتم استنساخ أية وثائق للموظف حتى الآن'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('documents')}
                    className="text-xs font-bold bg-white text-teal-800 border border-teal-300 hover:bg-teal-50 px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
                  >
                    استعراض الأرشيف
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenScanner) onOpenScanner(employee);
                      else setActiveTab('documents');
                    }}
                    className="text-xs font-bold bg-teal-700 hover:bg-teal-800 text-white px-3 py-1.5 rounded-lg shadow-2xs cursor-pointer flex items-center gap-1 transition-colors"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>استنساخ ورقة 📸</span>
                  </button>
                </div>
              </div>

              {/* Transactions Log */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                  <History className="w-4 h-4 text-emerald-600" />
                  <span>سجل حركات وعمليات العطل للموظف:</span>
                </h4>

                {(!employee.transactions || employee.transactions.length === 0) ? (
                  <div className="text-center py-6 text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                    لا توجد عمليات مسجلة حتى الآن في هذه الجلسة. يتم تسجيل حركات الخصم والمداومة والمخلفات تلقائياً هنا.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {employee.transactions.map(tx => (
                      <div
                        key={tx.id}
                        className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:border-slate-300 transition-all shadow-2xs"
                      >
                        <div className="flex items-start sm:items-center gap-2.5">
                          <span
                            className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 sm:mt-0 ${
                              tx.action === 'إضافة'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {tx.action === 'إضافة' ? '+' : '-'}
                          </span>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-2 flex-wrap">
                              <span>{tx.reason}</span>
                              {tx.hasProof && tx.proofDataUrl ? (
                                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md flex items-center gap-1 border border-emerald-300">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>مرفق بوثيقة الموافقة الرسمية 📄</span>
                                </span>
                              ) : (
                                <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-md flex items-center gap-1 border border-amber-300">
                                  <AlertCircle className="w-3 h-3 text-amber-600" />
                                  <span>غير مرفق بوثيقة إثبات ⚠️</span>
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              التاريخ: <span className="font-mono text-slate-700">{tx.date}</span> • النوع: {tx.type} {tx.note && `• ${tx.note}`}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                          <div className="text-left font-black">
                            <span
                              className={
                                tx.action === 'إضافة'
                                  ? 'text-emerald-700 text-sm'
                                  : 'text-rose-700 text-sm'
                              }
                            >
                              {tx.action === 'إضافة' ? '+' : '-'}{tx.days} يوم
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {tx.hasProof && tx.proofDataUrl ? (
                              <button
                                type="button"
                                onClick={() => setViewingProofTx(tx)}
                                className="px-2.5 py-1.5 bg-teal-50 hover:bg-teal-100 border border-teal-300 text-teal-800 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                                title="معاينة وثيقة الموافقة الممسوحة ضوئياً"
                              >
                                <Eye className="w-3.5 h-3.5 text-teal-700" />
                                <span>معاينة الإثبات 👁️</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setAttachingProofTx(tx);
                                  setRetroProof({ hasProof: false });
                                }}
                                className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                                title="إرفاق وثيقة ممسوحة تثبت موافقة الإدارة"
                              >
                                <Camera className="w-3.5 h-3.5 text-amber-700" />
                                <span>إرفاق الإثبات 📎</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: TAKE LEAVE (خصم عطلة) */}
          {activeTab === 'take_leave' && (
            <form onSubmit={handleTakeLeaveSubmit} className="space-y-4">
              <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200 text-xs text-emerald-900">
                سيتم خصم عدد الأيام المطلوبة من الرصيد وتوثيق تاريخ العطلة في سجل الموظف وإصدار السند فوراً.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">نوع العطلة المراد خصمها:</label>
                  <select
                    value={leaveType}
                    onChange={e => setLeaveType(e.target.value as LeaveType)}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="سنوية">عطلة سنوية (الرصيد المتاح: {employee.annualLeave} يوم)</option>
                    <option value="تعويضية">عطلة تعويضية / مداومة (الرصيد المتاح: {employee.compensatoryLeave} يوم)</option>
                    <option value="استثنائية">عطلة استثنائية مدفوعة الأجر (الرصيد المتاح: {employee.exceptionalLeave} يوم)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">عدد الأيام المطلوبة:</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={leaveDays}
                    onChange={e => setLeaveDays(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">تاريخ بداية العطلة:</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">تاريخ نهاية العطلة:</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">سبب العطلة أو نوع المناسبة:</label>
                  <input
                    type="text"
                    value={leaveReason}
                    onChange={e => setLeaveReason(e.target.value)}
                    placeholder="عطلة صيفية، زواج، ختان، راحة..."
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">الموظف المستخلف (اختياري):</label>
                  <input
                    type="text"
                    value={interimEmployee}
                    onChange={e => setInterimEmployee(e.target.value)}
                    placeholder="اسم الموظف الذي ينوب عنه..."
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Mandatory Scanned Proof Attachment */}
              <ScanProofAttachment
                employeeId={employee.id}
                employeeName={employee.fullName}
                value={leaveProof}
                onChange={setLeaveProof}
                required={true}
                titleLabel="وثيقة إثبات موافقة وتأشيرة المسؤول المباشر (مسح ضوئي 📸)"
                description="إلزامـي: التقط صورة للرخصة الورقية الموقعة أو ارفع الملف الممسوح ضوئياً لإثبات الموافقة وتفادي أي التباس."
              />

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className="px-3.5 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  id="submit-take-leave-btn"
                  className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  تأكيد الخصم بالوثيقة المرفقة وتحديث الرصيد
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: RECORD PERMANENCE (تسجيل مداومة) */}
          {activeTab === 'add_permanence' && (
            <form onSubmit={handlePermanenceSubmit} className="space-y-4">
              <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200 text-xs text-amber-900">
                تمنح المداومة بالجامعة حق الاستفادة من يومين (02) تعويضي عن كل يوم مداومة نظامية مسجلة.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">عدد الأيام التعويضية المستحقة:</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={permDays}
                    onChange={e => setPermDays(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">المعتاد: 02 يومان للمداومة الواحدة</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">تاريخ يوم المداومة الفعلية:</label>
                  <input
                    type="date"
                    value={permDate}
                    onChange={e => setPermDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">بيان المداومة أو المصلحة:</label>
                  <input
                    type="text"
                    value={permNote}
                    onChange={e => setPermNote(e.target.value)}
                    placeholder="مداومة عطلة نهاية الأسبوع، مداومة شهر رمضان، مداومة الصيف..."
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Mandatory Scanned Proof Attachment */}
              <ScanProofAttachment
                employeeId={employee.id}
                employeeName={employee.fullName}
                value={permProof}
                onChange={setPermProof}
                required={true}
                titleLabel="سند المداومة المؤشر والموقع من طرف الإدارة (مسح ضوئي 📸)"
                description="إلزامـي: التقط صورة لجدول أو سند المداومة المؤشر من رئيس المصلحة أو عميد الكلية لتفادي أي خطأ."
              />

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className="px-3.5 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  id="submit-permanence-btn"
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  إضافة أيام المداومة بالوثيقة المرفقة
                </button>
              </div>
            </form>
          )}

          {/* TAB 4: ADD BACKLOG (إضافة مخلفات سابقة) */}
          {activeTab === 'add_backlog' && (
            <form onSubmit={handleBacklogSubmit} className="space-y-4">
              <div className="bg-indigo-50/70 p-3 rounded-xl border border-indigo-200 text-xs text-indigo-900">
                تسجيل مخلفات العطل السنوية للسنوات السابقة المتبقية (2022، 2023، 2024، 2025) وترحيلها لرصيد الموظف.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">عدد الأيام المرحلة:</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={backlogDays}
                    onChange={e => setBacklogDays(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">عن سنة:</label>
                  <select
                    value={backlogYear}
                    onChange={e => setBacklogYear(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value={2025}>سنة 2025</option>
                    <option value={2024}>سنة 2024</option>
                    <option value={2023}>سنة 2023</option>
                    <option value={2022}>سنة 2022</option>
                    <option value={2021}>سنة 2021</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ملاحظة الترحيل:</label>
                  <input
                    type="text"
                    value={backlogNote}
                    onChange={e => setBacklogNote(e.target.value)}
                    placeholder="باقي من ع/س بناء على طلب أو تسوية..."
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className="px-3.5 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  id="submit-backlog-btn"
                  className="px-4 py-2 rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  إضافة المخلفات السابقة
                </button>
              </div>
            </form>
          )}

          {/* TAB 5: MANUAL ADJUST */}
          {activeTab === 'adjust' && (
            <form onSubmit={handleAdjustSubmit} className="space-y-4">
              <div className="bg-slate-100 p-3 rounded-xl border border-slate-200 text-xs text-slate-800">
                تسوية يدوية مباشرة لإصلاح خطأ حسابي، تصحيح رصيد، أو تطبيق قرار إداري خاص.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">نوع الرصيد المراد تسويته:</label>
                  <select
                    value={adjustType}
                    onChange={e => setAdjustType(e.target.value as any)}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-slate-500"
                  >
                    <option value="annual">عطلة سنوية</option>
                    <option value="compensatory">عطلة تعويضية</option>
                    <option value="exceptional">عطلة استثنائية</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">طبيعة التعديل:</label>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setAdjustIsAdd(true)}
                      className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                        adjustIsAdd
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white text-slate-700 border-slate-300'
                      }`}
                    >
                      + إضافة أيام
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdjustIsAdd(false)}
                      className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                        !adjustIsAdd
                          ? 'bg-rose-600 text-white border-rose-600'
                          : 'bg-white text-slate-700 border-slate-300'
                      }`}
                    >
                      - إنقاص / خصم
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">الكمية (بالأيام):</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={adjustDelta}
                    onChange={e => setAdjustDelta(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">سبب التسوية / رقم الإرسالية:</label>
                  <input
                    type="text"
                    value={adjustNote}
                    onChange={e => setAdjustNote(e.target.value)}
                    placeholder="تصحيح خطأ حسابي، قرار تسوية..."
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-slate-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className="px-3.5 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  id="submit-adjust-btn"
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  تطبيق التسوية
                </button>
              </div>
            </form>
          )}

          {/* TAB 6: EDIT PROFILE */}
          {activeTab === 'edit' && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">الاسم واللقب:</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    required
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-emerald-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">الرتبة:</label>
                  <input
                    type="text"
                    value={editRank}
                    onChange={e => setEditRank(e.target.value)}
                    required
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">المصلحة / القسم التابع له:</label>
                  <input
                    type="text"
                    value={editDept}
                    onChange={e => setEditDept(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">الحالة الإدارية:</label>
                  <select
                    value={editStatus}
                    onChange={e => setEditStatus(e.target.value as any)}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="نشط">نشط في الخدمة</option>
                    <option value="في عطلة">في عطلة حالياً</option>
                    <option value="وضع تحت التصرف">وضع تحت التصرف</option>
                    <option value="محول">محول خارج الكلية</option>
                    <option value="عطلة أمومة">عطلة أمومة</option>
                    <option value="عطلة مرضية">عطلة مرضية طويلة</option>
                    <option value="وفاة">وفاة (رحمه الله)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ساعات الرضاعة / عطلة أمومة:</label>
                  <input
                    type="text"
                    value={editNursing}
                    onChange={e => setEditNursing(e.target.value)}
                    placeholder="مثال: عطلة أمومة من تاريخ... أو ساعتين رضاعة يومياً حتى تاريخ..."
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Direct Leave Balances Editing Box */}
                <div className="sm:col-span-2 bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-emerald-700" />
                      تعديل أرصدة العطل المباشرة (أيام):
                    </span>
                    <span className="text-[11px] text-emerald-700 font-medium">
                      تحديث فوري للأرصدة
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        العطلة السنوية
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="120"
                        value={editAnnual}
                        onChange={e => setEditAnnual(Number(e.target.value) || 0)}
                        className="w-full border border-slate-300 rounded-md p-1.5 text-center text-sm font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        العطلة التعويضية
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="90"
                        value={editComp}
                        onChange={e => setEditComp(Number(e.target.value) || 0)}
                        className="w-full border border-slate-300 rounded-md p-1.5 text-center text-sm font-bold text-teal-800 focus:ring-2 focus:ring-teal-500"
                      />
                    </div>

                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        الإضافات والمخلفات
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="90"
                        value={editAdditions}
                        onChange={e => setEditAdditions(Number(e.target.value) || 0)}
                        className="w-full border border-slate-300 rounded-md p-1.5 text-center text-sm font-bold text-amber-800 focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  {/* Calculated Total Ribbon */}
                  <div className="bg-emerald-800 text-white px-3.5 py-2.5 rounded-lg flex items-center justify-between">
                    <span className="text-xs font-semibold">
                      مجموع رصيد العطل المتبقي المحسوب:
                    </span>
                    <span className="text-base font-extrabold">
                      {Number(editAnnual) + Number(editComp) + Number(editAdditions)} يوماً
                    </span>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">الملاحظات العامة وسجل الترحيل:</label>
                  <textarea
                    rows={3}
                    value={editNotes}
                    onChange={e => setEditNotes(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                <button
                  type="button"
                  onClick={handleDelete}
                  className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-800 text-xs font-bold cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>حذف الموظف نهائياً</span>
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('overview')}
                    className="px-3.5 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    id="save-profile-btn"
                    className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>حفظ التعديلات</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* TAB 7: SCANNED DOCUMENTS ARCHIVE */}
          {activeTab === 'documents' && (
            <div className="space-y-4">
              {/* Header Action Bar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-4 bg-teal-50/70 border border-teal-200 rounded-2xl">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Camera className="w-4 h-4 text-teal-700" />
                    <span>الأرشيف والملف الضوئي: {employee.fullName}</span>
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    الوثائق والأوراق الرسمية المستنسخة ضوئياً والمحفوظة في قاعدة بيانات الكلية المحلية ({employeeDocs.length} وثيقة)
                  </p>
                </div>

                <button
                  onClick={() => {
                    if (onOpenScanner) {
                      onOpenScanner(employee);
                    }
                  }}
                  id="tab-scan-new-doc-btn"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-700 to-emerald-700 hover:from-teal-800 hover:to-emerald-800 text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-xs transition-transform active:scale-95 cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>استنساخ ورقة جديدة ضوئياً 📸</span>
                </button>
              </div>

              {/* Document List */}
              {employeeDocs.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl space-y-3">
                  <div className="w-14 h-14 bg-teal-100 text-teal-800 rounded-full flex items-center justify-center mx-auto">
                    <FolderOpen className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">
                      لا توجد أوراق أو وثائق مستنسخة ضوئياً لهذا الموظف بعد
                    </h4>
                    <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
                      يمكن لمصلحة المستخدمين استنساخ رخص العطل، الشهادات الطبية، مقررات المداومة، أو أي وثائق ثبوتية ضوئياً عبر كاميرا الحاسوب أو الهاتف وحفظها في ملف الموظف.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (onOpenScanner) {
                        onOpenScanner(employee);
                      }
                    }}
                    className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs cursor-pointer mt-2"
                  >
                    <Camera className="w-4 h-4" />
                    <span>بدء الاستنساخ الضوئي الآن</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {employeeDocs.map(doc => (
                    <div
                      key={doc.id}
                      className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs hover:shadow-xs transition-all flex flex-col group"
                    >
                      {/* Thumbnail Container */}
                      <div
                        onClick={() => setZoomDoc(doc)}
                        className="h-36 bg-slate-100 relative cursor-pointer overflow-hidden flex items-center justify-center"
                      >
                        <img
                          src={doc.imageData}
                          alt={doc.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-2">
                          <Eye className="w-5 h-5" />
                          <span className="text-xs font-bold">معاينة وتكبير</span>
                        </div>
                        <span className="absolute top-2 right-2 bg-slate-900/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-xs">
                          {doc.category}
                        </span>
                      </div>

                      {/* Details */}
                      <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                        <div>
                          <h4 className="font-bold text-slate-900 text-xs line-clamp-1" title={doc.title}>
                            {doc.title}
                          </h4>
                          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                            <span>{new Date(doc.createdAt).toLocaleDateString('ar-DZ')}</span>
                            <span>{Math.round(doc.fileSizeBytes / 1024)} ك.ب</span>
                          </div>
                          {doc.notes && (
                            <p className="text-[10px] text-slate-600 line-clamp-1 mt-1 bg-slate-50 p-1 rounded-sm">
                              {doc.notes}
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setZoomDoc(doc)}
                              title="معاينة بكامل الشاشة"
                              className="p-1 rounded-md text-slate-600 hover:bg-slate-100 cursor-pointer"
                            >
                              <Maximize2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => {
                                const w = window.open('', '_blank');
                                if (w) {
                                  w.document.write(`
                                    <html>
                                      <head>
                                        <title>${doc.title} - جامعة قاصدي مرباح ورقلة</title>
                                        <style>
                                          body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #fff; }
                                          img { max-width: 95vw; max-height: 95vh; object-fit: contain; }
                                          @media print { body { padding: 0; } img { width: 100%; height: auto; } }
                                        </style>
                                      </head>
                                      <body>
                                        <img src="${doc.imageData}" onload="window.print();" />
                                      </body>
                                    </html>
                                  `);
                                  w.document.close();
                                }
                              }}
                              title="طباعة الورقة مباشرة"
                              className="p-1 rounded-md text-slate-600 hover:bg-slate-100 cursor-pointer"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>

                            <a
                              href={doc.imageData}
                              download={`${employee.fullName}_${doc.title}.jpg`}
                              title="تحميل الصورة"
                              className="p-1 rounded-md text-slate-600 hover:bg-slate-100 cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          </div>

                          <button
                            onClick={async () => {
                              if (confirm(`هل أنت متأكد من حذف الوثيقة «${doc.title}»؟`)) {
                                await deleteScannedDocument(doc.id);
                                loadDocs();
                              }
                            }}
                            title="حذف الوثيقة"
                            className="p-1 rounded-md text-rose-500 hover:bg-rose-50 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Zoom Lightbox Modal */}
        {zoomDoc && (
          <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-scaleUp">
              {/* Header */}
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-600 text-white text-xs font-bold px-2 py-0.5 rounded-md">
                    {zoomDoc.category}
                  </span>
                  <h3 className="font-bold text-sm">{zoomDoc.title}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const w = window.open('', '_blank');
                      if (w) {
                        w.document.write(`
                          <html>
                            <head><title>${zoomDoc.title}</title><style>body{margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;}img{max-width:100%;height:auto;}@media print{img{width:100%;}}</style></head>
                            <body><img src="${zoomDoc.imageData}" onload="window.print();" /></body>
                          </html>
                        `);
                        w.document.close();
                      }
                    }}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>طباعة</span>
                  </button>
                  <a
                    href={zoomDoc.imageData}
                    download={`${zoomDoc.title}.jpg`}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>تحميل</span>
                  </a>
                  <button
                    onClick={() => setZoomDoc(null)}
                    className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Image Canvas View */}
              <div className="p-4 flex-1 overflow-auto bg-slate-100 flex items-center justify-center min-h-[400px]">
                <img
                  src={zoomDoc.imageData}
                  alt={zoomDoc.title}
                  className="max-h-[65vh] object-contain rounded-lg shadow-md border border-slate-300"
                />
              </div>

              {/* Meta */}
              <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs text-slate-600">
                <span>تاريخ الاستنساخ: {new Date(zoomDoc.createdAt).toLocaleString('ar-DZ')}</span>
                <span>الحجم: {Math.round(zoomDoc.fileSizeBytes / 1024)} كيلوبايت</span>
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="bg-slate-100 px-5 py-3 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
          <div>
            جامعة قاصدي مرباح ورقلة — كلية الرياضيات وعلوم المادة
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
          >
            إغلاق
          </button>
        </div>

        {/* Proof Viewer Lightbox Modal */}
        {viewingProofTx && viewingProofTx.proofDataUrl && (
          <ProofViewerModal
            isOpen={true}
            onClose={() => setViewingProofTx(null)}
            title={viewingProofTx.proofTitle || 'وثيقة الموافقة الممسوحة ضوئياً'}
            imageDataUrl={viewingProofTx.proofDataUrl}
            employeeName={employee.fullName}
            date={viewingProofTx.date}
            category={viewingProofTx.proofCategory || 'موافقة المسؤول المباشر'}
          />
        )}

        {/* Retroactive Proof Attachment Modal for existing transactions */}
        {attachingProofTx && (
          <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-xl w-full p-5 shadow-2xl text-right animate-scaleUp" dir="rtl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
                <div className="flex items-center gap-2">
                  <Camera className="w-5 h-5 text-teal-700" />
                  <h3 className="font-bold text-sm text-slate-900">
                    إرفاق وتوثيق وثيقة الإثبات للعملية: {attachingProofTx.reason}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAttachingProofTx(null);
                    setRetroProof({ hasProof: false });
                  }}
                  className="p-1 rounded-md text-slate-400 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-3 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
                قاعدة إدارية صارمة: يجب أن يكون لكل عملية خصم أو مداومة أو ترخيص سند رسمي ممسوح ضوئياً موقع ومؤشر من طرف المسؤول المباشر لضمان الشفافية.
              </div>

              <ScanProofAttachment
                employeeId={employee.id}
                employeeName={employee.fullName}
                value={retroProof}
                onChange={setRetroProof}
                required={true}
                titleLabel="التقط صورة للوثيقة أو ارفعها من الماسح الضوئي"
                description="صورة واضحة للرخصة الموقعة، التقرير، أو سند المداومة الرسمي."
              />

              <div className="mt-4 pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAttachingProofTx(null);
                    setRetroProof({ hasProof: false });
                  }}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveRetroProof(attachingProofTx.id)}
                  disabled={!retroProof.hasProof || !retroProof.proofDataUrl}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold text-white cursor-pointer shadow-xs ${
                    retroProof.hasProof && retroProof.proofDataUrl
                      ? 'bg-teal-700 hover:bg-teal-800'
                      : 'bg-slate-300 cursor-not-allowed'
                  }`}
                >
                  حفظ وتأكيد إرفاق الوثيقة
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
