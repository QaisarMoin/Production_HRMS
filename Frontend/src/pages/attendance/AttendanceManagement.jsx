import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Download, Upload, Filter } from 'lucide-react';
import Modal from '../../components/common/Modal';
import api from '../../utils/api';

const STATUS_COLORS = {
  Present: 'bg-emerald-100 text-emerald-700', Absent: 'bg-red-100 text-red-700',
  Late: 'bg-amber-100 text-amber-700', 'Half Day': 'bg-orange-100 text-orange-700',
  Leave: 'bg-blue-100 text-blue-700', 'Week Off': 'bg-purple-100 text-purple-700',
  Holiday: 'bg-indigo-100 text-indigo-700', 'Early Exit': 'bg-pink-100 text-pink-700',
};

const AttendanceManagement = () => {
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filters, setFilters] = useState({ search: '', department: '', attendance_status: '', from_date: '', to_date: '' });
  const [formData, setFormData] = useState({ employee_id: '', attendance_date: new Date().toISOString().split('T')[0], in_time: '', out_time: '', attendance_status: 'Present', late_minutes: 0, overtime_hours: 0, shift_id: '', remarks: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.department) params.append('department', filters.department);
      if (filters.attendance_status) params.append('attendance_status', filters.attendance_status);
      if (filters.from_date) params.append('from_date', filters.from_date);
      if (filters.to_date) params.append('to_date', filters.to_date);
      const [recRes, empRes, shiftRes, deptRes] = await Promise.all([
        api.get(`/attendance?${params}`), api.get('/employees'), api.get('/shifts'), api.get('/departments'),
      ]);
      setRecords(recRes.data.data || []); setEmployees(empRes.data.data || []);
      setShifts(shiftRes.data.data || []); setDepartments(deptRes.data.data || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [filters.department, filters.attendance_status, filters.from_date, filters.to_date]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData };
      if (formData.in_time) payload.in_time = new Date(`${formData.attendance_date}T${formData.in_time}`);
      if (formData.out_time) payload.out_time = new Date(`${formData.attendance_date}T${formData.out_time}`);
      if (editing) await api.put(`/attendance/${editing._id}`, payload);
      else await api.post('/attendance', payload);
      setIsModalOpen(false); fetchData();
    } catch (e) { alert(e.response?.data?.message || e.message); }
  };

  const handleEdit = (r) => {
    setEditing(r);
    setFormData({ employee_id: r.employee_id?._id || '', attendance_date: new Date(r.attendance_date).toISOString().split('T')[0], in_time: r.in_time ? new Date(r.in_time).toTimeString().slice(0,5) : '', out_time: r.out_time ? new Date(r.out_time).toTimeString().slice(0,5) : '', attendance_status: r.attendance_status, late_minutes: r.late_minutes || 0, overtime_hours: r.overtime_hours || 0, shift_id: r.shift_id?._id || '', remarks: r.remarks || '' });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this attendance record?')) return;
    await api.delete(`/attendance/${id}`); fetchData();
  };

  const filtered = records.filter(r => {
    const name = `${r.employee_id?.first_name} ${r.employee_id?.last_name} ${r.employee_id?.employee_code}`.toLowerCase();
    return name.includes(filters.search.toLowerCase());
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap justify-between items-center gap-3 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h3 className="text-lg font-black text-gray-900 m-0 flex items-center gap-2"><span className="w-2.5 h-5 bg-blue-600 rounded-full" />Attendance Management</h3>
          <p className="text-xs text-gray-500 mt-1 m-0">Daily and monthly attendance records with full CRUD support</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => api.post('/attendance/export')} className="flex items-center gap-1.5 px-3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl border-0 cursor-pointer"><Download className="w-4 h-4" />Export</button>
          <button onClick={() => { setEditing(null); setFormData({ employee_id: '', attendance_date: new Date().toISOString().split('T')[0], in_time: '', out_time: '', attendance_status: 'Present', late_minutes: 0, overtime_hours: 0, shift_id: '', remarks: '' }); setIsModalOpen(true); }} className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl border-0 cursor-pointer shadow-sm"><Plus className="w-4 h-4" />Mark Attendance</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="relative md:col-span-2"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input placeholder="Search employee..." value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs" /></div>
          <select value={filters.department} onChange={e => setFilters(f => ({ ...f, department: e.target.value }))} className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold">
            <option value="">All Departments</option>{departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
          </select>
          <select value={filters.attendance_status} onChange={e => setFilters(f => ({ ...f, attendance_status: e.target.value }))} className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold">
            <option value="">All Statuses</option>{['Present','Absent','Late','Half Day','Leave','Week Off','Holiday','Early Exit'].map(s => <option key={s}>{s}</option>)}
          </select>
          <input type="date" value={filters.from_date} onChange={e => setFilters(f => ({ ...f, from_date: e.target.value }))} className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>{['Employee', 'Date', 'In Time', 'Out Time', 'Total Hrs', 'Late Mins', 'OT Hrs', 'Status', 'Actions'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? [...Array(5)].map((_, i) => <tr key={i}><td colSpan={9} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>)
              : filtered.length > 0 ? filtered.map(r => (
                <tr key={r._id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 text-xs font-bold text-gray-900">{r.employee_id?.first_name} {r.employee_id?.last_name}<span className="text-[10px] text-blue-500 block">{r.employee_id?.employee_code}</span></td>
                  <td className="px-4 py-3 text-xs text-gray-600">{new Date(r.attendance_date).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">{r.in_time ? new Date(r.in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">{r.out_time ? new Date(r.out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                  <td className="px-4 py-3 text-xs font-semibold text-gray-700">{r.total_hours?.toFixed(2) ?? '0.00'}</td>
                  <td className="px-4 py-3 text-xs text-red-600 font-semibold">{r.late_minutes ?? 0}</td>
                  <td className="px-4 py-3 text-xs text-green-600 font-semibold">{r.overtime_hours ?? 0}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_COLORS[r.attendance_status] || 'bg-gray-100 text-gray-700'}`}>{r.attendance_status}</span></td>
                  <td className="px-4 py-3"><div className="flex gap-2"><button onClick={() => handleEdit(r)} className="text-blue-600 border-0 bg-transparent cursor-pointer"><Edit className="w-3.5 h-3.5" /></button><button onClick={() => handleDelete(r._id)} className="text-red-600 border-0 bg-transparent cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button></div></td>
                </tr>
              )) : <tr><td colSpan={9} className="py-10 text-center text-xs text-gray-400">No attendance records found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editing ? 'Edit Attendance' : 'Mark Attendance'}>
        <form onSubmit={handleSubmit} className="space-y-3 text-left max-h-[450px] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Employee</label>
              <select value={formData.employee_id} onChange={e => setFormData(f => ({ ...f, employee_id: e.target.value }))} required className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold">
                <option value="">-- Select Employee --</option>{employees.map(e => <option key={e._id} value={e._id}>{e.first_name} {e.last_name} ({e.employee_code})</option>)}
              </select>
            </div>
            <div><label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Date</label><input type="date" value={formData.attendance_date} onChange={e => setFormData(f => ({ ...f, attendance_date: e.target.value }))} required className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs" /></div>
            <div><label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Status</label>
              <select value={formData.attendance_status} onChange={e => setFormData(f => ({ ...f, attendance_status: e.target.value }))} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold">
                {['Present','Absent','Late','Half Day','Leave','Week Off','Holiday','Early Exit'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div><label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">In Time</label><input type="time" value={formData.in_time} onChange={e => setFormData(f => ({ ...f, in_time: e.target.value }))} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs" /></div>
            <div><label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Out Time</label><input type="time" value={formData.out_time} onChange={e => setFormData(f => ({ ...f, out_time: e.target.value }))} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs" /></div>
            <div><label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Late Minutes</label><input type="number" min="0" value={formData.late_minutes} onChange={e => setFormData(f => ({ ...f, late_minutes: e.target.value }))} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs" /></div>
            <div><label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Overtime Hrs</label><input type="number" min="0" step="0.5" value={formData.overtime_hours} onChange={e => setFormData(f => ({ ...f, overtime_hours: e.target.value }))} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs" /></div>
            <div><label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Shift</label>
              <select value={formData.shift_id} onChange={e => setFormData(f => ({ ...f, shift_id: e.target.value }))} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs">
                <option value="">-- No Shift --</option>{shifts.map(s => <option key={s._id} value={s._id}>{s.shift_name}</option>)}
              </select>
            </div>
            <div className="col-span-2"><label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Remarks</label><input value={formData.remarks} onChange={e => setFormData(f => ({ ...f, remarks: e.target.value }))} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs" placeholder="Optional remarks" /></div>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-500 cursor-pointer">Cancel</button>
            <button type="submit" className="px-5 py-2 bg-blue-600 text-white text-xs font-black rounded-xl cursor-pointer border-0">{editing ? 'Update' : 'Save'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AttendanceManagement;
