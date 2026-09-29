import React, { useState } from 'react';
import { X, Printer, Download, ZoomIn, ZoomOut, RotateCcw, CheckCircle2, ShieldCheck, Calendar, User, Tag } from 'lucide-react';
import { LeaveTransaction } from '../types';

interface ProofViewerModalProps {
  transaction: LeaveTransaction | null;
  employeeName?: string;
  employeeRank?: string;
  onClose: () => void;
}

export const ProofViewerModal: React.FC<ProofViewerModalProps> = ({
  transaction,
  employeeName,
  employeeRank,
  onClose,
}) => {
  const [zoom, setZoom] = useState<number>(100);

  if (!transaction || !transaction.proofDataUrl) return null;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('يرجى السماح بالنوافذ المنبثقة لطباعة الوثيقة');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
        <head>
          <meta charset="utf-8">
          <title>وثيقة إثبات وموافقة رسمية - ${employeeName || ''}</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              margin: 0;
              padding: 20px;
              color: #1e293b;
              direction: rtl;
            }
            .header-box {
              border-bottom: 2px solid #0f766e;
              padding-bottom: 12px;
              margin-bottom: 15px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .title {
              font-size: 18px;
              font-weight: bold;
              color: #0f766e;
            }
            .meta {
              font-size: 12px;
              color: #475569;
              line-height: 1.6;
            }
            .image-container {
              text-align: center;
              margin-top: 15px;
            }
            img {
              max-width: 100%;
              max-height: 85vh;
              object-fit: contain;
              border: 1px solid #cbd5e1;
              box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
            }
            .footer-stamp {
              margin-top: 15px;
              padding: 10px;
              background-color: #f0fdf4;
              border: 1px dashed #16a34a;
              border-radius: 6px;
              font-size: 11px;
              color: #15803d;
              display: flex;
              justify-content: space-between;
            }
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header-box">
            <div>
              <div class="title">وثيقة إثبات وموافقة رسمية ممسوحة ضوئياً 📄</div>
              <div class="meta">
                الموظف: <strong>${employeeName || 'غير محدد'}</strong> ${employeeRank ? `(${employeeRank})` : ''} | 
                البيان: <strong>${transaction.reason}</strong> | 
                تاريخ العملية: ${transaction.date} | 
                الأيام: ${transaction.days} يوم (${transaction.action})
              </div>
            </div>
          </div>
          <div class="image-container">
            <img src="${transaction.proofDataUrl}" alt="وثيقة الإثبات الممسوحة" />
          </div>
          <div class="footer-stamp">
            <span>✅ إثبات رسمي مؤشر ومعتمد إدارياً في منظومة إدارة عطل كلية المحروقات - جامعة قاصدي مرباح ورقلة</span>
            <span>تاريخ وتوقيت المعاينة: ${new Date().toLocaleString('ar-DZ')}</span>
          </div>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = transaction.proofDataUrl!;
    link.download = `اثبات_موافقة_${employeeName ? employeeName.replace(/\s+/g, '_') : 'موظف'}_${transaction.date}.jpg`;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden text-right" dir="rtl">
        {/* Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-teal-800 to-emerald-900 text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-700/80 border border-teal-500/50 flex items-center justify-center text-white">
              <ShieldCheck className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <span>{transaction.proofTitle || 'وثيقة إثبات وموافقة المسؤول المباشر'}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-400/40">
                  مؤشرة رسمياً
                </span>
              </h3>
              <p className="text-[11px] text-teal-200">
                {employeeName ? `الموظف: ${employeeName}` : ''} {employeeRank ? `(${employeeRank})` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Zoom Controls */}
            <div className="flex items-center bg-teal-950/60 rounded-lg p-1 border border-teal-700/50 text-white text-xs ml-2">
              <button
                type="button"
                onClick={() => setZoom(prev => Math.max(50, prev - 20))}
                title="تصغير"
                className="p-1 hover:bg-teal-800/80 rounded cursor-pointer"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="px-2 font-mono text-[11px] min-w-[42px] text-center">{zoom}%</span>
              <button
                type="button"
                onClick={() => setZoom(prev => Math.min(250, prev + 20))}
                title="تكبير"
                className="p-1 hover:bg-teal-800/80 rounded cursor-pointer"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setZoom(100)}
                title="إعادة ضبط الحجم"
                className="p-1 hover:bg-teal-800/80 rounded cursor-pointer ml-0.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              id="print-proof-doc-btn"
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">طباعة الوثيقة</span>
            </button>

            {/* Download Button */}
            <button
              type="button"
              onClick={handleDownload}
              id="download-proof-doc-btn"
              className="px-3 py-1.5 bg-teal-700 hover:bg-teal-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">تحميل</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              id="close-proof-viewer-modal"
              className="w-8 h-8 rounded-lg bg-teal-950/60 hover:bg-rose-600/80 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Transaction Summary Sub-bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-2.5 flex flex-wrap items-center justify-between text-xs gap-3">
          <div className="flex items-center gap-4 text-slate-700">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-teal-600" />
              تاريخ العملية: <strong className="font-mono text-slate-900">{transaction.date}</strong>
            </span>
            <span className="flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-teal-600" />
              نوع العملية: <strong className="text-slate-900">{transaction.type}</strong>
            </span>
            <span className="flex items-center gap-1">
              المدة: <strong className="text-emerald-700 font-bold">{transaction.action === 'إضافة' ? '+' : '-'}{transaction.days} يوم</strong>
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-emerald-800 bg-emerald-100/70 px-2.5 py-1 rounded-md text-[11px] font-bold border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>{transaction.verifiedBy || 'موافقة وتأشيرة المسؤول المباشر / الإدارة'}</span>
          </div>
        </div>

        {/* Image Preview Canvas */}
        <div className="flex-1 bg-slate-900/90 p-4 overflow-auto flex items-center justify-center min-h-[380px] max-h-[65vh]">
          <div
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center center', transition: 'transform 0.15s ease-out' }}
            className="flex items-center justify-center"
          >
            <img
              src={transaction.proofDataUrl}
              alt="وثيقة الموافقة الممسوحة"
              className="max-h-[60vh] max-w-full rounded-lg shadow-2xl object-contain bg-white border border-slate-700"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="text-slate-500 text-[11px]">
            {transaction.attachedAt ? `تاريخ التوثيق والمسح الضوئي: ${new Date(transaction.attachedAt).toLocaleString('ar-DZ')}` : 'تم حفظ الوثيقة في الأرشيف الضوئي الرقمي للكلية.'}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold cursor-pointer transition-colors"
          >
            إغلاق المعاينة
          </button>
        </div>
      </div>
    </div>
  );
};
