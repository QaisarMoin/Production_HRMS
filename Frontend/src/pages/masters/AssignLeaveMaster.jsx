import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Coffee, Upload } from 'lucide-react';
import Modal from '../../components/common/Modal';
import api from '../../utils/api';

const AssignLeaveMaster = () => {
  const [assignments, setAssignments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);

  const [formData, setFormData] = useState({
    employee_code: '',
    employee_name: '',
    casual_leave: 12,
    sick_leave: 12,
    marriage_leave: 5,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [assignRes, empRes] = await Promise.all([
        api.get('/employee-leave-assignments'),
        api.get('/employees')
      ]);
      setAssignments(assignRes.data.data || []);
      setEmployees(empRes.data.data || []);
    } catch (err) {
      console.error('Error fetching leave assignment data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleEdit = (assignment) => {
    setEditingAssignment(assignment);
    setFormData({
      employee_code: assignment.employee_code,
      employee_name: assignment.employee_name,
      casual_leave: assignment.casual_leave,
      sick_leave: assignment.sick_leave,
      marriage_leave: assignment.marriage_leave,
    });
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingAssignment(null);
    setFormData({
      employee_code: '',
      employee_name: '',
      casual_leave: 12,
      sick_leave: 12,
      marriage_leave: 5,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to cancel this leave allocation?')) {
      try {
        await api.delete(`/employee-leave-assignments/${id}`);
        fetchData();
      } catch (err) {
        console.error('Error deleting assignment:', err);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cl = parseInt(formData.casual_leave);
    const sl = parseInt(formData.sick_leave);
    const ml = parseInt(formData.marriage_leave);

    try {
      const selectedEmp = employees.find(x => x.employee_code === formData.employee_code);
      const payload = {
        ...formData,
        employee_id: selectedEmp?._id || null,
        casual_leave: cl,
        sick_leave: sl,
        marriage_leave: ml
      };

      if (editingAssignment) {
        await api.put(`/employee-leave-assignments/${editingAssignment._id}`, payload);
      } else {
        await api.post('/employee-leave-assignments', payload);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Error saving assignment:', err);
      alert('Error saving record: ' + (err.response?.data?.message || err.message));
    }
  };

  const filteredAssignments = assignments.filter(a =>
    a.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.employee_code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
            <span className="w-2.5 h-5 bg-blue-600 rounded-full inline-block" />
            Employee Leave Balance Allocations
          </h3>
          <p className="text-xs text-gray-500 mt-1 m-0">
            Configure credit boundaries for Casual Leaves (CL), Sick Leaves (SL), and Marriage Leaves (ML) per employee account.
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={handleAdd}
            className="flex items-center space-x-1.5 px-4 py-2.5 bg-blue-600 text-white text-xs font-black rounded-xl hover:bg-blue-700 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Credit Balance</span>
          </button>
          <button
            onClick={() => alert('Excel Template leaves-import.xlsx downloaded!')}
            className="flex items-center space-x-1.5 px-4 py-2.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-xl hover:bg-indigo-100 transition"
          >
            <Upload className="w-4 h-4" />
            <span>Import Allocations</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search employee leave files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50/60 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50/75">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Employee Info</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-widest">Casual Leaves</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-widest">Sick Leaves</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-widest">Marriage Leaves</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Allocation Date</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-xs text-gray-400">Loading leave allocations...</td>
                </tr>
              ) : filteredAssignments.length > 0 ? (
                filteredAssignments.map((a) => (
                  <tr key={a._id} className="hover:bg-gray-50/40 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      <div className="flex items-center gap-2">
                        <Coffee className="w-4 h-4 text-blue-500" />
                        <div>
                          <p className="m-0 font-bold">{a.employee_name || 'Generic Employee'}</p>
                          <p className="m-0 text-[10px] text-blue-600 font-bold mt-0.5">{a.employee_code || 'N/A'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-xs font-bold text-green-600">{a.casual_leave} days</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-xs font-bold text-blue-600">{a.sick_leave} days</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-xs font-bold text-purple-600">{a.marriage_leave} days</td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400 font-semibold">{a.created_at ? new Date(a.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-medium">
                      <div className="flex space-x-2.5">
                        <button onClick={() => handleEdit(a)} className="text-blue-600 hover:text-blue-900 bg-transparent border-0"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(a._id)} className="text-red-600 hover:text-red-900 bg-transparent border-0"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-xs text-gray-400">No leave allocations credited.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingAssignment ? 'Adjust Leave Balances' : 'Credit New Employee Balances'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Select Employee</label>
            <select
              value={formData.employee_code}
              onChange={(e) => {
                const code = e.target.value;
                const emp = employees.find(x => x.employee_code === code);
                if (emp) {
                  setFormData({
                    ...formData,
                    employee_code: emp.employee_code,
                    employee_name: `${emp.first_name} ${emp.last_name}`
                  });
                } else {
                  setFormData({
                    ...formData,
                    employee_code: '',
                    employee_name: ''
                  });
                }
              }}
              required
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 cursor-pointer"
            >
              <option value="">-- Choose Employee --</option>
              {employees.map(emp => (
                <option key={emp._id} value={emp.employee_code}>
                  {emp.first_name} {emp.last_name} ({emp.employee_code})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 text-green-600">Casual Leave (CL)</label>
              <input
                type="number"
                name="casual_leave"
                value={formData.casual_leave}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-center"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 text-blue-600">Sick Leave (SL)</label>
              <input
                type="number"
                name="sick_leave"
                value={formData.sick_leave}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-center"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 text-purple-600">Marriage Leave (ML)</label>
              <input
                type="number"
                name="marriage_leave"
                value={formData.marriage_leave}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-center"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 text-white text-xs font-black rounded-xl hover:bg-blue-700 shadow-sm"
            >
              {editingAssignment ? 'Apply Adjustments' : 'Allocate Credits'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AssignLeaveMaster;
