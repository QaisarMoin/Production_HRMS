import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import Modal from '../../components/common/Modal';
import api from '../../utils/api';
const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

const WeekOffManagement = () => {
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ apply_to: 'Employee', employee_id: '', department_id: '', week_off_days: ['Saturday','Sunday'], effective_from: new Date().toISOString().split('T')[0] });

  const fetchData = async () => { setLoading(true); try { const [r,e,d] = await Promise.all([api.get('/week-offs'), api.get('/employees'), api.get('/departments')]); setRecords(r.data.data||[]); setEmployees(e.data.data||[]); setDepartments(d.data.data||[]); } catch(err){} finally{setLoading(false);} };
  useEffect(()=>{fetchData();},[]);
  const handleSubmit = async (e) => { e.preventDefault(); try { await api.post('/week-offs', formData); setIsModalOpen(false); fetchData(); } catch(err){ alert(err.response?.data?.message||err.message); } };
  const toggleDay = (day) => setFormData(f=>({...f,week_off_days:f.week_off_days.includes(day)?f.week_off_days.filter(d=>d!==day):[...f.week_off_days,day]}));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap justify-between items-center gap-3 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <div><h3 className="text-lg font-black text-gray-900 m-0 flex items-center gap-2"><span className="w-2.5 h-5 bg-blue-600 rounded-full" />Week Off Management</h3><p className="text-xs text-gray-500 mt-1 m-0">Configure weekly off rules per employee or department</p></div>
        <button onClick={()=>{setFormData({apply_to:'Employee',employee_id:'',department_id:'',week_off_days:['Saturday','Sunday'],effective_from:new Date().toISOString().split('T')[0]});setIsModalOpen(true);}} className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 text-white text-xs font-black rounded-xl border-0 cursor-pointer shadow-sm"><Plus className="w-4 h-4" />Add Week Off Rule</button>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50"><tr>{['Apply To','Name','Week Off Days','Effective From'].map(h=><th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? <tr><td colSpan={4} className="py-8 text-center text-xs text-gray-400">Loading...</td></tr>
            : records.length>0 ? records.map(r=>(
              <tr key={r._id} className="hover:bg-gray-50/50">
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.apply_to==='Employee'?'bg-blue-100 text-blue-700':'bg-indigo-100 text-indigo-700'}`}>{r.apply_to}</span></td>
                <td className="px-4 py-3 text-xs font-bold text-gray-900">{r.employee_id ? `${r.employee_id.first_name} ${r.employee_id.last_name}` : r.department_id?.name || 'All'}</td>
                <td className="px-4 py-3"><div className="flex flex-wrap gap-1">{r.week_off_days?.map(d=><span key={d} className="text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-bold">{d.slice(0,3)}</span>)}</div></td>
                <td className="px-4 py-3 text-xs text-gray-500">{r.effective_from?new Date(r.effective_from).toLocaleDateString():'—'}</td>
              </tr>
            )) : <tr><td colSpan={4} className="py-10 text-center text-xs text-gray-400">No week off rules configured</td></tr>}
          </tbody>
        </table>
      </div>
      <Modal isOpen={isModalOpen} onClose={()=>setIsModalOpen(false)} title="Configure Week Off Rule">
        <form onSubmit={handleSubmit} className="space-y-3 text-left">
          <div><label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Apply To</label><select value={formData.apply_to} onChange={e=>setFormData(f=>({...f,apply_to:e.target.value}))} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"><option>Employee</option><option>Department</option><option>All</option></select></div>
          {formData.apply_to==='Employee' && <div><label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Employee</label><select value={formData.employee_id} onChange={e=>setFormData(f=>({...f,employee_id:e.target.value}))} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"><option value="">-- Select Employee --</option>{employees.map(e=><option key={e._id} value={e._id}>{e.first_name} {e.last_name} ({e.employee_code})</option>)}</select></div>}
          {formData.apply_to==='Department' && <div><label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Department</label><select value={formData.department_id} onChange={e=>setFormData(f=>({...f,department_id:e.target.value}))} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"><option value="">-- Select Department --</option>{departments.map(d=><option key={d._id} value={d._id}>{d.name}</option>)}</select></div>}
          <div><label className="text-[10px] font-bold text-gray-500 uppercase block mb-2">Week Off Days</label><div className="flex flex-wrap gap-2">{DAYS.map(d=><button key={d} type="button" onClick={()=>toggleDay(d)} className={`px-2.5 py-1 rounded-lg text-xs font-bold border-0 cursor-pointer ${formData.week_off_days.includes(d)?'bg-purple-600 text-white':'bg-gray-100 text-gray-600'}`}>{d.slice(0,3)}</button>)}</div></div>
          <div><label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Effective From</label><input type="date" value={formData.effective_from} onChange={e=>setFormData(f=>({...f,effective_from:e.target.value}))} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs" /></div>
          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100"><button type="button" onClick={()=>setIsModalOpen(false)} className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-500 cursor-pointer">Cancel</button><button type="submit" className="px-5 py-2 bg-blue-600 text-white text-xs font-black rounded-xl border-0 cursor-pointer">Save Rule</button></div>
        </form>
      </Modal>
    </div>
  );
};
export default WeekOffManagement;
