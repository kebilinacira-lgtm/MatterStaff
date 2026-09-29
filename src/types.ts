export type LeaveType = 
  | 'سنوية' // Annual leave
  | 'تعويضية' // Compensatory leave (moudaouama)
  | 'استثنائية' // Exceptional leave (marriage, circumcision, birth, death)
  | 'أمومة' // Maternity leave
  | 'مرضية' // Sick leave
  | 'مداومة' // Permanence addition
  | 'مخلفات'; // Backlog carryover

export type EmployeeStatus = 
  | 'نشط' // Active
  | 'في عطلة' // Currently on leave
  | 'وضع تحت التصرف' // Put at disposal
  | 'محول' // Transferred
  | 'عطلة أمومة' // Maternity
  | 'عطلة مرضية' // Long sick leave
  | 'وفاة' // Deceased
  | 'مؤرشف'; // Archived

export interface LeaveTransaction {
  id: string;
  date: string; // YYYY-MM-DD
  type: LeaveType;
  action: 'إضافة' | 'خصم'; // Add or deduct
  days: number;
  reason: string; // e.g. "مداومة يوم السبت", "عقد زواج", "رخصة عطلة سنوية"
  note?: string;
  year?: number;
  // Official scanned proof fields:
  hasProof?: boolean;
  proofDocId?: string;
  proofTitle?: string;
  proofDataUrl?: string;
  proofCategory?: DocumentCategory;
  verifiedBy?: string; // e.g. "موافقة رئيس المصلحة / العميد"
  attachedAt?: string;
  performedBy?: string; // اسم الحساب الذي أجرى المعاملة
  performedRole?: 'admin' | 'assistant'; // رتبة الحساب
}

export type UserRole = 'admin' | 'assistant';

export interface AppUser {
  id: string; // 'admin' | 'assistant'
  username: string;
  name: string; // 'مسؤول مصلحة المستخدمين' | 'مساعدة مسؤول المصلحة'
  role: UserRole;
  roleTitle: string; // 'مسؤول المصلحة (الرئيس)' | 'مساعدة المسؤول (المساعدة الإدارية)'
  passwordHash: string; // Stored password
  avatarColor: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string; // ISO string
  formattedDate: string; // e.g. '16-09-2026 10:45:12'
  userId: string;
  userName: string;
  userRole: UserRole;
  userRoleTitle: string;
  actionType: 
    | 'إصدار رخصة عطلة'
    | 'خصم عطلة'
    | 'تسجيل مداومة'
    | 'إضافة مخلفات'
    | 'تسوية رصيد'
    | 'تعديل بيانات وأرصدة موظف'
    | 'إضافة موظف جديد'
    | 'حذف موظف'
    | 'استيراد بيانات إكسل'
    | 'استرجاع البيانات الأصلية'
    | 'أرشفة وثيقة ضوئية';
  employeeId?: number;
  employeeName?: string;
  details: string;
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
}

export interface Employee {
  id: number;
  nationalId?: string;
  fullName: string;
  rank: string; // الرتبة e.g. متصرف رئيسي، مهندس دولة
  department?: string; // القسم / المصلحة
  annualLeave: number; // العطلة السنوية
  exceptionalLeave: number; // العطلة الاستثنائية (e.g. 10 days max per year)
  compensatoryLeave: number; // العطلة التعويضية
  additions: number; // الإضافات / مخلفات
  maternityNursingHours?: string; // ساعات الرضاعة / عطلة أمومة
  totalRemaining: number; // الباقي من مجموع العطل
  status: EmployeeStatus;
  notes: string; // ملاحظات e.g. تحويل، وضع تحت التصرف
  transactions?: LeaveTransaction[];
}

export interface LeaveRequestForm {
  employeeId: number;
  employeeName: string;
  rank: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  durationDays: number;
  reason: string;
  interimEmployeeName?: string; // الموظف المستخلف
  year: number;
  // Official scanned proof
  hasProof?: boolean;
  proofDocId?: string;
  proofTitle?: string;
  proofDataUrl?: string;
}

export type DocumentCategory = 
  | 'موافقة المسؤول المباشر'
  | 'رخصة عطلة موقعة'
  | 'محضر استئناف'
  | 'شهادة طبية'
  | 'سند مداومة'
  | 'قرار إداري / تعيين'
  | 'طلب خطي'
  | 'بطاقة هوية'
  | 'أخرى';

export interface ScannedDocument {
  id: string;
  employeeId: number;
  employeeName: string;
  title: string;
  category: DocumentCategory;
  fileName: string;
  fileDataUrl: string; // Base64 image/pdf data URL
  fileType: string;
  fileSize: number;
  createdAt: string; // ISO date
  notes?: string;
}

