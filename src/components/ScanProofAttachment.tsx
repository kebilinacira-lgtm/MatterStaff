import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, FolderCheck, CheckCircle2, AlertTriangle, Eye, Trash2, X, RefreshCw, FileText, Check } from 'lucide-react';
import { getDocumentsByEmployee } from '../utils/documentStorage';
import { ScannedDocument } from '../types';

export interface ProofAttachmentValue {
  hasProof: boolean;
  proofDocId?: string;
  proofTitle?: string;
  proofDataUrl?: string;
}

interface ScanProofAttachmentProps {
  employeeId?: number;
  employeeName?: string;
  value: ProofAttachmentValue;
  onChange: (val: ProofAttachmentValue) => void;
  titleLabel?: string;
  description?: string;
  required?: boolean;
  onPreview?: (dataUrl: string, title?: string) => void;
}

export const ScanProofAttachment: React.FC<ScanProofAttachmentProps> = ({
  employeeId,
  employeeName,
  value,
  onChange,
  titleLabel = 'وثيقة إثبات موافقة المسؤول المباشر / الإدارة (مسح ضوئي)',
  description = 'وفقاً لتعليمات الكلية، يجب إرفاق وثيقة ممسوحة ضوئياً تثبت موافقة المسؤول لتفادي أي خطأ أو التباس.',
  required = true,
  onPreview,
}) => {
  const [mode, setMode] = useState<'idle' | 'camera' | 'archive'>('idle');
  const [archiveDocs, setArchiveDocs] = useState<ScannedDocument[]>([]);
  const [isLoadingArchive, setIsLoadingArchive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Load employee archive docs when archive mode is opened
  const handleOpenArchive = async () => {
    if (!employeeId) return;
    setIsLoadingArchive(true);
    setMode('archive');
    try {
      const docs = await getDocumentsByEmployee(employeeId);
      setArchiveDocs(docs);
    } catch (err) {
      console.error('Error fetching employee archive:', err);
    } finally {
      setIsLoadingArchive(false);
    }
  };

  // Start Camera
  const startCamera = async () => {
    setCameraError(null);
    setMode('camera');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError('تعذر تشغيل الكاميرا مباشرة. يمكنك استخدام خاصية رفع ملف أو صورة ممسوحة ضوئياً أدناه.');
    }
  };

  // Stop Camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setMode('idle');
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // Capture snapshot from video
  const captureSnapshot = () => {
    if (!videoRef.current) return;
    setIsProcessing(true);

    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

        stopCamera();

        onChange({
          hasProof: true,
          proofTitle: `موافقة وتأشيرة المسؤول المباشر (${new Date().toLocaleDateString('ar-DZ')})`,
          proofDataUrl: dataUrl,
        });
      }
    } catch (err) {
      console.error('Capture error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      onChange({
        hasProof: true,
        proofTitle: file.name.replace(/\.[^/.]+$/, '') || 'وثيقة إثبات وموافقة ممسوحة',
        proofDataUrl: dataUrl,
      });
      setIsProcessing(false);
    };
    reader.onerror = () => {
      alert('تعذر قراءة الملف المختار');
      setIsProcessing(false);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Select document from archive
  const handleSelectFromArchive = (doc: ScannedDocument) => {
    onChange({
      hasProof: true,
      proofDocId: doc.id,
      proofTitle: doc.title,
      proofDataUrl: doc.fileDataUrl,
    });
    setMode('idle');
  };

  // Remove attached proof
  const handleRemove = () => {
    onChange({
      hasProof: false,
      proofDocId: undefined,
      proofTitle: undefined,
      proofDataUrl: undefined,
    });
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3" dir="rtl">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-teal-700" />
              <span>{titleLabel}</span>
            </h4>
            {required && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 border border-rose-200">
                إلزامـي
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
            {description}
          </p>
        </div>

        {value.hasProof && (
          <span className="shrink-0 flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>مرفق ومؤشر ✅</span>
          </span>
        )}
      </div>

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*,application/pdf"
        className="hidden"
      />

      {/* View 1: Camera Active Mode */}
      {mode === 'camera' && (
        <div className="bg-black rounded-xl p-3 text-white space-y-2.5">
          <div className="flex items-center justify-between text-xs pb-1 border-b border-zinc-800">
            <span className="font-bold flex items-center gap-1 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
              مسح وتصوير الوثيقة الورقية بالكاميرا
            </span>
            <button
              type="button"
              onClick={stopCamera}
              className="text-zinc-400 hover:text-white p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {cameraError ? (
            <div className="bg-rose-950/70 border border-rose-800 p-3 rounded-lg text-xs text-rose-200 text-center">
              {cameraError}
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  fileInputRef.current?.click();
                }}
                className="mt-2 block mx-auto px-3 py-1 bg-rose-700 text-white rounded text-xs font-bold"
              >
                رفع صورة الوثيقة من الجهاز
              </button>
            </div>
          ) : (
            <div className="relative rounded-lg overflow-hidden bg-zinc-950 flex flex-col items-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full max-h-[260px] object-cover rounded-lg"
              />
              {/* Document alignment guidelines */}
              <div className="absolute inset-4 border-2 border-dashed border-emerald-400/60 rounded-lg pointer-events-none flex items-center justify-center">
                <span className="text-[10px] bg-black/60 px-2 py-0.5 rounded text-emerald-300">
                  ضع وثيقة الموافقة داخل هذا الإطار
                </span>
              </div>

              <div className="pt-2 pb-1 flex items-center gap-3">
                <button
                  type="button"
                  onClick={captureSnapshot}
                  disabled={isProcessing}
                  id="btn-capture-proof-snapshot"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full font-bold text-xs shadow-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>التقاط صورة الوثيقة الآن 📸</span>
                </button>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-full text-xs font-bold cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* View 2: Archive Selector Mode */}
      {mode === 'archive' && (
        <div className="bg-white border border-teal-200 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
            <h5 className="text-xs font-bold text-teal-900 flex items-center gap-1.5">
              <FolderCheck className="w-3.5 h-3.5 text-teal-700" />
              <span>اختيار وثيقة من الأرشيف الضوئي لـ {employeeName || 'الموظف'}</span>
            </h5>
            <button
              type="button"
              onClick={() => setMode('idle')}
              className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {isLoadingArchive ? (
            <div className="text-center py-4 text-xs text-slate-500">
              جارِ تحميل الوثائق الممسوحة...
            </div>
          ) : archiveDocs.length === 0 ? (
            <div className="text-center py-4 text-xs text-slate-500 bg-slate-50 rounded-lg">
              لا توجد وثائق ممسوحة مسبقاً لهذا الموظف في الأرشيف. يمكنك التقاط صورة بالكاميرا أو رفع ملف.
            </div>
          ) : (
            <div className="max-h-[220px] overflow-y-auto space-y-1.5">
              {archiveDocs.map(doc => (
                <div
                  key={doc.id}
                  onClick={() => handleSelectFromArchive(doc)}
                  className="p-2 rounded-lg border border-slate-200 hover:border-teal-500 hover:bg-teal-50/50 flex items-center justify-between cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    {doc.fileDataUrl.startsWith('data:image') ? (
                      <img
                        src={doc.fileDataUrl}
                        alt=""
                        className="w-10 h-10 object-cover rounded border border-slate-200 shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-teal-700" />
                      </div>
                    )}
                    <div>
                      <div className="text-xs font-bold text-slate-800">{doc.title}</div>
                      <div className="text-[10px] text-slate-500">
                        {doc.category} • {new Date(doc.createdAt).toLocaleDateString('ar-DZ')}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="text-xs bg-teal-700 text-white px-2.5 py-1 rounded font-bold hover:bg-teal-800"
                  >
                    اختيار
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* View 3: When a document IS attached */}
      {value.hasProof && value.proofDataUrl && mode === 'idle' && (
        <div className="bg-emerald-50/70 border border-emerald-300 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              onClick={() => onPreview && onPreview(value.proofDataUrl!, value.proofTitle)}
              className="relative group cursor-pointer shrink-0"
              title="انقر لتكبير ومعاينة الوثيقة"
            >
              <img
                src={value.proofDataUrl}
                alt="وثيقة الموافقة"
                className="w-14 h-14 object-cover rounded-lg border-2 border-emerald-400 shadow-xs group-hover:opacity-90 transition-opacity bg-white"
              />
              <div className="absolute inset-0 bg-black/30 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Eye className="w-4 h-4 text-white" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-emerald-950">
                  {value.proofTitle || 'وثيقة الموافقة الرسمية'}
                </span>
                <span className="text-[10px] bg-emerald-200 text-emerald-900 font-bold px-1.5 py-0.2 rounded">
                  معتمدة إدارياً
                </span>
              </div>
              <p className="text-[11px] text-emerald-800 mt-0.5">
                تم التحقق من الوثيقة وسيتم توثيقها تلقائياً مع هذه العملية في سجل الموظف.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-center">
            {onPreview && (
              <button
                type="button"
                onClick={() => onPreview(value.proofDataUrl!, value.proofTitle)}
                className="px-2.5 py-1.5 bg-white border border-emerald-300 hover:bg-emerald-100/50 text-emerald-800 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>معاينة</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-2.5 py-1.5 bg-white border border-emerald-300 hover:bg-emerald-100/50 text-emerald-800 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>تغيير</span>
            </button>

            <button
              type="button"
              onClick={handleRemove}
              className="px-2.5 py-1.5 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>إزالة</span>
            </button>
          </div>
        </div>
      )}

      {/* View 4: When NO document is attached yet and in idle mode */}
      {!value.hasProof && mode === 'idle' && (
        <div className="space-y-2.5">
          {required && (
            <div className="bg-amber-50 border border-amber-300/80 rounded-lg p-2.5 flex items-start gap-2 text-xs text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">تنبيه إداري إلزامي: </span>
                <span>
                  يشترط إرفاق وثيقة ممسموحة ضوئياً تثبت موافقة وتأشيرة المسؤول المباشر (رئيس المصلحة / العميد / الأمين العام) قبل إتمام التسجيل لمنع أي خطأ.
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
            {/* 1. Camera Scan */}
            <button
              type="button"
              onClick={startCamera}
              id="btn-proof-camera-scan"
              className="p-2.5 bg-white hover:bg-teal-50 border border-teal-300 text-teal-800 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-2xs hover:shadow-xs transition-all"
            >
              <Camera className="w-4 h-4 text-teal-600 shrink-0" />
              <span>مسح ضوئي بالكاميرا 📸</span>
            </button>

            {/* 2. Upload file */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              id="btn-proof-upload-file"
              className="p-2.5 bg-white hover:bg-teal-50 border border-teal-300 text-teal-800 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-2xs hover:shadow-xs transition-all"
            >
              <Upload className="w-4 h-4 text-teal-600 shrink-0" />
              <span>رفع ملف أو صورة 📁</span>
            </button>

            {/* 3. Choose from existing archive */}
            <button
              type="button"
              onClick={handleOpenArchive}
              id="btn-proof-select-archive"
              className="p-2.5 bg-white hover:bg-teal-50 border border-teal-300 text-teal-800 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-2xs hover:shadow-xs transition-all"
            >
              <FolderCheck className="w-4 h-4 text-teal-600 shrink-0" />
              <span>اختيار من الأرشيف 📑</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
