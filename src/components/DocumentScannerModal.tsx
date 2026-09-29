import React, { useState, useRef, useEffect } from 'react';
import { Employee, ScannedDocument, DocumentCategory } from '../types';
import { 
  saveScannedDocument, 
  getDocumentsByEmployee, 
  deleteScannedDocument 
} from '../utils/documentStorage';
import { 
  X, 
  Camera, 
  Upload, 
  RotateCw, 
  Printer, 
  Save, 
  Trash2, 
  Eye, 
  FileText, 
  CheckCircle2, 
  RefreshCw, 
  Sliders, 
  Download, 
  Maximize2,
  FolderOpen,
  ArrowRight,
  AlertCircle
} from 'lucide-react';

interface DocumentScannerModalProps {
  initialEmployee?: Employee | null;
  employees: Employee[];
  onClose: () => void;
  onDocumentSaved?: () => void;
}

export const DocumentScannerModal: React.FC<DocumentScannerModalProps> = ({
  initialEmployee,
  employees,
  onClose,
  onDocumentSaved,
}) => {
  // Selected Employee
  const [selectedEmpId, setSelectedEmpId] = useState<number>(
    initialEmployee?.id || (employees.length > 0 ? employees[0].id : 1)
  );

  const selectedEmployee = employees.find(e => e.id === selectedEmpId) || employees[0];

  // Active view inside modal: 'scan' (scan/upload new) | 'archive' (view employee documents)
  const [activeView, setActiveView] = useState<'scan' | 'archive'>('scan');

  // Scanner state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraDevices, setCameraDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Captured / Uploaded Image
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [imageRotation, setImageRotation] = useState<number>(0);
  const [colorMode, setColorMode] = useState<'original' | 'bw' | 'grayscale'>('original');

  // Document Metadata Form
  const [docCategory, setDocCategory] = useState<DocumentCategory>('رخصة عطلة موقعة');
  const [docTitle, setDocTitle] = useState<string>('');
  const [docNotes, setDocNotes] = useState<string>('');

  // Existing Documents for the selected employee
  const [employeeDocs, setEmployeeDocs] = useState<ScannedDocument[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [zoomDoc, setZoomDoc] = useState<ScannedDocument | null>(null);

  // Feedback Notification
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Load employee's existing documents
  const loadEmployeeDocuments = async (empId: number) => {
    setIsLoadingDocs(true);
    try {
      const docs = await getDocumentsByEmployee(empId);
      setEmployeeDocs(docs);
    } catch (err) {
      console.error('Error loading documents', err);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  useEffect(() => {
    if (selectedEmpId) {
      loadEmployeeDocuments(selectedEmpId);
    }
  }, [selectedEmpId]);

  // Set default title based on category & employee
  useEffect(() => {
    if (!docTitle || docTitle.startsWith('وثيقة')) {
      const today = new Date().toISOString().split('T')[0];
      setDocTitle(`${docCategory} - ${selectedEmployee?.fullName || ''} (${today})`);
    }
  }, [docCategory, selectedEmployee]);

  // Enumerate cameras
  useEffect(() => {
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices()
        .then(devices => {
          const videoInputs = devices.filter(d => d.kind === 'videoinput');
          setCameraDevices(videoInputs);
          if (videoInputs.length > 0) {
            // Prefer environment/back camera if available, or first
            const backCam = videoInputs.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('environment'));
            setSelectedDeviceId(backCam ? backCam.deviceId : videoInputs[0].deviceId);
          }
        })
        .catch(err => console.warn('Could not enumerate cameras', err));
    }

    return () => {
      stopCamera();
    };
  }, []);

  // Start Camera
  const startCamera = async (deviceId?: string) => {
    stopCamera();
    setCameraError(null);
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode: deviceId ? undefined : { ideal: 'environment' }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError('تعذر الوصول إلى الكاميرا. يرجى التحقق من إذن الكاميرا أو استخدام زر "رفع وثيقة من الجهاز".');
      setIsCameraActive(false);
    }
  };

  // Stop Camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Capture Image from Video Stream
  const captureImage = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setOriginalImage(dataUrl);
    setPreviewImage(dataUrl);
    setImageRotation(0);
    setColorMode('original');
    stopCamera();
  };

  // Handle File Upload from Computer / Mobile
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (max 15MB)
    if (file.size > 15 * 1024 * 1024) {
      setFeedback({ type: 'error', message: 'حجم الملف كبير جداً. يرجى اختيار ملف أصغر من 15 ميغابايت.' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setOriginalImage(dataUrl);
      setPreviewImage(dataUrl);
      setImageRotation(0);
      setColorMode('original');
      stopCamera();
    };
    reader.readAsDataURL(file);
    // Reset file input
    e.target.value = '';
  };

  // Apply Transformations (Rotation + B&W Filter)
  const applyFilterAndTransform = (srcUrl: string, rotation: number, mode: 'original' | 'bw' | 'grayscale') => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const isRotated = rotation === 90 || rotation === 270;
      canvas.width = isRotated ? img.height : img.width;
      canvas.height = isRotated ? img.width : img.height;

      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      ctx.restore();

      // Apply Filters if requested
      if (mode !== 'original') {
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          // Luminance calculation
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;

          if (mode === 'grayscale') {
            data[i] = gray;
            data[i + 1] = gray;
            data[i + 2] = gray;
          } else if (mode === 'bw') {
            // Adaptive scanner high contrast thresholding
            const val = gray > 135 ? 255 : 0;
            data[i] = val;
            data[i + 1] = val;
            data[i + 2] = val;
          }
        }
        ctx.putImageData(imgData, 0, 0);
      }

      setPreviewImage(canvas.toDataURL('image/jpeg', 0.9));
    };
    img.src = srcUrl;
  };

  // Handle Rotation
  const handleRotate = () => {
    if (!originalImage) return;
    const newRotation = (imageRotation + 90) % 360;
    setImageRotation(newRotation);
    applyFilterAndTransform(originalImage, newRotation, colorMode);
  };

  // Handle Filter Change
  const handleFilterChange = (mode: 'original' | 'bw' | 'grayscale') => {
    if (!originalImage) return;
    setColorMode(mode);
    applyFilterAndTransform(originalImage, imageRotation, mode);
  };

  // Save Scanned Document to IndexedDB
  const handleSaveDocument = async () => {
    if (!previewImage) {
      setFeedback({ type: 'error', message: 'يرجى التقاط صورة أو رفع وثيقة أولاً.' });
      return;
    }

    try {
      const newDoc: ScannedDocument = {
        id: 'doc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        employeeId: selectedEmpId,
        employeeName: selectedEmployee.fullName,
        title: docTitle.trim() || `${docCategory} - ${selectedEmployee.fullName}`,
        category: docCategory,
        fileName: `${docCategory}_${selectedEmployee.fullName.replace(/\s+/g, '_')}_${Date.now()}.jpg`,
        fileDataUrl: previewImage,
        fileType: 'image/jpeg',
        fileSize: Math.round(previewImage.length * 0.75),
        createdAt: new Date().toISOString(),
        notes: docNotes.trim() || undefined,
      };

      await saveScannedDocument(newDoc);
      setFeedback({ type: 'success', message: `تم حفظ وثيقة "${newDoc.title}" في ملف الموظف بنجاح!` });
      setTimeout(() => setFeedback(null), 4000);

      // Reset form
      setPreviewImage(null);
      setOriginalImage(null);
      setDocNotes('');

      // Refresh list
      await loadEmployeeDocuments(selectedEmpId);
      if (onDocumentSaved) onDocumentSaved();

      // Switch to archive view to view the saved document
      setActiveView('archive');
    } catch (err: any) {
      console.error('Error saving document', err);
      setFeedback({ type: 'error', message: 'حدث خطأ أثناء حفظ الوثيقة: ' + (err.message || '') });
    }
  };

  // Delete Document
  const handleDeleteDoc = async (id: string, title: string) => {
    if (!window.confirm(`هل أنت متأكد من رغبتك في حذف الوثيقة: "${title}" نهائياً من ملف الموظف؟`)) {
      return;
    }
    try {
      await deleteScannedDocument(id);
      await loadEmployeeDocuments(selectedEmpId);
      if (onDocumentSaved) onDocumentSaved();
      setFeedback({ type: 'success', message: 'تم حذف الوثيقة بنجاح.' });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      console.error('Failed to delete', err);
    }
  };

  // Print Document directly
  const handlePrintDocument = (dataUrl: string, title: string) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl">
        <head>
          <title>${title} - كلية الرياضيات وعلوم المادة</title>
          <style>
            @page { size: A4; margin: 10mm; }
            body { margin: 0; padding: 0; text-align: center; font-family: sans-serif; }
            img { max-width: 100%; max-height: 98vh; object-fit: contain; }
          </style>
        </head>
        <body>
          <img src="${dataUrl}" onload="window.print();window.close();" />
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden border border-slate-200 my-4 flex flex-col max-h-[92vh]">
        
        {/* MODAL HEADER - Large & High Contrast */}
        <div className="bg-slate-900 text-white p-5 flex flex-wrap justify-between items-center gap-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-black text-lg sm:text-xl text-white">الماسح الضوئي والأرشيف الرقمي لملف الموظف</h2>
                <span className="bg-emerald-500/20 text-emerald-300 text-xs px-2.5 py-0.5 rounded-full font-bold border border-emerald-500/30">
                  استنساخ ضوئي فوري
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                مسح ضوئي لأوراق وملفات الموظفين (رخص العطل، الشهادات، الاستئناف، المقررات) وحفظها رقمياً
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            id="close-scanner-modal-btn"
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
            title="إغلاق النافذة"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* FEEDBACK ALERT */}
        {feedback && (
          <div
            className={`p-3.5 px-6 flex items-center gap-2 text-xs font-bold shrink-0 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-b border-emerald-200'
                : 'bg-rose-50 text-rose-900 border-b border-rose-200'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* EMPLOYEE SELECTION & TABS BAR */}
        <div className="bg-slate-100 p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-2 flex-1 min-w-[280px]">
            <label className="text-xs font-black text-slate-800 whitespace-nowrap">الموظف المعني بالملف:</label>
            <select
              value={selectedEmpId}
              onChange={(e) => {
                const id = Number(e.target.value);
                setSelectedEmpId(id);
              }}
              id="scanner-employee-select"
              className="flex-1 bg-white border-2 border-emerald-600 text-slate-900 text-sm font-bold rounded-xl px-3 py-2 shadow-2xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            >
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.id} - {emp.fullName} ({emp.rank})
                </option>
              ))}
            </select>
          </div>

          {/* Large Navigation Tabs */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveView('scan')}
              id="tab-btn-scanner-action"
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all cursor-pointer shadow-xs ${
                activeView === 'scan'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>مسح وثيقة جديدة 📸</span>
            </button>

            <button
              onClick={() => setActiveView('archive')}
              id="tab-btn-scanner-archive"
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all cursor-pointer shadow-xs ${
                activeView === 'archive'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'
              }`}
            >
              <FolderOpen className="w-4 h-4" />
              <span>أرشيف الوثائق المحفوظة ({employeeDocs.length}) 📁</span>
            </button>
          </div>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

          {/* ================= VIEW 1: SCAN / UPLOAD NEW DOCUMENT ================= */}
          {activeView === 'scan' && (
            <div className="space-y-6">
              
              {/* PRIMARY METHOD SELECTOR - 2 HUGE BUTTONS */}
              {!isCameraActive && !previewImage && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 py-2">
                  {/* Button 1: Camera Scanner */}
                  <button
                    onClick={() => startCamera(selectedDeviceId)}
                    id="scanner-start-camera-btn"
                    className="p-8 rounded-3xl border-3 border-emerald-600 bg-gradient-to-b from-emerald-50 to-emerald-100/60 hover:from-emerald-100 hover:to-emerald-200/80 text-emerald-950 flex flex-col items-center justify-center gap-4 text-center transition-all cursor-pointer group shadow-sm hover:shadow-md"
                  >
                    <div className="w-20 h-20 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                      <Camera className="w-10 h-10" />
                    </div>
                    <div>
                      <h3 className="font-black text-xl text-emerald-900">التقاط مباشر بالكاميرا (الماسح الضوئي)</h3>
                      <p className="text-xs text-emerald-700 mt-1 max-w-xs font-medium">
                        افتح كاميرا الحاسوب أو كاميرا الهاتف أو الويب كام لمسح الورقة مباشرة ضوئياً
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-2 bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-black text-sm shadow-xs">
                      <Camera className="w-4 h-4" />
                      <span>تشغيل الكاميرا الآن</span>
                    </span>
                  </button>

                  {/* Button 2: Upload File / PDF / Image */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    id="scanner-upload-file-btn"
                    className="p-8 rounded-3xl border-3 border-blue-600 bg-gradient-to-b from-blue-50 to-blue-100/60 hover:from-blue-100 hover:to-blue-200/80 text-blue-950 flex flex-col items-center justify-center gap-4 text-center transition-all cursor-pointer group shadow-sm hover:shadow-md"
                  >
                    <div className="w-20 h-20 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                      <Upload className="w-10 h-10" />
                    </div>
                    <div>
                      <h3 className="font-black text-xl text-blue-900">رفع وثيقة أو صورة من الجهاز</h3>
                      <p className="text-xs text-blue-700 mt-1 max-w-xs font-medium">
                        اختيار ملف صورة (JPG, PNG) أو مسح ضوئي محفوظ مسبقاً في الحاسوب
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-2 bg-blue-700 text-white px-5 py-2.5 rounded-xl font-black text-sm shadow-xs">
                      <Upload className="w-4 h-4" />
                      <span>استعراض ملف من الحاسوب</span>
                    </span>
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*,application/pdf"
                    className="hidden"
                  />
                </div>
              )}

              {/* CAMERA ERROR NOTIFICATION */}
              {cameraError && (
                <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-2xl text-rose-900 text-xs font-bold flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                    <span>{cameraError}</span>
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-rose-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
                  >
                    رفع ملف بدلاً من الكاميرا
                  </button>
                </div>
              )}

              {/* CAMERA LIVE STREAM VIEW */}
              {isCameraActive && (
                <div className="bg-slate-950 rounded-3xl p-4 sm:p-6 overflow-hidden border-2 border-emerald-500 shadow-xl space-y-4">
                  {/* Camera Control Header */}
                  <div className="flex flex-wrap justify-between items-center gap-3 text-white">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></span>
                      <span className="font-black text-sm text-emerald-400">الكاميرا قيد التشغيل — ضع الوثيقة في الإطار</span>
                    </div>

                    {cameraDevices.length > 1 && (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-400">تغيير الكاميرا:</span>
                        <select
                          value={selectedDeviceId}
                          onChange={(e) => {
                            setSelectedDeviceId(e.target.value);
                            startCamera(e.target.value);
                          }}
                          className="bg-slate-800 text-white border border-slate-700 rounded-lg px-2 py-1 text-xs"
                        >
                          {cameraDevices.map((d, idx) => (
                            <option key={d.deviceId} value={d.deviceId}>
                              {d.label || `كاميرا ${idx + 1}`}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Video Viewport with A4 Overlay Framing */}
                  <div className="relative mx-auto max-w-2xl bg-black rounded-2xl overflow-hidden aspect-4/3 flex items-center justify-center border border-slate-800 shadow-inner">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-contain"
                    />

                    {/* Visual A4 Document Guide Frame */}
                    <div className="absolute inset-8 border-2 border-dashed border-emerald-400/80 rounded-xl pointer-events-none flex flex-col justify-between p-3">
                      <div className="flex justify-between text-[11px] font-bold text-emerald-300 bg-black/60 px-2 py-0.5 rounded-sm self-start">
                        إطار محاذاة الوثيقة A4
                      </div>
                      <div className="text-center text-xs font-bold text-emerald-300 bg-black/70 py-1 px-3 rounded-full self-center">
                        احرص على ثبات الوثيقة وإضاءة واضحة
                      </div>
                    </div>
                  </div>

                  {/* HUGE CAPTURE BUTTON */}
                  <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                    <button
                      onClick={captureImage}
                      id="scanner-capture-btn"
                      className="flex items-center gap-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-base sm:text-lg px-8 py-4 rounded-2xl shadow-xl transition-transform active:scale-95 cursor-pointer"
                    >
                      <Camera className="w-7 h-7" />
                      <span>التقاط صورة الوثيقة الآن 📸</span>
                    </button>

                    <button
                      onClick={stopCamera}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-5 py-3 rounded-2xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      إلغاء الكاميرا
                    </button>
                  </div>
                </div>
              )}

              {/* PREVIEW & METADATA SECTION (AFTER CAPTURE OR UPLOAD) */}
              {previewImage && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-50 p-4 sm:p-6 rounded-3xl border-2 border-slate-300">
                  
                  {/* Left Column: Image Preview & Enhancement Controls */}
                  <div className="lg:col-span-6 space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                      <span>معاينة الوثيقة الممسوحة ضوئياً:</span>
                      <div className="flex items-center gap-2">
                        {/* Rotate button */}
                        <button
                          onClick={handleRotate}
                          title="تدوير الوثيقة 90 درجة"
                          className="flex items-center gap-1 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          <RotateCw className="w-3.5 h-3.5 text-emerald-700" />
                          <span>تدوير 90°</span>
                        </button>

                        {/* Reset / Retake button */}
                        <button
                          onClick={() => {
                            setPreviewImage(null);
                            setOriginalImage(null);
                          }}
                          className="flex items-center gap-1 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-800 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>إعادة الالتقاط</span>
                        </button>
                      </div>
                    </div>

                    {/* Filter Buttons */}
                    <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs font-bold">
                      <span className="px-2 text-slate-500 text-[11px]">الفلتر:</span>
                      <button
                        onClick={() => handleFilterChange('original')}
                        className={`flex-1 py-1.5 rounded-lg text-center transition-colors cursor-pointer ${
                          colorMode === 'original' ? 'bg-slate-900 text-white' : 'hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        ألوان أصلية
                      </button>
                      <button
                        onClick={() => handleFilterChange('bw')}
                        className={`flex-1 py-1.5 rounded-lg text-center transition-colors cursor-pointer ${
                          colorMode === 'bw' ? 'bg-emerald-700 text-white' : 'hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        ماسح ضوئي (B&W ناصع)
                      </button>
                      <button
                        onClick={() => handleFilterChange('grayscale')}
                        className={`flex-1 py-1.5 rounded-lg text-center transition-colors cursor-pointer ${
                          colorMode === 'grayscale' ? 'bg-slate-700 text-white' : 'hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        تدرج رمادي
                      </button>
                    </div>

                    {/* Document Display Box */}
                    <div className="bg-slate-900 p-2 rounded-2xl flex items-center justify-center min-h-[360px] max-h-[460px] overflow-hidden shadow-inner">
                      <img
                        src={previewImage}
                        alt="Scanned Document Preview"
                        className="max-h-[440px] w-auto max-w-full object-contain rounded-lg shadow-md"
                      />
                    </div>
                  </div>

                  {/* Right Column: Metadata Details & Big Save Button */}
                  <div className="lg:col-span-6 flex flex-col justify-between space-y-4 bg-white p-5 rounded-2xl border border-slate-200">
                    <div className="space-y-4">
                      <h4 className="font-black text-sm text-slate-900 pb-2 border-b border-slate-200 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-emerald-600" />
                        <span>بيانات وتصنيف الوثيقة الإدارية:</span>
                      </h4>

                      {/* Document Type Category */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          نوع الوثيقة المستنسخة ضوئياً:
                        </label>
                        <select
                          value={docCategory}
                          onChange={(e) => setDocCategory(e.target.value as DocumentCategory)}
                          id="scanner-doc-category-select"
                          className="w-full bg-slate-50 border-2 border-slate-300 font-bold text-slate-900 rounded-xl p-2.5 text-xs sm:text-sm focus:border-emerald-600 focus:outline-hidden"
                        >
                          <option value="رخصة عطلة موقعة">رخصة عطلة موقعة ومختومة (FOR.GRH.010)</option>
                          <option value="محضر استئناف">محضر استئناف العمل (PV de Reprise)</option>
                          <option value="شهادة طبية">شهادة طبية / عطلة مرضية</option>
                          <option value="سند مداومة">سند أو مقرر مداومة (مؤشر)</option>
                          <option value="قرار إداري / تعيين">قرار إداري / قرار تعيين أو ترقية</option>
                          <option value="طلب خطي">طلب عطلة خطي للمعني</option>
                          <option value="بطاقة هوية">بطاقة التعريف الوطنية / وثيقة هوية</option>
                          <option value="أخرى">وثيقة إدارية أخرى</option>
                        </select>
                      </div>

                      {/* Document Title */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          عنوان الوثيقة أو التسمية الرسمية:
                        </label>
                        <input
                          type="text"
                          value={docTitle}
                          onChange={(e) => setDocTitle(e.target.value)}
                          placeholder="مثال: رخصة عطلة سنوية شهر جويلية 2026"
                          className="w-full bg-slate-50 border border-slate-300 font-bold text-slate-900 rounded-xl p-2.5 text-xs sm:text-sm focus:border-emerald-600 focus:outline-hidden"
                        />
                      </div>

                      {/* Administrative Notes */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          ملاحظات إضافية أو رقم الوثيقة (اختياري):
                        </label>
                        <textarea
                          rows={2}
                          value={docNotes}
                          onChange={(e) => setDocNotes(e.target.value)}
                          placeholder="مثال: تم التأشير عليها من الأمين العام للكلية، المدة 15 يوماً"
                          className="w-full bg-slate-50 border border-slate-300 font-medium text-slate-900 rounded-xl p-2.5 text-xs focus:border-emerald-600 focus:outline-hidden"
                        />
                      </div>

                      {/* Selected Employee Summary Card */}
                      <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200 text-xs text-emerald-950 space-y-1">
                        <div className="font-bold flex justify-between">
                          <span>الموظف: {selectedEmployee.fullName}</span>
                          <span className="text-emerald-700">رقم: {selectedEmployee.id}</span>
                        </div>
                        <div className="text-emerald-800 text-[11px]">
                          الرتبة: {selectedEmployee.rank} — المصلحة: {selectedEmployee.department || 'كلية الرياضيات وعلوم المادة'}
                        </div>
                      </div>
                    </div>

                    {/* BIG ACTION BUTTONS */}
                    <div className="pt-4 border-t border-slate-200 space-y-2">
                      <button
                        onClick={handleSaveDocument}
                        id="save-scanned-doc-btn"
                        className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-black text-sm sm:text-base py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
                      >
                        <Save className="w-5 h-5" />
                        <span>حفظ الوثيقة في ملف الموظف 💾</span>
                      </button>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handlePrintDocument(previewImage, docTitle)}
                          className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 border border-slate-300 transition-colors cursor-pointer"
                        >
                          <Printer className="w-4 h-4 text-slate-600" />
                          <span>طباعة فورية A4 🖨️</span>
                        </button>

                        <button
                          onClick={() => {
                            setPreviewImage(null);
                            setOriginalImage(null);
                          }}
                          className="bg-slate-100 hover:bg-rose-50 hover:text-rose-800 text-slate-600 font-bold text-xs py-2.5 px-3 rounded-xl transition-colors cursor-pointer"
                        >
                          إلغاء
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              )}

            </div>
          )}

          {/* ================= VIEW 2: ARCHIVE OF SCANNED DOCUMENTS FOR EMPLOYEE ================= */}
          {activeView === 'archive' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <h3 className="font-black text-base text-slate-900">
                    الملف الرقمي والوثائق الممسوحة ضوئياً: {selectedEmployee.fullName}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    إجمالي الوثائق المحفوظة: {employeeDocs.length} وثيقة في قاعدة البيانات المحلية
                  </p>
                </div>

                <button
                  onClick={() => setActiveView('scan')}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-2xs"
                >
                  <Camera className="w-4 h-4" />
                  <span>مسح وثيقة جديدة لهذا الموظف 📸</span>
                </button>
              </div>

              {isLoadingDocs ? (
                <div className="p-12 text-center text-slate-500 font-bold text-sm">
                  جارٍ تحميل الوثائق الضوئية...
                </div>
              ) : employeeDocs.length === 0 ? (
                <div className="p-12 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-300 space-y-3">
                  <FolderOpen className="w-12 h-12 text-slate-400 mx-auto" />
                  <h4 className="font-bold text-slate-800 text-sm">لا توجد وثائق ممسوحة ضوئياً لهذا الموظف حتى الآن</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    يمكنك الآن استنساخ أوراق ملف الموظف ضوئياً (رخصة العطلة، الشهادات الطبية، محضر الاستئناف، طلبات خطية) بسهولة عبر الكاميرا أو رفعها من الحاسوب.
                  </p>
                  <button
                    onClick={() => setActiveView('scan')}
                    className="mt-2 inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs px-5 py-2.5 rounded-xl shadow-xs cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>ابدأ مسح أول وثيقة الآن</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {employeeDocs.map((doc) => (
                    <div
                      key={doc.id}
                      className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow overflow-hidden flex flex-col justify-between group"
                    >
                      {/* Document Thumbnail with Hover Preview */}
                      <div 
                        onClick={() => setZoomDoc(doc)}
                        className="relative bg-slate-900 aspect-4/3 overflow-hidden cursor-pointer flex items-center justify-center"
                      >
                        <img
                          src={doc.fileDataUrl}
                          alt={doc.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-1 text-xs font-bold">
                          <Eye className="w-5 h-5" />
                          <span>معاينة وتكبير</span>
                        </div>
                        <span className="absolute top-2 right-2 bg-slate-900/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-xs">
                          {doc.category}
                        </span>
                      </div>

                      {/* Card Content */}
                      <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="font-bold text-xs text-slate-900 line-clamp-1" title={doc.title}>
                            {doc.title}
                          </h4>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            تاريخ المسح: {new Date(doc.createdAt).toLocaleDateString('ar-DZ')}
                          </p>
                          {doc.notes && (
                            <p className="text-[11px] text-slate-600 bg-slate-50 p-1.5 rounded-md mt-1 line-clamp-2">
                              {doc.notes}
                            </p>
                          )}
                        </div>

                        {/* Card Action Buttons */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setZoomDoc(doc)}
                              title="تكبير ومعاينة"
                              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
                            >
                              <Maximize2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handlePrintDocument(doc.fileDataUrl, doc.title)}
                              title="طباعة A4 مباشرة"
                              className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                            <a
                              href={doc.fileDataUrl}
                              download={doc.fileName}
                              title="تحميل الصورة"
                              className="p-1.5 rounded-lg text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          </div>

                          <button
                            onClick={() => handleDeleteDoc(doc.id, doc.title)}
                            title="حذف الوثيقة"
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
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

        {/* FULLSCREEN ZOOM MODAL */}
        {zoomDoc && (
          <div className="fixed inset-0 z-60 bg-slate-950/90 flex flex-col p-4 backdrop-blur-sm">
            <div className="flex justify-between items-center text-white pb-3 border-b border-slate-800">
              <div>
                <h3 className="font-black text-sm sm:text-base">{zoomDoc.title}</h3>
                <span className="text-xs text-slate-400">
                  {zoomDoc.category} — {selectedEmployee.fullName} — {new Date(zoomDoc.createdAt).toLocaleDateString('ar-DZ')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePrintDocument(zoomDoc.fileDataUrl, zoomDoc.title)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة A4</span>
                </button>
                <a
                  href={zoomDoc.fileDataUrl}
                  download={zoomDoc.fileName}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>تحميل</span>
                </a>
                <button
                  onClick={() => setZoomDoc(null)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
              <img
                src={zoomDoc.fileDataUrl}
                alt={zoomDoc.title}
                className="max-h-[85vh] max-w-[90vw] object-contain rounded-xl shadow-2xl bg-white"
              />
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
