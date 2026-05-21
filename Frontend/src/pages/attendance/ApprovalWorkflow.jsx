import { useState, useEffect } from 'react';
import { Settings, Plus, Edit } from 'lucide-react';
import Modal from '../../components/common/Modal';
import api from '../../utils/api';

const SCREENS = ['Attendance Regularization', 'Overtime', 'Permission', 'Late Fine', 'Manual Attendance'];
const APPROVER_TYPES = ['Reporting Manager', 'HR Manager', 'Department Head', 'Custom', 'None'];

const ApprovalWorkflow = () => {
  const [workflows, setWorkflows] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({ screen_name: SCREENS[0], first_approver_type: 'Reporting Manager', second_approver_type: 'None', third_approver_type: 'None', approver_users: [], is_active: true });

  const fetchData = async () => { setLoading(true); try { const [w,e] = await Promise.all([api.get('/approval-workflows'), api.get('/employees')]); setWorkflows(w.data.data||[]); setEmployees(e.data.data||[]); } catch(err){} finally{setLoading(false);} };
  useEffect(()=>{fetchData();},[]);

  const handleSubmit = async (e) => { e.preventDefault(); try { if(editing) await api.put(`/approval-workflows/${editing._id}`, formData); else await api.post('/approval-workflows', formData); setIsModalOpen(false); fetchData(); } catch(err){ alert(err.response?.data?.message||err.message); } };
  const handleEdit = (w) => { setEditing(w); setFormData({ screen_name:w.screen_name, first_approver_type:w.first_approver_type, second_approver_type:w.second_approver_type, third_approver_type:w.third_approver_type, approver_users:w.approver_users?.map(u=>u._id||u)||[], is_active:w.is_active }); setIsModalOpen(true); };

  const LEVEL_COLORS = { 'Reporting Manager':'bg-blue-100 text-blue-700', 'HR Manager':'bg-purple-100 text-purple-700', 'Department Head':'bg-indigo-100 text-indigo-700', Custom:'bg-amber-100 text-amber-700', None:'bg-gray-100 text-gray-500' };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap justify-between items-center gap-3 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <div><h3 className="text-lg font-black text-gray-900 m-0 flex items-center gap-2"><span className="w-2.5 h-5 bg-blue-600 rounded-full" />Approval Workflow Engine</h3><p className="text-xs text-gray-500 mt-1 m-0">Configure multi-level approval chains for attendance modules</p></div>
        <button onClick={()=>{setEditing(null);setFormData({screen_name:SCREENS[0],first_approver_type:'Reporting Manager',second_approver_type:'None',third_approver_type:'None',approver_users:[],is_active:true});setIsModalOpen(true);}} className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 text-white text-xs font-black rounded-xl border-0 cursor-pointer shadow-sm"><Plus className="w-4 h-4" />Add Workflow</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? [...Array(4)].map((_,i)=><div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />)
        : workflows.length>0 ? workflows.map(w=>(
          <div key={w._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2"><Settings className="w-4 h-4 text-blue-500"/><h4 className="font-black text-gray-900 text-sm m-0">{w.screen_name}</h4></div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${w.is_active?'bg-emerald-100 text-emerald-700':'bg-gray-100 text-gray-500'}`}>{w.is_active?'Active':'Inactive'}</span>
                <button onClick={()=>handleEdit(w)} className="text-blue-600 bg-transparent border-0 cursor-pointer"><Edit className="w-4 h-4"/></button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {['Level 1', 'Level 2', 'Level 3'].map((lvl, i) => {
                const types = [w.first_approver_type, w.second_approver_type, w.third_approver_type];
                const type = types[i];
                return (
                  <div key={lvl} className="flex items-center gap-1">
                    <div className="text-center"><p className="text-[9px] text-gray-400 m-0">{lvl}</p><span className={`text-[10px] px-2 py-0.5 rounded-full font-bold block ${LEVEL_COLORS[type]||'bg-gray-100 text-gray-500'}`}>{type}</span></div>
                    {i < 2 && <span className="text-gray-300 text-lg">→</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )) : <div className="col-span-2 py-16 text-center text-xs text-gray-400">No approval workflows configured</div>}
      </div>

      <Modal isOpen={isModalOpen} onClose={()=>setIsModalOpen(false)} title={editing?'Edit Workflow':'Create Approval Workflow'}>
        <form onSubmit={handleSubmit} className="space-y-3 text-left">
          <div><label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Screen / Module</label><select value={formData.screen_name} onChange={e=>setFormData(f=>({...f,screen_name:e.target.value}))} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold">{SCREENS.map(s=><option key={s}>{s}</option>)}</select></div>
          <div className="grid grid-cols-3 gap-3">
            {[['Level 1 Approver','first_approver_type'],['Level 2 Approver','second_approver_type'],['Level 3 Approver','third_approver_type']].map(([label,key])=>(
              <div key={key}><label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">{label}</label><select value={formData[key]} onChange={e=>setFormData(f=>({...f,[key]:e.target.value}))} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold">{APPROVER_TYPES.map(t=><option key={t}>{t}</option>)}</select></div>
            ))}
          </div>
          <div className="flex items-center gap-2"><input type="checkbox" id="wfactive" checked={formData.is_active} onChange={e=>setFormData(f=>({...f,is_active:e.target.checked}))} className="w-4 h-4 rounded" /><label htmlFor="wfactive" className="text-xs font-semibold text-gray-700">Active</label></div>
          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100"><button type="button" onClick={()=>setIsModalOpen(false)} className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-500 cursor-pointer">Cancel</button><button type="submit" className="px-5 py-2 bg-blue-600 text-white text-xs font-black rounded-xl border-0 cursor-pointer">{editing?'Update':'Create'}</button></div>
        </form>
      </Modal>
    </div>
  );
};
export default ApprovalWorkflow;
