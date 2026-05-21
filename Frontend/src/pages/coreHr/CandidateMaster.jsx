import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Download, UserPlus, Filter, Upload, FileSpreadsheet, ExternalLink } from 'lucide-react';
import Modal from '../../components/common/Modal';
import api from '../../utils/api';

const CandidateMaster = () => {
  const [candidates, setCandidates] = useState([]);
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filtering & Pagination state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGender, setFilterGender] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSource, setFilterSource] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState(null);
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    mobile: '',
    email: '',
    gender: 'Male',
    application_source: '',
    apply_date: new Date().toISOString().split('T')[0],
    state: '',
    candidate_status: 'Applied',
    resume_url: ''
  });

  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [candRes, sourceRes] = await Promise.all([
        api.get('/candidates'),
        api.get('/lookup/SourceOfHire')
      ]);
      setCandidates(candRes.data.data || []);
      setSources(sourceRes.data.data || []);
    } catch (err) {
      console.error('Error fetching candidates data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdd = () => {
    setEditingCandidate(null);
    setFormData({
      first_name: '',
      last_name: '',
      mobile: '',
      email: '',
      gender: 'Male',
      application_source: sources[0]?._id || '',
      apply_date: new Date().toISOString().split('T')[0],
      state: '',
      candidate_status: 'Applied',
      resume_url: ''
    });
    setIsModalOpen(true);
  };

  const handleEdit = (cand) => {
    setEditingCandidate(cand);
    setFormData({
      first_name: cand.first_name || '',
      last_name: cand.last_name || '',
      mobile: cand.mobile || '',
      email: cand.email || '',
      gender: cand.gender || 'Male',
      application_source: cand.application_source?._id || cand.application_source || '',
      apply_date: cand.apply_date ? new Date(cand.apply_date).toISOString().split('T')[0] : '',
      state: cand.state || '',
      candidate_status: cand.candidate_status || 'Applied',
      resume_url: cand.resume_url || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this candidate record?')) {
      try {
        await api.delete(`/candidates/${id}`);
        fetchData();
      } catch (err) {
        console.error('Error deleting candidate:', err);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCandidate) {
        await api.put(`/candidates/${editingCandidate._id}`, formData);
      } else {
        await api.post('/candidates', formData);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Error saving candidate:', err);
      alert('Error saving candidate: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleExport = async () => {
    try {
      await api.post('/candidates/export');
      alert('Candidates spreadsheet exported successfully!');
    } catch (err) {
      console.error('Export error:', err);
    }
  };

  const handleImportSubmit = async (e) => {
    e.preventDefault();
    setImporting(true);
    try {
      // Post bulk import
      await api.post('/candidates/import');
      alert('Candidates workbook imported successfully! Loaded parsed records.');
      setIsImportModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Import error:', err);
    } finally {
      setImporting(false);
    }
  };

  // Filter Logic
  const filteredCandidates = candidates.filter(cand => {
    const fullName = `${cand.first_name} ${cand.last_name}`.toLowerCase();
    const matchesSearch = 
      fullName.includes(searchTerm.toLowerCase()) ||
      cand.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cand.candidate_code?.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesGender = filterGender ? cand.gender === filterGender : true;
    const matchesStatus = filterStatus ? cand.candidate_status === filterStatus : true;
    const matchesSource = filterSource ? (cand.application_source?._id || cand.application_source) === filterSource : true;

    return matchesSearch && matchesGender && matchesStatus && matchesSource;
  });

  return (
    <div className="space-y-6 text-left">
      {/* 1. Header controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h3 className="text-lg font-black text-gray-900 flex items-center gap-2 m-0">
            <span className="w-2.5 h-5 bg-blue-600 rounded-full inline-block" />
            Recruitment Candidate Workspace
          </h3>
          <p className="text-xs text-gray-500 mt-1 m-0">
            Manage, filter, and onboard incoming job applicants before transitioning them to regular workforce directories.
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition border-0 cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Import XLS</span>
          </button>
          <button
            onClick={handleExport}
            className="flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition border-0 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export XLS</span>
          </button>
          <button
            onClick={handleAdd}
            className="flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl transition shadow-sm border-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Candidate</span>
          </button>
        </div>
      </div>

      {/* 2. Advanced Search & Filters Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
          <Filter className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Search & Filters</span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by code, name, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50/60 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs"
            />
          </div>

          <select
            value={filterGender}
            onChange={(e) => setFilterGender(e.target.value)}
            className="px-3 py-2.5 bg-gray-50/60 border border-gray-200 rounded-xl text-xs font-semibold cursor-pointer"
          >
            <option value="">-- All Genders --</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2.5 bg-gray-50/60 border border-gray-200 rounded-xl text-xs font-semibold cursor-pointer"
          >
            <option value="">-- All Statuses --</option>
            <option value="Applied">Applied</option>
            <option value="Interviewed">Interviewed</option>
            <option value="Selected">Selected</option>
            <option value="Rejected">Rejected</option>
            <option value="Joined">Joined</option>
          </select>

          <select
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value)}
            className="px-3 py-2.5 bg-gray-50/60 border border-gray-200 rounded-xl text-xs font-semibold cursor-pointer"
          >
            <option value="">-- All Sources --</option>
            {sources.map(src => (
              <option key={src._id} value={src._id}>{src.source_name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 3. Candidates listing table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50/75">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Candidate Info</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Email & Mobile</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Source & Date</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">State & Gender</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Attachment</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-10 text-center text-xs text-gray-400">Loading candidates roster...</td>
                </tr>
              ) : filteredCandidates.length > 0 ? (
                filteredCandidates.map((cand) => (
                  <tr key={cand._id} className="hover:bg-gray-50/40 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      <div className="flex items-center gap-2">
                        <UserPlus className="w-4 h-4 text-blue-500" />
                        <div>
                          <p className="m-0 font-bold">{cand.first_name} {cand.last_name}</p>
                          <p className="m-0 text-[10px] text-blue-600 font-bold mt-0.5">{cand.candidate_code}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600">
                      <p className="m-0 font-semibold">{cand.email}</p>
                      <p className="m-0 text-[10px] text-gray-400 mt-0.5">{cand.mobile}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600">
                      <p className="m-0 font-bold text-indigo-600">{cand.application_source?.source_name || 'Direct Apply'}</p>
                      <p className="m-0 text-[10px] text-gray-400 mt-0.5">{cand.apply_date ? new Date(cand.apply_date).toLocaleDateString() : 'N/A'}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600">
                      <p className="m-0 font-semibold">{cand.state || 'N/A'}</p>
                      <p className="m-0 text-[10px] text-gray-400 mt-0.5">{cand.gender}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs">
                      {cand.resume_url ? (
                        <a
                          href={cand.resume_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[10px] font-bold no-underline"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Resume</span>
                        </a>
                      ) : (
                        <span className="text-gray-300 text-[10px] font-medium">None</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        cand.candidate_status === 'Joined' ? 'bg-emerald-100 text-emerald-700' :
                        cand.candidate_status === 'Selected' ? 'bg-indigo-100 text-indigo-700' :
                        cand.candidate_status === 'Interviewed' ? 'bg-amber-100 text-amber-700' :
                        cand.candidate_status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                      }`}>{cand.candidate_status}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-medium">
                      <div className="flex space-x-2.5">
                        <button onClick={() => handleEdit(cand)} className="text-blue-600 hover:text-blue-900 bg-transparent border-0 cursor-pointer"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(cand._id)} className="text-red-600 hover:text-red-900 bg-transparent border-0 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-10 text-center text-xs text-gray-400">No applicants matching selected filter conditions.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. CRUD Modal Form */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCandidate ? 'Edit Candidate Details' : 'Add Candidate Profile'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[480px] overflow-y-auto pr-2 text-left">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">First Name</label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                required
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
                placeholder="e.g. Rahul"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Last Name</label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                required
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
                placeholder="e.g. Sharma"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Email ID</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
                placeholder="e.g. rahul@domain.com"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Mobile Contact</label>
              <input
                type="text"
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                required
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
                placeholder="e.g. +91 98765 43210"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Source of Hire</label>
              <select
                value={formData.application_source}
                onChange={(e) => setFormData({ ...formData, application_source: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
              >
                <option value="">-- Direct --</option>
                {sources.map(src => (
                  <option key={src._id} value={src._id}>{src.source_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Apply Date</label>
              <input
                type="date"
                value={formData.apply_date}
                onChange={(e) => setFormData({ ...formData, apply_date: e.target.value })}
                required
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">State / Region</label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
                placeholder="e.g. Maharashtra"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Candidate Status</label>
              <select
                value={formData.candidate_status}
                onChange={(e) => setFormData({ ...formData, candidate_status: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700"
              >
                <option value="Applied">Applied</option>
                <option value="Interviewed">Interviewed</option>
                <option value="Selected">Selected</option>
                <option value="Rejected">Rejected</option>
                <option value="Joined">Joined</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Resume / CV Attachment URL</label>
            <input
              type="text"
              value={formData.resume_url}
              onChange={(e) => setFormData({ ...formData, resume_url: e.target.value })}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
              placeholder="e.g. https://domain/cv-rahul.pdf"
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
              {editingCandidate ? 'Update Profile' : 'Add Candidate'}
            </button>
          </div>
        </form>
      </Modal>

      {/* 5. Bulk XLS Import Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Candidate Excel Workbook Import"
      >
        <form onSubmit={handleImportSubmit} className="space-y-4 text-left">
          <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center bg-gray-50/50 hover:bg-gray-50 transition-colors">
            <FileSpreadsheet className="w-12 h-12 text-indigo-500 mx-auto mb-3" />
            <p className="text-xs font-bold text-gray-800 m-0">Drag and drop spreadsheet here</p>
            <p className="text-[10px] text-gray-400 mt-1 m-0">Supports Excel workbooks (.xls, .xlsx, .csv)</p>
            
            <input
              type="file"
              onChange={(e) => setImportFile(e.target.files[0])}
              className="hidden"
              id="excel-file-uploader"
            />
            <label
              htmlFor="excel-file-uploader"
              className="mt-4 inline-block px-4 py-2 bg-white border border-gray-200 text-xs font-bold text-gray-700 rounded-xl cursor-pointer hover:bg-gray-50"
            >
              {importFile ? importFile.name : 'Choose File'}
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsImportModalOpen(false)}
              className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={importing}
              className="px-5 py-2 bg-indigo-600 text-white text-xs font-black rounded-xl hover:bg-indigo-700 shadow-sm cursor-pointer border-0 disabled:opacity-50"
            >
              {importing ? 'Uploading stream...' : 'Import Workbook'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CandidateMaster;
