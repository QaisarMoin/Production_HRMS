import { useState, useEffect } from 'react';
import { Plus, Check, X } from 'lucide-react';
import Modal from '../../components/common/Modal';
import api from '../../utils/api';

const ST = { Applied: 'bg-amber-100 text-amber-700', Approved: 'bg-emerald-100 text-emerald-700', Rejected: 'bg-red-100 text-red-700' };

const OvertimeManagement = () => {
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ employee_id: '', overtime_date: new Date().toISOString().split('T')[0], overtime_hours: 0, overtime_amount: 0, remarks: '' });

  const fetchData = async () => { setLoading(true); try { const [r, e] = await Promise.all([api.get('/overtime'), api.get('/employees')]); setRecords(r.data.data||[]); setEmployees(e.data.data||[]); } catch(err){} finally{setLoading(false);} };
  useEffect(()=>{fetchData();},[]);

  const handleSubmit = async (e) => { e.preventDefault(); try { await api.post('/overtime', formData); setIsModalOpen(false); fetchData(); } catch(err){ alert(err.response?.data?.message||err.message); } };
  const handleApproval = async (id, status) => { await api.put(`/overtime/${id}`, { approval_status: status }); fetchData(); };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap justify-between items-center gap-3 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <div><h3 className="text-lg font-black text-gray-900 m-0 flex items-center gap-2"><span className="w-2.5 h-5 bg-blue-600 rounded-full" />Overtime Management</h3><p className="text-xs text-gray-500 mt-1 m-0">Track overtime hours, approvals and payroll integration</p></div>
        <button onClick={()=>{setFormData({employee_id:'',overtime_date:new Date().toISOString().split('T')[0],overtime_hours:0,overtime_amount:0,remarks:''});setIsModalOpen(true);}} className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 text-white text-xs font-black rounded-xl border-0 cursor-pointer shadow-sm"><Plus className="w-4 h-4" />Log Overtime</button>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50"><tr>{['Employee','Date','OT Hours','OT Amount','Status','Actions'].map(h=><th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? <tr><td colSpan={6} className="py-8 text-center text-xs text-gray-400">Loading...</td></tr>
            : records.length > 0 ? records.map(r=>(
              <tr key={r._id} className="hover:bg-gray-50/50">
                <td className="px-4 py-3 text-xs font-bold text-gray-900">{r.employee_id?.first_name} {r.employee_id?.last_name}<span className="text-[10px] text-blue-500 block">{r.employee_id?.employee_code}</span></td>
                <td className="px-4 py-3 text-xs text-gray-600">{new Date(r.overtime_date).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-xs font-black text-green-700">{r.overtime_hours}h</td>
                <td className="px-4 py-3 text-xs font-black text-emerald-700">₹{r.overtime_amount}</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${ST[r.approval_status]||'bg-gray-100 text-gray-600'}`}>{r.approval_status}</span></td>
                <td className="px-4 py-3">{r.approval_status==='Applied'&&<div className="flex gap-1"><button onClick={()=>handleApproval(r._id,'Approved')} className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg text-[10px] font-bold border-0 cursor-pointer"><Check className="w-3 h-3"/></button><button onClick={()=>handleApproval(r._id,'Rejected')} className="text-red-600 bg-red-50 px-2 py-1 rounded-lg text-[10px] font-bold border-0 cursor-pointer"><X className="w-3 h-3"/></button></div>}</td>
              </tr>
            )) : <tr><td colSpan={6} className="py-10 text-center text-xs text-gray-400">No overtime records</td></tr>}
          </tbody>
        </table>
      </div>
      <Modal isOpen={isModalOpen} onClose={()=>setIsModalOpen(false)} title="Log Overtime">
        <form onSubmit={handleSubmit} className="space-y-3 text-left">
          <div><label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Employee</label><select value={formData.employee_id} onChange={e=>setFormData(f=>({...f,employee_id:e.target.value}))} required className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"><option value="">-- Select Employee --</option>{employees.map(e=><option key={e._id} value={e._id}>{e.first_name} {e.last_name} ({e.employee_code})</option>)}</select></div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Date</label><input type="date" value={formData.overtime_date} onChange={e=>setFormData(f=>({...f,overtime_date:e.target.value}))} required className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs" /></div>
            <div><label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">OT Hours</label><input type="number" min="0" step="0.5" value={formData.overtime_hours} onChange={e=>setFormData(f=>({...f,overtime_hours:e.target.value}))} required className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs" /></div>
            <div><label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">OT Amount ₹</label><input type="number" min="0" value={formData.overtime_amount} onChange={e=>setFormData(f=>({...f,overtime_amount:e.target.value}))} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs" /></div>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100"><button type="button" onClick={()=>setIsModalOpen(false)} className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-500 cursor-pointer">Cancel</button><button type="submit" className="px-5 py-2 bg-blue-600 text-white text-xs font-black rounded-xl border-0 cursor-pointer">Save</button></div>
        </form>
      </Modal>
    </div>
  );
};
export default OvertimeManagement;
