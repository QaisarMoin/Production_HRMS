import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Clock, ToggleLeft, ToggleRight } from 'lucide-react';
import Modal from '../../components/common/Modal';
import api from '../../utils/api';

const AttendanceRulesMaster = () => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);

  const [formData, setFormData] = useState({
    rule_name: '',
    device_count: 1,
    rule_type: 'Regular',
    work_day_calculation: '9 Hours Shift',
    in_time: '09:00',
    out_time: '18:00',
    in_time_grace: 15,
    out_time_grace: 15,
    overnight_shift: false,
    continuous_shift: false,
    recover_leave_hours: false,
    description: '',
    status: 'active'
  });

  const fetchRules = async () => {
    setLoading(true);
    try {
      const res = await api.get('/attendance-rules');
      setRules(res.data.data || []);
    } catch (err) {
      console.error('Error fetching attendance rules:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleAdd = () => {
    setEditingRule(null);
    setFormData({
      rule_name: '',
      device_count: 1,
      rule_type: 'Regular',
      work_day_calculation: '9 Hours Shift',
      in_time: '09:00',
      out_time: '18:00',
      in_time_grace: 15,
      out_time_grace: 15,
      overnight_shift: false,
      continuous_shift: false,
      recover_leave_hours: false,
      description: '',
      status: 'active'
    });
    setIsModalOpen(true);
  };

  const handleEdit = (rule) => {
    setEditingRule(rule);
    setFormData({
      rule_name: rule.rule_name || '',
      device_count: rule.device_count || 1,
      rule_type: rule.rule_type || 'Regular',
      work_day_calculation: rule.work_day_calculation || '9 Hours Shift',
      in_time: rule.in_time || '09:00',
      out_time: rule.out_time || '18:00',
      in_time_grace: rule.in_time_grace || 15,
      out_time_grace: rule.out_time_grace || 15,
      overnight_shift: rule.overnight_shift || false,
      continuous_shift: rule.continuous_shift || false,
      recover_leave_hours: rule.recover_leave_hours || false,
      description: rule.description || '',
      status: rule.status || 'active'
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this rule?')) {
      try {
        await api.delete(`/attendance-rules/${id}`);
        fetchRules();
      } catch (err) {
        console.error('Error deleting rule:', err);
      }
    }
  };

  const handleToggleStatus = async (rule) => {
    try {
      const nextStatus = rule.status === 'inactive' ? 'active' : 'inactive';
      await api.put(`/attendance-rules/${rule._id}`, { status: nextStatus });
      fetchRules();
    } catch (err) {
      console.error('Error toggling rule status:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRule) {
        await api.put(`/attendance-rules/${editingRule._id}`, formData);
      } else {
        await api.post('/attendance-rules', formData);
      }
      setIsModalOpen(false);
      fetchRules();
    } catch (err) {
      console.error('Error saving attendance rule:', err);
      alert('Error saving record: ' + (err.response?.data?.message || err.message));
    }
  };

  const filteredRules = rules.filter(rule =>
    rule.rule_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rule.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
            <span className="w-2.5 h-5 bg-blue-600 rounded-full inline-block" />
            Attendance Configuration Rules
          </h3>
          <p className="text-xs text-gray-500 mt-1 m-0">
            Define punching rules, device count constraints, overnight shift triggers, late buffers, and grace boundaries.
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center space-x-1.5 px-4 py-2.5 bg-blue-600 text-white text-xs font-black rounded-xl hover:bg-blue-700 transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Rule</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search attendance rules..."
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
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Rule Name</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Calculation Type</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Office Timings</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Grace Minutes</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Overnight</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-10 text-center text-xs text-gray-400">Loading rules list...</td>
                </tr>
              ) : filteredRules.length > 0 ? (
                filteredRules.map((rule) => (
                  <tr key={rule._id} className="hover:bg-gray-50/40 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      <p className="m-0 font-bold">{rule.rule_name}</p>
                      <p className="m-0 text-[10px] text-gray-400 mt-0.5">{rule.description}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600 font-semibold">{rule.work_day_calculation}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600">
                      <div className="flex items-center gap-1.5 font-bold">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span>{rule.in_time} - {rule.out_time}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 font-bold">
                      In: {rule.in_time_grace}m | Out: {rule.out_time_grace}m
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                      {rule.overnight_shift ? (
                        <span className="bg-purple-100 text-purple-700 px-2.5 py-0.5 rounded-full font-bold text-[10px]">Overnight</span>
                      ) : (
                        <span className="bg-gray-100 text-gray-400 px-2.5 py-0.5 rounded-full font-semibold text-[10px]">Standard</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                      <button onClick={() => handleToggleStatus(rule)} className="bg-transparent border-0 cursor-pointer p-0">
                        {rule.status !== 'inactive' ? (
                          <span className="flex items-center text-green-600 font-bold gap-1"><ToggleRight className="w-5 h-5" /> Active</span>
                        ) : (
                          <span className="flex items-center text-red-500 font-bold gap-1"><ToggleLeft className="w-5 h-5" /> Inactive</span>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-medium">
                      <div className="flex space-x-2.5">
                        <button onClick={() => handleEdit(rule)} className="text-blue-600 hover:text-blue-900 bg-transparent border-0"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(rule._id)} className="text-red-600 hover:text-red-900 bg-transparent border-0"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-10 text-center text-xs text-gray-400">No attendance rules registered.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRule ? 'Edit Attendance Rule' : 'Create Attendance Rule'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[480px] overflow-y-auto pr-2">
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Rule Name</label>
            <input
              type="text"
              name="rule_name"
              value={formData.rule_name}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
              placeholder="e.g. Standard FTE Office Shift"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Rule Type</label>
              <select
                name="rule_type"
                value={formData.rule_type}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
              >
                <option value="General">General</option>
                <option value="Night Shift">Night Shift</option>
                <option value="Flexible">Flexible</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Device Count (Biometrics)</label>
              <input
                type="number"
                name="device_count"
                value={formData.device_count}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Office In Time</label>
              <input
                type="time"
                name="in_time"
                value={formData.in_time}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Office Out Time</label>
              <input
                type="time"
                name="out_time"
                value={formData.out_time}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">In grace minutes buffer</label>
              <input
                type="number"
                name="in_time_grace"
                value={formData.in_time_grace}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Out grace minutes buffer</label>
              <input
                type="number"
                name="out_time_grace"
                value={formData.out_time_grace}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Work Day Calculation Basis</label>
            <input
              type="text"
              name="work_day_calculation"
              value={formData.work_day_calculation}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
              placeholder="e.g. 9 Hours Shift"
            />
          </div>

          <div className="grid grid-cols-3 gap-2 py-2 text-left">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="overnight_shift"
                name="overnight_shift"
                checked={formData.overnight_shift}
                onChange={handleInputChange}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="overnight_shift" className="text-[10px] font-bold text-gray-600 cursor-pointer select-none">Overnight</label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="continuous_shift"
                name="continuous_shift"
                checked={formData.continuous_shift}
                onChange={handleInputChange}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="continuous_shift" className="text-[10px] font-bold text-gray-600 cursor-pointer select-none">Continuous</label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="recover_leave_hours"
                name="recover_leave_hours"
                checked={formData.recover_leave_hours}
                onChange={handleInputChange}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="recover_leave_hours" className="text-[10px] font-bold text-gray-600 cursor-pointer select-none">Recover Leaves</label>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Rule Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="3"
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
              placeholder="Describe what triggers late markings or early departures..."
            />
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
              {editingRule ? 'Save Changes' : 'Create Rule'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AttendanceRulesMaster;
