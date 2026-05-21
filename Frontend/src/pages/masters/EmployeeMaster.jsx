import { useState, useEffect } from 'react';
import { 
  Plus, Search, Edit, Trash2, ToggleLeft, ToggleRight, Upload, Download, Key, Filter 
} from 'lucide-react';
import Modal from '../../components/common/Modal';
import api from '../../utils/api';

const EmployeeMaster = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Master lists loaded dynamically from live API
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);

  // Filtering & searching states
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  
  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  
  const [editingEmployee, setEditingEmployee] = useState(null);
  
  // Custom Export Selected Fields
  const [exportFields, setExportFields] = useState({
    employee_code: true,
    first_name: true,
    last_name: true,
    email: true,
    mobile: true,
    joining_date: true,
    gender: true,
    dob: true,
    branch: true,
    migrant: true,
    component_group: true,
    employee_status: true
  });

  // Main Employee Form State (matching schema exactly)
  const [formData, setFormData] = useState({
    employee_code: '',
    first_name: '',
    last_name: '',
    email: '',
    mobile: '',
    gender: 'Male',
    dob: '',
    joining_date: '',
    department_id: '',
    designation_id: '',
    employee_category_id: '',
    location_id: '',
    reporting_manager_id: '',
    component_group: 'A',
    branch: 'Main HQ',
    employee_status: 'Active',
    migrant: false
  });

  // Fetch employees list from Server
  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await api.get('/employees', {
        params: {
          search,
          department: deptFilter,
          employee_status: statusFilter
        }
      });
      setEmployees(res.data.data || []);
    } catch (err) {
      console.error('Error fetching employees:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load config lookups and initial employees list on mount
  useEffect(() => {
    const loadMastersAndEmployees = async () => {
      try {
        const [deptRes, desgRes, catRes, locRes] = await Promise.all([
          api.get('/departments'),
          api.get('/designations'),
          api.get('/lookup/EmployeeCategory'),
          api.get('/locations')
        ]);
        
        const depts = deptRes.data.data || [];
        const desgs = desgRes.data.data || [];
        const cats = catRes.data.data || [];
        const locs = locRes.data.data || [];

        setDepartments(depts);
        setDesignations(desgs);
        setCategories(cats);
        setLocations(locs);

        // Prepopulate first values in form defaults
        setFormData(prev => ({
          ...prev,
          department_id: depts[0]?._id || '',
          designation_id: desgs[0]?._id || '',
          employee_category_id: cats[0]?._id || '',
          location_id: locs[0]?._id || ''
        }));
      } catch (err) {
        console.error('Error loading master configurations:', err);
      }
    };

    loadMastersAndEmployees();
  }, []);

  // Sync employees on query change
  useEffect(() => {
    fetchEmployees();
  }, [search, statusFilter, deptFilter]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
  };

  const handleAdd = () => {
    setEditingEmployee(null);
    setFormData({
      employee_code: `EMP00${employees.length + 1}`,
      first_name: '',
      last_name: '',
      email: '',
      mobile: '',
      gender: 'Male',
      dob: '',
      joining_date: '',
      department_id: departments[0]?._id || '',
      designation_id: designations[0]?._id || '',
      employee_category_id: categories[0]?._id || '',
      location_id: locations[0]?._id || '',
      reporting_manager_id: '',
      component_group: 'A',
      branch: 'Main HQ',
      employee_status: 'Active',
      migrant: false
    });
    setIsFormOpen(true);
  };

  const handleEdit = (emp) => {
    setEditingEmployee(emp);
    setFormData({
      employee_code: emp.employee_code || '',
      first_name: emp.first_name || '',
      last_name: emp.last_name || '',
      email: emp.email || '',
      mobile: emp.mobile || '',
      gender: emp.gender || 'Male',
      dob: emp.dob ? new Date(emp.dob).toISOString().split('T')[0] : '',
      joining_date: emp.joining_date ? new Date(emp.joining_date).toISOString().split('T')[0] : '',
      department_id: emp.department_id?._id || emp.department_id || '',
      designation_id: emp.designation_id?._id || emp.designation_id || '',
      employee_category_id: emp.employee_category_id?._id || emp.employee_category_id || '',
      location_id: emp.location_id?._id || emp.location_id || '',
      reporting_manager_id: emp.reporting_manager_id?._id || emp.reporting_manager_id || '',
      component_group: emp.component_group || 'A',
      branch: emp.branch || 'Main HQ',
      employee_status: emp.employee_status || 'Active',
      migrant: emp.migrant || false
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this employee record?')) {
      try {
        await api.delete(`/employees/${id}`);
        fetchEmployees();
      } catch (err) {
        console.error('Error deleting employee:', err);
      }
    }
  };

  const handleResetPassword = async (emp) => {
    try {
      await api.post('/employees/reset-ess-password', { employee_id: emp._id });
      alert(`ESS Password Reset Successful!\nTemporary password has been emailed to ${emp.first_name}.`);
    } catch (err) {
      console.error('Error resetting password:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingEmployee) {
        await api.put(`/employees/${editingEmployee._id}`, formData);
      } else {
        await api.post('/employees', formData);
      }
      setIsFormOpen(false);
      fetchEmployees();
    } catch (err) {
      console.error('Error saving employee:', err);
      alert('Error saving record: ' + (err.response?.data?.message || err.message));
    }
  };

  // Excel Bulk Upload
  const handleBulkUpload = async (e) => {
    e.preventDefault();
    try {
      await api.post('/employees/bulk-upload');
      alert('Excel File parsed successfully! Mock employee records imported.');
      setIsBulkOpen(false);
      fetchEmployees();
    } catch (err) {
      console.error(err);
    }
  };

  // Custom Export Trigger
  const handleCustomExport = async (e) => {
    e.preventDefault();
    try {
      const activeFields = Object.keys(exportFields).filter(f => exportFields[f]);
      await api.post('/employees/custom-export', { fields: activeFields });
      alert(`Export triggered successfully!\nGenerated Excel containing fields: ${activeFields.join(', ')}.`);
      setIsExportOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 text-left">
      
      {/* Upper header controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
            <span className="w-2.5 h-5 bg-blue-600 rounded-full inline-block" />
            Employees Master Directory
          </h3>
          <p className="text-xs text-gray-500 mt-1 m-0">
            Create employee records, trigger bulk imports, custom exports, and administer ESS access keys.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button
            onClick={handleAdd}
            className="flex items-center space-x-1.5 px-4 py-2.5 bg-blue-600 text-white text-xs font-black rounded-xl hover:bg-blue-700 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Employee</span>
          </button>
          <button
            onClick={() => setIsBulkOpen(true)}
            className="flex items-center space-x-1.5 px-4 py-2.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-xl hover:bg-indigo-100 transition"
          >
            <Upload className="w-4 h-4" />
            <span>Bulk Upload</span>
          </button>
          <button
            onClick={() => setIsExportOpen(true)}
            className="flex items-center space-x-1.5 px-4 py-2.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl hover:bg-emerald-100 transition"
          >
            <Download className="w-4 h-4" />
            <span>Custom Export</span>
          </button>
        </div>
      </div>

      {/* EmployeeFilters component */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by code, name, email..."
              value={search}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50/60 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-xs text-gray-700 font-bold cursor-pointer"
          >
            <option value="">Filter Status (All)</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Resigned">Resigned</option>
            <option value="Terminated">Terminated</option>
          </select>

          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-xs text-gray-700 font-bold cursor-pointer"
          >
            <option value="">Filter Department (All)</option>
            {departments.map(d => (
              <option key={d._id} value={d._id}>{d.department_name || d.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* EmployeeTable component */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50/75">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Code</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Full Name</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Contact Info</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Join Date</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Migrant</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-10 text-center text-xs text-gray-400">Loading employees list...</td>
                </tr>
              ) : employees.length > 0 ? (
                employees.map((emp) => (
                  <tr key={emp._id} className="hover:bg-gray-50/40 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-black text-blue-600">{emp.employee_code}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{emp.full_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600">
                      <p className="m-0 font-semibold">{emp.email}</p>
                      <p className="m-0 text-gray-400 mt-0.5">{emp.mobile}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 font-semibold">
                      {emp.joining_date ? new Date(emp.joining_date).toISOString().split('T')[0] : ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                      {emp.migrant ? (
                        <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-bold text-[10px]">Migrant</span>
                      ) : (
                        <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-semibold text-[10px]">Local</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        emp.employee_status === 'Active' ? 'bg-green-100 text-green-700' :
                        emp.employee_status === 'Inactive' ? 'bg-red-100 text-red-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>{emp.employee_status}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-medium">
                      <div className="flex space-x-2.5">
                        <button onClick={() => handleEdit(emp)} className="text-blue-600 hover:text-blue-900 bg-transparent border-0"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => handleResetPassword(emp)} title="Reset Password" className="text-amber-600 hover:text-amber-900 bg-transparent border-0"><Key className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(emp._id)} className="text-red-600 hover:text-red-900 bg-transparent border-0"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-10 text-center text-xs text-gray-400">No employee records match the filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EmployeeFormModal component */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingEmployee ? 'Edit Employee Record' : 'Create New Employee'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[500px] overflow-y-auto pr-2 text-left">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Employee Code</label>
              <input
                type="text"
                name="employee_code"
                value={formData.employee_code}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Branch</label>
              <input
                type="text"
                name="branch"
                value={formData.branch}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">First Name</label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Last Name</label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Mobile</label>
              <input
                type="text"
                name="mobile"
                value={formData.mobile}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Date of Birth</label>
              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Joining Date</label>
              <input
                type="date"
                name="joining_date"
                value={formData.joining_date}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Component Group</label>
              <select
                name="component_group"
                value={formData.component_group}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 font-bold"
              >
                <option value="A">Group A</option>
                <option value="B">Group B</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Department</label>
              <select
                name="department_id"
                value={formData.department_id}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 font-bold cursor-pointer"
              >
                {departments.map(d => (
                  <option key={d._id} value={d._id}>{d.department_name || d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Designation</label>
              <select
                name="designation_id"
                value={formData.designation_id}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 font-bold cursor-pointer"
              >
                {designations.map(d => (
                  <option key={d._id} value={d._id}>{d.designation_name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Office Location</label>
              <select
                name="location_id"
                value={formData.location_id}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 font-bold cursor-pointer"
              >
                {locations.map(l => (
                  <option key={l._id} value={l._id}>{l.location_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Employee Status</label>
              <select
                name="employee_status"
                value={formData.employee_status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 font-bold cursor-pointer"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Resigned">Resigned</option>
                <option value="Terminated">Terminated</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <input
              type="checkbox"
              id="migrant"
              name="migrant"
              checked={formData.migrant}
              onChange={handleInputChange}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
            />
            <label htmlFor="migrant" className="text-xs font-bold text-gray-600 cursor-pointer select-none">Register as Migrant Employee</label>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 text-white text-xs font-black rounded-xl hover:bg-blue-700 shadow-sm"
            >
              {editingEmployee ? 'Save Updates' : 'Create Record'}
            </button>
          </div>
        </form>
      </Modal>

      {/* BulkUploadModal component */}
      <Modal
        isOpen={isBulkOpen}
        onClose={() => setIsBulkOpen(false)}
        title="Excel Bulk Import Manager"
      >
        <form onSubmit={handleBulkUpload} className="space-y-6 text-center">
          <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 hover:bg-gray-50 transition cursor-pointer flex flex-col items-center">
            <Upload className="w-12 h-12 text-indigo-500 mb-3" />
            <p className="text-sm font-bold text-gray-700">Drag and drop your Excel (.xlsx) file here</p>
            <p className="text-xs text-gray-400 mt-1">or click to browse local files</p>
            <input type="file" accept=".xlsx, .xls" className="hidden" />
          </div>
          <div className="flex justify-between items-center text-xs bg-gray-50 p-3.5 rounded-xl border border-gray-100">
            <span className="text-gray-500 font-bold">Standard Import Template</span>
            <a href="#download" className="text-blue-600 font-black no-underline hover:underline">Download Template.xlsx</a>
          </div>
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsBulkOpen(false)}
              className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 text-white text-xs font-black rounded-xl hover:bg-indigo-700 shadow-sm"
            >
              Import File
            </button>
          </div>
        </form>
      </Modal>

      {/* CustomExportModal component */}
      <Modal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        title="Custom Fields Export Engine"
      >
        <form onSubmit={handleCustomExport} className="space-y-4">
          <p className="text-xs text-gray-500 m-0 leading-relaxed text-left">
            Select the specific schema attributes you want to include in the exported Excel spreadsheet:
          </p>
          <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto p-1">
            {Object.keys(exportFields).map((field) => (
              <div key={field} className="flex items-center space-x-2.5 p-2 hover:bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  id={`field_${field}`}
                  checked={exportFields[field]}
                  onChange={(e) => setExportFields({ ...exportFields, [field]: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                />
                <label htmlFor={`field_${field}`} className="text-xs font-bold text-gray-700 capitalize">
                  {field.replace('_', ' ')}
                </label>
              </div>
            ))}
          </div>
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsExportOpen(false)}
              className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 text-white text-xs font-black rounded-xl hover:bg-emerald-700 shadow-sm"
            >
              Export Selected Fields
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default EmployeeMaster;
