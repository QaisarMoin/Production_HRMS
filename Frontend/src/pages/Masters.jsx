import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Layers,
  Building2,
  Users,
  MapPin,
  Coffee,
  FileText,
  CheckSquare,
  DollarSign,
  LogOut,
  GraduationCap,
  Briefcase,
  Gift,
  Plus,
  Search,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  TrendingUp,
  Award,
  HelpCircle
} from 'lucide-react';
import Modal from '../components/common/Modal';
import api from '../utils/api';

// High Fidelity Custom Masters
import EmployeeMaster from './masters/EmployeeMaster';
import DepartmentMaster from './masters/DepartmentMaster';
import DesignationMaster from './masters/DesignationMaster';
import AttendanceRulesMaster from './masters/AttendanceRulesMaster';
import ShiftRosterMaster from './masters/ShiftRosterMaster';
import LocationMaster from './masters/LocationMaster';
import AssignLeaveMaster from './masters/AssignLeaveMaster';
import SalaryStructureMaster from './masters/SalaryStructureMaster';

const modelMap = {
  'Holiday': 'Holiday',
  'Employee Category': 'EmployeeCategory',
  'Leave Type': 'LeaveType',
  'Permission Type': 'PermissionType',
  'Reimbursement Type': 'ReimbursementType',
  'Regularization Reason': 'RegularizationReason',
  'Resign Reason': 'ResignReason',
  'Source of Hire': 'SourceOfHire',
  'Bonus Policy': 'BonusPolicy',
  'Degree': 'Degree'
};

const Masters = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'Employee';

  const [genericList, setGenericList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Dynamic Form Data depending on active tab properties
  const [formData, setFormData] = useState({});

  const fetchLookupData = async () => {
    const modelName = modelMap[activeTab];
    if (!modelName) return;
    setLoading(true);
    try {
      const res = await api.get(`/lookup/${modelName}`);
      setGenericList(res.data.data || []);
    } catch (err) {
      console.error('Error fetching lookup:', err);
      setGenericList([]);
    } finally {
      setLoading(false);
    }
  };

  // Reset filter and reload lookup records when switching tabs
  useEffect(() => {
    setSearchTerm('');
    setCurrentPage(1);
    
    // Initialize form defaults based on active tab properties
    if (activeTab === 'Holiday') {
      setFormData({ holiday_name: '', holiday_date: '', description: '', holiday_type: 'Regular' });
    } else if (activeTab === 'Employee Category') {
      setFormData({ category_name: '' });
    } else if (activeTab === 'Leave Type') {
      setFormData({ leave_name: '', allowed_days: 12 });
    } else if (activeTab === 'Permission Type') {
      setFormData({ permission_type: '' });
    } else if (activeTab === 'Reimbursement Type') {
      setFormData({ reimbursement_type: '' });
    } else if (activeTab === 'Regularization Reason' || activeTab === 'Resign Reason') {
      setFormData({ reason: '' });
    } else if (activeTab === 'Source of Hire') {
      setFormData({ source_name: '' });
    } else if (activeTab === 'Bonus Policy') {
      setFormData({ policy_name: '', policy_type: 'Regular' });
    } else if (activeTab === 'Degree') {
      setFormData({ degree_name: '' });
    }

    if (modelMap[activeTab]) {
      fetchLookupData();
    }
  }, [activeTab]);

  // Helper function to search fields dynamically based on schema keys
  const filteredList = genericList.filter(item => {
    const text = JSON.stringify(item).toLowerCase();
    return text.includes(searchTerm.toLowerCase());
  });

  const totalPages = Math.ceil(filteredList.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredList.slice(startIndex, endIndex);

  const handleAdd = () => {
    setEditingItem(null);
    if (activeTab === 'Holiday') {
      setFormData({ holiday_name: '', holiday_date: '', description: '', holiday_type: 'Regular' });
    } else if (activeTab === 'Employee Category') {
      setFormData({ category_name: '' });
    } else if (activeTab === 'Leave Type') {
      setFormData({ leave_name: '', allowed_days: 12 });
    } else if (activeTab === 'Permission Type') {
      setFormData({ permission_type: '' });
    } else if (activeTab === 'Reimbursement Type') {
      setFormData({ reimbursement_type: '' });
    } else if (activeTab === 'Regularization Reason' || activeTab === 'Resign Reason') {
      setFormData({ reason: '' });
    } else if (activeTab === 'Source of Hire') {
      setFormData({ source_name: '' });
    } else if (activeTab === 'Bonus Policy') {
      setFormData({ policy_name: '', policy_type: 'Regular' });
    } else if (activeTab === 'Degree') {
      setFormData({ degree_name: '' });
    }
    setIsModalOpen(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({ ...item });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    const modelName = modelMap[activeTab];
    if (!modelName) return;
    if (window.confirm(`Are you sure you want to delete this record from ${activeTab}?`)) {
      try {
        await api.delete(`/lookup/${modelName}/${id}`);
        fetchLookupData();
      } catch (err) {
        console.error('Error deleting lookup:', err);
      }
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const modelName = modelMap[activeTab];
    if (!modelName) return;
    try {
      await api.put(`/lookup/${modelName}/${id}`, { 
        status: currentStatus === 'active' ? 'inactive' : 'active' 
      });
      fetchLookupData();
    } catch (err) {
      console.error('Error toggling status:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const modelName = modelMap[activeTab];
    if (!modelName) return;

    try {
      if (editingItem) {
        await api.put(`/lookup/${modelName}/${editingItem._id}`, formData);
      } else {
        await api.post(`/lookup/${modelName}`, formData);
      }
      setIsModalOpen(false);
      fetchLookupData();
    } catch (err) {
      console.error('Error saving record:', err);
      alert('Error saving record: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleFormInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Helper to determine headers based on active tab properties
  const getTableHeaderKeys = () => {
    if (activeTab === 'Holiday') return ['Holiday Name', 'Date', 'Description', 'Holiday Type'];
    if (activeTab === 'Employee Category') return ['Category Name'];
    if (activeTab === 'Leave Type') return ['Leave Name', 'Allowed Days'];
    if (activeTab === 'Permission Type') return ['Permission Type'];
    if (activeTab === 'Reimbursement Type') return ['Reimbursement Type'];
    if (activeTab === 'Regularization Reason' || activeTab === 'Resign Reason') return ['Reason Summary'];
    if (activeTab === 'Source of Hire') return ['Source Name'];
    if (activeTab === 'Bonus Policy') return ['Policy Name', 'Policy Type'];
    if (activeTab === 'Degree') return ['Degree Name'];
    return ['Name'];
  };

  return (
    <div className="space-y-8 pb-16">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.08),transparent)] pointer-events-none" />
        <div className="text-left space-y-2 z-10">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight m-0 text-white flex items-center gap-3">
            <TrendingUp className="w-10 h-10 text-amber-300 animate-pulse" /> HRMS Setup: {activeTab}
          </h1>
          <p className="text-indigo-100 text-sm md:text-base font-medium max-w-2xl">
            Configure system directories, holiday lists, shift rosters, department structures, leave allocation formulas, salary bands, and administrative rules.
          </p>
        </div>
      </div>

      {/* 2. Active Tab CRUD Display Body */}
      <div className="w-full space-y-6">
        
        {/* Dynamic Component Loaders */}
        {activeTab === 'Employee' ? (
          <EmployeeMaster />
        ) : activeTab === 'Department' ? (
          <DepartmentMaster />
        ) : activeTab === 'Designation' ? (
          <DesignationMaster />
        ) : activeTab === 'Attendance Rule' ? (
          <AttendanceRulesMaster />
        ) : activeTab === 'Shift Roster' ? (
          <ShiftRosterMaster />
        ) : activeTab === 'Location' ? (
          <LocationMaster />
        ) : activeTab === 'Assign Leave Type' ? (
          <AssignLeaveMaster />
        ) : activeTab === 'Salary Structure' ? (
          <SalaryStructureMaster />
        ) : (
          
          /* Generic CRUD Engine for holidays and remaining directories */
          <div className="space-y-6 text-left">
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div>
                <h3 className="text-lg font-black text-gray-900 capitalize flex items-center gap-2">
                  <span className="w-2.5 h-5 bg-blue-600 rounded-full inline-block" />
                  {activeTab} Directory
                </h3>
                <p className="text-xs text-gray-500 mt-1 m-0">
                  Manage directory parameters. Synchronizes with employee files and payroll computation.
                </p>
              </div>
              <button
                onClick={handleAdd}
                className="flex items-center space-x-1.5 px-4 py-2.5 bg-blue-600 text-white text-xs font-black rounded-xl hover:bg-blue-700 transition shadow-sm self-stretch sm:self-auto justify-center"
              >
                <Plus className="w-4 h-4" />
                <span>Add Record</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={`Search in ${activeTab} names or details...`}
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50/60 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs"
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50/75">
                    <tr>
                      {getTableHeaderKeys().map((header, idx) => (
                        <th key={idx} className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">
                          {header}
                        </th>
                      ))}
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {loading ? (
                      <tr>
                        <td colSpan={getTableHeaderKeys().length + 2} className="px-6 py-10 text-center text-xs text-gray-400">
                          Fetching latest updates from server...
                        </td>
                      </tr>
                    ) : currentItems.length > 0 ? (
                      currentItems.map((item) => (
                        <tr key={item._id} className="hover:bg-gray-50/40 transition-colors">
                          
                          {/* Holiday Columns */}
                          {activeTab === 'Holiday' && (
                            <>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{item.holiday_name}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600 font-semibold">
                                {item.holiday_date ? new Date(item.holiday_date).toISOString().split('T')[0] : ''}
                              </td>
                              <td className="px-6 py-4 text-xs text-gray-500">{item.description}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 font-bold">{item.holiday_type}</td>
                            </>
                          )}

                          {/* Employee Category Columns */}
                          {activeTab === 'Employee Category' && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{item.category_name}</td>
                          )}

                          {/* Leave Type Columns */}
                          {activeTab === 'Leave Type' && (
                            <>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{item.leave_name}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600 font-black">{item.allowed_days} Days Allowed</td>
                            </>
                          )}

                          {/* Permission Type Columns */}
                          {activeTab === 'Permission Type' && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{item.permission_type}</td>
                          )}

                          {/* Reimbursement Type Columns */}
                          {activeTab === 'Reimbursement Type' && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{item.reimbursement_type}</td>
                          )}

                          {/* Regularization / Resign Reason Columns */}
                          {(activeTab === 'Regularization Reason' || activeTab === 'Resign Reason') && (
                            <td className="px-6 py-4 text-sm font-semibold text-gray-800">{item.reason}</td>
                          )}

                          {/* Source of Hire Columns */}
                          {activeTab === 'Source of Hire' && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{item.source_name}</td>
                          )}

                          {/* Bonus Policy Columns */}
                          {activeTab === 'Bonus Policy' && (
                            <>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{item.policy_name}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600 font-bold">{item.policy_type}</td>
                            </>
                          )}

                          {/* Degree Columns */}
                          {activeTab === 'Degree' && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{item.degree_name}</td>
                          )}

                          {/* Status and Action Buttons */}
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                            <button
                              onClick={() => handleToggleStatus(item._id, item.status)}
                              className="flex items-center space-x-1.5 bg-transparent border-0 cursor-pointer p-0"
                            >
                              {item.status !== 'inactive' ? (
                                <span className="flex items-center text-green-600 font-bold gap-1"><ToggleRight className="w-5 h-5" /> Active</span>
                              ) : (
                                <span className="flex items-center text-red-500 font-bold gap-1"><ToggleLeft className="w-5 h-5" /> Inactive</span>
                              )}
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs font-medium">
                            <div className="flex space-x-2.5">
                              <button
                                onClick={() => handleEdit(item)}
                                className="text-blue-600 hover:text-blue-900 bg-transparent border-0"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(item._id)}
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
                        <td colSpan={getTableHeaderKeys().length + 2} className="px-6 py-10 text-center text-xs text-gray-400">
                          No records found in this directory setup.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {filteredList.length > itemsPerPage && (
                <div className="bg-white px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                  <div className="text-xs text-gray-500 font-bold">
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredList.length)} of{' '}
                    {filteredList.length} entries
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

            {/* Reusable Input Form Modal */}
            <Modal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              title={editingItem ? `Edit ${activeTab}` : `Create New ${activeTab}`}
            >
              <form onSubmit={handleSubmit} className="space-y-4 text-left">
                
                {/* Holiday Input Fields */}
                {activeTab === 'Holiday' && (
                  <>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Holiday Name</label>
                      <input
                        type="text"
                        name="holiday_name"
                        value={formData.holiday_name || ''}
                        onChange={handleFormInputChange}
                        required
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
                        placeholder="e.g. Christmas Day"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Holiday Date</label>
                        <input
                          type="date"
                          name="holiday_date"
                          value={formData.holiday_date ? new Date(formData.holiday_date).toISOString().split('T')[0] : ''}
                          onChange={handleFormInputChange}
                          required
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Holiday Type</label>
                        <select
                          name="holiday_type"
                          value={formData.holiday_type || 'Regular'}
                          onChange={handleFormInputChange}
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
                        >
                          <option value="Regular">Regular</option>
                          <option value="Restricted">Restricted</option>
                          <option value="National">National</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Description</label>
                      <textarea
                        name="description"
                        value={formData.description || ''}
                        onChange={handleFormInputChange}
                        rows="3"
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
                        placeholder="Describe holiday..."
                      />
                    </div>
                  </>
                )}

                {/* Employee Category Input Fields */}
                {activeTab === 'Employee Category' && (
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Category Name</label>
                    <input
                      type="text"
                      name="category_name"
                      value={formData.category_name || ''}
                      onChange={handleFormInputChange}
                      required
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
                      placeholder="e.g. Permanent FTE"
                    />
                  </div>
                )}

                {/* Leave Type Input Fields */}
                {activeTab === 'Leave Type' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Leave Name</label>
                      <input
                        type="text"
                        name="leave_name"
                        value={formData.leave_name || ''}
                        onChange={handleFormInputChange}
                        required
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
                        placeholder="e.g. Casual Leave (CL)"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Allowed Days</label>
                      <input
                        type="number"
                        name="allowed_days"
                        value={formData.allowed_days || 12}
                        onChange={handleFormInputChange}
                        required
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
                      />
                    </div>
                  </div>
                )}

                {/* Permission Type Input Fields */}
                {activeTab === 'Permission Type' && (
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Permission Type Name</label>
                    <input
                      type="text"
                      name="permission_type"
                      value={formData.permission_type || ''}
                      onChange={handleFormInputChange}
                      required
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
                      placeholder="e.g. Late Check-In Permission"
                    />
                  </div>
                )}

                {/* Reimbursement Type Input Fields */}
                {activeTab === 'Reimbursement Type' && (
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Reimbursement Type Name</label>
                    <input
                      type="text"
                      name="reimbursement_type"
                      value={formData.reimbursement_type || ''}
                      onChange={handleFormInputChange}
                      required
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
                      placeholder="e.g. Broadband / Mobile Allowance"
                    />
                  </div>
                )}

                {/* Regularization / Resign Reason Input Fields */}
                {(activeTab === 'Regularization Reason' || activeTab === 'Resign Reason') && (
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Reason Description</label>
                    <textarea
                      name="reason"
                      value={formData.reason || ''}
                      onChange={handleFormInputChange}
                      required
                      rows="3"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
                      placeholder="Provide precise reason parameters..."
                    />
                  </div>
                )}

                {/* Source of Hire Input Fields */}
                {activeTab === 'Source of Hire' && (
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Source Name</label>
                    <input
                      type="text"
                      name="source_name"
                      value={formData.source_name || ''}
                      onChange={handleFormInputChange}
                      required
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
                      placeholder="e.g. LinkedIn Jobs Portal"
                    />
                  </div>
                )}

                {/* Bonus Policy Input Fields */}
                {activeTab === 'Bonus Policy' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Policy Name</label>
                      <input
                        type="text"
                        name="policy_name"
                        value={formData.policy_name || ''}
                        onChange={handleFormInputChange}
                        required
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
                        placeholder="e.g. Festival Performance"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Policy Type</label>
                      <select
                        name="policy_type"
                        value={formData.policy_type || 'Regular'}
                        onChange={handleFormInputChange}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
                      >
                        <option value="Regular">Regular</option>
                        <option value="Festival">Festival</option>
                        <option value="Performance">Performance</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Degree Input Fields */}
                {activeTab === 'Degree' && (
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Degree Name</label>
                    <input
                      type="text"
                      name="degree_name"
                      value={formData.degree_name || ''}
                      onChange={handleFormInputChange}
                      required
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
                      placeholder="e.g. Bachelor of Technology (B.Tech)"
                    />
                  </div>
                )}

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
                    {editingItem ? 'Save Updates' : 'Create Record'}
                  </button>
                </div>
              </form>
            </Modal>
          </div>
        )}
      </div>
    </div>
  );
};

export default Masters;
