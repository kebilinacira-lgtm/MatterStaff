import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Employee, EmployeeStatus, LeaveRequestForm, LeaveTransaction, DocumentCategory, AuditLogEntry } from '../types';
import { initialEmployees } from '../data/initialEmployees';
import { saveScannedDocument } from '../utils/documentStorage';
import { getAuditLogs, logAuditAction, exportAuditLogsExcel } from '../utils/auditLogger';
import { useAuth } from './AuthContext';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import * as XLSX from 'xlsx';

interface LeavesContextType {
  employees: Employee[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedRank: string;
  setSelectedRank: (rank: string) => void;
  selectedStatus: string;
  setSelectedStatus: (status: string) => void;
  selectedBalanceFilter: string;
  setSelectedBalanceFilter: (filter: string) => void;
  selectedEmployee: Employee | null;
  setSelectedEmployee: (emp: Employee | null) => void;
  privacyMode: boolean;
  setPrivacyMode: (val: boolean) => void;
  addEmployee: (emp: Omit<Employee, 'id' | 'totalRemaining'>) => void;
  updateEmployee: (id: number, updated: Partial<Employee>) => void;
  updateEmployeeBalancesAndInfo: (
    empId: number,
    data: {
      fullName: string;
      rank: string;
      department?: string;
      annualLeave: number;
      compensatoryLeave: number;
      additions: number;
      exceptionalLeave: number;
      status: EmployeeStatus;
      notes: string;
      maternityNursingHours?: string;
    }
  ) => void;
  deleteEmployee: (id: number) => void;
  recordLeave: (req: LeaveRequestForm) => { success: boolean; message: string };
  recordPermanence: (
    empId: number,
    days: number,
    date: string,
    note: string,
    proof?: { hasProof?: boolean; proofDocId?: string; proofTitle?: string; proofDataUrl?: string }
  ) => void;
  attachProofToTransaction: (
    employeeId: number,
    transactionId: string,
    proof: { proofDocId?: string; proofTitle: string; proofDataUrl: string; proofCategory?: DocumentCategory }
  ) => void;
  addBacklog: (empId: number, days: number, year: number, note: string) => void;
  adjustBalance: (empId: number, type: 'annual' | 'compensatory' | 'exceptional', delta: number, note: string) => void;
  logLicensePrinted: (emp: Employee, leaveType: string, days: number, startDate: string, endDate: string) => void;
  auditLogs: AuditLogEntry[];
  refreshAuditLogs: () => void;
  exportAuditLogs: () => void;
  resetToOriginalData: () => void;
  clearAllEmployees: () => void;
  loadCleanSampleData: () => void;
  auditAndRecalculateAll: () => { auditedCount: number; fixedCount: number };
  exportToExcel: () => void;
  downloadTemplateExcel: () => void;
  importFromExcel: (file: File) => Promise<{ count: number }>;
  exportBackupJSON: () => void;
  importBackupJSON: (jsonData: string) => boolean;
  activeTab: 'table' | 'analytics' | 'print' | 'guide';
  setActiveTab: (tab: 'table' | 'analytics' | 'print' | 'guide') => void;
}

const STORAGE_KEY = 'km_ouargla_faculty_leaves_data_v4';

const parseNumber = (val: any, defaultVal = 0): number => {
  if (val === undefined || val === null || val === '') return defaultVal;
  if (typeof val === 'number') return isNaN(val) ? defaultVal : val;
  const cleaned = String(val).replace(',', '.').replace(/[^\d.-]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? defaultVal : num;
};

const LeavesContext = createContext<LeavesContextType | undefined>(undefined);

export const LeavesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => getAuditLogs());

  const refreshAuditLogs = () => {
    setAuditLogs(getAuditLogs());
  };

  const exportAuditLogs = () => {
    exportAuditLogsExcel(auditLogs);
  };

  const [employees, setEmployees] = useState<Employee[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Fallback
    }
    return initialEmployees;
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRank, setSelectedRank] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedBalanceFilter, setSelectedBalanceFilter] = useState('ALL');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [privacyMode, setPrivacyMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'table' | 'analytics' | 'print' | 'guide'>('table');

  // Cloud sync flag to prevent infinite echo updates
  const isIncomingCloudUpdate = useRef(false);
  const cloudDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Listen to live cloud changes from the other user
  useEffect(() => {
    const sharedDocRef = doc(db, 'system', 'sharedData');
    
    // Initial fetch to populate cloud if empty, or load from cloud
    const initializeCloudSync = async () => {
      try {
        const snap = await getDoc(sharedDocRef);
        if (snap.exists()) {
          const data = snap.data();
          if (data && Array.isArray(data.employees) && data.employees.length > 0) {
            isIncomingCloudUpdate.current = true;
            setEmployees(data.employees);
          }
        } else {
          // If cloud has no record yet, upload current initial list
          await setDoc(sharedDocRef, {
            employees,
            updatedAt: new Date().toISOString(),
            updatedBy: currentUser?.name || 'النظام',
            updatedByRole: currentUser?.role || 'admin',
          });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, 'system/sharedData');
      }
    };

    initializeCloudSync();

    // Live real-time listener for instant updates between Admin and Assistant
    const unsubscribe = onSnapshot(sharedDocRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data && Array.isArray(data.employees)) {
          // Check if this update came from another user or session
          if (!isIncomingCloudUpdate.current) {
            isIncomingCloudUpdate.current = true;
            setEmployees(data.employees);
          }
        }
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'system/sharedData');
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Persist to local storage AND sync to Cloud Firestore
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(employees));
    } catch {
      // Storage quota or error
    }

    // If change was caused by remote cloud, don't re-upload immediately
    if (isIncomingCloudUpdate.current) {
      isIncomingCloudUpdate.current = false;
      return;
    }

    // Debounce cloud write by 800ms
    if (cloudDebounceRef.current) clearTimeout(cloudDebounceRef.current);
    cloudDebounceRef.current = setTimeout(async () => {
      try {
        const sharedDocRef = doc(db, 'system', 'sharedData');
        await setDoc(sharedDocRef, {
          employees,
          updatedAt: new Date().toISOString(),
          updatedBy: currentUser?.name || 'مستخدم المنصة',
          updatedByRole: currentUser?.role || 'admin',
        }, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'system/sharedData');
      }
    }, 800);

    return () => {
      if (cloudDebounceRef.current) clearTimeout(cloudDebounceRef.current);
    };
  }, [employees]);

  // Add new employee
  const addEmployee = (empData: Omit<Employee, 'id' | 'totalRemaining'>) => {
    const nextId = employees.length > 0 ? Math.max(...employees.map(e => e.id)) + 1 : 1;
    const totalRemaining = empData.annualLeave + empData.compensatoryLeave + (empData.additions || 0);
    const newEmp: Employee = {
      ...empData,
      id: nextId,
      totalRemaining,
      transactions: [
        {
          id: `tx-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          type: 'سنوية',
          action: 'إضافة',
          days: empData.annualLeave,
          reason: 'تسجيل موظف جديد بالرصيد الأولي',
          performedBy: currentUser?.name || 'مستخدم المنصة',
          performedRole: currentUser?.role || 'admin',
        }
      ]
    };
    setEmployees(prev => [newEmp, ...prev]);
    logAuditAction(currentUser, {
      actionType: 'إضافة موظف جديد',
      employeeId: newEmp.id,
      employeeName: newEmp.fullName,
      details: `تمت إضافة الموظف الجديد "${newEmp.fullName}" برتبة ${newEmp.rank}. الرصيد الأولي: سنوية (${newEmp.annualLeave})، تعويضية (${newEmp.compensatoryLeave})، إضافات (${newEmp.additions || 0})، المجموع (${totalRemaining} يوم).`,
    });
    refreshAuditLogs();
  };

  // Update employee basic details
  const updateEmployee = (id: number, updated: Partial<Employee>) => {
    const currentEmp = employees.find(e => e.id === id);
    setEmployees(prev =>
      prev.map(emp => {
        if (emp.id === id) {
          const merged = { ...emp, ...updated };
          merged.totalRemaining = merged.annualLeave + merged.compensatoryLeave + (merged.additions || 0);
          if (selectedEmployee && selectedEmployee.id === id) {
            setSelectedEmployee(merged);
          }
          return merged;
        }
        return emp;
      })
    );
    logAuditAction(currentUser, {
      actionType: 'تعديل بيانات وأرصدة موظف',
      employeeId: id,
      employeeName: updated.fullName || currentEmp?.fullName,
      details: `تم تعديل بيانات الموظف "${updated.fullName || currentEmp?.fullName}".`,
    });
    refreshAuditLogs();
  };

  // Update employee balances and complete administrative info
  const updateEmployeeBalancesAndInfo = (
    empId: number,
    data: {
      fullName: string;
      rank: string;
      department?: string;
      annualLeave: number;
      compensatoryLeave: number;
      additions: number;
      exceptionalLeave: number;
      status: EmployeeStatus;
      notes: string;
      maternityNursingHours?: string;
    }
  ) => {
    const currentEmp = employees.find(e => e.id === empId);
    const total = Number(data.annualLeave) + Number(data.compensatoryLeave) + Number(data.additions || 0);

    const changes: string[] = [];
    if (currentEmp) {
      if (currentEmp.annualLeave !== data.annualLeave) changes.push(`السنوية: ${currentEmp.annualLeave} ➔ ${data.annualLeave}`);
      if (currentEmp.compensatoryLeave !== data.compensatoryLeave) changes.push(`التعويضية: ${currentEmp.compensatoryLeave} ➔ ${data.compensatoryLeave}`);
      if (currentEmp.additions !== data.additions) changes.push(`الإضافات: ${currentEmp.additions} ➔ ${data.additions}`);
      if (currentEmp.status !== data.status) changes.push(`الحالة: ${currentEmp.status} ➔ ${data.status}`);
      if (currentEmp.rank !== data.rank) changes.push(`الرتبة: ${currentEmp.rank} ➔ ${data.rank}`);
      if (currentEmp.fullName !== data.fullName) changes.push(`الاسم: ${currentEmp.fullName} ➔ ${data.fullName}`);
    }

    setEmployees(prev =>
      prev.map(emp => {
        if (emp.id === empId) {
          const updated: Employee = {
            ...emp,
            fullName: data.fullName,
            rank: data.rank,
            department: data.department || emp.department,
            annualLeave: Number(data.annualLeave),
            compensatoryLeave: Number(data.compensatoryLeave),
            additions: Number(data.additions || 0),
            exceptionalLeave: Number(data.exceptionalLeave || 10),
            totalRemaining: total,
            status: data.status,
            notes: data.notes,
            maternityNursingHours: data.maternityNursingHours || undefined,
          };
          if (selectedEmployee && selectedEmployee.id === empId) {
            setSelectedEmployee(updated);
          }
          return updated;
        }
        return emp;
      })
    );

    logAuditAction(currentUser, {
      actionType: 'تعديل بيانات وأرصدة موظف',
      employeeId: empId,
      employeeName: data.fullName,
      details: changes.length > 0 
        ? `تعديل سجل ورصيد الموظف "${data.fullName}": ${changes.join(' • ')} (المجموع الجديد: ${total} يوم)`
        : `تحديث بيانات الموظف "${data.fullName}" ورصيده المتبقي (${total} يوم)`,
    });
    refreshAuditLogs();
  };

  // Delete employee
  const deleteEmployee = (id: number) => {
    const empToDelete = employees.find(e => e.id === id);
    setEmployees(prev => prev.filter(e => e.id !== id));
    if (selectedEmployee && selectedEmployee.id === id) {
      setSelectedEmployee(null);
    }
    logAuditAction(currentUser, {
      actionType: 'حذف موظف',
      employeeId: id,
      employeeName: empToDelete?.fullName,
      details: `تم حذف الموظف "${empToDelete?.fullName || id}" نهائياً من سجل المنصة.`,
    });
    refreshAuditLogs();
  };

  // Record leave (deduct days from balance)
  const recordLeave = (req: LeaveRequestForm): { success: boolean; message: string } => {
    const emp = employees.find(e => e.id === req.employeeId);
    if (!emp) return { success: false, message: 'الموظف غير موجود' };

    let annual = emp.annualLeave;
    let comp = emp.compensatoryLeave;
    let except = emp.exceptionalLeave;

    // If proof dataUrl is provided and no proofDocId, auto-save to scanned docs
    let assignedDocId = req.proofDocId;
    if (req.hasProof && req.proofDataUrl && !assignedDocId) {
      assignedDocId = `doc-${Date.now()}`;
      saveScannedDocument({
        id: assignedDocId,
        employeeId: emp.id,
        employeeName: emp.fullName,
        title: req.proofTitle || `إثبات وموافقة عطلة ${req.leaveType} (${req.startDate})`,
        category: 'موافقة المسؤول المباشر',
        fileName: `leave_approval_${req.startDate}.jpg`,
        fileDataUrl: req.proofDataUrl,
        fileType: 'image/jpeg',
        fileSize: Math.round(req.proofDataUrl.length * 0.75),
        createdAt: new Date().toISOString(),
        notes: `إثبات موافقة الإدارة على رخصة عطلة ${req.durationDays} يوم من ${req.startDate} إلى ${req.endDate}`,
      }).catch(err => console.error('Failed to auto-archive leave proof:', err));
    }

    const tx: LeaveTransaction = {
      id: `tx-${Date.now()}`,
      date: req.startDate,
      type: req.leaveType,
      action: 'خصم',
      days: req.durationDays,
      reason: `${req.reason} (من ${req.startDate} إلى ${req.endDate})`,
      note: req.interimEmployeeName ? `المستخلف: ${req.interimEmployeeName}` : undefined,
      year: req.year,
      performedBy: currentUser?.name || 'مستخدم المنصة',
      performedRole: currentUser?.role || 'admin',
      hasProof: Boolean(req.hasProof),
      proofDocId: assignedDocId,
      proofTitle: req.proofTitle || (req.hasProof ? 'موافقة وتأشيرة المسؤول المباشر' : undefined),
      proofDataUrl: req.proofDataUrl,
      proofCategory: req.hasProof ? 'موافقة المسؤول المباشر' : undefined,
      verifiedBy: req.hasProof ? 'موافقة وتأشيرة المسؤول المباشر / الإدارة' : undefined,
      attachedAt: req.hasProof ? new Date().toISOString() : undefined,
    };

    if (req.leaveType === 'سنوية') {
      if (annual < req.durationDays) {
        return { success: false, message: `رصيد العطلة السنوية (${annual} يوم) غير كافٍ لطلب ${req.durationDays} يوم.` };
      }
      annual -= req.durationDays;
    } else if (req.leaveType === 'تعويضية') {
      if (comp < req.durationDays) {
        return { success: false, message: `رصيد العطلة التعويضية (${comp} يوم) غير كافٍ لطلب ${req.durationDays} يوم.` };
      }
      comp -= req.durationDays;
    } else if (req.leaveType === 'استثنائية') {
      if (except < req.durationDays) {
        return { success: false, message: `رصيد العطلة الاستثنائية المتبقي (${except} يوم) غير كافٍ لطلب ${req.durationDays} يوم.` };
      }
      except -= req.durationDays;
    }

    const updatedEmp: Employee = {
      ...emp,
      annualLeave: annual,
      compensatoryLeave: comp,
      exceptionalLeave: except,
      totalRemaining: annual + comp + (emp.additions || 0),
      notes: emp.notes ? `${emp.notes} | رخصة عطلة ${req.durationDays} يوم (${req.leaveType})` : `رخصة عطلة ${req.durationDays} يوم`,
      transactions: [tx, ...(emp.transactions || [])],
    };

    setEmployees(prev => prev.map(e => (e.id === req.employeeId ? updatedEmp : e)));
    if (selectedEmployee && selectedEmployee.id === req.employeeId) {
      setSelectedEmployee(updatedEmp);
    }

    logAuditAction(currentUser, {
      actionType: 'خصم عطلة',
      employeeId: req.employeeId,
      employeeName: emp.fullName,
      details: `خصم ${req.durationDays} يوم عطلة ${req.leaveType} من ${req.startDate} إلى ${req.endDate} (المتبقي: ${updatedEmp.totalRemaining} يوم). السبب: ${req.reason}`,
    });
    refreshAuditLogs();

    return { success: true, message: `تم تسجيل العطلة بنجاح وخصم ${req.durationDays} يوم من رصيد ${req.leaveType}.` };
  };

  // Record permanence (مداومة) -> adds compensatory leave (عادة يومان)
  const recordPermanence = (
    empId: number,
    days: number,
    date: string,
    note: string,
    proof?: { hasProof?: boolean; proofDocId?: string; proofTitle?: string; proofDataUrl?: string }
  ) => {
    const emp = employees.find(e => e.id === empId);
    let assignedDocId = proof?.proofDocId;
    if (emp && proof?.hasProof && proof?.proofDataUrl && !assignedDocId) {
      assignedDocId = `doc-${Date.now()}`;
      saveScannedDocument({
        id: assignedDocId,
        employeeId: emp.id,
        employeeName: emp.fullName,
        title: proof.proofTitle || `سند مداومة وموافقة رسمية (${date})`,
        category: 'سند مداومة',
        fileName: `permanence_order_${date}.jpg`,
        fileDataUrl: proof.proofDataUrl,
        fileType: 'image/jpeg',
        fileSize: Math.round(proof.proofDataUrl.length * 0.75),
        createdAt: new Date().toISOString(),
        notes: `إثبات وتأشيرة مداومة ${days} يوم تعويضي بتاريخ ${date}`,
      }).catch(err => console.error('Failed to auto-archive permanence proof:', err));
    }

    const tx: LeaveTransaction = {
      id: `tx-${Date.now()}`,
      date: date || new Date().toISOString().split('T')[0],
      type: 'مداومة',
      action: 'إضافة',
      days,
      reason: `مداومة رسمية بتاريخ ${date}`,
      note: note || undefined,
      performedBy: currentUser?.name || 'مستخدم المنصة',
      performedRole: currentUser?.role || 'admin',
      hasProof: Boolean(proof?.hasProof),
      proofDocId: assignedDocId,
      proofTitle: proof?.proofTitle || (proof?.hasProof ? 'سند مداومة مؤشر من المسؤول' : undefined),
      proofDataUrl: proof?.proofDataUrl,
      proofCategory: proof?.hasProof ? 'سند مداومة' : undefined,
      verifiedBy: proof?.hasProof ? 'تأشيرة وموافقة رئيس المصلحة / الأمين العام' : undefined,
      attachedAt: proof?.hasProof ? new Date().toISOString() : undefined,
    };

    setEmployees(prev =>
      prev.map(emp => {
        if (emp.id === empId) {
          const newComp = emp.compensatoryLeave + days;
          const updatedNote = emp.notes ? `${emp.notes} | إضافة ${days} يوم مداومة (${date})` : `إضافة ${days} يوم مداومة (${date})`;
          const updated: Employee = {
            ...emp,
            compensatoryLeave: newComp,
            totalRemaining: emp.annualLeave + newComp + (emp.additions || 0),
            notes: updatedNote,
            transactions: [tx, ...(emp.transactions || [])],
          };
          if (selectedEmployee && selectedEmployee.id === empId) {
            setSelectedEmployee(updated);
          }
          return updated;
        }
        return emp;
      })
    );

    logAuditAction(currentUser, {
      actionType: 'تسجيل مداومة',
      employeeId: empId,
      employeeName: emp?.fullName,
      details: `تسجيل مداومة وإضافة ${days} يوم رصيد تعويضي بتاريخ ${date}. الملاحظة: ${note || 'لا توجد'}`,
    });
    refreshAuditLogs();
  };

  // Attach or update proof for an existing transaction
  const attachProofToTransaction = (
    employeeId: number,
    transactionId: string,
    proof: { proofDocId?: string; proofTitle: string; proofDataUrl: string; proofCategory?: DocumentCategory }
  ) => {
    const emp = employees.find(e => e.id === employeeId);
    let assignedDocId = proof.proofDocId;
    if (emp && proof.proofDataUrl && !assignedDocId) {
      assignedDocId = `doc-${Date.now()}`;
      saveScannedDocument({
        id: assignedDocId,
        employeeId: emp.id,
        employeeName: emp.fullName,
        title: proof.proofTitle,
        category: proof.proofCategory || 'موافقة المسؤول المباشر',
        fileName: `proof_${transactionId}.jpg`,
        fileDataUrl: proof.proofDataUrl,
        fileType: 'image/jpeg',
        fileSize: Math.round(proof.proofDataUrl.length * 0.75),
        createdAt: new Date().toISOString(),
        notes: `إثبات وموافقة مرفقة للعملية رقم ${transactionId}`,
      }).catch(err => console.error('Failed to save proof document:', err));
    }

    setEmployees(prev =>
      prev.map(e => {
        if (e.id === employeeId && e.transactions) {
          const updatedTxs = e.transactions.map(t => {
            if (t.id === transactionId) {
              return {
                ...t,
                hasProof: true,
                proofDocId: assignedDocId,
                proofTitle: proof.proofTitle,
                proofDataUrl: proof.proofDataUrl,
                proofCategory: proof.proofCategory || 'موافقة المسؤول المباشر',
                verifiedBy: 'موافقة وتأشيرة الإدارة المؤكدة',
                attachedAt: new Date().toISOString(),
              };
            }
            return t;
          });
          const updatedEmp = { ...e, transactions: updatedTxs };
          if (selectedEmployee && selectedEmployee.id === employeeId) {
            setSelectedEmployee(updatedEmp);
          }
          return updatedEmp;
        }
        return e;
      })
    );
  };

  // Add backlog / carryover
  const addBacklog = (empId: number, days: number, year: number, note: string) => {
    const emp = employees.find(e => e.id === empId);
    const tx: LeaveTransaction = {
      id: `tx-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      type: 'مخلفات',
      action: 'إضافة',
      days,
      reason: `مخلفات عطلة لسنة ${year}`,
      note: note || undefined,
      year,
      performedBy: currentUser?.name || 'مستخدم المنصة',
      performedRole: currentUser?.role || 'admin',
    };

    setEmployees(prev =>
      prev.map(item => {
        if (item.id === empId) {
          const newAnnual = item.annualLeave + days;
          const updated: Employee = {
            ...item,
            annualLeave: newAnnual,
            totalRemaining: newAnnual + item.compensatoryLeave + (item.additions || 0),
            notes: item.notes ? `${item.notes} | إضافة ${days} يوم مخلفات ${year}` : `إضافة ${days} يوم مخلفات ${year}`,
            transactions: [tx, ...(item.transactions || [])],
          };
          if (selectedEmployee && selectedEmployee.id === empId) {
            setSelectedEmployee(updated);
          }
          return updated;
        }
        return item;
      })
    );

    logAuditAction(currentUser, {
      actionType: 'إضافة مخلفات',
      employeeId: empId,
      employeeName: emp?.fullName,
      details: `إضافة ${days} يوم مخلفات عطلة عن سنة ${year} للموظف "${emp?.fullName}". الملاحظة: ${note || 'لا توجد'}`,
    });
    refreshAuditLogs();
  };

  // Manual adjustment
  const adjustBalance = (empId: number, type: 'annual' | 'compensatory' | 'exceptional', delta: number, note: string) => {
    const emp = employees.find(e => e.id === empId);
    setEmployees(prev =>
      prev.map(item => {
        if (item.id === empId) {
          let annual = item.annualLeave;
          let comp = item.compensatoryLeave;
          let except = item.exceptionalLeave;

          if (type === 'annual') annual = Math.max(0, annual + delta);
          if (type === 'compensatory') comp = Math.max(0, comp + delta);
          if (type === 'exceptional') except = Math.max(0, except + delta);

          const tx: LeaveTransaction = {
            id: `tx-${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            type: type === 'annual' ? 'سنوية' : type === 'compensatory' ? 'تعويضية' : 'استثنائية',
            action: delta >= 0 ? 'إضافة' : 'خصم',
            days: Math.abs(delta),
            reason: note || (delta >= 0 ? `تعديل يدوي بإضافة ${delta} يوم` : `تعديل يدوي بخصم ${Math.abs(delta)} يوم`),
            performedBy: currentUser?.name || 'مستخدم المنصة',
            performedRole: currentUser?.role || 'admin',
          };

          const updated: Employee = {
            ...item,
            annualLeave: annual,
            compensatoryLeave: comp,
            exceptionalLeave: except,
            totalRemaining: annual + comp + (item.additions || 0),
            transactions: [tx, ...(item.transactions || [])],
          };
          if (selectedEmployee && selectedEmployee.id === empId) {
            setSelectedEmployee(updated);
          }
          return updated;
        }
        return item;
      })
    );

    logAuditAction(currentUser, {
      actionType: 'تسوية رصيد',
      employeeId: empId,
      employeeName: emp?.fullName,
      details: `تسوية رصيد ${type === 'annual' ? 'العطلة السنوية' : type === 'compensatory' ? 'العطلة التعويضية' : 'العطلة الاستثنائية'} بمقدار (${delta > 0 ? `+${delta}` : delta} يوم) للموظف "${emp?.fullName}". السبب: ${note || 'تسوية إدارية'}`,
    });
    refreshAuditLogs();
  };

  // Log leave license printing
  const logLicensePrinted = (emp: Employee, leaveType: string, days: number, startDate: string, endDate: string) => {
    logAuditAction(currentUser, {
      actionType: 'إصدار رخصة عطلة',
      employeeId: emp.id,
      employeeName: emp.fullName,
      details: `تم إصدار واستخراج وثيقة رخصة عطلة رسمية (FOR.GRH.010) مدتها ${days} يوم (${leaveType}) من ${startDate} إلى ${endDate}.`,
    });
    refreshAuditLogs();
  };

  // Reset to original audited clean data
  const resetToOriginalData = () => {
    if (window.confirm('هل أنت متأكد من إعادة ضبط البيانات إلى السجل الإداري النموذجي المدقق؟ سيتم استرجاع السجل المعقم بالكامل.')) {
      setEmployees(initialEmployees);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialEmployees));
      setSelectedEmployee(null);
    }
  };

  // Clear all employees (start fresh for official Excel import)
  const clearAllEmployees = () => {
    if (window.confirm('تنبيه: هل تريد تفريغ السجل بالكامل للبدء باستيراد ملف الكلية الرسمي من الصفر؟ ستكون قاعدة البيانات فارغة تماماً.')) {
      setEmployees([]);
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      setSelectedEmployee(null);
    }
  };

  // Load clean audited sample data
  const loadCleanSampleData = () => {
    setEmployees(initialEmployees);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialEmployees));
    setSelectedEmployee(null);
  };

  // Audit all records to verify mathematical correspondence and historical adjustments
  const auditAndRecalculateAll = (): { auditedCount: number; fixedCount: number } => {
    let diffCount = 0;
    employees.forEach(emp => {
      const calculated = emp.annualLeave + emp.compensatoryLeave + (emp.additions || 0);
      if (emp.totalRemaining !== calculated) {
        diffCount++;
      }
    });

    return { auditedCount: employees.length, fixedCount: diffCount };
  };

  // Download empty official Excel template
  const downloadTemplateExcel = () => {
    const templateRows = [
      {
        'الرقم': 1,
        'الاسم واللقب': 'فلان بن فلان',
        'الرتبة': 'متصرف رئيسي',
        'المصلحة / القسم': 'مصلحة المستخدمين',
        'العطلة السنوية': 30,
        'العطلة الاستثنائية': 10,
        'العطلة التعويضية': 4,
        'الإضافات والمخلفات': 0,
        'الباقي من مجموع العطل': 34,
        'الحالة الإدارية': 'نشط',
        'ملاحظات وسجل العطل': 'رصيد نظامي معتمد',
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'نموذج عطل المستخدمين');

    worksheet['!cols'] = [
      { wch: 6 }, { wch: 22 }, { wch: 25 }, { wch: 25 },
      { wch: 14 }, { wch: 16 }, { wch: 15 }, { wch: 15 },
      { wch: 18 }, { wch: 15 }, { wch: 40 },
    ];

    XLSX.writeFile(workbook, `نموذج_إكسل_رسمي_لعطل_المستخدمين_جامعة_ورقلة.xlsx`);
  };

  // Export to Excel (.xlsx)
  const exportToExcel = () => {
    const excelRows = employees.map(emp => ({
      'الرقم': emp.id,
      'الاسم واللقب': privacyMode ? `موظف رقم ${emp.id}` : emp.fullName,
      'الرتبة': emp.rank,
      'المصلحة / القسم': emp.department || 'كلية الرياضيات وعلوم المادة',
      'العطلة السنوية': emp.annualLeave,
      'العطلة الاستثنائية': emp.exceptionalLeave,
      'العطلة التعويضية': emp.compensatoryLeave,
      'الإضافات والمخلفات': emp.additions || 0,
      'الباقي من مجموع العطل': emp.annualLeave + emp.compensatoryLeave + (emp.additions || 0),
      'الحالة الإدارية': emp.status,
      'ملاحظات وسجل العطل': emp.notes || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'عطل المستخدمين');

    worksheet['!cols'] = [
      { wch: 6 },  // الرقم
      { wch: 22 }, // الاسم واللقب
      { wch: 28 }, // الرتبة
      { wch: 25 }, // المصلحة
      { wch: 14 }, // السنوية
      { wch: 16 }, // الاستثنائية
      { wch: 15 }, // التعويضية
      { wch: 15 }, // الإضافات
      { wch: 18 }, // الباقي
      { wch: 15 }, // الحالة
      { wch: 45 }, // ملاحظات
    ];

    const todayStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `عطل_مستخدمي_كلية_الرياضيات_وعلوم_المادة_${todayStr}.xlsx`);
  };

  // Import from Excel (.xlsx) with precision parsing and guaranteed math
  const importFromExcel = (file: File): Promise<{ count: number }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const rawJson = XLSX.utils.sheet_to_json(worksheet) as Record<string, any>[];

          if (rawJson.length === 0) {
            reject(new Error('الملف فارغ أو لا يحتوي على صفوف بيانات'));
            return;
          }

          const importedEmployees: Employee[] = rawJson.map((row, index) => {
            const id = parseNumber(row['الرقم'] || row['N°'] || row['id'] || row['num'], index + 1);
            const fullName = String(row['الاسم واللقب'] || row['الاسم و اللقب'] || row['Nom'] || row['الاسم'] || `موظف ${index + 1}`).trim();
            const rank = String(row['الرتبة'] || row['Grade'] || 'متصرف').trim();
            const department = String(row['المصلحة / القسم'] || row['القسم'] || row['المصلحة'] || 'كلية الرياضيات وعلوم المادة').trim();
            
            const annualLeave = parseNumber(row['العطلة السنوية'] || row['سنوية'] || row['Congé annuel']);
            const exceptionalLeave = parseNumber(row['العطلة الاستثنائية'] || row['استثنائية'] || 10, 10);
            const compensatoryLeave = parseNumber(row['العطلة التعويضية'] || row['تعويضية'] || row['Récupération']);
            const additions = parseNumber(row['الإضافات والمخلفات'] || row['إضافات'] || row['الاضافات'] || 0);
            
            // Take official total if provided in the sheet, otherwise calculate sum
            const rawTotal = row['الباقي من مجموع العطل'] ?? row['الباقي'] ?? row['المجموع'] ?? row['Total'];
            const totalRemaining = rawTotal !== undefined && rawTotal !== null && rawTotal !== ''
              ? parseNumber(rawTotal, annualLeave + compensatoryLeave + additions)
              : (annualLeave + compensatoryLeave + additions);
            
            const rawStatus = String(row['الحالة الإدارية'] || row['الحالة'] || 'نشط').trim();
            const validStatuses: EmployeeStatus[] = ['نشط', 'في عطلة', 'وضع تحت التصرف', 'محول', 'عطلة أمومة', 'عطلة مرضية', 'وفاة', 'مؤرشف'];
            const status: EmployeeStatus = validStatuses.includes(rawStatus as any) ? (rawStatus as EmployeeStatus) : 'نشط';

            const notes = String(row['ملاحظات وسجل العطل'] || row['ملاحظة'] || row['ملاحظات'] || '').trim();

            return {
              id,
              fullName,
              rank,
              department,
              annualLeave,
              exceptionalLeave: Math.min(10, Math.max(0, exceptionalLeave)),
              compensatoryLeave,
              additions,
              totalRemaining,
              status,
              notes,
              transactions: []
            };
          });

          setEmployees(importedEmployees);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(importedEmployees));
          setSelectedEmployee(null);
          resolve({ count: importedEmployees.length });
        } catch (err: any) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('فشل قراءة ملف الإكسل'));
      reader.readAsArrayBuffer(file);
    });
  };

  // Export JSON backup
  const exportBackupJSON = () => {
    const dataStr = JSON.stringify(employees, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `نسخة_احتياطية_عطل_الكلية_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON backup
  const importBackupJSON = (jsonData: string): boolean => {
    try {
      const parsed = JSON.parse(jsonData);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].fullName) {
        const imported = parsed.map((e: Employee) => ({
          ...e,
          totalRemaining: e.totalRemaining !== undefined ? Number(e.totalRemaining) : (Number(e.annualLeave || 0) + Number(e.compensatoryLeave || 0) + Number(e.additions || 0)),
        }));
        setEmployees(imported);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(imported));
        setSelectedEmployee(null);
        return true;
      }
    } catch {
      // Invalid
    }
    return false;
  };

  return (
    <LeavesContext.Provider
      value={{
        employees,
        searchTerm,
        setSearchTerm,
        selectedRank,
        setSelectedRank,
        selectedStatus,
        setSelectedStatus,
        selectedBalanceFilter,
        setSelectedBalanceFilter,
        selectedEmployee,
        setSelectedEmployee,
        privacyMode,
        setPrivacyMode,
        addEmployee,
        updateEmployee,
        updateEmployeeBalancesAndInfo,
        deleteEmployee,
        recordLeave,
        recordPermanence,
        attachProofToTransaction,
        addBacklog,
        adjustBalance,
        logLicensePrinted,
        auditLogs,
        refreshAuditLogs,
        exportAuditLogs,
        resetToOriginalData,
        clearAllEmployees,
        loadCleanSampleData,
        auditAndRecalculateAll,
        exportToExcel,
        downloadTemplateExcel,
        importFromExcel,
        exportBackupJSON,
        importBackupJSON,
        activeTab,
        setActiveTab,
      }}
    >
      {children}
    </LeavesContext.Provider>
  );
};

export const useLeaves = () => {
  const context = useContext(LeavesContext);
  if (!context) throw new Error('useLeaves must be used within LeavesProvider');
  return context;
};
