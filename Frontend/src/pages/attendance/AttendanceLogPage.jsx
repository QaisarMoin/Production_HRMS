import { useState, useEffect } from 'react';
import { Search, Calendar, Users, Filter, Download, Plus, Check, X, RefreshCw } from 'lucide-react';
import Modal from '../../components/common/Modal';
import api from '../../utils/api';

const AttendanceLogPage = () => {
  const [logs, setLogs] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedDesg, setSelectedDesg] = useState('');
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

  // Add Attendance Entry Flow States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10));
  const [entryEmployees, setEntryEmployees] = useState([]);

  // Edit Single Log States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState(null);

  // Regularize Log States
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  const [regLog, setRegLog] = useState(null);
  const [regReason, setRegReason] = useState('');

  const fetchFiltersAndLogs = async () => {
    setLoading(true);
    try {
      const [dRes, dgRes, lRes] = await Promise.all([
        api.get('/departments'),
        api.get('/designations'),
        api.get(`/attendance-logs?month=${month}&department=${selectedDept}&designation=${selectedDesg}&search=${search}`)
      ]);
      setDepartments(dRes.data.data || []);
      setDesignations(dgRes.data.data || []);
      setLogs(lRes.data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiltersAndLogs();
  }, [month, selectedDept, selectedDesg]);

  const loadEntryEmployees = async () => {
    try {
      const res = await api.post('/attendance-logs/load-employees', {
        date: entryDate,
        filters: { department: selectedDept, designation: selectedDesg }
      });
      setEntryEmployees(res.data.data || []);
    } catch (e) {
      alert(e.message);
    }
  };

  // Bulk Apply First Row Logic
  const handleBulkApply = () => {
    if (entryEmployees.length < 2) return;
    const first = entryEmployees[0];
    const updated = entryEmployees.map((emp, i) => {
      if (i === 0) return emp;
      return {
        ...emp,
        in_time: first.in_time,
        out_time: first.out_time,
        attendance_status: first.attendance_status,
        work_day: first.work_day
      };
    });
    setEntryEmployees(updated);
  };

  const handleSaveAttendance = async () => {
    try {
      await api.post('/attendance-logs', {
        attendance_date: entryDate,
        employees: entryEmployees
      });
      setIsModalOpen(false);
      fetchFiltersAndLogs();
    } catch (e) {
      alert(e.response?.data?.message || e.message);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put('/attendance-logs', editingLog);
      setIsEditModalOpen(false);
      fetchFiltersAndLogs();
    } catch (e) {
      alert(e.response?.data?.message || e.message);
    }
  };

  const handleRegularizeSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/attendance-logs/regularize', {
        employee_id: regLog.employee_id?._id || regLog.employee_id,
        attendance_log_id: regLog._id,
        in_time: regLog.in_time,
        out_time: regLog.out_time,
        reason: regReason
      });
      setIsRegModalOpen(false);
      alert('Regularization requested!');
    } catch (e) {
      alert(e.response?.data?.message || e.message);
    }
  };

  const exportExcel = async () => {
    try {
      const res = await api.post('/attendance-logs/export/excel');
      window.open(res.data.url, '_blank');
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-3 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h3 className="text-lg font-black text-gray-900 m-0 flex items-center gap-2">
            <span className="w-2.5 h-5 bg-blue-600 rounded-full" />
            Attendance Logs
          </h3>
          <p className="text-xs text-gray-500 mt-1 m-0">Daily attendance check-ins, auto-calculations and regularization</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportExcel} className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 text-xs font-black rounded-xl border-0 cursor-pointer hover:bg-emerald-100">
            <Download className="w-4 h-4" /> Export Excel
          </button>
          <button onClick={() => { setIsModalOpen(true); setEntryEmployees([]); }} className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 text-white text-xs font-black rounded-xl border-0 cursor-pointer shadow-sm">
            <Plus className="w-4 h-4" /> New Attendance Entry
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by Employee Code or Name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs"
          />
        </div>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
        />
        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
        >
          <option value="">All Departments</option>
          {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
        </select>
        <select
          value={selectedDesg}
          onChange={(e) => setSelectedDesg(e.target.value)}
          className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
        >
          <option value="">All Designations</option>
          {designations.map((d) => <option key={d._id} value={d._id}>{d.designation_name}</option>)}
        </select>
        <button onClick={fetchFiltersAndLogs} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-xl border-0 cursor-pointer">
          <RefreshCw className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50">
            <tr>
              {['Code', 'Employee', 'Date', 'In Time', 'Out Time', 'Worked Hrs', 'Status', 'Actions'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={8} className="py-10 text-center text-xs text-gray-400">Loading attendance logs...</td></tr>
            ) : logs.length > 0 ? (
              logs.map((log) => (
                <tr key={log._id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 text-xs font-mono font-bold text-blue-700">{log.employee_code}</td>
                  <td className="px-4 py-3 text-xs font-bold text-gray-900">{log.employee_name}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">{new Date(log.attendance_date).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-xs font-mono text-emerald-700">{log.in_time || '—'}</td>
                  <td className="px-4 py-3 text-xs font-mono text-red-700">{log.out_time || '—'}</td>
                  <td className="px-4 py-3 text-xs font-bold text-gray-700">{log.worked_hours} hrs</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                      log.attendance_status === 'Present' ? 'bg-emerald-100 text-emerald-700' :
                      log.attendance_status === 'Absent' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {log.attendance_status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingLog(log); setIsEditModalOpen(true); }} className="text-xs bg-blue-50 text-blue-600 border-0 px-2 py-1 rounded cursor-pointer font-bold">Edit</button>
                      <button onClick={() => { setRegLog(log); setRegReason(''); setIsRegModalOpen(true); }} className="text-xs bg-purple-50 text-purple-600 border-0 px-2 py-1 rounded cursor-pointer font-bold">Regularize</button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={8} className="py-10 text-center text-xs text-gray-400">No logs match query</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* New Attendance Entry Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Attendance Entry">
        <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-1 text-left">
          <div className="flex items-center gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Date</label>
              <input
                type="date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs"
              />
            </div>
            <button onClick={loadEntryEmployees} className="mt-5 px-4 py-2 bg-gray-100 text-gray-700 text-xs font-bold rounded-xl border-0 cursor-pointer">
              Load Employees
            </button>
            {entryEmployees.length > 1 && (
              <button onClick={handleBulkApply} className="mt-5 px-4 py-2 bg-amber-50 text-amber-700 text-xs font-bold rounded-xl border-0 cursor-pointer">
                Bulk Apply First Row
              </button>
            )}
          </div>

          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-2 text-xs font-bold text-gray-500">Employee</th>
                <th className="px-2 py-2 text-xs font-bold text-gray-500">In Time</th>
                <th className="px-2 py-2 text-xs font-bold text-gray-500">Out Time</th>
                <th className="px-2 py-2 text-xs font-bold text-gray-500">Status</th>
                <th className="px-2 py-2 text-xs font-bold text-gray-500">Work Day</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {entryEmployees.map((emp, idx) => (
                <tr key={emp.employee_id}>
                  <td className="px-2 py-1 text-xs font-bold">{emp.employee_name}</td>
                  <td className="px-2 py-1">
                    <input
                      type="time"
                      value={emp.in_time}
                      onChange={(e) => {
                        const next = [...entryEmployees];
                        next[idx].in_time = e.target.value;
                        setEntryEmployees(next);
                      }}
                      className="px-2 py-1 border rounded text-xs"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      type="time"
                      value={emp.out_time}
                      onChange={(e) => {
                        const next = [...entryEmployees];
                        next[idx].out_time = e.target.value;
                        setEntryEmployees(next);
                      }}
                      className="px-2 py-1 border rounded text-xs"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <select
                      value={emp.attendance_status}
                      onChange={(e) => {
                        const next = [...entryEmployees];
                        next[idx].attendance_status = e.target.value;
                        setEntryEmployees(next);
                      }}
                      className="px-2 py-1 border rounded text-xs"
                    >
                      <option>Present</option>
                      <option>Absent</option>
                      <option>Half Day</option>
                      <option>Leave</option>
                      <option>Holiday</option>
                    </select>
                  </td>
                  <td className="px-2 py-1">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="1"
                      value={emp.work_day}
                      onChange={(e) => {
                        const next = [...entryEmployees];
                        next[idx].work_day = Number(e.target.value);
                        setEntryEmployees(next);
                      }}
                      className="w-12 px-2 py-1 border rounded text-xs"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded-xl text-xs font-bold text-gray-500">Cancel</button>
            <button onClick={handleSaveAttendance} className="px-5 py-2 bg-blue-600 text-white text-xs font-black rounded-xl border-0">Save Attendance</button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Attendance Log">
        {editingLog && (
          <form onSubmit={handleEditSubmit} className="space-y-4 text-left">
            <div>
              <p className="text-sm font-bold text-gray-900 m-0">{editingLog.employee_name}</p>
              <p className="text-xs text-gray-500 m-0">{editingLog.employee_code}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">In Time</label>
                <input
                  type="time"
                  value={editingLog.in_time || ''}
                  onChange={(e) => setEditingLog({ ...editingLog, in_time: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Out Time</label>
                <input
                  type="time"
                  value={editingLog.out_time || ''}
                  onChange={(e) => setEditingLog({ ...editingLog, out_time: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Status</label>
              <select
                value={editingLog.attendance_status}
                onChange={(e) => setEditingLog({ ...editingLog, attendance_status: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
              >
                <option>Present</option>
                <option>Absent</option>
                <option>Half Day</option>
                <option>Leave</option>
                <option>Holiday</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t">
              <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 border rounded-xl text-xs font-bold text-gray-500">Cancel</button>
              <button type="submit" className="px-5 py-2 bg-blue-600 text-white text-xs font-black rounded-xl border-0">Save Changes</button>
            </div>
          </form>
        )}
      </Modal>

      {/* Regularize Modal */}
      <Modal isOpen={isRegModalOpen} onClose={() => setIsRegModalOpen(false)} title="Request Regularization">
        {regLog && (
          <form onSubmit={handleRegularizeSubmit} className="space-y-4 text-left">
            <div>
              <p className="text-sm font-bold text-gray-900 m-0">{regLog.employee_name}</p>
              <p className="text-xs text-gray-500 m-0">Date: {new Date(regLog.attendance_date).toLocaleDateString()}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Correct In Time</label>
                <input
                  type="time"
                  value={regLog.in_time || ''}
                  onChange={(e) => setRegLog({ ...regLog, in_time: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Correct Out Time</label>
                <input
                  type="time"
                  value={regLog.out_time || ''}
                  onChange={(e) => setRegLog({ ...regLog, out_time: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Reason for Adjustment</label>
              <textarea
                value={regReason}
                onChange={(e) => setRegReason(e.target.value)}
                required
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                rows={3}
                placeholder="Forgot to punch / System issue / Client site..."
              />
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t">
              <button type="button" onClick={() => setIsRegModalOpen(false)} className="px-4 py-2 border rounded-xl text-xs font-bold text-gray-500">Cancel</button>
              <button type="submit" className="px-5 py-2 bg-blue-600 text-white text-xs font-black rounded-xl border-0">Submit Request</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default AttendanceLogPage;
