import { useState, useEffect } from 'react';
import { Download, FileText, BarChart2 } from 'lucide-react';
import api from '../../utils/api';

const AttendanceReports = () => {
  const [report, setReport] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const now = new Date();
  const [filters, setFilters] = useState({ month: now.getMonth() + 1, year: now.getFullYear(), department: '', employee_id: '' });

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(filters);
      const [r, d, e] = await Promise.all([api.get(`/attendance/reports?${params}`), api.get('/departments'), api.get('/employees')]);
      setReport(r.data.data||[]); setDepartments(d.data.data||[]); setEmployees(e.data.data||[]);
    } catch(err){} finally{setLoading(false);}
  };
  useEffect(()=>{fetchReport();},[]);

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const totalPresent = report.reduce((s,r)=>s+r.total_present,0);
  const totalAbsent = report.reduce((s,r)=>s+r.total_absent,0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap justify-between items-center gap-3 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <div><h3 className="text-lg font-black text-gray-900 m-0 flex items-center gap-2"><span className="w-2.5 h-5 bg-blue-600 rounded-full" />Attendance Reports</h3><p className="text-xs text-gray-500 mt-1 m-0">Monthly muster roll, late fine, overtime and attendance summary reports</p></div>
        <button onClick={() => api.post('/attendance/export')} className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 text-white text-xs font-black rounded-xl border-0 cursor-pointer shadow-sm"><Download className="w-4 h-4" />Export Excel</button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <select value={filters.month} onChange={e=>setFilters(f=>({...f,month:Number(e.target.value)}))} className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold">
            {months.map((m,i)=><option key={i} value={i+1}>{m}</option>)}
          </select>
          <select value={filters.year} onChange={e=>setFilters(f=>({...f,year:Number(e.target.value)}))} className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold">
            {[2024,2025,2026,2027].map(y=><option key={y}>{y}</option>)}
          </select>
          <select value={filters.department} onChange={e=>setFilters(f=>({...f,department:e.target.value}))} className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold">
            <option value="">All Departments</option>{departments.map(d=><option key={d._id} value={d._id}>{d.name}</option>)}
          </select>
          <button onClick={fetchReport} className="px-4 py-2.5 bg-blue-600 text-white text-xs font-black rounded-xl border-0 cursor-pointer">Generate Report</button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{l:'Total Employees',v:report.length,c:'text-gray-900'},{l:'Total Present',v:totalPresent,c:'text-emerald-700'},{l:'Total Absent',v:totalAbsent,c:'text-red-700'},{l:'Avg Working Days',v:report.length>0?Math.round(report.reduce((s,r)=>s+r.working_days,0)/report.length):0,c:'text-blue-700'}].map(s=>(
          <div key={s.l} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center"><p className="text-xs text-gray-500 m-0">{s.l}</p><p className={`text-2xl font-black m-0 ${s.c}`}>{s.v}</p></div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50"><tr>{['Code','Employee','Dept','Designation','Present','Absent','Leave','Late','Half Day','OT Hrs','Days'].map(h=><th key={h} className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? <tr><td colSpan={11} className="py-10 text-center text-xs text-gray-400">Generating report...</td></tr>
              : report.length>0 ? report.map((r,i)=>(
                <tr key={i} className="hover:bg-gray-50/50">
                  <td className="px-3 py-3 text-xs font-mono font-bold text-blue-700">{r.employee_code}</td>
                  <td className="px-3 py-3 text-xs font-bold text-gray-900 whitespace-nowrap">{r.employee_name}</td>
                  <td className="px-3 py-3 text-xs text-gray-600">{r.department}</td>
                  <td className="px-3 py-3 text-xs text-gray-600 whitespace-nowrap">{r.designation}</td>
                  <td className="px-3 py-3 text-xs font-black text-emerald-700">{r.total_present}</td>
                  <td className="px-3 py-3 text-xs font-black text-red-700">{r.total_absent}</td>
                  <td className="px-3 py-3 text-xs font-black text-blue-700">{r.total_leave}</td>
                  <td className="px-3 py-3 text-xs font-black text-amber-700">{r.total_late}</td>
                  <td className="px-3 py-3 text-xs font-black text-orange-700">{r.total_half_day}</td>
                  <td className="px-3 py-3 text-xs font-black text-purple-700">{r.total_overtime?.toFixed(1)}</td>
                  <td className="px-3 py-3 text-xs text-gray-600">{r.working_days}</td>
                </tr>
              )) : <tr><td colSpan={11} className="py-10 text-center text-xs text-gray-400">Click "Generate Report" to load data</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default AttendanceReports;
