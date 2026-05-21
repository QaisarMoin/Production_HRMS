import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import Modal from '../../components/common/Modal';
import api from '../../utils/api';

const DepartmentMaster = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Form state
  const [formData, setFormData] = useState({
    department_name: '',
    status: 'active'
  });

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/departments');
      // Lookups return array under data.data
      setDepartments(res.data.data || res.data || []);
    } catch (err) {
      console.error('Error fetching departments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const filteredDepartments = departments.filter(dept =>
    (dept.department_name || dept.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredDepartments.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentDepartments = filteredDepartments.slice(startIndex, endIndex);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleAdd = () => {
    setEditingDepartment(null);
    setFormData({ department_name: '', status: 'active' });
    setIsModalOpen(true);
  };

  const handleEdit = (dept) => {
    setEditingDepartment(dept);
    setFormData({
      department_name: dept.department_name || dept.name || '',
      status: dept.status || 'active',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this department?')) {
      try {
        await api.delete(`/departments/${id}`);
        fetchDepartments();
      } catch (error) {
        console.error('Error deleting department:', error);
      }
    }
  };

  const handleToggleStatus = async (dept) => {
    try {
      const nextStatus = dept.status === 'inactive' ? 'active' : 'inactive';
      await api.put(`/departments/${dept._id}`, { status: nextStatus });
      fetchDepartments();
    } catch (error) {
      console.error('Error toggling department status:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.department_name, // fallback for legacy code
        department_name: formData.department_name,
        code: formData.department_name.substring(0, 3).toUpperCase(),
        status: formData.status
      };

      if (editingDepartment) {
        await api.put(`/departments/${editingDepartment._id}`, payload);
      } else {
        await api.post('/departments', payload);
      }
      setIsModalOpen(false);
      fetchDepartments();
    } catch (error) {
      console.error('Error saving department:', error);
      alert('Error saving record: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="space-y-6 text-left">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 m-0">Department Master</h1>
        <button
          onClick={handleAdd}
          className="flex items-center space-x-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition shadow-sm text-xs font-black"
        >
          <Plus className="w-4 h-4" />
          <span>Add Department</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search departments by name..."
            value={searchTerm}
            onChange={handleSearch}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50/60 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50/75">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">
                Department Name
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">
                Department Code
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">
                Modified Date
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan="5" className="px-6 py-10 text-center text-xs text-gray-400">Loading departments...</td>
              </tr>
            ) : currentDepartments.length > 0 ? (
              currentDepartments.map((department) => (
                <tr key={department._id} className="hover:bg-gray-50/40 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    {department.department_name || department.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs font-black text-blue-600">
                    {department.code || (department.department_name || department.name || '').substring(0, 3).toUpperCase()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                    <button
                      onClick={() => handleToggleStatus(department)}
                      className="flex items-center space-x-2 bg-transparent border-0 cursor-pointer p-0"
                    >
                      {department.status !== 'inactive' ? (
                        <span className="flex items-center text-green-600 font-bold gap-1"><ToggleRight className="w-5 h-5" /> Active</span>
                      ) : (
                        <span className="flex items-center text-red-500 font-bold gap-1"><ToggleLeft className="w-5 h-5" /> Inactive</span>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 font-semibold">
                    {department.modified_date ? new Date(department.modified_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs font-medium">
                    <div className="flex space-x-2.5">
                      <button
                        onClick={() => handleEdit(department)}
                        className="text-blue-600 hover:text-blue-900 bg-transparent border-0"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(department._id)}
                        className="text-red-600 hover:text-red-900 bg-transparent border-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="px-6 py-10 text-center text-xs text-gray-400">No departments setup yet.</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {filteredDepartments.length > itemsPerPage && (
          <div className="bg-white px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <div className="text-xs text-gray-500 font-bold">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredDepartments.length)} of{' '}
              {filteredDepartments.length} results
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3.5 py-1.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3.5 py-1.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDepartment ? 'Edit Department' : 'Add Department'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="department_name" className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">
              Department Name
            </label>
            <input
              type="text"
              id="department_name"
              name="department_name"
              value={formData.department_name}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
              placeholder="e.g. IT & Software Development"
            />
          </div>
          <div>
            <label htmlFor="status" className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 text-white text-xs font-black rounded-xl hover:bg-blue-700 transition-colors shadow-md"
            >
              {editingDepartment ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default DepartmentMaster;
