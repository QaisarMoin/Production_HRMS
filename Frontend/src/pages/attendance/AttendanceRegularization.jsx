import { useState, useEffect } from 'react';
import { Plus, Search, Check, X, Clock } from 'lucide-react';
import Modal from '../../components/common/Modal';
import api from '../../utils/api';

const STATUS_COLORS = { Applied: 'bg-amber-100 text-amber-700', 'Under Review': 'bg-blue-100 text-blue-700', Approved: 'bg-emerald-100 text-emerald-700', Rejected: 'bg-red-100 text-red-700' };

const AttendanceRegularization = () => {
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [formData, setFormData] = useState({ employee_id: '', attendance_date: '', requested_in_time: '', requested_out_time: '', reason: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = filterStatus ? `?approval_status=${filterStatus}` : '';
      const [regRes, empRes] = await Promise.all([api.get(`/attendance-regularization${params}`), api.get('/employees')]);
      setRecords(regRes.data.data || []); setEmployees(empRes.data.data || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [filterStatus]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData, requested_in_time: new Date(`${formData.attendance_date}T${formData.requested_in_time}`), requested_out_time: new Date(`${formData.attendance_date}T${formData.requested_out_time}`) };
      await api.post('/attendance-regularization', payload);
      setIsModalOpen(false); fetchData();
    } catch (e) { alert(e.response?.data?.message || e.message); }
  };

  const handleApproval = async (id, status) => {
    await api.put(`/attendance-regularization/${id}`, { approval_status: status }); fetchData();
  };

  const filtered = records.filter(r => `${r.employee_id?.first_name} ${r.employee_id?.last_name} ${r.regularization_number}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap justify-between items-center gap-3 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <div><h3 className="text-lg font-black text-gray-900 m-0 flex items-center gap-2"><span className="w-2.5 h-5 bg-blue-600 rounded-full" />Attendance Regularization</h3><p className="text-xs text-gray-500 mt-1 m-0">Employee punch time correction requests and multi-level approvals</p></div>
        <button onClick={() => { setFormData({ employee_id: '', attendance_date: '', requested_in_time: '', requested_out_time: '', reason: '' }); setIsModalOpen(true); }} className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 text-white text-xs font-black rounded-xl border-0 cursor-pointer shadow-sm"><Plus className="w-4 h-4" />Apply Regularization</button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input placeholder="Search by name or REG number..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs" /></div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold">
          <option value="">All Statuses</option>{['Applied','Under Review','Approved','Rejected'].map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50"><tr>{['Reg. Number','Employee','Date','Requested Time','Reason','Status','Actions'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? <tr><td colSpan={7} className="py-10 text-center text-xs text-gray-400">Loading...</td></tr>
            : filtered.length > 0 ? filtered.map(r => (
              <tr key={r._id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3 text-xs font-mono font-bold text-gray-700">{r.regularization_number}</td>
                <td className="px-4 py-3 text-xs font-bold text-gray-900">{r.employee_id?.first_name} {r.employee_id?.last_name}<span className="text-[10px] text-blue-500 block">{r.employee_id?.employee_code}</span></td>
                <td className="px-4 py-3 text-xs text-gray-600">{r.attendance_date ? new Date(r.attendance_date).toLocaleDateString() : '—'}</td>
                <td className="px-4 py-3 text-xs text-gray-600">{r.requested_in_time ? new Date(r.requested_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'} → {r.requested_out_time ? new Date(r.requested_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                <td className="px-4 py-3 text-xs text-gray-600 max-w-[160px] truncate">{r.reason}</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_COLORS[r.approval_status] || 'bg-gray-100 text-gray-600'}`}>{r.approval_status}</span></td>
                <td className="px-4 py-3">
                  {r.approval_status === 'Applied' && (
                    <div className="flex gap-2">
                      <button onClick={() => handleApproval(r._id, 'Approved')} className="text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-lg text-[10px] font-bold border-0 cursor-pointer flex items-center gap-1"><Check className="w-3 h-3" />Approve</button>
                      <button onClick={() => handleApproval(r._id, 'Rejected')} className="text-red-600 bg-red-50 hover:bg-red-100 px-2 py-1 rounded-lg text-[10px] font-bold border-0 cursor-pointer flex items-center gap-1"><X className="w-3 h-3" />Reject</button>
                    </div>
                  )}
                </td>
              </tr>
            )) : <tr><td colSpan={7} className="py-10 text-center text-xs text-gray-400">No regularization requests found</td></tr>}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Apply Attendance Regularization">
        <form onSubmit={handleSubmit} className="space-y-3 text-left">
          <div><label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Employee</label>
            <select value={formData.employee_id} onChange={e => setFormData(f => ({ ...f, employee_id: e.target.value }))} required className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold">
              <option value="">-- Select Employee --</option>{employees.map(e => <option key={e._id} value={e._id}>{e.first_name} {e.last_name} ({e.employee_code})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Date</label><input type="date" value={formData.attendance_date} onChange={e => setFormData(f => ({ ...f, attendance_date: e.target.value }))} required className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs" /></div>
            <div><label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">In Time</label><input type="time" value={formData.requested_in_time} onChange={e => setFormData(f => ({ ...f, requested_in_time: e.target.value }))} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs" /></div>
            <div><label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Out Time</label><input type="time" value={formData.requested_out_time} onChange={e => setFormData(f => ({ ...f, requested_out_time: e.target.value }))} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs" /></div>
          </div>
          <div><label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Reason</label><textarea rows={3} value={formData.reason} onChange={e => setFormData(f => ({ ...f, reason: e.target.value }))} required className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs" placeholder="Explain reason for regularization..." /></div>
          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-500 cursor-pointer">Cancel</button>
            <button type="submit" className="px-5 py-2 bg-blue-600 text-white text-xs font-black rounded-xl border-0 cursor-pointer">Submit Request</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AttendanceRegularization;
