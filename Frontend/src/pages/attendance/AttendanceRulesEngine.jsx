import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import Modal from '../../components/common/Modal';
import api from '../../utils/api';

const AttendanceRulesEngine = () => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({ rule_name: '', rule_type: 'Fixed', in_time: '09:00', out_time: '18:00', grace_minutes: 15, half_day_hours: 4, overtime_enabled: false, overtime_after_hours: 9, late_fine_enabled: false, status: 'Active' });

  const fetchData = async () => { setLoading(true); try { const r = await api.get('/attendance-rules'); setRules(r.data.data||[]); } catch(e){} finally{setLoading(false);} };
  useEffect(()=>{fetchData();},[]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) await api.put(`/attendance-rules/${editing._id}`, formData);
      else await api.post('/attendance-rules', formData);
      setIsModalOpen(false); fetchData();
    } catch(err){ alert(err.response?.data?.message||err.message); }
  };
  const handleEdit = (r) => { setEditing(r); setFormData({ rule_name:r.rule_name, rule_type:r.rule_type, in_time:r.in_time, out_time:r.out_time, grace_minutes:r.grace_minutes||0, half_day_hours:r.half_day_hours||4, overtime_enabled:r.overtime_enabled||false, overtime_after_hours:r.overtime_after_hours||9, late_fine_enabled:r.late_fine_enabled||false, status:r.status||'Active' }); setIsModalOpen(true); };
  const handleDelete = async (id) => { if(!confirm('Delete rule?')) return; await api.delete(`/attendance-rules/${id}`); fetchData(); };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap justify-between items-center gap-3 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <div><h3 className="text-lg font-black text-gray-900 m-0 flex items-center gap-2"><span className="w-2.5 h-5 bg-blue-600 rounded-full" />Attendance Rules Engine</h3><p className="text-xs text-gray-500 mt-1 m-0">Configure attendance calculation rules with grace, OT and late fine</p></div>
        <button onClick={()=>{setEditing(null);setFormData({rule_name:'',rule_type:'Fixed',in_time:'09:00',out_time:'18:00',grace_minutes:15,half_day_hours:4,overtime_enabled:false,overtime_after_hours:9,late_fine_enabled:false,status:'Active'});setIsModalOpen(true);}} className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 text-white text-xs font-black rounded-xl border-0 cursor-pointer shadow-sm"><Plus className="w-4 h-4" />Add Rule</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? [...Array(2)].map((_,i)=><div key={i} className="h-40 bg-gray-100 rounded-2xl animate-pulse" />)
        : rules.length>0 ? rules.map(r=>(
          <div key={r._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <div><h4 className="font-black text-gray-900 text-sm m-0">{r.rule_name}</h4><span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${r.rule_type==='Fixed'?'bg-blue-100 text-blue-700':'bg-purple-100 text-purple-700'}`}>{r.rule_type}</span></div>
              <div className="flex gap-2">
                <button onClick={()=>handleEdit(r)} className="text-blue-600 bg-transparent border-0 cursor-pointer"><Edit className="w-4 h-4"/></button>
                <button onClick={()=>handleDelete(r._id)} className="text-red-600 bg-transparent border-0 cursor-pointer"><Trash2 className="w-4 h-4"/></button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="bg-blue-50 p-2 rounded-lg text-center"><p className="text-[9px] text-gray-500 m-0">Shift</p><p className="text-xs font-black text-blue-700 m-0">{r.in_time} – {r.out_time}</p></div>
              <div className="bg-amber-50 p-2 rounded-lg text-center"><p className="text-[9px] text-gray-500 m-0">Grace</p><p className="text-xs font-black text-amber-700 m-0">{r.grace_minutes}m</p></div>
            </div>
            <div className="flex flex-wrap gap-2">
              {r.overtime_enabled&&<span className="text-[9px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">OT After {r.overtime_after_hours}h</span>}
              {r.late_fine_enabled&&<span className="text-[9px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">Late Fine Enabled</span>}
              <span className="text-[9px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-bold">Half Day: {r.half_day_hours}h</span>
              <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${r.status==='Active'?'bg-emerald-100 text-emerald-700':'bg-gray-100 text-gray-500'}`}>{r.status}</span>
            </div>
          </div>
        )) : <div className="col-span-2 py-16 text-center text-xs text-gray-400">No attendance rules configured</div>}
      </div>

      <Modal isOpen={isModalOpen} onClose={()=>setIsModalOpen(false)} title={editing?'Edit Attendance Rule':'Create Attendance Rule'}>
        <form onSubmit={handleSubmit} className="space-y-3 text-left max-h-[450px] overflow-y-auto pr-1">
          <div><label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Rule Name</label><input value={formData.rule_name} onChange={e=>setFormData(f=>({...f,rule_name:e.target.value}))} required className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs" placeholder="e.g. General Office Rule" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Rule Type</label><select value={formData.rule_type} onChange={e=>setFormData(f=>({...f,rule_type:e.target.value}))} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"><option>Fixed</option><option>Dynamic</option><option>Dynamic With Break</option></select></div>
            <div><label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Status</label><select value={formData.status} onChange={e=>setFormData(f=>({...f,status:e.target.value}))} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"><option>Active</option><option>Inactive</option></select></div>
            <div><label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">In Time</label><input type="time" value={formData.in_time} onChange={e=>setFormData(f=>({...f,in_time:e.target.value}))} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs" /></div>
            <div><label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Out Time</label><input type="time" value={formData.out_time} onChange={e=>setFormData(f=>({...f,out_time:e.target.value}))} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs" /></div>
            <div><label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Grace (mins)</label><input type="number" min="0" value={formData.grace_minutes} onChange={e=>setFormData(f=>({...f,grace_minutes:e.target.value}))} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs" /></div>
            <div><label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Half Day (hrs)</label><input type="number" min="0" step="0.5" value={formData.half_day_hours} onChange={e=>setFormData(f=>({...f,half_day_hours:e.target.value}))} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs" /></div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg"><input type="checkbox" id="ot" checked={formData.overtime_enabled} onChange={e=>setFormData(f=>({...f,overtime_enabled:e.target.checked}))} className="w-4 h-4" /><label htmlFor="ot" className="text-xs font-semibold text-gray-700 flex-1">Overtime Enabled</label>{formData.overtime_enabled&&<input type="number" min="1" value={formData.overtime_after_hours} onChange={e=>setFormData(f=>({...f,overtime_after_hours:e.target.value}))} className="w-16 px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs" placeholder="hrs" />}</div>
            <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg"><input type="checkbox" id="lf" checked={formData.late_fine_enabled} onChange={e=>setFormData(f=>({...f,late_fine_enabled:e.target.checked}))} className="w-4 h-4" /><label htmlFor="lf" className="text-xs font-semibold text-gray-700">Late Fine Enabled</label></div>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100"><button type="button" onClick={()=>setIsModalOpen(false)} className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-500 cursor-pointer">Cancel</button><button type="submit" className="px-5 py-2 bg-blue-600 text-white text-xs font-black rounded-xl border-0 cursor-pointer">{editing?'Update':'Create Rule'}</button></div>
        </form>
      </Modal>
    </div>
  );
};
export default AttendanceRulesEngine;
