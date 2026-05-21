import { useState, useEffect } from 'react';
import { Plus, Search, Eye, Download, FileText, Calendar, Trash2 } from 'lucide-react';
import Modal from '../../components/common/Modal';
import api from '../../utils/api';

const RelievingLetterMaster = () => {
  const [letters, setLetters] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    employee_id: '',
    designation_id: '',
    joining_date: '',
    last_working_date: new Date().toISOString().split('T')[0],
    relieving_letter_date: new Date().toISOString().split('T')[0],
    remarks: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [letRes, empRes, desRes] = await Promise.all([
        api.get('/relieving-letters'),
        api.get('/employees'),
        api.get('/designations')
      ]);
      setLetters(letRes.data.data || []);
      setEmployees(empRes.data.data || []);
      setDesignations(desRes.data.data || []);
    } catch (err) {
      console.error('Error fetching relieving data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSelectEmployee = (empId) => {
    const emp = employees.find(x => x._id === empId);
    if (emp) {
      setFormData(prev => ({
        ...prev,
        employee_id: empId,
        designation_id: emp.designation_id?._id || emp.designation_id || '',
        joining_date: emp.joining_date ? new Date(emp.joining_date).toISOString().split('T')[0] : ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        employee_id: '',
        designation_id: '',
        joining_date: ''
      }));
    }
  };

  const handleAdd = () => {
    setFormData({
      employee_id: '',
      designation_id: '',
      joining_date: '',
      last_working_date: new Date().toISOString().split('T')[0],
      relieving_letter_date: new Date().toISOString().split('T')[0],
      remarks: ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this relieving record?')) {
      try {
        await api.delete(`/relieving-letters/${id}`);
        fetchData();
      } catch (err) {
        console.error('Error deleting relieving letter:', err);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/relieving-letters', formData);
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Error saving relieving letter:', err);
    }
  };

  const filteredLetters = letters.filter(letRec => {
    const name = letRec.employee_id 
      ? `${letRec.employee_id.first_name} ${letRec.employee_id.last_name}`.toLowerCase()
      : '';
    return name.includes(searchTerm.toLowerCase()) || letRec.doc_number?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-6 text-left">
      {/* 1. Header controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h3 className="text-lg font-black text-gray-900 flex items-center gap-2 m-0">
            <span className="w-2.5 h-5 bg-blue-600 rounded-full inline-block" />
            Separation & Relieving Certificates
          </h3>
          <p className="text-xs text-gray-500 mt-1 m-0">
            Process employee exit clearances, record last working dates, and generate formal relieving letters.
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="w-full sm:w-auto flex items-center justify-center space-x-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl transition shadow-sm border-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Record Separation</span>
        </button>
      </div>

      {/* 2. Search block */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by code, resigned staff name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50/60 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs"
          />
        </div>
      </div>

      {/* 3. Document Table Grid */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50/75">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Document Ref</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Employee Name</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Designation</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Joining Date</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Last Working Date</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-xs text-gray-400">Loading exit clearance records...</td>
                </tr>
              ) : filteredLetters.length > 0 ? (
                filteredLetters.map((letRec) => {
                  const empName = letRec.employee_id 
                    ? `${letRec.employee_id.first_name} ${letRec.employee_id.last_name}`
                    : 'Staff Member';
                  const code = letRec.employee_id ? letRec.employee_id.employee_code : 'N/A';
                  
                  return (
                    <tr key={letRec._id} className="hover:bg-gray-50/40 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-emerald-500" />
                          <span className="font-mono text-xs">{letRec.doc_number}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600 font-semibold">
                        <div>
                          <p className="m-0 font-bold text-gray-800">{empName}</p>
                          <p className="m-0 text-[10px] text-gray-400 mt-0.5">{code}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600 font-bold">
                        {letRec.designation_id?.designation_name || 'Staff'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                        {letRec.joining_date ? new Date(letRec.joining_date).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-red-600 font-bold">
                        {letRec.last_working_date ? new Date(letRec.last_working_date).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-medium">
                        <div className="flex space-x-3 items-center">
                          <a
                            href={`${api.defaults.baseURL || ''}/relieving-letters/${letRec._id}/download`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center text-blue-600 hover:text-blue-900 bg-transparent border-0 cursor-pointer no-underline gap-1 font-bold"
                          >
                            <Download className="w-4 h-4" />
                            <span>Print PDF</span>
                          </a>
                          <button onClick={() => handleDelete(letRec._id)} className="text-red-600 hover:text-red-900 bg-transparent border-0 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-xs text-gray-400">No separation/relieving records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Letter Modal Form */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Employee Separation & Relieving"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Select Exiting Employee</label>
            <select
              value={formData.employee_id}
              onChange={(e) => handleSelectEmployee(e.target.value)}
              required
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 cursor-pointer"
            >
              <option value="">-- Choose Employee --</option>
              {employees.map(emp => (
                <option key={emp._id} value={emp._id}>{emp.first_name} {emp.last_name} ({emp.employee_code})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Employee Designation</label>
              <select
                value={formData.designation_id}
                disabled
                className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-xl text-xs font-semibold text-gray-500 cursor-not-allowed"
              >
                <option value="">-- Auto Loaded --</option>
                {designations.map(des => (
                  <option key={des._id} value={des._id}>{des.designation_name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Joining Date</label>
              <input
                type="date"
                value={formData.joining_date}
                disabled
                className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-xl text-xs font-semibold text-gray-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Last Working Date</label>
              <input
                type="date"
                value={formData.last_working_date}
                onChange={(e) => setFormData({ ...formData, last_working_date: e.target.value })}
                required
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Letter Issue Date</label>
              <input
                type="date"
                value={formData.relieving_letter_date}
                onChange={(e) => setFormData({ ...formData, relieving_letter_date: e.target.value })}
                required
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Exit Separation Remarks / Reasons</label>
            <textarea
              rows="3"
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
              placeholder="e.g. Resigned to seek higher education, outstanding performance recorded."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 text-white text-xs font-black rounded-xl hover:bg-blue-700 shadow-sm cursor-pointer border-0"
            >
              Issue Relieving Letter
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default RelievingLetterMaster;
