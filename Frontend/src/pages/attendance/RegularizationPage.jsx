import { useState, useEffect } from 'react';
import { Plus, Check, X, Download, Paperclip } from 'lucide-react';
import Modal from '../../components/common/Modal';
import api from '../../utils/api';

const RegularizationPage = () => {
  const [requests, setRequests] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  // Apply Request States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    employee_id: '',
    attendance_log_id: '',
    attendance_type: 'Punch Missing',
    in_date: new Date().toISOString().slice(0, 10),
    in_time: '09:00',
    out_date: new Date().toISOString().slice(0, 10),
    out_time: '18:00',
    remarks: '',
    overnight_shift: false,
    half_salary: false,
    attachment_urls: []
  });

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const [rRes, eRes] = await Promise.all([
        api.get(`/regularizations?approval_status=${statusFilter}`),
        api.get('/employees')
      ]);
      setRequests(rRes.data.data || []);
      setEmployees(eRes.data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  // Load employee logs when selecting an employee in modal
  const handleEmployeeChange = async (empId) => {
    setFormData(f => ({ ...f, employee_id: empId, attendance_log_id: '' }));
    if (!empId) {
      setLogs([]);
      return;
    }
    try {
      const res = await api.get(`/attendance-logs?employee=${empId}`);
      setLogs(res.data.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.post('/regularizations/upload', fd);
      setFormData(f => ({ ...f, attachment_urls: [...f.attachment_urls, res.data.fileUrl] }));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleApply = async (e) => {
    e.preventDefault();
    try {
      await api.post('/regularizations', formData);
      setIsModalOpen(false);
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.post(`/regularizations/approve/${id}`);
      fetchRequests();
    } catch (e) {
      alert(e.response?.data?.message || e.message);
    }
  };

  const handleReject = async (id) => {
    try {
      await api.post(`/regularizations/reject/${id}`);
      fetchRequests();
    } catch (e) {
      alert(e.response?.data?.message || e.message);
    }
  };

  const handleExport = async (type) => {
    try {
      const res = await api.post(`/regularizations/export/${type}`);
      window.open(res.data.url, '_blank');
    } catch (e) {
      alert(e.message);
    }
  };

  const ST_COLORS = { Applied: 'bg-amber-100 text-amber-700', Approved: 'bg-emerald-100 text-emerald-700', Rejected: 'bg-red-100 text-red-700' };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-3 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h3 className="text-lg font-black text-gray-900 m-0 flex items-center gap-2">
            <span className="w-2.5 h-5 bg-blue-600 rounded-full" />
            Approve Regularizations
          </h3>
          <p className="text-xs text-gray-500 mt-1 m-0">Approve or reject employee attendance correction requests</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => handleExport('excel')} className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 text-xs font-black rounded-xl border-0 cursor-pointer">
            <Download className="w-4 h-4" /> Excel
          </button>
          <button onClick={() => handleExport('pdf')} className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 text-rose-700 text-xs font-black rounded-xl border-0 cursor-pointer">
            <Download className="w-4 h-4" /> PDF
          </button>
          <button onClick={() => { setIsModalOpen(true); setFormData({ employee_id: '', attendance_log_id: '', attendance_type: 'Punch Missing', in_date: new Date().toISOString().slice(0, 10), in_time: '09:00', out_date: new Date().toISOString().slice(0, 10), out_time: '18:00', remarks: '', overnight_shift: false, half_salary: false, attachment_urls: [] }); }} className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 text-white text-xs font-black rounded-xl border-0 cursor-pointer shadow-sm">
            <Plus className="w-4 h-4" /> Apply Regularization
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
        >
          <option value="">All Statuses</option>
          <option value="Applied">Applied</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50">
            <tr>
              {['Employee', 'Correction Type', 'Requested Times', 'Reason/Remarks', 'Attachment', 'Status', 'Actions'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={7} className="py-8 text-center text-xs text-gray-400">Loading requests...</td></tr>
            ) : requests.length > 0 ? (
              requests.map((r) => (
                <tr key={r._id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 text-xs font-bold text-gray-900">
                    {r.employee_id?.first_name} {r.employee_id?.last_name}
                    <span className="text-[10px] text-blue-500 block">{r.employee_id?.employee_code}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-indigo-700 font-semibold">{r.attendance_type || 'Punch Correction'}</td>
                  <td className="px-4 py-3 text-xs font-mono text-gray-600">
                    In: {r.in_time || '—'} | Out: {r.out_time || '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 max-w-[200px] truncate">{r.remarks || '—'}</td>
                  <td className="px-4 py-3 text-xs">
                    {r.attachment_urls?.length > 0 ? (
                      <a href={r.attachment_urls[0]} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-600 font-bold hover:underline">
                        <Paperclip className="w-3.5 h-3.5" /> View
                      </a>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${ST_COLORS[r.approval_status] || 'bg-gray-100 text-gray-600'}`}>
                      {r.approval_status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {r.approval_status === 'Applied' ? (
                      <div className="flex gap-1.5">
                        <button onClick={() => handleApprove(r._id)} className="bg-emerald-50 text-emerald-700 border-0 px-2 py-1 rounded cursor-pointer font-black flex items-center gap-0.5 text-xs hover:bg-emerald-100">
                          <Check className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button onClick={() => handleReject(r._id)} className="bg-red-50 text-red-700 border-0 px-2 py-1 rounded cursor-pointer font-black flex items-center gap-0.5 text-xs hover:bg-red-100">
                          <X className="w-3.5 h-3.5" /> Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-gray-400 font-semibold">Processed</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={7} className="py-10 text-center text-xs text-gray-400">No requests found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Apply Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Apply Regularization Request">
        <form onSubmit={handleApply} className="space-y-3 text-left">
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Employee</label>
            <select
              value={formData.employee_id}
              onChange={(e) => handleEmployeeChange(e.target.value)}
              required
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
            >
              <option value="">-- Select Employee --</option>
              {employees.map(e => <option key={e._id} value={e._id}>{e.first_name} {e.last_name}</option>)}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Select Attendance Log to Correct</label>
            <select
              value={formData.attendance_log_id}
              onChange={(e) => {
                const log = logs.find(l => l._id === e.target.value);
                setFormData(f => ({
                  ...f,
                  attendance_log_id: e.target.value,
                  in_time: log?.in_time || '09:00',
                  out_time: log?.out_time || '18:00'
                }));
              }}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
            >
              <option value="">-- New Entry / Punch Missing --</option>
              {logs.map(l => (
                <option key={l._id} value={l._id}>
                  {new Date(l.attendance_date).toLocaleDateString()} (In: {l.in_time || 'None'} | Out: {l.out_time || 'None'})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">New In Time</label>
              <input type="time" value={formData.in_time} onChange={(e) => setFormData(f => ({ ...f, in_time: e.target.value }))} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">New Out Time</label>
              <input type="time" value={formData.out_time} onChange={(e) => setFormData(f => ({ ...f, out_time: e.target.value }))} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs" />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Correction Type</label>
            <select value={formData.attendance_type} onChange={(e) => setFormData(f => ({ ...f, attendance_type: e.target.value }))} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold">
              <option>Punch Missing</option>
              <option>Late Entry regularize</option>
              <option>Early Exit regularize</option>
              <option>Official Duty</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Upload Attachment Doc</label>
            <input type="file" onChange={handleUpload} className="w-full text-xs" />
            {formData.attachment_urls.length > 0 && <span className="text-[10px] text-green-600 block mt-1 font-bold">Uploaded successfully</span>}
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Reason</label>
            <textarea value={formData.remarks} onChange={(e) => setFormData(f => ({ ...f, remarks: e.target.value }))} required rows={2} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs" />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded-xl text-xs font-bold text-gray-500">Cancel</button>
            <button type="submit" className="px-5 py-2 bg-blue-600 text-white text-xs font-black rounded-xl border-0">Submit Request</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default RegularizationPage;
