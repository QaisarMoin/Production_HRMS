import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, ToggleLeft, ToggleRight, Award, Download } from 'lucide-react';
import Modal from '../../components/common/Modal';
import api from '../../utils/api';

const DesignationMaster = () => {
  const [designations, setDesignations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDesignation, setEditingDesignation] = useState(null);

  // Form State matching MongoDB Collections precisely
  const [formData, setFormData] = useState({
    designation_name: '',
    component_group: 'A', // Enum A/B
    reporting_required: true,
    status: 'active'
  });

  const fetchDesignations = async () => {
    setLoading(true);
    try {
      const res = await api.get('/designations');
      setDesignations(res.data.data || []);
    } catch (err) {
      console.error('Error fetching designations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDesignations();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleAdd = () => {
    setEditingDesignation(null);
    setFormData({
      designation_name: '',
      component_group: 'A',
      reporting_required: true,
      status: 'active'
    });
    setIsModalOpen(true);
  };

  const handleEdit = (desg) => {
    setEditingDesignation(desg);
    setFormData({
      designation_name: desg.designation_name,
      component_group: desg.component_group,
      reporting_required: desg.reporting_required,
      status: desg.status || 'active'
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this designation?')) {
      try {
        await api.delete(`/designations/${id}`);
        fetchDesignations();
      } catch (err) {
        console.error('Error deleting designation:', err);
      }
    }
  };

  const handleToggleStatus = async (desg) => {
    try {
      const nextStatus = desg.status === 'inactive' ? 'active' : 'inactive';
      await api.put(`/designations/${desg._id}`, { status: nextStatus });
      fetchDesignations();
    } catch (err) {
      console.error('Error toggling designation status:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingDesignation) {
        await api.put(`/designations/${editingDesignation._id}`, formData);
      } else {
        await api.post('/designations', formData);
      }
      setIsModalOpen(false);
      fetchDesignations();
    } catch (err) {
      console.error('Error saving designation:', err);
      alert('Error saving record: ' + (err.response?.data?.message || err.message));
    }
  };

  const filteredDesignations = designations.filter(d =>
    d.designation_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
            <span className="w-2.5 h-5 bg-blue-600 rounded-full inline-block" />
            Roles & Designation Directory
          </h3>
          <p className="text-xs text-gray-500 mt-1 m-0">
            Configure employee designations. Maps component group structures (Band A / B) and enforces reporting hierarchy dependencies.
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={handleAdd}
            className="flex items-center space-x-1.5 px-4 py-2.5 bg-blue-600 text-white text-xs font-black rounded-xl hover:bg-blue-700 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Designation</span>
          </button>
          <button
            onClick={() => alert('Designation list exported to Excel successfully!')}
            className="flex items-center space-x-1.5 px-4 py-2.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl hover:bg-emerald-100 transition"
          >
            <Download className="w-4 h-4" />
            <span>Export list</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search designations..."
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
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Designation Name</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-widest">Component Group</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-widest">Reporting Hierarchy</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center text-xs text-gray-400">Loading designations...</td>
                </tr>
              ) : filteredDesignations.length > 0 ? (
                filteredDesignations.map((d) => (
                  <tr key={d._id} className="hover:bg-gray-50/40 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-amber-500" />
                        <span>{d.designation_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-xs text-gray-600 font-black">
                      Band {d.component_group}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-xs text-gray-500">
                      {d.reporting_required ? (
                        <span className="bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-full font-bold text-[10px]">Manager Required</span>
                      ) : (
                        <span className="bg-gray-100 text-gray-500 px-2.5 py-0.5 rounded-full font-semibold text-[10px]">Independent Role</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                      <button onClick={() => handleToggleStatus(d)} className="bg-transparent border-0 cursor-pointer p-0">
                        {d.status !== 'inactive' ? (
                          <span className="flex items-center text-green-600 font-bold gap-1"><ToggleRight className="w-5 h-5" /> Active</span>
                        ) : (
                          <span className="flex items-center text-red-500 font-bold gap-1"><ToggleLeft className="w-5 h-5" /> Inactive</span>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-medium">
                      <div className="flex space-x-2.5">
                        <button onClick={() => handleEdit(d)} className="text-blue-600 hover:text-blue-900 bg-transparent border-0"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(d._id)} className="text-red-600 hover:text-red-900 bg-transparent border-0"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center text-xs text-gray-400">No designations registered.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDesignation ? 'Edit Designation Details' : 'Create New Designation'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Designation Name</label>
            <input
              type="text"
              name="designation_name"
              value={formData.designation_name}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
              placeholder="e.g. Lead Devops Architect"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Component Group</label>
              <select
                name="component_group"
                value={formData.component_group}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
              >
                <option value="A">Band Group A</option>
                <option value="B">Band Group B</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Reporting Structure</label>
              <select
                name="reporting_required"
                value={formData.reporting_required ? 'true' : 'false'}
                onChange={(e) => setFormData({ ...formData, reporting_required: e.target.value === 'true' })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 font-bold"
              >
                <option value="true">Requires Manager Assignment</option>
                <option value="false">No Manager Assignment Required</option>
              </select>
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
              {editingDesignation ? 'Apply Modifications' : 'Create Role'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default DesignationMaster;
