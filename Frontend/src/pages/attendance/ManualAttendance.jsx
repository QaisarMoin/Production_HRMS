import { useState, useEffect } from 'react';
import { Download, Upload } from 'lucide-react';
import api from '../../utils/api';

const STATUSES = ['P','A','L','H','WO','HD','LT'];
const STATUS_COLORS = { P:'bg-emerald-500 text-white', A:'bg-red-500 text-white', L:'bg-blue-500 text-white', H:'bg-indigo-500 text-white', WO:'bg-purple-500 text-white', HD:'bg-orange-500 text-white', LT:'bg-amber-500 text-white', '':'bg-gray-200 text-gray-500' };

const getDaysInMonth = (y, m) => new Date(y, m, 0).getDate();

const ManualAttendance = () => {
  const [employees, setEmployees] = useState([]);
  const [grid, setGrid] = useState({}); // { empId: { day: status } }
  const [loading, setLoading] = useState(true);
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const days = getDaysInMonth(year, month);

  const fetchData = async () => {
    setLoading(true);
    try {
      const empRes = await api.get('/employees');
      const emps = empRes.data.data || [];
      setEmployees(emps);
      const from = `${year}-${String(month).padStart(2,'0')}-01`;
      const to = `${year}-${String(month).padStart(2,'0')}-${String(days).padStart(2,'0')}`;
      const attRes = await api.get(`/attendance?from_date=${from}&to_date=${to}&limit=5000`);
      const records = attRes.data.data || [];
      const newGrid = {};
      emps.forEach(e => { newGrid[e._id] = {}; });
      records.forEach(r => {
        const empId = r.employee_id?._id || r.employee_id;
        const day = new Date(r.attendance_date).getDate();
        const abbr = { Present:'P', Absent:'A', Leave:'L', Holiday:'H', 'Week Off':'WO', 'Half Day':'HD', Late:'LT', 'Early Exit':'P' };
        if (newGrid[empId]) newGrid[empId][day] = abbr[r.attendance_status] || '';
      });
      setGrid(newGrid);
    } catch(e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [month, year]);

  const cycleStatus = (empId, day) => {
    const current = grid[empId]?.[day] || '';
    const next = STATUSES[(STATUSES.indexOf(current) + 1) % STATUSES.length];
    setGrid(g => ({ ...g, [empId]: { ...(g[empId]||{}), [day]: next } }));
  };

  const getTotal = (empId, status) => Object.values(grid[empId] || {}).filter(s => s === status).length;

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap justify-between items-center gap-3 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <div><h3 className="text-lg font-black text-gray-900 m-0 flex items-center gap-2"><span className="w-2.5 h-5 bg-blue-600 rounded-full" />Manual Attendance</h3><p className="text-xs text-gray-500 mt-1 m-0">Click cells to cycle: P → A → L → H → WO → HD → LT</p></div>
        <div className="flex items-center gap-2">
          <select value={month} onChange={e=>setMonth(Number(e.target.value))} className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold">{months.map((m,i)=><option key={i} value={i+1}>{m}</option>)}</select>
          <select value={year} onChange={e=>setYear(Number(e.target.value))} className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold">{[2024,2025,2026,2027].map(y=><option key={y}>{y}</option>)}</select>
          <button className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-700 text-xs font-bold rounded-xl border-0 cursor-pointer"><Download className="w-4 h-4" />Export</button>
          <button className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-700 text-xs font-bold rounded-xl border-0 cursor-pointer"><Upload className="w-4 h-4" />Import</button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 bg-white p-3 rounded-xl border border-gray-100">
        {[['P','Present'],['A','Absent'],['L','Leave'],['H','Holiday'],['WO','Week Off'],['HD','Half Day'],['LT','Late']].map(([k,v])=>(
          <div key={k} className="flex items-center gap-1.5"><span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${STATUS_COLORS[k]}`}>{k}</span><span className="text-[10px] text-gray-500">{v}</span></div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 text-[10px]">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-3 py-2.5 text-left font-bold text-gray-500 uppercase sticky left-0 bg-gray-50 z-10 min-w-[150px]">Employee</th>
                {[...Array(days)].map((_,i)=><th key={i+1} className="px-1.5 py-2.5 text-center font-bold text-gray-500 min-w-[28px]">{i+1}</th>)}
                <th className="px-2 py-2.5 text-center font-bold text-gray-500 bg-emerald-50">P</th>
                <th className="px-2 py-2.5 text-center font-bold text-gray-500 bg-red-50">A</th>
                <th className="px-2 py-2.5 text-center font-bold text-gray-500 bg-blue-50">L</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? <tr><td colSpan={days+4} className="py-10 text-center text-xs text-gray-400">Loading attendance grid...</td></tr>
              : employees.length > 0 ? employees.map(emp => (
                <tr key={emp._id} className="hover:bg-gray-50/30">
                  <td className="px-3 py-2 sticky left-0 bg-white z-10 border-r border-gray-100">
                    <p className="font-bold text-gray-900 m-0">{emp.first_name} {emp.last_name}</p>
                    <p className="text-blue-500 m-0">{emp.employee_code}</p>
                  </td>
                  {[...Array(days)].map((_,i) => {
                    const day = i + 1;
                    const status = grid[emp._id]?.[day] || '';
                    return (
                      <td key={day} className="px-0.5 py-1 text-center">
                        <button onClick={() => cycleStatus(emp._id, day)} className={`w-7 h-7 rounded-md text-[9px] font-black border-0 cursor-pointer transition-colors ${STATUS_COLORS[status]}`}>
                          {status || '·'}
                        </button>
                      </td>
                    );
                  })}
                  <td className="px-2 py-2 text-center font-black text-emerald-700 bg-emerald-50">{getTotal(emp._id,'P')}</td>
                  <td className="px-2 py-2 text-center font-black text-red-700 bg-red-50">{getTotal(emp._id,'A')}</td>
                  <td className="px-2 py-2 text-center font-black text-blue-700 bg-blue-50">{getTotal(emp._id,'L')}</td>
                </tr>
              )) : <tr><td colSpan={days+4} className="py-10 text-center text-xs text-gray-400">No employees found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default ManualAttendance;
