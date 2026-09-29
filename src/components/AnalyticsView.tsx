import React, { useMemo } from 'react';
import { useLeaves } from '../context/LeavesContext';
import { Employee } from '../types';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  AlertTriangle, 
  Users, 
  Calendar, 
  Award,
  ChevronLeft
} from 'lucide-react';

interface AnalyticsViewProps {
  onOpenEmployeeDetail: (emp: Employee) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ onOpenEmployeeDetail }) => {
  const { employees } = useLeaves();

  // Rank breakdown
  const rankStats = useMemo(() => {
    const map: Record<string, { count: number; totalDays: number }> = {};
    employees.forEach(e => {
      const r = e.rank || 'أخرى';
      if (!map[r]) map[r] = { count: 0, totalDays: 0 };
      map[r].count += 1;
      map[r].totalDays += e.totalRemaining;
    });

    return Object.entries(map)
      .map(([rank, data]) => ({ rank, count: data.count, totalDays: data.totalDays }))
      .sort((a, b) => b.count - a.count);
  }, [employees]);

  // Balance brackets
  const balanceBrackets = useMemo(() => {
    let high = 0; // >= 50
    let medium = 0; // 20 - 49
    let low = 0; // 1 - 19
    let zero = 0; // 0

    employees.forEach(e => {
      if (e.totalRemaining >= 50) high++;
      else if (e.totalRemaining >= 20) medium++;
      else if (e.totalRemaining > 0) low++;
      else zero++;
    });

    return { high, medium, low, zero };
  }, [employees]);

  // Top 10 accumulated leave employees
  const topLeaveEmployees = useMemo(() => {
    return [...employees]
      .sort((a, b) => b.totalRemaining - a.totalRemaining)
      .slice(0, 10);
  }, [employees]);

  // Total days
  const totalRemainingDays = employees.reduce((acc, e) => acc + e.totalRemaining, 0);
  const avgDaysPerEmp = employees.length > 0 ? Math.round(totalRemainingDays / employees.length) : 0;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-emerald-950 text-white p-6 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            <span>لوحة التحليلات والإحصائيات التراكمية للعطل</span>
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            كلية الرياضيات وعلوم المادة — جامعة قاصدي مرباح ورقلة ({employees.length} موظفاً مسجلاً)
          </p>
        </div>

        <div className="flex gap-4">
          <div className="bg-white/10 px-4 py-2 rounded-xl border border-white/10 text-center">
            <span className="text-[11px] text-slate-300 block">إجمالي الأيام المتبقية</span>
            <span className="text-xl font-black text-emerald-300">{totalRemainingDays.toLocaleString()} يوم</span>
          </div>
          <div className="bg-white/10 px-4 py-2 rounded-xl border border-white/10 text-center">
            <span className="text-[11px] text-slate-300 block">متوسط رصيد الموظف</span>
            <span className="text-xl font-black text-amber-300">{avgDaysPerEmp} يوم</span>
          </div>
        </div>
      </div>

      {/* Grid: Leave Distribution & Brackets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Balance Distribution Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <h3 className="font-bold text-slate-900 text-sm mb-4 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-emerald-600" />
            <span>توزيع أرصدة العطل المتبقية للموظفين</span>
          </h3>

          <div className="space-y-3 text-xs">
            {/* High >= 50 */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="font-bold text-amber-800 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  أرصدة تراكمية مرتفعة (≥ 50 يوماً)
                </span>
                <span className="font-mono font-bold text-slate-700">
                  {balanceBrackets.high} موظف ({Math.round((balanceBrackets.high / employees.length) * 100)}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div 
                  className="bg-amber-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${(balanceBrackets.high / employees.length) * 100}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                تتطلب جدولة وتنسيقاً خاصاً مع المصالح لتفادي تراكم العطل
              </span>
            </div>

            {/* Medium 20-49 */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="font-bold text-emerald-800 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                  أرصدة متوسطة (20 إلى 49 يوماً)
                </span>
                <span className="font-mono font-bold text-slate-700">
                  {balanceBrackets.medium} موظف ({Math.round((balanceBrackets.medium / employees.length) * 100)}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-600 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${(balanceBrackets.medium / employees.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Low 1-19 */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="font-bold text-blue-800 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                  أرصدة عادية / منخفضة (1 إلى 19 يوماً)
                </span>
                <span className="font-mono font-bold text-slate-700">
                  {balanceBrackets.low} موظف ({Math.round((balanceBrackets.low / employees.length) * 100)}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div 
                  className="bg-blue-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${(balanceBrackets.low / employees.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Zero */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="font-bold text-slate-600 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                  أرصدة مستهلكة بالكامل (0 يوم)
                </span>
                <span className="font-mono font-bold text-slate-700">
                  {balanceBrackets.zero} موظف ({Math.round((balanceBrackets.zero / employees.length) * 100)}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div 
                  className="bg-slate-400 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${(balanceBrackets.zero / employees.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Top 10 Employees with highest balances */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-600" />
              <span>أعلى 10 موظفين في رصيد العطل المتراكم</span>
            </span>
            <span className="text-[11px] text-slate-500 font-normal">انقر لفتح الملف</span>
          </h3>

          <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
            {topLeaveEmployees.map((emp, index) => (
              <div
                key={emp.id}
                onClick={() => onOpenEmployeeDetail(emp)}
                className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 transition-all cursor-pointer group text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[10px]">
                    {index + 1}
                  </span>
                  <div>
                    <span className="font-bold text-slate-900 group-hover:text-emerald-800 block">
                      {emp.fullName}
                    </span>
                    <span className="text-[10px] text-slate-500">{emp.rank}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-left font-black">
                    <span className="text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md font-mono text-xs">
                      {emp.totalRemaining} يوم
                    </span>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-slate-400 group-hover:text-emerald-700" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Ranks Breakdown Table */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
          <Users className="w-4 h-4 text-indigo-600" />
          <span>إحصائيات الموظفين وأرصدة العطل حسب الرتب الوظيفية</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <th className="p-2.5">الرتبة الوظيفية</th>
                <th className="p-2.5 text-center">العدد</th>
                <th className="p-2.5 text-center">النسبة المئوية</th>
                <th className="p-2.5 text-center">مجموع رصيد العطل</th>
                <th className="p-2.5 text-center">المتوسط للرتبة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {rankStats.map(stat => (
                <tr key={stat.rank} className="hover:bg-slate-50 transition-colors">
                  <td className="p-2.5 font-bold text-slate-800">{stat.rank}</td>
                  <td className="p-2.5 text-center font-bold text-slate-700">{stat.count}</td>
                  <td className="p-2.5 text-center text-slate-500">
                    {Math.round((stat.count / employees.length) * 100)}%
                  </td>
                  <td className="p-2.5 text-center font-black text-emerald-800">{stat.totalDays} يوم</td>
                  <td className="p-2.5 text-center font-mono text-slate-600">
                    {Math.round(stat.totalDays / stat.count)} يوم
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
