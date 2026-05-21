import { useState, useEffect } from 'react';
import api from '../../utils/api';

const ToggleSwitch = ({ checked, onChange, label }) => (
  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
    <span className="text-xs font-semibold text-gray-700">{label}</span>
    <button type="button" onClick={() => onChange(!checked)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors border-0 cursor-pointer ${checked ? 'bg-blue-600' : 'bg-gray-300'}`}>
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  </div>
);

const EssAttendanceSettings = () => {
  const [settings, setSettings] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ employee_id: '', location_tracking: false, battery_optimization: true, live_tracking: false, tracking_interval: 15, selfie_attendance: false, geo_fencing_enabled: false, permission_status: false });

  const fetchData = async () => { setLoading(true); try { const [s,e] = await Promise.all([api.get('/ess-attendance-settings'), api.get('/employees')]); setSettings(s.data.data||[]); setEmployees(e.data.data||[]); } catch(err){} finally{setLoading(false);} };
  useEffect(()=>{fetchData();},[]);

  const handleSave = async () => {
    try {
      if (selected) await api.put(`/ess-attendance-settings/${selected._id}`, form);
      else await api.post('/ess-attendance-settings', form);
      fetchData(); setSelected(null);
    } catch(e) { alert(e.response?.data?.message||e.message); }
  };

  const loadSetting = (s) => { setSelected(s); setForm({ employee_id: s.employee_id?._id||'', location_tracking: s.location_tracking, battery_optimization: s.battery_optimization, live_tracking: s.live_tracking, tracking_interval: s.tracking_interval, selfie_attendance: s.selfie_attendance, geo_fencing_enabled: s.geo_fencing_enabled, permission_status: s.permission_status }); };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap justify-between items-center gap-3 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <div><h3 className="text-lg font-black text-gray-900 m-0 flex items-center gap-2"><span className="w-2.5 h-5 bg-blue-600 rounded-full" />ESS Attendance Settings</h3><p className="text-xs text-gray-500 mt-1 m-0">Configure location tracking, live monitoring and ESS access</p></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Config Panel */}
        <div className="md:col-span-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <div><label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Employee</label>
            <select value={form.employee_id} onChange={e=>setForm(f=>({...f,employee_id:e.target.value}))} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold">
              <option value="">-- Global / Select Employee --</option>{employees.map(e=><option key={e._id} value={e._id}>{e.first_name} {e.last_name}</option>)}
            </select>
          </div>
          <ToggleSwitch checked={form.location_tracking} onChange={v=>setForm(f=>({...f,location_tracking:v}))} label="📍 Location Tracking" />
          <ToggleSwitch checked={form.live_tracking} onChange={v=>setForm(f=>({...f,live_tracking:v}))} label="📡 Live Tracking" />
          <ToggleSwitch checked={form.battery_optimization} onChange={v=>setForm(f=>({...f,battery_optimization:v}))} label="🔋 Battery Optimization" />
          <ToggleSwitch checked={form.selfie_attendance} onChange={v=>setForm(f=>({...f,selfie_attendance:v}))} label="📷 Selfie Attendance" />
          <ToggleSwitch checked={form.geo_fencing_enabled} onChange={v=>setForm(f=>({...f,geo_fencing_enabled:v}))} label="🗺️ Geo Fencing" />
          <ToggleSwitch checked={form.permission_status} onChange={v=>setForm(f=>({...f,permission_status:v}))} label="✅ Permission Enabled" />
          <div><label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Tracking Interval (mins)</label><input type="number" min="5" max="60" value={form.tracking_interval} onChange={e=>setForm(f=>({...f,tracking_interval:e.target.value}))} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs" /></div>
          <button onClick={handleSave} className="w-full py-2.5 bg-blue-600 text-white text-xs font-black rounded-xl border-0 cursor-pointer">{selected ? 'Update Settings' : 'Save Settings'}</button>
          {selected && <button onClick={()=>setSelected(null)} className="w-full py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-500 cursor-pointer">Clear</button>}
        </div>
        {/* Settings List */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50"><tr>{['Employee','Location','Live','Battery','Selfie','Interval','Actions'].map(h=><th key={h} className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? <tr><td colSpan={7} className="py-8 text-center text-xs text-gray-400">Loading...</td></tr>
              : settings.length>0 ? settings.map(s=>(
                <tr key={s._id} className="hover:bg-gray-50/50 cursor-pointer" onClick={()=>loadSetting(s)}>
                  <td className="px-3 py-3 text-xs font-bold text-gray-900">{s.employee_id?.first_name} {s.employee_id?.last_name||'Global'}</td>
                  <td className="px-3 py-3"><span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${s.location_tracking?'bg-emerald-100 text-emerald-700':'bg-gray-100 text-gray-500'}`}>{s.location_tracking?'ON':'OFF'}</span></td>
                  <td className="px-3 py-3"><span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${s.live_tracking?'bg-blue-100 text-blue-700':'bg-gray-100 text-gray-500'}`}>{s.live_tracking?'ON':'OFF'}</span></td>
                  <td className="px-3 py-3"><span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${s.battery_optimization?'bg-amber-100 text-amber-700':'bg-gray-100 text-gray-500'}`}>{s.battery_optimization?'ON':'OFF'}</span></td>
                  <td className="px-3 py-3"><span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${s.selfie_attendance?'bg-purple-100 text-purple-700':'bg-gray-100 text-gray-500'}`}>{s.selfie_attendance?'ON':'OFF'}</span></td>
                  <td className="px-3 py-3 text-xs text-gray-600">{s.tracking_interval}m</td>
                  <td className="px-3 py-3 text-xs text-blue-600 font-bold">Edit</td>
                </tr>
              )) : <tr><td colSpan={7} className="py-10 text-center text-xs text-gray-400">No ESS settings configured</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default EssAttendanceSettings;
