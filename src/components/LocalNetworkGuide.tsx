import React from 'react';
import { 
  Wifi, 
  Server, 
  Laptop, 
  Download, 
  ShieldCheck, 
  Terminal, 
  Share2, 
  HardDrive,
  Copy,
  Check,
  Monitor,
  Play,
  Package
} from 'lucide-react';

export const LocalNetworkGuide: React.FC = () => {
  const [copied, setCopied] = React.useState<string | null>(null);

  const copyCode = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white p-6 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-emerald-300">
            <Wifi className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold">دليل تشغيل المنصة في شبكة الكلية المحلية (Local Intranet LAN)</h2>
            <p className="text-xs text-slate-200 mt-1">
              كيفية تشغيل وتوزيع التطبيق داخلياً في مصلحة المستخدمين بكلية الرياضيات وعلوم المادة دون الحاجة لاتصال بالإنترنت
            </p>
          </div>
        </div>
      </div>

      {/* Architecture Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs text-center space-y-2">
          <div className="w-10 h-10 mx-auto rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center">
            <Server className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-800 text-xs">1. جهاز الخادم الرئيسي (PC Principal)</h3>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            حاسوب مصلحة المستخدمين في الكلية يعمل كخادم محلي يقوم بتشغيل المنصة ومشاركة الرابط.
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs text-center space-y-2">
          <div className="w-10 h-10 mx-auto rounded-full bg-teal-100 text-teal-800 flex items-center justify-center">
            <Wifi className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-800 text-xs">2. شبكة الكلية الداخلية (LAN / Wi-Fi)</h3>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            الربط عبر كابل الشبكة (Ethernet) أو شبكة الويفي الخاصة بالكلية دون المرور بالإنترنت الخارجي.
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs text-center space-y-2">
          <div className="w-10 h-10 mx-auto rounded-full bg-indigo-100 text-indigo-800 flex items-center justify-center">
            <Laptop className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-800 text-xs">3. حواسيب المصالح والعمادة</h3>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            يقوم رئيس المصلحة والموظفون بفتح الرابط المباشر من أي متصفح (Chrome, Firefox, Edge).
          </p>
        </div>
      </div>

      {/* Step by Step Execution Guide */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b pb-3 border-slate-200">
          <Terminal className="w-4 h-4 text-emerald-700" />
          <span>خطوات التثبيت والتشغيل المحلي على حاسوب المصلحة:</span>
        </h3>

        {/* Step 1 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[11px]">1</span>
            <span>تنزيل المشروع أو نسخه على الحاسوب (أو فلاش ديسك USB):</span>
          </div>
          <p className="text-xs text-slate-600 pr-7 leading-relaxed">
            يمكنك تحميل المشروع كاملاً بصيغة ZIP من قائمة الإعدادات (Settings &gt; Export to ZIP) وفك الضغط في مجلد مخصص مثل <code>C:\FacultyLeavesApp</code>.
          </p>
        </div>

        {/* Step 2 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[11px]">2</span>
            <span>تثبيت الحزم وتشغيل الخادم ليكون متاحاً للشبكة المحلية:</span>
          </div>
          <p className="text-xs text-slate-600 pr-7">
            افتح موجه الأوامر (CMD أو PowerShell) في مجلد التطبيق، ونفذ الأوامر التالية:
          </p>
          <div className="pr-7">
            <div className="bg-slate-900 text-slate-100 p-3 rounded-xl font-mono text-xs flex justify-between items-center">
              <code>npm install && npm run dev -- --host 0.0.0.0</code>
              <button
                onClick={() => copyCode('npm install && npm run dev -- --host 0.0.0.0', 'c1')}
                className="text-slate-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
                title="نسخ الأمر"
              >
                {copied === 'c1' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              ملاحظة: خيار <code>--host 0.0.0.0</code> يسمح لجميع الحواسيب الأخرى في نفس الشبكة بالوصول إلى التطبيق.
            </span>
          </div>
        </div>

        {/* Step 3 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[11px]">3</span>
            <span>معرفة عنوان IP الخاص بحاسوب الخادم:</span>
          </div>
          <p className="text-xs text-slate-600 pr-7">
            في حاسوب المصلحة، اكتب الأمر التالي في CMD لمعرفة العنوان:
          </p>
          <div className="pr-7">
            <div className="bg-slate-900 text-slate-100 p-3 rounded-xl font-mono text-xs flex justify-between items-center">
              <code>ipconfig</code>
              <button
                onClick={() => copyCode('ipconfig', 'c2')}
                className="text-slate-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
              >
                {copied === 'c2' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              ابحث عن سطر <strong>IPv4 Address</strong>، مثلاً: <code>192.168.1.45</code>
            </span>
          </div>
        </div>

        {/* Step 4 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[11px]">4</span>
            <span>فتح التطبيق من أي حاسوب داخل الكلية:</span>
          </div>
          <p className="text-xs text-slate-600 pr-7 leading-relaxed">
            الآن يمكن لأي موظف أو مسؤول متصل بشبكة الكلية فتح المتصفح والدخول إلى الرابط:
          </p>
          <div className="pr-7">
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-950 p-3 rounded-xl font-mono text-sm font-bold flex justify-between items-center">
              <span>http://192.168.1.45:3000</span>
              <span className="text-xs text-emerald-700 font-sans font-normal">(استبدل 192.168.1.45 بـ IP جهازك)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Offline & Security Tips */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2 text-xs">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <HardDrive className="w-4 h-4 text-emerald-700" />
            <span>حفظ البيانات والنسخ الاحتياطي الدوري</span>
          </div>
          <p className="text-slate-600 leading-relaxed">
            يتم حفظ جميع التعديلات تلقائياً في التخزين المحلي للمتصفح. يُنصح في نهاية كل أسبوع بالنقر على زر <strong>إكسل والنسخ</strong> وتصدير ملف Excel أو نسخة JSON وحفظها في قرص صلب خارجي أو فلاش ديسك.
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2 text-xs">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>السرية والأمان التام لبيانات الكلية</span>
          </div>
          <p className="text-slate-600 leading-relaxed">
            لأن التطبيق يعمل داخل شبكة الكلية المحلية فقط (Intranet)، فإن بيانات الموظفين وعطلهم وساعات الرضاعة لا تخرج أبداً خارج جدران الكلية، ولا يتم إرسالها إلى أي خوادم خارجية غير مصرح بها.
          </p>
        </div>
      </div>

      {/* Electron Desktop Application Guide Section */}
      <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-indigo-50 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Monitor className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <span>تشغيل وبناء التطبيق كبرنامج سطح مكتب مستقل (Electron.js)</span>
                <span className="text-[10px] font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
                  Electron Desktop
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                يمكنك تشغيل المنصة كبرنامج مستقل على حاسوب مصلحة المستخدمين وتصدير ملف تثبيت (.exe أو .deb)
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Card 1: Dev Run */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
            <div className="flex items-center gap-2 font-bold text-slate-800">
              <Play className="w-4 h-4 text-indigo-600" />
              <span>1. التشغيل المباشر أثناء التطوير:</span>
            </div>
            <p className="text-[11px] text-slate-500">
              قم بتشغيل السيرفر أولاً ثم فتح نافذة Electron:
            </p>
            <div className="bg-slate-900 text-slate-100 p-2.5 rounded-lg font-mono text-[11px] flex justify-between items-center">
              <code>npm run electron:dev</code>
              <button
                onClick={() => copyCode('npm run electron:dev', 'el1')}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                {copied === 'el1' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Card 2: Run Production Build */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
            <div className="flex items-center gap-2 font-bold text-slate-800">
              <Terminal className="w-4 h-4 text-emerald-600" />
              <span>2. بناء وتشغيل نسخة الإنتاج:</span>
            </div>
            <p className="text-[11px] text-slate-500">
              بناء ملفات الواجهة ثم تشغيلها محلياً:
            </p>
            <div className="bg-slate-900 text-slate-100 p-2.5 rounded-lg font-mono text-[11px] flex justify-between items-center">
              <code>npm run build && npm run electron</code>
              <button
                onClick={() => copyCode('npm run build && npm run electron', 'el2')}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                {copied === 'el2' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Card 3: Package Installer */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
            <div className="flex items-center gap-2 font-bold text-slate-800">
              <Package className="w-4 h-4 text-purple-600" />
              <span>3. تصدير ملف التثبيت (.exe / .deb):</span>
            </div>
            <p className="text-[11px] text-slate-500">
              إنشاء برنامج تنفيذي كامل داخل مجلد release:
            </p>
            <div className="bg-slate-900 text-slate-100 p-2.5 rounded-lg font-mono text-[11px] flex justify-between items-center">
              <code>npm run electron:build</code>
              <button
                onClick={() => copyCode('npm run electron:build', 'el3')}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                {copied === 'el3' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-3 text-xs text-indigo-950 flex items-start gap-2.5">
          <div className="w-2 h-2 rounded-full bg-indigo-600 mt-1.5 shrink-0" />
          <p className="leading-relaxed">
            <strong>ميزة إضافية لنسخة سطح المكتب:</strong> تدعم الطباعة الفورية المباشرة بدون حوار المتصفح عبر اختصار <kbd className="bg-white px-1.5 py-0.5 rounded border border-indigo-200 font-mono text-[10px]">Ctrl + P</kbd>، وتصدير رخص واستمارات العطلات مباشرة إلى ملف PDF مخصص عبر خيار القائمة <strong>ملف &gt; تصدير الوثيقة كملف PDF</strong>.
          </p>
        </div>
      </div>
    </div>
  );
};
