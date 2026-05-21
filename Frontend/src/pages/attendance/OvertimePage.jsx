import { useState, useEffect } from 'react';
import { Plus, Check, X, Download, Paperclip, Trash2 } from 'lucide-react';
import Modal from '../../components/common/Modal';
import api from '../../utils/api';

const OvertimePage = () => {
  const [requests, setRequests] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    employee_id: '',
    overtime_entries: [{ overtime_date: new Date().toISOString().slice(0, 10), overtime_hours: 2 }],
    overtime_reason: '',
    overtime_notes: '',
    attachment_urls: []
  });

  const fetchOvertime = async () => {
    setLoading(true);
    try {
      const [oRes, eRes] = await Promise.all([
        api.get('/overtime-requests'),
        api.get('/employees')
      ]);
      setRequests(oRes.data.data || []);
      setEmployees(eRes.data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOvertime();
  }, []);

  const handleAddEntryRow = () => {
    setFormData(f => ({
      ...f,
      overtime_entries: [...f.overtime_entries, { overtime_date: new Date().toISOString().slice(0, 10), overtime_hours: 2 }]
    }));
  };

  const handleRemoveEntryRow = (index) => {
    setFormData(f => ({
      ...f,
      overtime_entries: f.overtime_entries.filter((_, idx) => idx !== index)
    }));
  };

  const handleEntryChange = (index, field, value) => {
    const next = [...formData.overtime_entries];
    next[index][field] = field === 'overtime_hours' ? Number(value) : value;
    setFormData(f => ({ ...f, overtime_entries: next }));
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.post('/overtime-requests/upload', fd);
      setFormData(f => ({ ...f, attachment_urls: [...f.attachment_urls, res.data.fileUrl] }));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await api.post('/overtime-requests', formData);
      setIsModalOpen(false);
      fetchOvertime();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.post(`/overtime-requests/approve/${id}`);
      fetchOvertime();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleReject = async (id) => {
    try {
      await api.post(`/overtime-requests/reject/${id}`);
      fetchOvertime();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleExport = async () => {
    try {
      const res = await api.post('/overtime-requests/export');
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
            Approve Overtime Requests
          </h3>
          <p className="text-xs text-gray-500 mt-1 m-0">Review, approve or reject hours requested for extra hours worked</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 text-xs font-black rounded-xl border-0 cursor-pointer">
            <Download className="w-4 h-4" /> Export Requests
          </button>
          <button onClick={() => { setIsModalOpen(true); setFormData({ employee_id: '', overtime_entries: [{ overtime_date: new Date().toISOString().slice(0, 10), overtime_hours: 2 }], overtime_reason: '', overtime_notes: '', attachment_urls: [] }); }} className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 text-white text-xs font-black rounded-xl border-0 cursor-pointer shadow-sm">
            <Plus className="w-4 h-4" /> Request Overtime
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50">
            <tr>
              {['Employee', 'Total Hours', 'Overtime Entries', 'Reason', 'Attachment', 'Status', 'Actions'].map((h) => (
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
                    {r.employee_name || '—'}
                    <span className="text-[10px] text-blue-500 block">{r.employee_code || '—'}</span>
                  </td>
                  <td className="px-4 py-3 text-xs font-black text-green-700">{r.total_hours} hrs</td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    <div className="space-y-1">
                      {r.overtime_entries?.map((e, idx) => (
                        <span key={idx} className="inline-block bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded text-[9px] mr-1 font-semibold">
                          {new Date(e.overtime_date).toLocaleDateString()}: {e.overtime_hours}h
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 max-w-[200px] truncate">{r.overtime_reason || '—'}</td>
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
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Overtime Request">
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
              <label className="text-[10px] font-bold text-gray-500 uppercase block">Overtime Entries</label>
              <button type="button" onClick={handleAddEntryRow} className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold border-0 rounded cursor-pointer">
                + Add Date Row
              </button>
            </div>
            <div className="space-y-2">
              {formData.overtime_entries.map((entry, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="date"
                    value={entry.overtime_date}
                    onChange={(e) => handleEntryChange(idx, 'overtime_date', e.target.value)}
                    required
                    className="flex-1 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                  />
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={entry.overtime_hours}
                    onChange={(e) => handleEntryChange(idx, 'overtime_hours', e.target.value)}
                    required
                    className="w-20 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                    placeholder="Hours"
                  />
                  {formData.overtime_entries.length > 1 && (
                    <button type="button" onClick={() => handleRemoveEntryRow(idx)} className="text-red-500 hover:text-red-700 bg-transparent border-0 cursor-pointer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Upload Overtime Sheet (Doc)</label>
            <input type="file" onChange={handleUpload} className="w-full text-xs" />
            {formData.attachment_urls.length > 0 && <span className="text-[10px] text-green-600 block mt-1 font-bold">Attachment uploaded</span>}
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Reason for Extra Work</label>
            <input
              type="text"
              value={formData.overtime_reason}
              onChange={(e) => setFormData(f => ({ ...f, overtime_reason: e.target.value }))}
              required
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs"
              placeholder="System migration, End-of-month reporting, etc."
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Additional Notes</label>
            <textarea
              value={formData.overtime_notes}
              onChange={(e) => setFormData(f => ({ ...f, overtime_notes: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs"
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

export default OvertimePage;
