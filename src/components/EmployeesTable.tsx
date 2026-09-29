import React, { useState, useMemo, useEffect } from 'react';
import { useLeaves } from '../context/LeavesContext';
import { Employee } from '../types';
import { getDocumentCountsByEmployee } from '../utils/documentStorage';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  CalendarPlus, 
  AlertCircle,
  Printer,
  User,
  Camera,
  Edit3
} from 'lucide-react';

interface EmployeesTableProps {
  onOpenEmployeeDetail?: (emp: Employee) => void;
  onOpenDetail?: (emp: Employee) => void;
  onOpenEditBalances?: (emp: Employee) => void;
  onOpenLeaveModalForEmployee?: (emp: Employee) => void;
  onOpenPermanenceModalForEmployee?: (emp: Employee) => void;
  onOpenPrintModalForEmployee?: (emp: Employee) => void;
  onOpenPrint?: (emp: Employee) => void;
  onOpenScanner?: (emp: Employee) => void;
  onOpenScannerModalForEmployee?: (emp: Employee) => void;
  onOpenScannerModalGeneral?: () => void;
}

export const EmployeesTable: React.FC<EmployeesTableProps> = ({
  onOpenEmployeeDetail,
  onOpenDetail,
  onOpenEditBalances,
  onOpenLeaveModalForEmployee,
  onOpenPermanenceModalForEmployee,
  onOpenPrintModalForEmployee,
  onOpenPrint,
  onOpenScanner,
  onOpenScannerModalForEmployee,
  onOpenScannerModalGeneral,
}) => {
  const handleDetail = onOpenEmployeeDetail || onOpenDetail || (() => {});
  const handlePrint = onOpenPrintModalForEmployee || onOpenPrint || (() => {});
  const handleScanner = onOpenScannerModalForEmployee || onOpenScanner;

  const [docCounts, setDocCounts] = useState<Record<number, number>>({});

  useEffect(() => {
    getDocumentCountsByEmployee().then(setDocCounts).catch(console.error);
  }, []);
  const {
    employees,
    searchTerm,
    setSearchTerm,
    selectedRank,
    setSelectedRank,
    selectedStatus,
    setSelectedStatus,
    selectedBalanceFilter,
    setSelectedBalanceFilter,
    privacyMode,
  } = useLeaves();

  // Sorting
  const [sortField, setSortField] = useState<keyof Employee>('id');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  // Distinct ranks for filter
  const distinctRanks = useMemo(() => {
    const ranks = new Set<string>();
    employees.forEach(e => {
      if (e.rank) ranks.add(e.rank);
    });
    return Array.from(ranks).sort();
  }, [employees]);

  // Distinct statuses
  const distinctStatuses = ['نشط', 'في عطلة', 'وضع تحت التصرف', 'محول', 'عطلة أمومة', 'عطلة مرضية', 'وفاة'];

  // Filtered and sorted employees
  const filteredEmployees = useMemo(() => {
    return employees
      .filter(emp => {
        // Search
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase().trim();
          const matchName = emp.fullName.toLowerCase().includes(term);
          const matchRank = emp.rank.toLowerCase().includes(term);
          const matchNotes = (emp.notes || '').toLowerCase().includes(term);
          const matchDept = (emp.department || '').toLowerCase().includes(term);
          const matchId = String(emp.id).includes(term);
          if (!matchName && !matchRank && !matchNotes && !matchDept && !matchId) return false;
        }

        // Rank filter
        if (selectedRank !== 'ALL' && emp.rank !== selectedRank) {
          return false;
        }

        // Status filter
        if (selectedStatus !== 'ALL') {
          if (selectedStatus === 'عطلة أمومة') {
            if (emp.status !== 'عطلة أمومة' && !emp.maternityNursingHours) return false;
          } else if (emp.status !== selectedStatus) {
            return false;
          }
        }

        // Balance filter
        if (selectedBalanceFilter === 'high') {
          if (emp.totalRemaining < 50) return false;
        } else if (selectedBalanceFilter === 'medium') {
          if (emp.totalRemaining < 20 || emp.totalRemaining >= 50) return false;
        } else if (selectedBalanceFilter === 'low') {
          if (emp.totalRemaining <= 0 || emp.totalRemaining >= 20) return false;
        } else if (selectedBalanceFilter === 'zero') {
          if (emp.totalRemaining > 0) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const valA = a[sortField];
        const valB = b[sortField];

        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortAsc ? valA - valB : valB - valA;
        }
        const strA = String(valA || '');
        const strB = String(valB || '');
        return sortAsc ? strA.localeCompare(strB, 'ar') : strB.localeCompare(strA, 'ar');
      });
  }, [employees, searchTerm, selectedRank, selectedStatus, selectedBalanceFilter, sortField, sortAsc]);

  const handleSort = (field: keyof Employee) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false); // default desc for numbers
    }
  };

  // Helper for status badge
  const renderStatusBadge = (status: string, notes?: string) => {
    switch (status) {
      case 'نشط':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            نشط في الخدمة
          </span>
        );
      case 'وضع تحت التصرف':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">
            تحت التصرف
          </span>
        );
      case 'محول':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            محول
          </span>
        );
      case 'عطلة أمومة':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800 border border-rose-200">
            عطلة أمومة
          </span>
        );
      case 'عطلة مرضية':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100 text-purple-800 border border-purple-200">
            عطلة مرضية
          </span>
        );
      case 'وفاة':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-200 text-red-900 border border-red-300">
            وفاة
          </span>
        );
      case 'مؤرشف':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-200 text-slate-700 border border-slate-300">
            مؤرشف
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-800">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Search & Filter Bar */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/70 space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Large Search Input */}
          <div className="relative w-full md:w-96">
            <Search className="w-5 h-5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="employee-search-input"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="ابحث باسم أو لقب الموظف، أو الرتبة..."
              className="w-full pr-11 pl-4 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-slate-900 placeholder-slate-400 font-medium"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 cursor-pointer font-bold"
              >
                مسح
              </button>
            )}
          </div>

          {/* Clean Dropdown Filters */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {/* Rank Filter */}
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                id="rank-filter-select"
                value={selectedRank}
                onChange={e => setSelectedRank(e.target.value)}
                className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              >
                <option value="ALL">جميع الرتب الوظيفية ({distinctRanks.length})</option>
                {distinctRanks.map(rank => (
                  <option key={rank} value={rank}>
                    {rank}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <select
                id="status-filter-select"
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              >
                <option value="ALL">جميع الحالات</option>
                {distinctStatuses.map(status => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            {/* Balance Filter */}
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <select
                id="balance-filter-select"
                value={selectedBalanceFilter}
                onChange={e => setSelectedBalanceFilter(e.target.value)}
                className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              >
                <option value="ALL">كافة الأرصدة</option>
                <option value="high">رصيد مرتفع (≥ 50 يوم)</option>
                <option value="medium">رصيد متوسط (20-49 يوم)</option>
                <option value="low">رصيد منخفض (1-19 يوم)</option>
                <option value="zero">رصيد مستهلك (0 يوم)</option>
              </select>
            </div>

            {(selectedRank !== 'ALL' || selectedStatus !== 'ALL' || selectedBalanceFilter !== 'ALL' || searchTerm) && (
              <button
                onClick={() => {
                  setSelectedRank('ALL');
                  setSelectedStatus('ALL');
                  setSelectedBalanceFilter('ALL');
                  setSearchTerm('');
                }}
                className="text-xs text-emerald-700 hover:text-emerald-900 font-bold px-2 py-1 underline cursor-pointer"
              >
                إلغاء التصفية
              </button>
            )}
          </div>
        </div>

        {/* Counter indicator */}
        <div className="flex justify-between items-center text-xs text-slate-500 pt-1 border-t border-slate-200/60">
          <div>
            عرض <span className="font-bold text-slate-800">{filteredEmployees.length}</span> من أصل{' '}
            <span className="font-bold text-slate-800">{employees.length}</span> موظف
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-right text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 select-none">
              <th 
                onClick={() => handleSort('id')}
                className="p-3 w-14 text-center cursor-pointer hover:bg-slate-200 transition-colors"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>الرقم</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              <th 
                onClick={() => handleSort('fullName')}
                className="p-3 min-w-[180px] cursor-pointer hover:bg-slate-200 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>الاسم واللقب</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              <th 
                onClick={() => handleSort('rank')}
                className="p-3 min-w-[180px] cursor-pointer hover:bg-slate-200 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>الرتبة</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              <th 
                onClick={() => handleSort('annualLeave')}
                className="p-3 w-24 text-center cursor-pointer hover:bg-slate-200 transition-colors bg-emerald-50/50"
              >
                <div className="flex items-center justify-center gap-1 text-emerald-900">
                  <span>عطلة سنوية</span>
                  <ArrowUpDown className="w-3 h-3 text-emerald-600" />
                </div>
              </th>

              <th 
                onClick={() => handleSort('exceptionalLeave')}
                className="p-3 w-24 text-center cursor-pointer hover:bg-slate-200 transition-colors"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>استثنائية</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              <th 
                onClick={() => handleSort('compensatoryLeave')}
                className="p-3 w-24 text-center cursor-pointer hover:bg-slate-200 transition-colors bg-amber-50/50"
              >
                <div className="flex items-center justify-center gap-1 text-amber-900">
                  <span>تعويضية</span>
                  <ArrowUpDown className="w-3 h-3 text-amber-600" />
                </div>
              </th>

              <th 
                onClick={() => handleSort('additions')}
                className="p-3 w-24 text-center cursor-pointer hover:bg-slate-200 transition-colors bg-blue-50/50"
              >
                <div className="flex items-center justify-center gap-1 text-blue-900">
                  <span>إضافات/مخلفات</span>
                  <ArrowUpDown className="w-3 h-3 text-blue-600" />
                </div>
              </th>

              <th 
                onClick={() => handleSort('totalRemaining')}
                className="p-3 w-28 text-center cursor-pointer hover:bg-slate-200 transition-colors bg-teal-50"
              >
                <div className="flex items-center justify-center gap-1 font-extrabold text-teal-950">
                  <span>الباقي (المجموع)</span>
                  <ArrowUpDown className="w-3 h-3 text-teal-700" />
                </div>
              </th>

              <th className="p-3 min-w-[200px]">الملاحظات والتسجيلات</th>
              <th className="p-3 w-32 text-center">الحالة</th>
              <th className="p-3 min-w-[280px] text-center font-bold text-slate-800">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredEmployees.length === 0 ? (
              <tr>
                <td colSpan={11} className="p-12 text-center text-slate-500">
                  <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="font-semibold text-sm">لم يتم العثور على أي موظف يطابق معايير البحث والتصفية</p>
                  <button
                    onClick={() => {
                      setSelectedRank('ALL');
                      setSelectedStatus('ALL');
                      setSelectedBalanceFilter('ALL');
                      setSearchTerm('');
                    }}
                    className="mt-3 text-xs text-emerald-700 font-bold hover:underline cursor-pointer"
                  >
                    إعادة تعيين البحث
                  </button>
                </td>
              </tr>
            ) : (
              filteredEmployees.map(emp => {
                const isHighBalance = emp.totalRemaining >= 50;
                const isZeroBalance = emp.totalRemaining === 0;
                const isDisposalOrTransferred = emp.status === 'وضع تحت التصرف' || emp.status === 'محول';
                const isDeceased = emp.status === 'وفاة';

                return (
                  <tr
                    key={emp.id}
                    id={`employee-row-${emp.id}`}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isDeceased
                        ? 'bg-red-50/40 text-slate-500'
                        : isDisposalOrTransferred
                        ? 'bg-indigo-50/30'
                        : isHighBalance
                        ? 'bg-amber-50/20'
                        : ''
                    }`}
                  >
                    {/* ID */}
                    <td className="p-3 text-center font-bold text-slate-600">
                      {emp.id}
                    </td>

                    {/* Full Name */}
                    <td className="p-3 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDetail(emp)}
                          className="hover:text-emerald-700 hover:underline text-right font-bold cursor-pointer"
                        >
                          {privacyMode ? `موظف رقم ${emp.id}` : emp.fullName}
                        </button>
                        {docCounts[emp.id] ? (
                          <span 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (handleScanner) handleScanner(emp);
                              else handleDetail(emp);
                            }}
                            className="bg-teal-100 hover:bg-teal-200 text-teal-800 border border-teal-300 text-[10px] px-1.5 py-0.5 rounded-md font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
                            title={`${docCounts[emp.id]} وثيقة/ورقة مستنسخة ضوئياً في ملف الموظف`}
                          >
                            <Camera className="w-3 h-3 text-teal-700" />
                            <span>{docCounts[emp.id]}</span>
                          </span>
                        ) : null}
                        {emp.maternityNursingHours && (
                          <span 
                            className="bg-rose-100 text-rose-700 text-[10px] px-1.5 py-0.5 rounded-sm font-semibold"
                            title={emp.maternityNursingHours}
                          >
                            أمومة / رضاعة
                          </span>
                        )}
                      </div>
                      {emp.department && (
                        <div className="text-[11px] text-slate-500 font-normal mt-0.5">
                          {emp.department}
                        </div>
                      )}
                    </td>

                    {/* Rank */}
                    <td className="p-3 text-slate-700">
                      <span className="font-medium">{emp.rank}</span>
                    </td>

                    {/* Annual Leave */}
                    <td className="p-3 text-center font-bold text-emerald-800 bg-emerald-50/30">
                      <span className={`inline-block px-2 py-0.5 rounded-sm ${emp.annualLeave >= 50 ? 'bg-amber-200 text-amber-900' : ''}`}>
                        {emp.annualLeave}
                      </span>
                    </td>

                    {/* Exceptional */}
                    <td className="p-3 text-center text-slate-600 font-medium">
                      {emp.exceptionalLeave}
                    </td>

                    {/* Compensatory (Moudaouama) */}
                    <td className="p-3 text-center font-bold text-amber-800 bg-amber-50/30">
                      <span className={`inline-block px-2 py-0.5 rounded-sm ${emp.compensatoryLeave >= 20 ? 'bg-amber-300 text-amber-950 font-black' : ''}`}>
                        {emp.compensatoryLeave}
                      </span>
                    </td>

                    {/* Additions / Backlogs */}
                    <td className="p-3 text-center font-bold text-blue-800 bg-blue-50/30">
                      <span className={`inline-block px-2 py-0.5 rounded-sm ${emp.additions > 0 ? 'bg-blue-100 text-blue-900 font-bold' : 'text-slate-400 font-normal'}`}>
                        {emp.additions || 0}
                      </span>
                    </td>

                    {/* Total Remaining */}
                    <td className="p-3 text-center font-black text-slate-900 bg-teal-50/60">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-md text-xs ${
                          isZeroBalance
                            ? 'bg-slate-200 text-slate-600'
                            : isHighBalance
                            ? 'bg-amber-400 text-slate-950 shadow-2xs font-black'
                            : 'bg-emerald-600 text-white shadow-2xs'
                        }`}
                      >
                        {emp.totalRemaining} يوم
                      </span>
                    </td>

                    {/* Notes & Backlogs */}
                    <td className="p-3 text-slate-600 text-[11px] max-w-xs">
                      {emp.notes ? (
                        <p className="line-clamp-2" title={emp.notes}>
                          {emp.notes}
                        </p>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="p-3 text-center whitespace-nowrap">
                      {renderStatusBadge(emp.status, emp.notes)}
                    </td>

                    {/* Large, Clear Actions for the Head of Department */}
                    <td className="p-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        {/* 1. Issue Leave License */}
                        <button
                          onClick={() => handlePrint(emp)}
                          id={`print-emp-${emp.id}`}
                          title="إصدار وطباعة رخصة العطلة الرسمية فوراً لهذا الموظف"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-2xs transition-all cursor-pointer whitespace-nowrap active:scale-95"
                        >
                          <Printer className="w-4 h-4 text-emerald-200" />
                          <span>رخصة عطلة</span>
                        </button>

                        {/* 2. Register Leave / Permanence */}
                        <button
                          onClick={() => onOpenLeaveModalForEmployee ? onOpenLeaveModalForEmployee(emp) : handleDetail(emp)}
                          id={`leave-emp-${emp.id}`}
                          title="تسجيل عطلة سنوية أو مداومة لهذا الموظف وخصمها من الرصيد"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-xs transition-all cursor-pointer whitespace-nowrap active:scale-95"
                        >
                          <CalendarPlus className="w-4 h-4 text-emerald-700" />
                          <span>عطلة/مداومة</span>
                        </button>

                        {/* 3. Employee Profile & History */}
                        <button
                          onClick={() => handleDetail(emp)}
                          id={`view-emp-${emp.id}`}
                          title="عرض بطاقة الموظف، الأرشيف، وتاريخ العمليات"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs transition-all cursor-pointer whitespace-nowrap active:scale-95"
                        >
                          <User className="w-4 h-4 text-slate-500" />
                          <span>الملف</span>
                        </button>

                        {/* 4. Direct Edit Balances & Info */}
                        {onOpenEditBalances && (
                          <button
                            onClick={() => onOpenEditBalances(emp)}
                            id={`edit-emp-${emp.id}`}
                            title="تعديل مباشر لبيانات الموظف ورصيد العطل بالسجل"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-300 font-bold text-xs transition-all cursor-pointer whitespace-nowrap active:scale-95"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-teal-700" />
                            <span>تعديل الرصيد</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
