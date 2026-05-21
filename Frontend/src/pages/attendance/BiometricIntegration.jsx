import { useState, useEffect } from 'react';
import { Plus, Cpu, RefreshCw } from 'lucide-react';
import Modal from '../../components/common/Modal';
import api from '../../utils/api';
const ST = { Pending:'bg-amber-100 text-amber-700', Synced:'bg-emerald-100 text-emerald-700', Failed:'bg-red-100 text-red-700' };

const BiometricIntegration = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [formData, setFormData] = useState({ device_id:'', employee_code:'', punch_time:'', punch_type:'IN' });

  const fetchData = async () => { setLoading(true); try { const r = await api.get(`/biometric-logs${filterStatus?'?sync_status='+filterStatus:''}`); setLogs(r.data.data||[]); } catch(e){} finally{setLoading(false);} };
  useEffect(()=>{fetchData();},[filterStatus]);
  const handleSubmit = async (e) => { e.preventDefault(); try { await api.post('/biometric-logs', { ...formData, punch_time: new Date(formData.punch_time) }); setIsModalOpen(false); fetchData(); } catch(err){ alert(err.response?.data?.message||err.message); } };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap justify-between items-center gap-3 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <div><h3 className="text-lg font-black text-gray-900 m-0 flex items-center gap-2"><span className="w-2.5 h-5 bg-blue-600 rounded-full" />Biometric Integration</h3><p className="text-xs text-gray-500 mt-1 m-0">Device sync logs, punch records and biometric audit trail</p></div>
        <div className="flex gap-2">
          <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"><option value="">All Status</option><option>Pending</option><option>Synced</option><option>Failed</option></select>
          <button onClick={fetchData} className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-700 text-xs font-bold rounded-xl border-0 cursor-pointer"><RefreshCw className="w-4 h-4" />Sync</button>
          <button onClick={()=>{setFormData({device_id:'',employee_code:'',punch_time:'',punch_type:'IN'});setIsModalOpen(true);}} className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 text-white text-xs font-black rounded-xl border-0 cursor-pointer shadow-sm"><Plus className="w-4 h-4" />Log Punch</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[{label:'Total Logs',val:logs.length,color:'text-gray-900'},{label:'Synced',val:logs.filter(l=>l.sync_status==='Synced').length,color:'text-emerald-700'},{label:'Pending/Failed',val:logs.filter(l=>l.sync_status!=='Synced').length,color:'text-red-700'}].map(s=>(
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center"><p className="text-xs text-gray-500 m-0">{s.label}</p><p className={`text-2xl font-black m-0 ${s.color}`}>{s.val}</p></div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50"><tr>{['Device ID','Employee Code','Punch Time','Type','Sync Status'].map(h=><th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? <tr><td colSpan={5} className="py-8 text-center text-xs text-gray-400">Loading...</td></tr>
            : logs.length>0 ? logs.map(l=>(
              <tr key={l._id} className="hover:bg-gray-50/50">
                <td className="px-4 py-3"><div className="flex items-center gap-2"><Cpu className="w-4 h-4 text-blue-400"/><span className="text-xs font-mono font-bold text-gray-700">{l.device_id}</span></div></td>
                <td className="px-4 py-3 text-xs font-bold text-blue-700">{l.employee_code}</td>
                <td className="px-4 py-3 text-xs text-gray-600">{new Date(l.punch_time).toLocaleString()}</td>
                <td className="px-4 py-3"><span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${l.punch_type==='IN'?'bg-emerald-100 text-emerald-700':'bg-red-100 text-red-700'}`}>{l.punch_type}</span></td>
                <td className="px-4 py-3"><span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${ST[l.sync_status]||'bg-gray-100 text-gray-600'}`}>{l.sync_status}</span></td>
              </tr>
            )) : <tr><td colSpan={5} className="py-10 text-center text-xs text-gray-400">No biometric logs</td></tr>}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={()=>setIsModalOpen(false)} title="Log Biometric Punch">
        <form onSubmit={handleSubmit} className="space-y-3 text-left">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Device ID</label><input value={formData.device_id} onChange={e=>setFormData(f=>({...f,device_id:e.target.value}))} required className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs" placeholder="e.g. BIO-001" /></div>
            <div><label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Employee Code</label><input value={formData.employee_code} onChange={e=>setFormData(f=>({...f,employee_code:e.target.value}))} required className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs" placeholder="e.g. EMP001" /></div>
            <div><label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Punch Time</label><input type="datetime-local" value={formData.punch_time} onChange={e=>setFormData(f=>({...f,punch_time:e.target.value}))} required className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs" /></div>
            <div><label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Punch Type</label><select value={formData.punch_type} onChange={e=>setFormData(f=>({...f,punch_type:e.target.value}))} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"><option>IN</option><option>OUT</option><option>BREAK_IN</option><option>BREAK_OUT</option></select></div>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100"><button type="button" onClick={()=>setIsModalOpen(false)} className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-500 cursor-pointer">Cancel</button><button type="submit" className="px-5 py-2 bg-blue-600 text-white text-xs font-black rounded-xl border-0 cursor-pointer">Log</button></div>
        </form>
      </Modal>
    </div>
  );
};
export default BiometricIntegration;
