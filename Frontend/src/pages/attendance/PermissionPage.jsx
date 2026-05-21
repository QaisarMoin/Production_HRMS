import { useState, useEffect } from 'react';
import { Plus, Check, X, Download, Paperclip, Trash2 } from 'lucide-react';
import Modal from '../../components/common/Modal';
import api from '../../utils/api';

const PermissionPage = () => {
  const [requests, setRequests] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    employee_id: '',
    permission_entries: [{ permission_date: new Date().toISOString().slice(0, 10), from_time: '10:00', to_time: '12:00', total_hours: 2 }],
    reason: '',
    attachment_urls: []
  });

  const fetchPermissions = async () => {
    setLoading(true);
    try {
      const [pRes, eRes] = await Promise.all([
        api.get(`/permission-requests?approval_status=${statusFilter}`),
        api.get('/employees')
      ]);
      setRequests(pRes.data.data || []);
      setEmployees(eRes.data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, [statusFilter]);

  const handleAddEntryRow = () => {
    setFormData(f => ({
      ...f,
      permission_entries: [...f.permission_entries, { permission_date: new Date().toISOString().slice(0, 10), from_time: '10:00', to_time: '12:00', total_hours: 2 }]
    }));
  };

  const handleRemoveEntryRow = (index) => {
    setFormData(f => ({
      ...f,
      permission_entries: f.permission_entries.filter((_, idx) => idx !== index)
    }));
  };

  const handleEntryChange = (index, field, value) => {
    const next = [...formData.permission_entries];
    next[index][field] = value;
    if (field === 'from_time' || field === 'to_time') {
      const entry = next[index];
      if (entry.from_time && entry.to_time) {
        const [fh, fm] = entry.from_time.split(':').map(Number);
        const [th, tm] = entry.to_time.split(':').map(Number);
        let diff = (th * 60 + tm) - (fh * 60 + fm);
        if (diff < 0) diff += 24 * 60;
        next[index].total_hours = parseFloat((diff / 60).toFixed(2));
      }
    }
    setFormData(f => ({ ...f, permission_entries: next }));
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.post('/permission-requests/upload', fd);
      setFormData(f => ({ ...f, attachment_urls: [...f.attachment_urls, res.data.fileUrl] }));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await api.post('/permission-requests', formData);
      setIsModalOpen(false);
      fetchPermissions();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.post(`/permission-requests/approve/${id}`);
      fetchPermissions();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleReject = async (id) => {
    try {
      await api.post(`/permission-requests/reject/${id}`);
      fetchPermissions();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this request?')) return;
    try {
      await api.delete(`/permission-requests/${id}`);
      fetchPermissions();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleExport = async () => {
    try {
      const res = await api.post('/permission-requests/export');
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
            Approve Permission Requests
          </h3>
          <p className="text-xs text-gray-500 mt-1 m-0">Review, approve or reject short duration permission requests (e.g. personal hours)</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 text-xs font-black rounded-xl border-0 cursor-pointer">
            <Download className="w-4 h-4" /> Export Requests
          </button>
          <button onClick={() => { setIsModalOpen(true); setFormData({ employee_id: '', permission_entries: [{ permission_date: new Date().toISOString().slice(0, 10), from_time: '10:00', to_time: '12:00', total_hours: 2 }], reason: '', attachment_urls: [] }); }} className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 text-white text-xs font-black rounded-xl border-0 cursor-pointer shadow-sm">
            <Plus className="w-4 h-4" /> Request Permission
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
              {['Perm. #', 'Employee', 'Total Hours', 'Permission Entries', 'Reason', 'Attachment', 'Status', 'Actions'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={8} className="py-8 text-center text-xs text-gray-400">Loading requests...</td></tr>
            ) : requests.length > 0 ? (
              requests.map((r) => (
                <tr key={r._id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 text-xs font-mono font-bold text-gray-700">{r.permission_number}</td>
                  <td className="px-4 py-3 text-xs font-bold text-gray-900">
                    {r.employee_name || '—'}
                    <span className="text-[10px] text-blue-500 block">{r.employee_code || '—'}</span>
                  </td>
                  <td className="px-4 py-3 text-xs font-black text-indigo-700">{r.total_hours} hrs</td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    <div className="space-y-1">
                      {r.permission_entries?.map((e, idx) => (
                        <span key={idx} className="inline-block bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded text-[9px] mr-1 font-semibold">
                          {new Date(e.permission_date).toLocaleDateString()}: {e.from_time}-{e.to_time} ({e.total_hours}h)
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 max-w-[200px] truncate">{r.reason || '—'}</td>
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
                  <td className="px-4 py-3 text-xs">
                    <div className="flex gap-1.5 items-center">
                      {r.approval_status === 'Applied' ? (
                        <>
                          <button onClick={() => handleApprove(r._id)} className="bg-emerald-50 text-emerald-700 border-0 px-2 py-1 rounded cursor-pointer font-black flex items-center gap-0.5 text-xs hover:bg-emerald-100">
                            <Check className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button onClick={() => handleReject(r._id)} className="bg-red-50 text-red-700 border-0 px-2 py-1 rounded cursor-pointer font-black flex items-center gap-0.5 text-xs hover:bg-red-100">
                            <X className="w-3.5 h-3.5" /> Reject
                          </button>
                        </>
                      ) : (
                        <span className="text-[10px] text-gray-400 font-semibold">Processed</span>
                      )}
                      <button onClick={() => handleDelete(r._id)} className="text-red-600 hover:text-red-800 bg-transparent border-0 cursor-pointer">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={8} className="py-10 text-center text-xs text-gray-400">No requests found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Request Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Permission Request">
        <form onSubmit={handleSave} className="space-y-3 text-left max-h-[80vh] overflow-y-auto pr-1">
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Employee</label>
            <select
              value={formData.employee_id}
              onChange={(e) => setFormData(f => ({ ...f, employee_id: e.target.value }))}
              required
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
            >
              <option value="">-- Select Employee --</option>
              {employees.map(e => <option key={e._id} value={e._id}>{e.first_name} {e.last_name} ({e.employee_code})</option>)}
            </select>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase block">Permission Entries</label>
              <button type="button" onClick={handleAddEntryRow} className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold border-0 rounded cursor-pointer">
                + Add Date Row
              </button>
            </div>
            <div className="space-y-2">
              {formData.permission_entries.map((entry, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="date"
                    value={entry.permission_date}
                    onChange={(e) => handleEntryChange(idx, 'permission_date', e.target.value)}
                    required
                    className="flex-1 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                  />
                  <input
                    type="time"
                    value={entry.from_time}
                    onChange={(e) => handleEntryChange(idx, 'from_time', e.target.value)}
                    required
                    className="px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                  />
                  <input
                    type="time"
                    value={entry.to_time}
                    onChange={(e) => handleEntryChange(idx, 'to_time', e.target.value)}
                    required
                    className="px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                  />
                  <span className="text-xs font-mono font-bold text-gray-700 w-12 text-center">
                    {entry.total_hours} hrs
                  </span>
                  {formData.permission_entries.length > 1 && (
                    <button type="button" onClick={() => handleRemoveEntryRow(idx)} className="text-red-500 hover:text-red-700 bg-transparent border-0 cursor-pointer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Upload Attachment Doc</label>
            <input type="file" onChange={handleUpload} className="w-full text-xs" />
            {formData.attachment_urls.length > 0 && <span className="text-[10px] text-green-600 block mt-1 font-bold">Attachment uploaded</span>}
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Reason for Request</label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData(f => ({ ...f, reason: e.target.value }))}
              required
              rows={2}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs"
              placeholder="Doctor appointment, personal emergency, bank visit..."
            />
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

export default PermissionPage;
