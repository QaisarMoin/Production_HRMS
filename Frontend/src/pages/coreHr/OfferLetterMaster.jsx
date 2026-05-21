import { useState, useEffect } from 'react';
import { Plus, Search, Download, FileText, Settings, Layers } from 'lucide-react';
import Modal from '../../components/common/Modal';
import api from '../../utils/api';

const OfferLetterMaster = () => {
  const [letters, setLetters] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    employee_id: '',
    candidate_id: '',
    letter_type: 'Candidate',
    company_name: 'Isaii HRMS Enterprise Corp',
    template_content: '',
    seal_url: '',
    signature_url: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [letRes, empRes, candRes] = await Promise.all([
        api.get('/offer-letters'),
        api.get('/employees'),
        api.get('/candidates')
      ]);
      setLetters(letRes.data.data || []);
      setEmployees(empRes.data.data || []);
      setCandidates(candRes.data.data || []);
    } catch (err) {
      console.error('Error fetching offer data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSelectTarget = async (type, id) => {
    if (!id) {
      setFormData(prev => ({
        ...prev,
        employee_id: type === 'Employee' ? '' : prev.employee_id,
        candidate_id: type === 'Candidate' ? '' : prev.candidate_id,
        template_content: ''
      }));
      return;
    }
    const payload = type === 'Employee' 
      ? { employee_id: id, company_name: formData.company_name }
      : { candidate_id: id, company_name: formData.company_name };
      
    try {
      const res = await api.post('/offer-letters/generate', payload);
      setFormData(prev => ({
        ...prev,
        employee_id: type === 'Employee' ? id : '',
        candidate_id: type === 'Candidate' ? id : '',
        template_content: res.data.data?.template_content || ''
      }));
    } catch (err) {
      console.error('Error auto-generating template:', err);
    }
  };

  const handleAdd = () => {
    setFormData({
      employee_id: '',
      candidate_id: '',
      letter_type: 'Candidate',
      company_name: 'Isaii HRMS Enterprise Corp',
      template_content: 'Dear {{employee_name}},\n\nChoose an employee or candidate to populate variables.',
      seal_url: '',
      signature_url: ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        employee_id: formData.employee_id || null,
        candidate_id: formData.candidate_id || null,
        compensation_details: { basic: 2500, hra: 1000, gross_salary: 5000 }
      };
      await api.post('/offer-letters', payload);
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Error saving offer letter:', err);
    }
  };

  const filteredLetters = letters.filter(letRec => {
    const isEmp = letRec.letter_type === 'Employee';
    const name = (isEmp 
      ? `${letRec.employee_id?.first_name || ''} ${letRec.employee_id?.last_name || ''}`
      : `${letRec.candidate_id?.first_name || ''} ${letRec.candidate_id?.last_name || ''}`).toLowerCase();
    return name.includes(searchTerm.toLowerCase()) || letRec.doc_number?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-6 text-left">
      {/* 1. Header block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h3 className="text-lg font-black text-gray-900 flex items-center gap-2 m-0">
            <span className="w-2.5 h-5 bg-blue-600 rounded-full inline-block" />
            Offer Letter Issuance Centre
          </h3>
          <p className="text-xs text-gray-500 mt-1 m-0">
            Design corporate templates, configure automated salary integrations, and compile print-ready employment offer letters.
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="w-full sm:w-auto flex items-center justify-center space-x-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl transition shadow-sm border-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Issue Offer Letter</span>
        </button>
      </div>

      {/* 2. Search block */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search documents by code, candidate name..."
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
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Recipients Type</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Selected Recipient</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-widest">Compensation (Gross)</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Date Issued</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-xs text-gray-400">Compiling issued document list...</td>
                </tr>
              ) : filteredLetters.length > 0 ? (
                filteredLetters.map((letRec) => {
                  const isEmp = letRec.letter_type === 'Employee';
                  const name = isEmp 
                    ? `${letRec.employee_id?.first_name || ''} ${letRec.employee_id?.last_name || ''}`
                    : `${letRec.candidate_id?.first_name || ''} ${letRec.candidate_id?.last_name || ''}`;
                  const code = isEmp ? letRec.employee_id?.employee_code : letRec.candidate_id?.candidate_code || 'N/A';
                  
                  return (
                    <tr key={letRec._id} className="hover:bg-gray-50/40 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-indigo-500" />
                          <span className="font-mono text-xs">{letRec.doc_number}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          isEmp ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                        }`}>{letRec.letter_type || 'Candidate'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600 font-semibold">
                        <div>
                          <p className="m-0 font-bold text-gray-800">{name || 'Staff'}</p>
                          <p className="m-0 text-[10px] text-gray-400 mt-0.5">{code || 'N/A'}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-black text-right text-green-600">
                        ${(letRec.compensation_details?.gross_salary || 5000).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                        {new Date(letRec.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-medium">
                        <a
                          href={`${api.defaults.baseURL || ''}/offer-letters/${letRec._id}/download`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center text-blue-600 hover:text-blue-900 bg-transparent border-0 cursor-pointer no-underline gap-1 font-bold"
                        >
                          <Download className="w-4 h-4" />
                          <span>Print PDF</span>
                        </a>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-xs text-gray-400">No issued offer letters found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Letter creation modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Establish Employment Offer Letter"
      >
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[500px] overflow-y-auto pr-2 text-left">
          
          <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50 space-y-3">
            <div className="flex items-center gap-1.5 text-blue-700 font-bold text-xs mb-1">
              <Settings className="w-4 h-4" />
              <span>Recipient Selection Engine</span>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Letter Recipient Type</label>
                <select
                  value={formData.letter_type}
                  onChange={(e) => setFormData({ ...formData, letter_type: e.target.value, employee_id: '', candidate_id: '' })}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 cursor-pointer"
                >
                  <option value="Candidate">Candidate</option>
                  <option value="Employee">Employee</option>
                </select>
              </div>

              {formData.letter_type === 'Employee' ? (
                <div className="col-span-2">
                  <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Link to Employee</label>
                  <select
                    value={formData.employee_id}
                    onChange={(e) => handleSelectTarget('Employee', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    <option value="">-- Choose Employee --</option>
                    {employees.map(emp => (
                      <option key={emp._id} value={emp._id}>{emp.first_name} {emp.last_name} ({emp.employee_code})</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="col-span-2">
                  <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Link to Candidate</label>
                  <select
                    value={formData.candidate_id}
                    onChange={(e) => handleSelectTarget('Candidate', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    <option value="">-- Choose Candidate --</option>
                    {candidates.map(cand => (
                      <option key={cand._id} value={cand._id}>{cand.first_name} {cand.last_name} ({cand.candidate_code})</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Issuing Company Entity</label>
              <input
                type="text"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                required
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
                placeholder="e.g. Isaii HRMS Enterprise Corp"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Official Document Type</label>
              <div className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold text-gray-500">
                Onboarding Offer Letter (OFF)
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Editable Letter Template Content</label>
            <textarea
              rows="6"
              value={formData.template_content}
              onChange={(e) => setFormData({ ...formData, template_content: e.target.value })}
              required
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold font-mono whitespace-pre-wrap"
              placeholder="Design template using variables {{employee_name}}, {{designation}}, etc."
            />
            <span className="text-[9px] text-gray-400 font-medium block mt-1">Variables list: `{{employee_name}}`, `{{designation}}`, `{{joining_date}}`, `{{salary}}`, `{{company_name}}`.</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Digital Authorized Seal URL</label>
              <input
                type="text"
                value={formData.seal_url}
                onChange={(e) => setFormData({ ...formData, seal_url: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
                placeholder="e.g. https://domain/seal.png"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Digital Signature URL</label>
              <input
                type="text"
                value={formData.signature_url}
                onChange={(e) => setFormData({ ...formData, signature_url: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
                placeholder="e.g. https://domain/signature.png"
              />
            </div>
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
              Generate & Record Offer
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default OfferLetterMaster;
