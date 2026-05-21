import { useState, useEffect } from 'react';
import { FileText, Download, Filter } from 'lucide-react';
import api from '../../utils/api';

const AttendanceLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const TYPE_COLORS = { Create:'bg-emerald-100 text-emerald-700', Update:'bg-blue-100 text-blue-700', Delete:'bg-red-100 text-red-700', Approve:'bg-purple-100 text-purple-700', Reject:'bg-red-100 text-red-700', Import:'bg-amber-100 text-amber-700', Export:'bg-indigo-100 text-indigo-700' };

  const fetchData = async () => { setLoading(true); try { const r = await api.get('/attendance-logs'); setLogs(r.data.data||[]); } catch(e){} finally{setLoading(false);} };
  useEffect(()=>{fetchData();},[]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap justify-between items-center gap-3 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <div><h3 className="text-lg font-black text-gray-900 m-0 flex items-center gap-2"><span className="w-2.5 h-5 bg-blue-600 rounded-full" />Attendance Audit Logs</h3><p className="text-xs text-gray-500 mt-1 m-0">Complete change history and audit trail for attendance module</p></div>
        <button onClick={fetchData} className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-700 text-xs font-bold rounded-xl border-0 cursor-pointer"><Filter className="w-4 h-4" />Refresh</button>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50"><tr>{['Module','Action','Type','Timestamp'].map(h=><th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? <tr><td colSpan={4} className="py-8 text-center text-xs text-gray-400">Loading...</td></tr>
            : logs.length>0 ? logs.map(l=>(
              <tr key={l._id} className="hover:bg-gray-50/50">
                <td className="px-4 py-3 text-xs font-bold text-gray-700">{l.module_name||'—'}</td>
                <td className="px-4 py-3 text-xs text-gray-600">{l.action}</td>
                <td className="px-4 py-3"><span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${TYPE_COLORS[l.log_type]||'bg-gray-100 text-gray-600'}`}>{l.log_type}</span></td>
                <td className="px-4 py-3 text-xs text-gray-500">{new Date(l.created_at).toLocaleString()}</td>
              </tr>
            )) : <tr><td colSpan={4} className="py-10 text-center text-xs text-gray-400">No audit logs yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default AttendanceLogs;
