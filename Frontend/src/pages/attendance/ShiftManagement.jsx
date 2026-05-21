import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Sun, Moon } from 'lucide-react';
import Modal from '../../components/common/Modal';
import api from '../../utils/api';

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

const ShiftManagement = () => {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({ shift_name: '', in_time: '09:00', out_time: '18:00', break_start: '13:00', break_end: '14:00', grace_in: 15, grace_out: 15, overnight_shift: false, weekly_offs: ['Saturday','Sunday'], status: 'Active' });

  const fetchData = async () => { setLoading(true); try { const r = await api.get('/shifts'); setShifts(r.data.data || []); } catch (e) {} finally { setLoading(false); } };
  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) await api.put(`/shifts/${editing._id}`, formData);
      else await api.post('/shifts', formData);
      setIsModalOpen(false); fetchData();
    } catch (e) { alert(e.response?.data?.message || e.message); }
  };

  const handleEdit = (s) => { setEditing(s); setFormData({ shift_name: s.shift_name, in_time: s.in_time, out_time: s.out_time, break_start: s.break_start || '', break_end: s.break_end || '', grace_in: s.grace_in || 0, grace_out: s.grace_out || 0, overnight_shift: s.overnight_shift || false, weekly_offs: s.weekly_offs || [], status: s.status || 'Active' }); setIsModalOpen(true); };
  const handleDelete = async (id) => { if (!confirm('Delete shift?')) return; await api.delete(`/shifts/${id}`); fetchData(); };
  const toggleWeeklyOff = (day) => setFormData(f => ({ ...f, weekly_offs: f.weekly_offs.includes(day) ? f.weekly_offs.filter(d => d !== day) : [...f.weekly_offs, day] }));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap justify-between items-center gap-3 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <div><h3 className="text-lg font-black text-gray-900 m-0 flex items-center gap-2"><span className="w-2.5 h-5 bg-blue-600 rounded-full" />Shift Management</h3><p className="text-xs text-gray-500 mt-1 m-0">Create and manage work shifts with grace timings and overnight support</p></div>
        <button onClick={() => { setEditing(null); setFormData({ shift_name: '', in_time: '09:00', out_time: '18:00', break_start: '13:00', break_end: '14:00', grace_in: 15, grace_out: 15, overnight_shift: false, weekly_offs: ['Saturday','Sunday'], status: 'Active' }); setIsModalOpen(true); }} className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 text-white text-xs font-black rounded-xl border-0 cursor-pointer shadow-sm"><Plus className="w-4 h-4" />Add Shift</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? [...Array(3)].map((_, i) => <div key={i} className="h-36 bg-gray-100 rounded-2xl animate-pulse" />) : shifts.length > 0 ? shifts.map(s => (
          <div key={s._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                {s.overnight_shift ? <Moon className="w-5 h-5 text-indigo-500" /> : <Sun className="w-5 h-5 text-amber-500" />}
                <h4 className="font-black text-gray-900 text-sm m-0">{s.shift_name}</h4>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${s.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>{s.status}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="bg-blue-50 rounded-xl p-2 text-center"><p className="text-[10px] text-gray-500 m-0">In Time</p><p className="text-sm font-black text-blue-700 m-0">{s.in_time}</p></div>
              <div className="bg-red-50 rounded-xl p-2 text-center"><p className="text-[10px] text-gray-500 m-0">Out Time</p><p className="text-sm font-black text-red-700 m-0">{s.out_time}</p></div>
            </div>
            <div className="flex items-center gap-2 mb-3 text-xs text-gray-500">
              <span>Grace In: <b className="text-gray-700">{s.grace_in}m</b></span>
              <span>·</span>
              <span>Grace Out: <b className="text-gray-700">{s.grace_out}m</b></span>
            </div>
            <div className="flex flex-wrap gap-1 mb-3">
              {DAYS.map(d => <span key={d} className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${s.weekly_offs?.includes(d) ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>{d.slice(0,3)}</span>)}
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleEdit(s)} className="flex-1 text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg text-xs font-bold border-0 cursor-pointer flex items-center justify-center gap-1"><Edit className="w-3 h-3" />Edit</button>
              <button onClick={() => handleDelete(s._id)} className="flex-1 text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg text-xs font-bold border-0 cursor-pointer flex items-center justify-center gap-1"><Trash2 className="w-3 h-3" />Delete</button>
            </div>
          </div>
        )) : <div className="col-span-3 py-16 text-center text-xs text-gray-400">No shifts configured yet</div>}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editing ? 'Edit Shift' : 'Create New Shift'}>
        <form onSubmit={handleSubmit} className="space-y-3 text-left max-h-[450px] overflow-y-auto pr-1">
          <div><label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Shift Name</label><input value={formData.shift_name} onChange={e => setFormData(f => ({ ...f, shift_name: e.target.value }))} required className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs" placeholder="e.g. General Shift" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">In Time</label><input type="time" value={formData.in_time} onChange={e => setFormData(f => ({ ...f, in_time: e.target.value }))} required className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs" /></div>
            <div><label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Out Time</label><input type="time" value={formData.out_time} onChange={e => setFormData(f => ({ ...f, out_time: e.target.value }))} required className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs" /></div>
            <div><label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Break Start</label><input type="time" value={formData.break_start} onChange={e => setFormData(f => ({ ...f, break_start: e.target.value }))} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs" /></div>
            <div><label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Break End</label><input type="time" value={formData.break_end} onChange={e => setFormData(f => ({ ...f, break_end: e.target.value }))} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs" /></div>
            <div><label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Grace In (mins)</label><input type="number" min="0" value={formData.grace_in} onChange={e => setFormData(f => ({ ...f, grace_in: e.target.value }))} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs" /></div>
            <div><label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Grace Out (mins)</label><input type="number" min="0" value={formData.grace_out} onChange={e => setFormData(f => ({ ...f, grace_out: e.target.value }))} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs" /></div>
          </div>
          <div className="flex items-center gap-2"><input type="checkbox" id="overnight" checked={formData.overnight_shift} onChange={e => setFormData(f => ({ ...f, overnight_shift: e.target.checked }))} className="w-4 h-4 rounded" /><label htmlFor="overnight" className="text-xs font-semibold text-gray-700">Overnight Shift</label></div>
          <div><label className="text-[10px] font-bold text-gray-500 uppercase block mb-2">Weekly Off Days</label>
            <div className="flex flex-wrap gap-2">{DAYS.map(d => <button key={d} type="button" onClick={() => toggleWeeklyOff(d)} className={`px-2.5 py-1 rounded-lg text-xs font-bold border-0 cursor-pointer ${formData.weekly_offs.includes(d) ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600'}`}>{d.slice(0,3)}</button>)}</div>
          </div>
          <div><label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Status</label>
            <select value={formData.status} onChange={e => setFormData(f => ({ ...f, status: e.target.value }))} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"><option>Active</option><option>Inactive</option></select>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-500 cursor-pointer">Cancel</button>
            <button type="submit" className="px-5 py-2 bg-blue-600 text-white text-xs font-black rounded-xl border-0 cursor-pointer">{editing ? 'Update' : 'Create Shift'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ShiftManagement;
