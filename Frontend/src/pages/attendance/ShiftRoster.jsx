import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import Modal from '../../components/common/Modal';
import api from '../../utils/api';

const ShiftRoster = () => {
  const [assignments, setAssignments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const now = new Date();
  const [rosterMonth, setRosterMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
  const [formData, setFormData] = useState({ employee_id: '', shift_id: '', roster_month: rosterMonth });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [aRes, eRes, sRes] = await Promise.all([api.get(`/shift-assignments?roster_month=${rosterMonth}`), api.get('/employees'), api.get('/shifts')]);
      setAssignments(aRes.data.data || []); setEmployees(eRes.data.data || []); setShifts(sRes.data.data || []);
    } catch (e) {} finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, [rosterMonth]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData, roster_month: rosterMonth };
      if (editing) await api.put(`/shift-assignments/${editing._id}`, payload);
      else await api.post('/shift-assignments', payload);
      setIsModalOpen(false); fetchData();
    } catch (e) { alert(e.response?.data?.message || e.message); }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap justify-between items-center gap-3 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <div><h3 className="text-lg font-black text-gray-900 m-0 flex items-center gap-2"><span className="w-2.5 h-5 bg-blue-600 rounded-full" />Shift Roster</h3><p className="text-xs text-gray-500 mt-1 m-0">Assign shifts to employees per month with bulk support</p></div>
        <div className="flex items-center gap-3">
          <input type="month" value={rosterMonth} onChange={e => setRosterMonth(e.target.value)} className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold" />
          <button onClick={() => { setEditing(null); setFormData({ employee_id: '', shift_id: '', roster_month: rosterMonth }); setIsModalOpen(true); }} className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 text-white text-xs font-black rounded-xl border-0 cursor-pointer shadow-sm"><Plus className="w-4 h-4" />Assign Shift</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50"><tr>{['Employee','Shift','Timing','Roster Month','Week Off','Actions'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? <tr><td colSpan={6} className="py-10 text-center text-xs text-gray-400">Loading...</td></tr>
            : assignments.length > 0 ? assignments.map(a => (
              <tr key={a._id} className="hover:bg-gray-50/50">
                <td className="px-4 py-3 text-xs font-bold text-gray-900">{a.employee_id?.first_name} {a.employee_id?.last_name}<span className="text-[10px] text-blue-500 block">{a.employee_id?.employee_code}</span></td>
                <td className="px-4 py-3 text-xs font-semibold text-indigo-700">{a.shift_id?.shift_name}</td>
                <td className="px-4 py-3 text-xs text-gray-600">{a.shift_id?.in_time} – {a.shift_id?.out_time}</td>
                <td className="px-4 py-3 text-xs text-gray-600">{a.roster_month}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{a.shift_id?.weekly_offs?.join(', ') || '—'}</td>
                <td className="px-4 py-3"><div className="flex gap-2">
                  <button onClick={() => { setEditing(a); setFormData({ employee_id: a.employee_id?._id || '', shift_id: a.shift_id?._id || '', roster_month: a.roster_month }); setIsModalOpen(true); }} className="text-blue-600 bg-transparent border-0 cursor-pointer"><Edit className="w-3.5 h-3.5" /></button>
                  <button onClick={async () => { if (!confirm('Remove assignment?')) return; await api.delete(`/shift-assignments/${a._id}`); fetchData(); }} className="text-red-600 bg-transparent border-0 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                </div></td>
              </tr>
            )) : <tr><td colSpan={6} className="py-10 text-center text-xs text-gray-400">No shift assignments for {rosterMonth}</td></tr>}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editing ? 'Edit Assignment' : 'Assign Shift to Employee'}>
        <form onSubmit={handleSubmit} className="space-y-3 text-left">
          <div><label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Employee</label>
            <select value={formData.employee_id} onChange={e => setFormData(f => ({ ...f, employee_id: e.target.value }))} required className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold">
              <option value="">-- Select Employee --</option>{employees.map(e => <option key={e._id} value={e._id}>{e.first_name} {e.last_name} ({e.employee_code})</option>)}
            </select>
          </div>
          <div><label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Shift</label>
            <select value={formData.shift_id} onChange={e => setFormData(f => ({ ...f, shift_id: e.target.value }))} required className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold">
              <option value="">-- Select Shift --</option>{shifts.map(s => <option key={s._id} value={s._id}>{s.shift_name} ({s.in_time}–{s.out_time})</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-500 cursor-pointer">Cancel</button>
            <button type="submit" className="px-5 py-2 bg-blue-600 text-white text-xs font-black rounded-xl border-0 cursor-pointer">Save</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ShiftRoster;
