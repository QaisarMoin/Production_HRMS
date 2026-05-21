import { useState, useEffect, useCallback } from 'react';
import { Download, RefreshCw, Search } from 'lucide-react';
import api from '../../utils/api';

const STATUS_COLORS = {
  Present:  'bg-emerald-100 text-emerald-700',
  Absent:   'bg-red-100 text-red-700',
  'Half Day': 'bg-amber-100 text-amber-700',
  Leave:    'bg-blue-100 text-blue-700',
  Holiday:  'bg-purple-100 text-purple-700',
};

const AttendanceHistoryPage = () => {
  const [logs, setLogs]               = useState([]);
  const [employees, setEmployees]     = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading]         = useState(true);

  // Filters
  const [selectedEmp,  setSelectedEmp]  = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [search,       setSearch]       = useState('');
  const [month,        setMonth]        = useState(new Date().toISOString().slice(0, 7));

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedEmp)  params.set('employee',   selectedEmp);
      if (selectedDept) params.set('department', selectedDept);
      if (search)       params.set('search',     search);
      if (month)        params.set('month',      month);

      const [logsRes, empRes, deptRes] = await Promise.all([
        api.get(`/attendance-logs?${params.toString()}`),
        api.get('/employees'),
        api.get('/departments'),
      ]);

      setLogs(logsRes.data.data       || []);
      setEmployees(empRes.data.data   || []);
      setDepartments(deptRes.data.data || []);
    } catch (e) {
      console.error('Attendance History fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, [selectedEmp, selectedDept, search, month]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleExport = async () => {
    try {
      const res = await api.post('/attendance-logs/export/excel');
      window.open(res.data.url, '_blank');
    } catch (e) {
      alert(e.message);
    }
  };

  // Summary counts
  const summary = logs.reduce(
    (acc, l) => {
      acc[l.attendance_status] = (acc[l.attendance_status] || 0) + 1;
      return acc;
    },
    {}
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-3 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h3 className="text-lg font-black text-gray-900 m-0 flex items-center gap-2">
            <span className="w-2.5 h-5 bg-blue-600 rounded-full" />
            Attendance History
          </h3>
          <p className="text-xs text-gray-500 mt-1 m-0">
            Full attendance record for all employees — live data from Attendance Logs
          </p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 text-xs font-black rounded-xl border-0 cursor-pointer hover:bg-emerald-100"
        >
          <Download className="w-4 h-4" /> Export Excel
        </button>
      </div>

      {/* Summary Cards */}
     <div className="flex gap-3 overflow-x-auto">
  {['Present', 'Absent', 'Half Day', 'Leave', 'Holiday'].map(s => (
    <div
      key={s}
      className="flex-1 min-w-[180px] bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center"
    >
      <p className="text-xl font-black text-gray-900 m-0">
        {summary[s] || 0}
      </p>
      <p className="text-[10px] font-bold text-gray-500 mt-1 m-0">
        {s}
      </p>
    </div>
  ))}
</div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[200px]">
          <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Employee name or code…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs"
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Month</label>
          <input
            type="month"
            value={month}
            onChange={e => setMonth(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
          />
        </div>

        <div className="min-w-[180px]">
          <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Employee</label>
          <select
            value={selectedEmp}
            onChange={e => setSelectedEmp(e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
          >
            <option value="">All Employees</option>
            {employees.map(e => (
              <option key={e._id} value={e._id}>
                {e.first_name} {e.last_name} ({e.employee_code})
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-[160px]">
          <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Department</label>
          <select
            value={selectedDept}
            onChange={e => setSelectedDept(e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
          >
            <option value="">All Departments</option>
            {departments.map(d => (
              <option key={d._id} value={d._id}>{d.name}</option>
            ))}
          </select>
        </div>

        <button
          onClick={fetchData}
          className="p-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl border-0 cursor-pointer"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50">
            <tr>
              {['Code', 'Employee', 'Department', 'Date', 'In Time', 'Out Time', 'Worked Hrs', 'Work Day', 'Late In', 'Early Out', 'Status'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td colSpan={11} className="py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-gray-400">Loading attendance records…</span>
                  </div>
                </td>
              </tr>
            ) : logs.length > 0 ? (
              logs.map(log => (
                <tr key={log._id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-4 py-3 text-xs font-mono font-bold text-blue-700 whitespace-nowrap">
                    {log.employee_code}
                  </td>
                  <td className="px-4 py-3 text-xs font-bold text-gray-900 whitespace-nowrap">
                    {log.employee_name}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                    {log.department_id?.name || '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                    {new Date(log.attendance_date).toLocaleDateString('en-IN', {
                      day: '2-digit', month: 'short', year: 'numeric'
                    })}
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-emerald-700 whitespace-nowrap">
                    {log.in_time || '—'}
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-red-700 whitespace-nowrap">
                    {log.out_time || '—'}
                  </td>
                  <td className="px-4 py-3 text-xs font-bold text-gray-700 whitespace-nowrap">
                    {log.worked_hours ? `${log.worked_hours} hrs` : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap text-center">
                    {log.work_day ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-xs whitespace-nowrap">
                    {log.late_in
                      ? <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full text-[10px] font-bold">Late</span>
                      : <span className="text-gray-300 text-[10px]">—</span>}
                  </td>
                  <td className="px-4 py-3 text-xs whitespace-nowrap">
                    {log.early_out
                      ? <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-[10px] font-bold">Early</span>
                      : <span className="text-gray-300 text-[10px]">—</span>}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${STATUS_COLORS[log.attendance_status] || 'bg-gray-100 text-gray-600'}`}>
                      {log.attendance_status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={11} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <svg className="w-10 h-10 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p className="text-xs font-semibold text-gray-400 m-0">No attendance records found for the selected filters.</p>
                    <p className="text-[10px] text-gray-300 m-0">Mark attendance in the Attendance Log tab first.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Count */}
      {!loading && logs.length > 0 && (
        <p className="text-xs text-gray-400 text-right m-0">
          Showing {logs.length} record{logs.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
};

export default AttendanceHistoryPage;
