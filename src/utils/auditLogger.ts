import { AuditLogEntry, AppUser, UserRole } from '../types';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import * as XLSX from 'xlsx';

const AUDIT_STORAGE_KEY = 'km_leaves_audit_logs_v1';

export function getAuditLogs(): AuditLogEntry[] {
  try {
    const raw = localStorage.getItem(AUDIT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading audit logs:', err);
  }
  return [];
}

export function saveAuditLogs(logs: AuditLogEntry[]): void {
  try {
    localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(logs.slice(0, 1000))); // Keep up to 1000 entries
  } catch (err) {
    console.error('Error saving audit logs:', err);
  }
}

export function logAuditAction(
  user: AppUser | null,
  action: {
    actionType: AuditLogEntry['actionType'];
    employeeId?: number;
    employeeName?: string;
    details: string;
    changes?: AuditLogEntry['changes'];
  }
): AuditLogEntry {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const formattedDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

  const entry: AuditLogEntry = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: now.toISOString(),
    formattedDate,
    userId: user?.id || 'system',
    userName: user?.name || 'مستخدم النظام',
    userRole: user?.role || 'admin',
    userRoleTitle: user?.roleTitle || 'مسؤول النظام',
    actionType: action.actionType,
    employeeId: action.employeeId,
    employeeName: action.employeeName,
    details: action.details,
    changes: action.changes,
  };

  const currentLogs = getAuditLogs();
  const updatedLogs = [entry, ...currentLogs];
  saveAuditLogs(updatedLogs);

  // Sync to Cloud Firestore asynchronously
  try {
    setDoc(doc(db, 'system', 'auditLogs'), {
      logs: updatedLogs.slice(0, 500),
      lastUpdated: now.toISOString(),
      lastAction: entry.actionType,
      performedBy: entry.userName,
    }, { merge: true }).catch(err => {
      handleFirestoreError(err, OperationType.WRITE, 'system/auditLogs');
    });
  } catch {
    // Non-blocking
  }

  return entry;
}

export function exportAuditLogsExcel(logs: AuditLogEntry[]): void {
  const rows = logs.map((log, index) => ({
    'الرقم': index + 1,
    'التاريخ والوقت': log.formattedDate,
    'من قام بالعملية': log.userName,
    'الصفة / الدور': log.userRoleTitle,
    'نوع الإجراء': log.actionType,
    'الموظف المعني': log.employeeName || (log.employeeId ? `موظف #${log.employeeId}` : '—'),
    'تفاصيل العملية': log.details,
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'سجل الرقابة الإدارية');
  XLSX.writeFile(workbook, `سجل_الرقابة_والعمليات_كلية_الرياضيات_${new Date().toISOString().split('T')[0]}.xlsx`);
}
