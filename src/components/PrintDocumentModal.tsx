import React, { useState } from 'react';
import { Employee } from '../types';
import { useLeaves } from '../context/LeavesContext';
import { X, Printer, FileText, CheckCheck, Stamp, Sparkles, ExternalLink, Download } from 'lucide-react';
import { UNIV_LOGO_BASE64 } from '../assets/logoBase64';
import { OfficialFooter } from './OfficialFooter';

interface PrintDocumentModalProps {
  initialEmployee?: Employee | null;
  onClose: () => void;
}

export const PrintDocumentModal: React.FC<PrintDocumentModalProps> = ({
  initialEmployee,
  onClose,
}) => {
  const { employees, logLicensePrinted } = useLeaves();

  const [selectedEmpId, setSelectedEmpId] = useState<number>(
    initialEmployee?.id || (employees.length > 0 ? employees[0].id : 1)
  );

  // Default is 'titre' which is now officially «رخصة العطلة» (FOR.GRH.010)
  const [docType, setDocType] = useState<'titre' | 'demande' | 'reprise' | 'solde' | 'recap'>('titre');

  // Custom parameters for document
  const [docLeaveType, setDocLeaveType] = useState<string>('عطلة سنوية');
  const [durationDays, setDurationDays] = useState<number>(15);
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });
  const [repriseDate, setRepriseDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().split('T')[0];
  });
  const [interimPerson, setInterimPerson] = useState<string>('زميل المصلحة');
  const [licenseNumber, setLicenseNumber] = useState<string>('........');
  const [customFunction, setCustomFunction] = useState<string>('');
  const [isBlankTemplate, setIsBlankTemplate] = useState<boolean>(false);

  const employee = employees.find(e => e.id === selectedEmpId) || employees[0];

  // Helper date formatter
  const formatArDate = (dStr: string) => {
    if (!dStr) return '';
    try {
      const [y, m, d] = dStr.split('-');
      return `${d}/${m}/${y}`;
    } catch {
      return dStr;
    }
  };

  const todayAr = new Date().toLocaleDateString('ar-DZ');

  // Generate clean standalone HTML document for high-quality printing
  const generateDocumentHtml = () => {
    const printElem = document.getElementById('official-print-document');
    const content = printElem ? printElem.innerHTML : '';
    const docTitle = docType === 'titre' 
      ? `رخصة_عطلة_${employee?.fullName || 'رسمية'}` 
      : `وثيقة_${employee?.fullName || 'رسمية'}`;

    // Collect all loaded CSS stylesheets and style tags
    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(el => el.outerHTML)
      .join('\n');

    return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${docTitle}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet">
  ${styles}
  <style>
    @page {
      size: A4 portrait;
      margin: 8mm 10mm 8mm 10mm;
    }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff !important;
      color: #000000 !important;
      font-family: 'Amiri', serif, Tahoma, Arial, sans-serif;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    img {
      max-width: 100% !important;
      height: auto !important;
      display: block !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
      image-rendering: -webkit-optimize-contrast;
    }
    svg {
      max-width: 100% !important;
      height: auto !important;
      display: block !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    .print-wrapper {
      width: 100%;
      max-width: 800px;
      margin: 0 auto;
      padding: 15px;
      background: #ffffff;
    }
    @media print {
      body { margin: 0; padding: 0; }
      .print-wrapper { max-width: 100% !important; padding: 0 !important; }
      .no-print { display: none !important; }
    }
    .print-floating-bar {
      position: sticky;
      top: 0;
      background: #064e3b;
      color: #ffffff;
      padding: 10px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      z-index: 99999;
      font-family: system-ui, -apple-system, sans-serif;
      direction: rtl;
    }
    .print-floating-bar button {
      background: #10b981;
      color: #ffffff;
      border: none;
      padding: 8px 18px;
      border-radius: 8px;
      font-weight: bold;
      cursor: pointer;
      font-size: 14px;
      transition: background 0.2s;
    }
    .print-floating-bar button:hover { background: #059669; }
    .print-floating-bar .close-btn {
      background: #475569;
      margin-right: 8px;
    }
    .print-floating-bar .close-btn:hover { background: #334155; }
  </style>
</head>
<body dir="rtl">
  <div class="print-floating-bar no-print">
    <div style="font-weight: bold; font-size: 15px;">
      كلية الرياضيات وعلوم المادة — رخصة العطلة الرسمية (A4)
    </div>
    <div style="display: flex; gap: 8px;">
      <button onclick="window.print()">🖨️ طباعة الآن (Ctrl + P)</button>
      <button class="close-btn" onclick="window.close()">إغلاق الصفحة</button>
    </div>
  </div>
  <div class="print-wrapper">
    ${content}
  </div>
  <script>
    window.addEventListener('load', function() {
      setTimeout(function() {
        try {
          window.print();
        } catch(e) {}
      }, 400);
    });
  </script>
</body>
</html>`;
  };

  // Primary Print Action: Tries clean hidden iframe first, with fallback to window.print()
  const handlePrint = () => {
    if (employee && docType === 'titre') {
      logLicensePrinted(employee, docLeaveType, durationDays, startDate, endDate);
    }
    try {
      let printIframe = document.getElementById('official-print-iframe') as HTMLIFrameElement;
      if (!printIframe) {
        printIframe = document.createElement('iframe');
        printIframe.id = 'official-print-iframe';
        printIframe.style.position = 'fixed';
        printIframe.style.right = '0';
        printIframe.style.bottom = '0';
        printIframe.style.width = '0px';
        printIframe.style.height = '0px';
        printIframe.style.border = 'none';
        document.body.appendChild(printIframe);
      }

      const doc = printIframe.contentDocument || printIframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(generateDocumentHtml());
        doc.close();

        setTimeout(() => {
          try {
            printIframe.contentWindow?.focus();
            printIframe.contentWindow?.print();
          } catch (err) {
            console.warn('Iframe printing caught error, falling back to direct print:', err);
            window.print();
          }
        }, 350);
        return;
      }
    } catch (e) {
      console.warn('Failed to print via iframe, falling back to window.print()', e);
    }

    // Direct fallback
    window.print();
  };

  // Secondary Print Action: Open in clean separate tab (bypasses any iframe restrictions)
  const handleOpenNewWindow = () => {
    const html = generateDocumentHtml();
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const newWin = window.open(url, '_blank');
    if (!newWin) {
      // If popup blocker intervened, trigger via virtual anchor link
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  // Download document as standalone HTML file (can be opened & printed on any PC)
  const handleDownloadHTML = () => {
    const html = generateDocumentHtml();
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `رخصة_عطلة_${employee?.fullName?.replace(/\s+/g, '_') || 'موظف'}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-200 my-4 print:border-none print:shadow-none print:m-0 print:w-full print:max-w-none flex flex-col">
        
        {/* Controls Header - Hidden on Print */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex flex-wrap justify-between items-center gap-3 print:hidden border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-black text-base sm:text-lg">طباعة واستخراج «رخصة العطلة» والوثائق الرسمية</h2>
              <p className="text-xs text-slate-300">
                الوثيقة الرسمية المعتمدة بكلية الرياضيات وعلوم المادة (النموذج الرسمي FOR.GRH.010)
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handlePrint}
              id="trigger-print-btn"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-black px-4 py-2.5 rounded-xl shadow-md transition-all cursor-pointer active:scale-95"
              title="إرسال أمر الطباعة المباشر إلى الطابعة الموصولة"
            >
              <Printer className="w-4 h-4" />
              <span>أمر الطباعة المباشر (A4) 🖨️</span>
            </button>

            <button
              onClick={handleOpenNewWindow}
              id="open-print-tab-btn"
              className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white text-xs sm:text-sm font-bold px-3.5 py-2.5 rounded-xl border border-slate-700 transition-all cursor-pointer"
              title="فتح الوثيقة في صفحة مستقلة جديدة للطباعة (يحل مشكلة النوافذ المضمنة)"
            >
              <ExternalLink className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">فتح في صفحة مستقلة</span>
              <span className="sm:hidden">صفحة مستقلة</span>
            </button>

            <button
              onClick={handleDownloadHTML}
              id="download-print-doc-btn"
              className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white text-xs sm:text-sm font-bold px-3.5 py-2.5 rounded-xl border border-slate-700 transition-all cursor-pointer"
              title="حفظ نسخة رسمية من الوثيقة على جهازك للطباعة في أي وقت"
            >
              <Download className="w-4 h-4 text-amber-300" />
              <span className="hidden sm:inline">تنزيل للطباعة</span>
              <span className="sm:hidden">تنزيل</span>
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Configuration Bar - Hidden on Print */}
        <div className="bg-slate-50 p-4 border-b border-slate-200 space-y-3 print:hidden text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block font-black text-slate-800 mb-1">نوع الوثيقة الإدارية:</label>
              <select
                value={docType}
                onChange={e => setDocType(e.target.value as any)}
                className="w-full border-2 border-emerald-600 rounded-xl p-2 font-bold bg-white text-slate-900"
              >
                <option value="titre">رخصة العطلة الرسمية (FOR.GRH.010)</option>
                <option value="demande">استمارة طلب عطلة (Demande de Congé)</option>
                <option value="reprise">محضر استئناف العمل (PV de Reprise)</option>
                <option value="solde">كشف رصيد عطل فردي (Fiche de Solde)</option>
                <option value="recap">جدول العطل الشامل للكلية (État Récapitulatif)</option>
              </select>
            </div>

            {docType !== 'recap' && (
              <div>
                <label className="block font-black text-slate-800 mb-1">الموظف المعني:</label>
                <select
                  value={selectedEmpId}
                  onChange={e => setSelectedEmpId(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded-xl p-2 font-bold bg-white text-slate-900"
                >
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.id} - {emp.fullName} ({emp.rank})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {docType === 'titre' && (
              <>
                <div>
                  <label className="block font-black text-slate-800 mb-1">رقم رخصة العطلة:</label>
                  <input
                    type="text"
                    value={licenseNumber}
                    onChange={e => setLicenseNumber(e.target.value)}
                    placeholder="مثال: 025"
                    className="w-full border border-slate-300 rounded-xl p-2 font-bold bg-white text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-black text-slate-800 mb-1">الوظيفة (إن وجدت):</label>
                  <input
                    type="text"
                    value={customFunction}
                    onChange={e => setCustomFunction(e.target.value)}
                    placeholder={employee?.department || 'موظف بالكلية'}
                    className="w-full border border-slate-300 rounded-xl p-2 font-bold bg-white text-slate-900"
                  />
                </div>
              </>
            )}

            {docType !== 'recap' && docType !== 'solde' && docType !== 'titre' && (
              <div>
                <label className="block font-bold text-slate-700 mb-1">نوع العطلة / المدة:</label>
                <div className="flex gap-1.5">
                  <select
                    value={docLeaveType}
                    onChange={e => setDocLeaveType(e.target.value)}
                    className="flex-1 border border-slate-300 rounded-xl p-2 bg-white text-slate-800"
                  >
                    <option value="عطلة سنوية">عطلة سنوية</option>
                    <option value="عطلة تعويضية">عطلة تعويضية</option>
                    <option value="عطلة استثنائية (زواج)">عطلة زواج (3 أيام)</option>
                    <option value="عطلة استثنائية (ختان)">عطلة ختان (3 أيام)</option>
                    <option value="عطلة استثنائية (وفاة)">عطلة وفاة (3 أيام)</option>
                    <option value="عطلة استثنائية (ازدياد مولود)">ازدياد مولود (3 أيام)</option>
                  </select>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={durationDays}
                    onChange={e => setDurationDays(Number(e.target.value))}
                    className="w-16 border border-slate-300 rounded-xl p-2 text-center font-bold"
                    title="عدد الأيام"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Additional controls row for Leave Dates */}
          {docType === 'titre' && (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-200 items-center">
              <div>
                <label className="block font-bold text-slate-700 mb-1">تاريخ الاستفادة (من):</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-1.5 bg-white text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">إلى غاية:</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-1.5 bg-white text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">تاريخ الاستئناف:</label>
                <input
                  type="date"
                  value={repriseDate}
                  onChange={e => setRepriseDate(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-1.5 bg-white text-slate-800"
                />
              </div>

              <div className="flex items-center gap-2 pt-4 sm:pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 text-xs">
                  <input
                    type="checkbox"
                    checked={isBlankTemplate}
                    onChange={e => setIsBlankTemplate(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded-sm"
                  />
                  <span>طباعة نموذج فارغ للتعبئة اليدوية</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Printable Paper Area (Strict A4 Layout Preview) */}
        <div id="official-print-document" className="print-area-container p-6 sm:p-10 md:p-12 bg-white text-slate-950 max-h-[640px] print:max-h-none overflow-y-auto select-text font-['Amiri',serif]">
          
          {/* ================= OFFICIAL DOCUMENT: رخصة العطلة (FOR.GRH.010) ================= */}
          {docType === 'titre' && employee && (
            <div className="max-w-[780px] mx-auto border border-slate-300 p-8 sm:p-10 rounded-none space-y-3 print:border-none print:p-2 print:m-0 print:max-w-none bg-white text-black font-['Amiri',serif]">
              
              {/* 1. TOP NATIONAL HEADER (CENTERED AT TOP EXACTLY AS IN OFFICIAL PDF SCREENSHOT) */}
              <div className="text-center space-y-0.5 pb-2 text-black" dir="rtl">
                <p className="text-xl sm:text-2xl font-bold tracking-normal font-['Amiri',serif] text-black">
                  الجمهورية الجزائرية الديمقراطية الشعبية
                </p>
                <p className="text-xs sm:text-[13px] font-bold font-sans tracking-wider text-black uppercase" dir="ltr">
                  PEOPLE'S DEMOCRATIC REPUBLIC OF ALGERIA
                </p>
                <p className="text-lg sm:text-xl font-bold font-['Amiri',serif] text-black pt-0.5">
                  وزارة التعليم العالي والبحث العلمي
                </p>
                <p className="text-xs sm:text-[13px] font-bold font-serif tracking-wide text-black" dir="ltr">
                  Ministry of Higher Education and Scientific Research
                </p>
              </div>

              {/* 2. SUB-HEADER: STRICT 3-COLUMN LAYOUT:
                  RIGHT: Arabic University info & License Number
                  CENTER: University Kasdi Merbah Logo
                  LEFT: English University info & Date line (ورقلة في)
              */}
              <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-4 pt-2 pb-1 text-black" style={{ direction: 'rtl' }}>
                
                {/* 1. RIGHT SIDE (First in RTL = PHYSICALLY ON THE RIGHT): ARABIC */}
                <div className="text-right text-sm sm:text-[15px] font-['Amiri',serif] font-bold leading-relaxed text-black space-y-0.5" dir="rtl">
                  <p className="font-bold text-base sm:text-[17px] text-black">جامعة قاصدي مرباح ورقلة</p>
                  <p className="font-bold text-black">كلية الرياضيات و العلوم المادة</p>
                  <p className="font-bold text-black">الأمانة العامة</p>
                  <p className="font-bold text-black">مصلحة المستخدمين</p>
                  
                  {/* License Number line */}
                  <div className="pt-1 flex items-baseline justify-start gap-1 font-bold text-sm sm:text-base text-black" dir="rtl">
                    <span className="shrink-0">الرقم: </span>
                    <span className="border-b border-dotted border-black px-2 pb-0.5 text-center min-w-[90px] font-mono text-sm font-bold">
                      {isBlankTemplate ? '....................' : (licenseNumber || '....................')}
                    </span>
                    <span className="shrink-0"> / 2026</span>
                  </div>
                </div>

                {/* 2. CENTER: Kasdi Merbah Ouargla Circular Logo */}
                <div className="flex flex-col items-center justify-center shrink-0 px-2 pt-0">
                  <img
                    src={UNIV_LOGO_BASE64}
                    alt="شعار جامعة قاصدي مرباح ورقلة"
                    className="w-24 h-24 sm:w-28 sm:h-28 object-contain block"
                    style={{ maxWidth: '112px', height: 'auto', display: 'block' }}
                  />
                </div>

                {/* 3. LEFT SIDE (Third in RTL = PHYSICALLY ON THE LEFT): ENGLISH & DATE */}
                <div className="text-left text-xs sm:text-[13px] font-serif font-bold leading-relaxed text-black space-y-0.5" style={{ direction: 'ltr' }}>
                  <p className="font-extrabold text-black">University of Kasdi Merbah -Ouargla</p>
                  <p className="font-bold text-black">Faculty of Mathematics and Matter Sciences</p>
                  <p className="font-bold text-black">General Secretary</p>
                  <p className="font-bold text-black">Human Resources Office</p>
                  
                  {/* Date line (ورقلة في) exactly below English block on the left */}
                  <div className="pt-3 font-['Amiri',serif] font-bold text-sm text-black flex items-baseline gap-1" style={{ direction: 'rtl' }}>
                    <span className="shrink-0">ورقلـة في:</span>
                    <span className="flex-1 border-b border-dotted border-black pb-0.5 text-center font-bold">
                      {isBlankTemplate ? '..................................................' : todayAr}
                    </span>
                  </div>
                </div>

              </div>

              {/* Solid horizontal separator line running full width */}
              <div className="w-full border-t-2 border-black my-3 sm:my-4"></div>

              {/* 3. DOCUMENT TITLE: رخصة العطلة (CENTERED UNDERLINED) */}
              <div className="text-center my-4 sm:my-6">
                <h1 className="text-2xl sm:text-3xl font-bold font-['Amiri',serif] inline-block border-b-2 border-black pb-1 px-4 tracking-wider text-black">
                  رخصة العطلة
                </h1>
              </div>

              {/* 4. FORM FIELDS WITH DOTTED LINES - STRICT RTL (LABEL ON RIGHT, DOTTED LINE ON LEFT) */}
              <div className="space-y-6 text-base font-['Amiri',serif] font-bold pt-2 pb-4 px-2 sm:px-6 text-black" dir="rtl">
                {/* Field 1: الإسم و اللقب : */}
                <div className="flex items-baseline gap-2" dir="rtl">
                  <span className="shrink-0 text-base sm:text-lg font-bold text-right min-w-[130px]">
                    الإســـم و اللقـب :
                  </span>
                  <div className="flex-1 border-b-2 border-dotted border-black pb-0.5 px-3 text-center text-base sm:text-lg font-bold text-black min-h-[1.8rem]">
                    {isBlankTemplate ? '' : employee.fullName}
                  </div>
                </div>

                {/* Field 2: الرتبــــــة : */}
                <div className="flex items-baseline gap-2" dir="rtl">
                  <span className="shrink-0 text-base sm:text-lg font-bold text-right min-w-[130px]">
                    الرتبـــــــــــــــــة :
                  </span>
                  <div className="flex-1 border-b-2 border-dotted border-black pb-0.5 px-3 text-center text-sm sm:text-base font-bold text-black min-h-[1.8rem]">
                    {isBlankTemplate ? '' : employee.rank}
                  </div>
                </div>

                {/* Field 3: الوظيفــــة : */}
                <div className="flex items-baseline gap-2" dir="rtl">
                  <span className="shrink-0 text-base sm:text-lg font-bold text-right min-w-[130px]">
                    الوظيفـــــــــــــــة :
                  </span>
                  <div className="flex-1 border-b-2 border-dotted border-black pb-0.5 px-3 text-center text-sm sm:text-base font-bold text-black min-h-[1.8rem]">
                    {isBlankTemplate ? '' : (customFunction || employee.department || 'موظف بالكلية')}
                  </div>
                </div>

                {/* Field 4: تاريخ الإستفادة : */}
                <div className="flex items-baseline gap-2" dir="rtl">
                  <span className="shrink-0 text-base sm:text-lg font-bold text-right min-w-[130px]">
                    تاريخ الإستفادة :
                  </span>
                  <div className="flex-1 border-b-2 border-dotted border-black pb-0.5 px-3 text-center text-sm sm:text-base font-bold text-black min-h-[1.8rem]">
                    {isBlankTemplate ? '' : `من ${formatArDate(startDate)} إلى ${formatArDate(endDate)}`}
                  </div>
                </div>

                {/* Field 5: تاريخ الإستئناف : */}
                <div className="flex items-baseline gap-2" dir="rtl">
                  <span className="shrink-0 text-base sm:text-lg font-bold text-right min-w-[130px]">
                    تاريخ الإستئناف :
                  </span>
                  <div className="flex-1 border-b-2 border-dotted border-black pb-0.5 px-3 text-center text-sm sm:text-base font-bold text-black min-h-[1.8rem]">
                    {isBlankTemplate ? '' : formatArDate(repriseDate)}
                  </div>
                </div>

                {/* Field 6: الباقي من العطلة : */}
                <div className="flex items-baseline gap-2" dir="rtl">
                  <span className="shrink-0 text-base sm:text-lg font-bold text-right min-w-[130px]">
                    البـــــاقي من العطلة:
                  </span>
                  <div className="flex-1 border-b-2 border-dotted border-black pb-0.5 px-3 text-center text-base sm:text-lg font-bold text-black min-h-[1.8rem]">
                    {isBlankTemplate ? '' : `${Math.max(0, employee.totalRemaining - durationDays)} يوماً`}
                  </div>
                </div>
              </div>

              {/* 5. SIGNATURE & STAMP SECTION */}
              <div className="pt-6 pr-8 sm:pr-16 text-right space-y-1 font-['Amiri',serif]" dir="rtl">
                <div className="flex items-center justify-end gap-2 text-sm sm:text-base font-bold text-black">
                  <span>ورقلـة في : </span>
                  <span className="font-mono text-xs">{isBlankTemplate ? '....................................' : todayAr}</span>
                </div>
                <p className="text-base sm:text-lg font-bold pr-4 mt-2 text-black">الأمين العام للكلية</p>
                {/* Clean signature space */}
                <div className="h-24 sm:h-28"></div>
              </div>

              {/* 6. OFFICIAL FOOTER: EXACT 1:1 CLONE OF ORIGINAL FOR.GRH.010 (Native Inline Vector SVG) */}
              <OfficialFooter />

            </div>
          )}

          {/* ================= DOCUMENT 2: استمارة طلب عطلة ================= */}
          {docType === 'demande' && employee && (
            <div className="max-w-2xl mx-auto border-2 border-slate-800 p-8 rounded-xs space-y-6 print:border-none print:p-0">
              <div className="text-center space-y-1 border-b pb-4 border-slate-400">
                <p className="font-bold text-sm">الجمهورية الجزائرية الديمقراطية الشعبية</p>
                <p className="font-bold text-sm">جامعة قاصدي مرباح ورقلة — كلية الرياضيات وعلوم المادة</p>
                <h1 className="text-lg font-black mt-2 underline">اسـتـمـارة طـلـب عـطـلـة إداريـة</h1>
              </div>

              <div className="space-y-4 text-sm leading-relaxed">
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 border border-slate-300 rounded-lg">
                  <div><strong>الاسم واللقب:</strong> {employee.fullName}</div>
                  <div><strong>الرتبة:</strong> {employee.rank}</div>
                  <div><strong>المصلحة / المخبر:</strong> {employee.department || 'كلية الرياضيات وعلوم المادة'}</div>
                  <div><strong>الرصيد المتوفر حالياً:</strong> {employee.totalRemaining} يوماً</div>
                </div>

                <div className="border border-slate-300 p-4 rounded-lg space-y-3">
                  <p>
                    أتشرف بطلب الاستفادة من: <strong>{docLeaveType}</strong>
                  </p>
                  <div className="flex gap-4">
                    <span>المدة: <strong>{durationDays} يوماً</strong></span>
                    <span>ابتداء من: <strong>{startDate}</strong></span>
                    <span>إلى غاية: <strong>{endDate}</strong></span>
                  </div>
                  <p>
                    الموظف المقترح للاستخلاف: <strong>{interimPerson}</strong>
                  </p>
                </div>

                <div className="text-left font-bold text-xs">
                  ورقلة في: {todayAr}
                </div>

                <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-300">
                  <div className="border border-slate-400 p-3 rounded-md min-h-[100px] text-center">
                    <p className="font-bold text-xs mb-1">رأي وتأشيرة المسؤول المباشر</p>
                    <p className="text-[11px] text-slate-500">[ ] موافق &nbsp;&nbsp;&nbsp; [ ] غير موافق</p>
                  </div>

                  <div className="border border-slate-400 p-3 rounded-md min-h-[100px] text-center">
                    <p className="font-bold text-xs mb-1">قرار مصلحة المستخدمين والعمادة</p>
                    <p className="text-[11px] text-slate-500">[ ] مقبولة &nbsp;&nbsp;&nbsp; [ ] مؤجلة</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= DOCUMENT 3: محضر استئناف العمل ================= */}
          {docType === 'reprise' && employee && (
            <div className="max-w-2xl mx-auto border-2 border-slate-800 p-8 rounded-xs space-y-6 print:border-none print:p-0">
              <div className="text-center space-y-1 border-b pb-4 border-slate-400">
                <p className="font-bold text-sm">الجمهورية الجزائرية الديمقراطية الشعبية</p>
                <p className="font-bold text-sm">وزارة التعليم العالي والبحث العلمي</p>
                <p className="font-bold text-base">جامعة قاصدي مرباح ورقلة</p>
                <p className="font-bold text-sm">كلية الرياضيات وعلوم المادة</p>
                <p className="text-xs text-slate-600">مصلحة المستخدمين</p>
              </div>

              <div className="text-center my-4">
                <h1 className="inline-block text-xl font-black border-2 border-slate-900 px-6 py-1.5 rounded-md">
                  مـحـضـر اسـتـئـنـاف الـعـمـل (REPRISE DE FONCTIONS)
                </h1>
              </div>

              <div className="space-y-4 text-sm leading-relaxed">
                <p>
                  يشهد عميد كلية الرياضيات وعلوم المادة بجامعة قاصدي مرباح ورقلة، بأن الموظف(ة):
                </p>
                <div className="bg-slate-50 p-4 border border-slate-300 rounded-lg space-y-2 font-bold">
                  <p>السيد(ة): {employee.fullName}</p>
                  <p>الرتبة: {employee.rank}</p>
                  <p>المصلحة: {employee.department || 'كلية الرياضيات وعلوم المادة'}</p>
                </div>

                <p>
                  قد استأنف(ت) عمله(ها) بصفة فعلية ورسمية بتاريخ: <strong>{repriseDate}</strong>، وذلك بعد انقضاء فترة العطلة الممنوحة له(ها) بموجب رخصة العطلة رقم: {licenseNumber || '.........'}
                </p>

                <p className="text-xs text-slate-600">
                  حرر هذا المحضر لإثبات الاستئناف وتسوية الوضعية الإدارية والمالية للمعني بالأمر.
                </p>

                <div className="text-left font-bold text-xs pt-4">
                  ورقلة في: {todayAr}
                </div>

                <div className="grid grid-cols-2 gap-8 pt-8 text-center text-xs font-bold border-t border-slate-300">
                  <div>
                    <p>إمضاء المعني بالأمر</p>
                    <div className="h-16"></div>
                  </div>
                  <div>
                    <p>رئيس مصلحة المستخدمين / العميد</p>
                    <div className="h-16"></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= DOCUMENT 4: كشف رصيد عطل فردي ================= */}
          {docType === 'solde' && employee && (
            <div className="max-w-2xl mx-auto border-2 border-slate-800 p-8 rounded-xs space-y-6 print:border-none print:p-0">
              <div className="text-center space-y-1 border-b pb-4 border-slate-400">
                <p className="font-bold text-sm">الجمهورية الجزائرية الديمقراطية الشعبية</p>
                <p className="font-bold text-base">جامعة قاصدي مرباح ورقلة — كلية الرياضيات وعلوم المادة</p>
                <p className="text-xs text-slate-600">مصلحة المستخدمين</p>
                <h1 className="text-lg font-black mt-2 underline">بـطـاقـة كـشـف رصـيـد الـعـطـل الـفـردي</h1>
              </div>

              <div className="space-y-4 text-sm">
                <div className="bg-slate-50 p-4 border border-slate-300 rounded-lg flex justify-between">
                  <div>
                    <p className="text-base font-bold">{employee.fullName}</p>
                    <p className="text-xs text-slate-600">{employee.rank}</p>
                  </div>
                  <div className="text-left">
                    <span className="text-xs text-slate-500 block">رقم الملف:</span>
                    <span className="font-mono font-bold">{employee.id}</span>
                  </div>
                </div>

                <table className="w-full text-right border-collapse border border-slate-400 text-xs">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="border border-slate-400 p-2">نوع العطلة</th>
                      <th className="border border-slate-400 p-2 text-center">الرصيد المتاح (أيام)</th>
                      <th className="border border-slate-400 p-2">ملاحظات الترحيل والتسوية</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-slate-400 p-2 font-bold">العطلة السنوية المرحّلة</td>
                      <td className="border border-slate-400 p-2 text-center font-bold text-emerald-800">{employee.annualLeave}</td>
                      <td className="border border-slate-400 p-2 text-[11px]">{employee.notes || 'رصيد سنوي'}</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-400 p-2 font-bold">العطلة التعويضية (المداومة)</td>
                      <td className="border border-slate-400 p-2 text-center font-bold text-amber-800">{employee.compensatoryLeave}</td>
                      <td className="border border-slate-400 p-2 text-[11px]">مكتسبة نظير المداومة الفعلية</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-400 p-2 font-bold">العطلة الاستثنائية القانونية</td>
                      <td className="border border-slate-400 p-2 text-center">{employee.exceptionalLeave}</td>
                      <td className="border border-slate-400 p-2 text-[11px]">مخصصة للمناسبات العائلية</td>
                    </tr>
                    {employee.additions > 0 && (
                      <tr>
                        <td className="border border-slate-400 p-2 font-bold">مخلفات وإضافات أخرى</td>
                        <td className="border border-slate-400 p-2 text-center font-bold text-blue-800">{employee.additions}</td>
                        <td className="border border-slate-400 p-2 text-[11px]">مخلفات سنوات سابقة</td>
                      </tr>
                    )}
                    <tr className="bg-slate-100 font-black">
                      <td className="border border-slate-400 p-2">إجمالي الرصيد المتبقي</td>
                      <td className="border border-slate-400 p-2 text-center text-sm">{employee.totalRemaining} يوم</td>
                      <td className="border border-slate-400 p-2">قابل للاستهلاك وفق رزنامة المصلحة</td>
                    </tr>
                  </tbody>
                </table>

                {employee.maternityNursingHours && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-900">
                    <strong>رخصة الرضاعة والأمومة:</strong> {employee.maternityNursingHours}
                  </div>
                )}

                <div className="text-left font-bold text-xs pt-4">
                  ورقلة في: {todayAr}
                </div>

                <div className="flex justify-between pt-8 text-center text-xs font-bold border-t border-slate-300">
                  <div>
                    <p>عـون مصلحة المستخدمين</p>
                  </div>
                  <div>
                    <p>رئيس مصلحة المستخدمين</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= DOCUMENT 5: جدول العطل العام للكلية ================= */}
          {docType === 'recap' && (
            <div className="space-y-4">
              <div className="text-center space-y-1 border-b pb-3 border-slate-400">
                <p className="font-bold text-xs">الجمهورية الجزائرية الديمقراطية الشعبية — وزارة التعليم العالي والبحث العلمي</p>
                <p className="font-bold text-sm">جامعة قاصدي مرباح ورقلة — كلية الرياضيات وعلوم المادة</p>
                <h1 className="text-base font-black underline">الجدول الشامل لعطل الموظفين الإداريين والتقنيين ({employees.length} موظف)</h1>
              </div>

              <table className="w-full text-right border-collapse border border-slate-300 text-[10px]">
                <thead>
                  <tr className="bg-slate-200 text-slate-900 font-bold">
                    <th className="border border-slate-300 p-1 text-center w-8">رقم</th>
                    <th className="border border-slate-300 p-1">الاسم واللقب</th>
                    <th className="border border-slate-300 p-1">الرتبة</th>
                    <th className="border border-slate-300 p-1 text-center">سنوية</th>
                    <th className="border border-slate-300 p-1 text-center">استثنائية</th>
                    <th className="border border-slate-300 p-1 text-center">تعويضية</th>
                    <th className="border border-slate-300 p-1 text-center">إضافات</th>
                    <th className="border border-slate-300 p-1 text-center">الباقي</th>
                    <th className="border border-slate-300 p-1">الملاحظات</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map(e => (
                    <tr key={e.id} className="hover:bg-slate-50">
                      <td className="border border-slate-300 p-1 text-center font-bold">{e.id}</td>
                      <td className="border border-slate-300 p-1 font-bold">{e.fullName}</td>
                      <td className="border border-slate-300 p-1">{e.rank}</td>
                      <td className="border border-slate-300 p-1 text-center font-bold">{e.annualLeave}</td>
                      <td className="border border-slate-300 p-1 text-center">{e.exceptionalLeave}</td>
                      <td className="border border-slate-300 p-1 text-center">{e.compensatoryLeave}</td>
                      <td className="border border-slate-300 p-1 text-center font-bold text-blue-800">{e.additions || 0}</td>
                      <td className="border border-slate-300 p-1 text-center font-black bg-slate-100">{e.totalRemaining}</td>
                      <td className="border border-slate-300 p-1 text-[9px] truncate max-w-xs">{e.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-between pt-4 text-xs font-bold">
                <span>ورقلة في: {todayAr}</span>
                <span>رئيس مصلحة المستخدمين</span>
                <span>عميد الكلية</span>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Bar - Hidden on Print */}
        <div className="bg-slate-100 p-4 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-slate-600 print:hidden shrink-0">
          <span className="flex items-center gap-1.5 font-bold text-emerald-800">
            <CheckCheck className="w-4 h-4 text-emerald-600" />
            نموذج «رخصة العطلة» الرسمي FOR.GRH.010 معتمد ومطابق للمعايير
          </span>
          <div className="flex flex-wrap gap-2 items-center">
            <button
              onClick={handleOpenNewWindow}
              className="px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 font-bold text-slate-700 cursor-pointer flex items-center gap-1.5"
              title="فتح الوثيقة في نافذة مستقلة للطباعة المباشرة"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              <span>صفحة مستقلة</span>
            </button>
            <button
              onClick={handleDownloadHTML}
              className="px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 font-bold text-slate-700 cursor-pointer flex items-center gap-1.5"
              title="تنزيل نسخة جاهزة للطباعة على جهازك"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>تنزيل للطباعة</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 font-bold text-slate-700 cursor-pointer"
            >
              إغلاق
            </button>
            <button
              onClick={handlePrint}
              className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة فورية A4</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
