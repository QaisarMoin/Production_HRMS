import { useState, useEffect } from 'react';
import { Plus, Trash2, Calendar } from 'lucide-react';
import Modal from '../../components/common/Modal';
import api from '../../utils/api';

const TYPES = ['National','Festival','Optional','Department'];
const TYPE_COLORS = { National:'bg-red-100 text-red-700', Festival:'bg-orange-100 text-orange-700', Optional:'bg-blue-100 text-blue-700', Department:'bg-purple-100 text-purple-700' };

const HolidayMapping = () => {
  const [holidays, setHolidays] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ holiday_name:'', holiday_date:'', holiday_type:'National', applicable_departments:[], status:'Active' });

  const fetchData = async () => { setLoading(true); try { const [h,d] = await Promise.all([api.get('/holiday-mappings'), api.get('/departments')]); setHolidays(h.data.data||[]); setDepartments(d.data.data||[]); } catch(e){} finally{setLoading(false);} };
  useEffect(()=>{fetchData();},[]);
  const handleSubmit = async (e) => { e.preventDefault(); try { await api.post('/holiday-mappings', formData); setIsModalOpen(false); fetchData(); } catch(err){ alert(err.response?.data?.message||err.message); } };
  const handleDelete = async (id) => { if(!confirm('Delete holiday?')) return; await api.delete(`/holiday-mappings/${id}`); fetchData(); };
  const toggleDept = (id) => setFormData(f=>({...f,applicable_departments:f.applicable_departments.includes(id)?f.applicable_departments.filter(d=>d!==id):[...f.applicable_departments,id]}));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap justify-between items-center gap-3 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <div><h3 className="text-lg font-black text-gray-900 m-0 flex items-center gap-2"><span className="w-2.5 h-5 bg-blue-600 rounded-full" />Holiday Mapping</h3><p className="text-xs text-gray-500 mt-1 m-0">Manage national, festival, and department holidays calendar</p></div>
        <button onClick={()=>{setFormData({holiday_name:'',holiday_date:'',holiday_type:'National',applicable_departments:[],status:'Active'});setIsModalOpen(true);}} className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 text-white text-xs font-black rounded-xl border-0 cursor-pointer shadow-sm"><Plus className="w-4 h-4" />Add Holiday</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? [...Array(3)].map((_,i)=><div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)
        : holidays.length>0 ? holidays.map(h=>(
          <div key={h._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-start justify-between hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0"><Calendar className="w-5 h-5 text-red-500" /></div>
              <div>
                <p className="text-sm font-black text-gray-900 m-0">{h.holiday_name}</p>
                <p className="text-xs text-gray-500 m-0">{new Date(h.holiday_date).toLocaleDateString('en-IN',{day:'2-digit',month:'long',year:'numeric'})}</p>
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold mt-1 inline-block ${TYPE_COLORS[h.holiday_type]||'bg-gray-100 text-gray-600'}`}>{h.holiday_type}</span>
              </div>
            </div>
            <button onClick={()=>handleDelete(h._id)} className="text-red-400 hover:text-red-600 bg-transparent border-0 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
          </div>
        )) : <div className="col-span-3 py-16 text-center text-xs text-gray-400">No holidays mapped</div>}
      </div>
      <Modal isOpen={isModalOpen} onClose={()=>setIsModalOpen(false)} title="Add Holiday">
        <form onSubmit={handleSubmit} className="space-y-3 text-left">
          <div><label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Holiday Name</label><input value={formData.holiday_name} onChange={e=>setFormData(f=>({...f,holiday_name:e.target.value}))} required className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs" placeholder="e.g. Diwali" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Date</label><input type="date" value={formData.holiday_date} onChange={e=>setFormData(f=>({...f,holiday_date:e.target.value}))} required className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs" /></div>
            <div><label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Type</label><select value={formData.holiday_type} onChange={e=>setFormData(f=>({...f,holiday_type:e.target.value}))} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold">{TYPES.map(t=><option key={t}>{t}</option>)}</select></div>
          </div>
          {formData.holiday_type==='Department' && <div><label className="text-[10px] font-bold text-gray-500 uppercase block mb-2">Applicable Departments</label><div className="flex flex-wrap gap-2">{departments.map(d=><button key={d._id} type="button" onClick={()=>toggleDept(d._id)} className={`px-2.5 py-1 rounded-lg text-xs font-bold border-0 cursor-pointer ${formData.applicable_departments.includes(d._id)?'bg-purple-600 text-white':'bg-gray-100 text-gray-600'}`}>{d.name}</button>)}</div></div>}
          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100"><button type="button" onClick={()=>setIsModalOpen(false)} className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-500 cursor-pointer">Cancel</button><button type="submit" className="px-5 py-2 bg-blue-600 text-white text-xs font-black rounded-xl border-0 cursor-pointer">Add Holiday</button></div>
        </form>
      </Modal>
    </div>
  );
};
export default HolidayMapping;
