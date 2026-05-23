import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  FileText, CheckSquare, ClipboardList, DollarSign, Briefcase, 
  Sliders, Users, Award, Plus, Search, Edit2, Trash2, Download, 
  Upload, Check, X, AlertCircle, Settings, Mail, RefreshCw, Printer 
} from 'lucide-react';
import api from '../utils/api';

const PAYROLL_TABS = [
  { id: 'Tax Regimes', icon: FileText, label: 'Tax Regimes' },
  { id: 'Declarations', icon: CheckSquare, label: 'Declarations' },
  { id: 'IT Proofs', icon: ClipboardList, label: 'IT Proofs' },
  { id: 'Previous Deductions', icon: DollarSign, label: 'Previous Deductions' },
  { id: 'Advance Salary', icon: Briefcase, label: 'Advance Salary' },
  { id: 'Generate Payroll', icon: Sliders, label: 'Generate Payroll' },
  { id: 'Final Settlements', icon: Users, label: 'Final Settlements' },
  { id: 'Payslips', icon: FileText, label: 'Payslips' },
  { id: 'Salary Revisions', icon: Award, label: 'Salary Revisions' },
];

const TAB_DESCRIPTIONS = {
  'Tax Regimes': 'Define tax regime rules, map slabs, review and bulk-assign employee tax regimes.',
  'Declarations': 'View and approve employee tax declarations under Section 80C, HRA, and LTA.',
  'IT Proofs': 'Verify submitted investment proofs and documents to calculate accurate tax exemptions.',
  'Previous Deductions': 'Log and compute prior employment earnings and deductions for accurate mid-year tax calculations.',
  'Advance Salary': 'Process advance salary request structures, monthly installment recovery plans, and track active balances.',
  'Generate Payroll': 'Run payroll calculations, generate monthly registers, and approve bulk employee payout disbursements.',
  'Final Settlements': 'Compute full & final settlement accounts, pending gratuity, notice periods, and leave encashment payouts.',
  'Payslips': 'Generate, print, and distribute digital monthly payslips and tax summaries to active staff.',
  'Salary Revisions': 'Review salary progression histories, log increments, and schedule structural payroll adjustments.',
};

const Payroll = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'Tax Regimes';

  // Shared state
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  // Sub-module specific states
  const [taxRegimes, setTaxRegimes] = useState([]);
  const [taxSlabs, setTaxSlabs] = useState([]);
  const [declarations, setDeclarations] = useState([]);
  const [itProofs, setItProofs] = useState([]);
  const [prevDeductions, setPrevDeductions] = useState([]);
  const [advSalaries, setAdvSalaries] = useState([]);
  const [payrolls, setPayrolls] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [payslips, setPayslips] = useState([]);
  const [revisions, setRevisions] = useState([]);
  const [salaryStructures, setSalaryStructures] = useState([]);

  // Modals / Forms controllers
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState(''); // e.g. "add-regime", "add-declaration", etc.
  const [formData, setFormData] = useState({});

  // Filtering states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Fetch employees on mount
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await api.get('/employees');
        setEmployees(res.data.data || []);
      } catch (err) {
        console.error('Error fetching employees:', err);
      }
    };
    fetchEmployees();
  }, []);

  // Fetch data depending on activeTab
  const fetchData = async () => {
    setLoading(true);
    setFeedbackMsg(null);
    try {
      if (activeTab === 'Tax Regimes') {
        const [regRes, slabRes] = await Promise.all([
          api.get('/payroll/tax-regimes'),
          api.get('/payroll/tax-slabs')
        ]);
        setTaxRegimes(regRes.data.data || []);
        setTaxSlabs(slabRes.data.data || []);
      } else if (activeTab === 'Declarations') {
        const res = await api.get('/payroll/declarations');
        setDeclarations(res.data.data || []);
      } else if (activeTab === 'IT Proofs') {
        const res = await api.get('/payroll/it-proofs');
        setItProofs(res.data.data || []);
      } else if (activeTab === 'Previous Deductions') {
        const res = await api.get('/payroll/previous-deductions');
        setPrevDeductions(res.data.data || []);
      } else if (activeTab === 'Advance Salary') {
        const res = await api.get('/payroll/advance-salaries');
        setAdvSalaries(res.data.data || []);
      } else if (activeTab === 'Generate Payroll') {
        const res = await api.get('/payrolls');
        setPayrolls(res.data.data || []);
      } else if (activeTab === 'Final Settlements') {
        const [settlementsRes, structuresRes] = await Promise.all([
          api.get('/payroll/final-settlements'),
          api.get('/salary-structures')
        ]);
        setSettlements(settlementsRes.data.data || []);
        setSalaryStructures(structuresRes.data.data || []);
      } else if (activeTab === 'Payslips') {
        const res = await api.get('/payslips');
        setPayslips(res.data.data || []);
      } else if (activeTab === 'Salary Revisions') {
        const res = await api.get('/payroll/salary-revisions');
        setRevisions(res.data.data || []);
      }
    } catch (err) {
      console.error(`Error loading data for ${activeTab}:`, err);
      setFeedbackMsg({ type: 'error', text: 'Failed to retrieve records from server.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Reset filters
    setSearchTerm('');
    setStatusFilter('');
  }, [activeTab]);

  const showToast = (type, text) => {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // Generic Submit handler for creation forms
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalType === 'add-regime') {
        await api.post('/payroll/tax-regimes', formData);
        showToast('success', 'Tax Regime request submitted successfully.');
      } else if (modalType === 'bulk-regime') {
        await api.post('/payroll/tax-regimes/bulk-insert', {
          employees: [{ employee_id: formData.employee_id, tax_regime: formData.new_regime }]
        });
        showToast('success', 'Bulk Tax Regime choice applied successfully.');
      } else if (modalType === 'add-declaration') {
        await api.post('/payroll/declarations', formData);
        showToast('success', 'Tax Declaration submitted successfully.');
      } else if (modalType === 'add-itproof') {
        await api.post('/payroll/it-proofs', {
          ...formData,
          proof_documents: ['mock_proof_receipt.pdf']
        });
        showToast('success', 'IT Proof file and declaration submitted.');
      } else if (modalType === 'add-prevdeduction') {
        await api.post('/payroll/previous-deductions', formData);
        showToast('success', 'Previous company deductions details logged.');
      } else if (modalType === 'add-advance') {
        await api.post('/payroll/advance-salaries', formData);
        showToast('success', 'Advance salary layout generated and registered.');
      } else if (modalType === 'add-payroll') {
        await api.post('/payrolls/generate', {
          salary_month: formData.salary_month,
          payroll_type: formData.payroll_type || 'Monthly'
        });
        showToast('success', 'Payroll run and calculations computed successfully.');
      } else if (modalType === 'add-settlement') {
        await api.post('/payroll/final-settlements', formData);
        showToast('success', 'Full & Final Settlement details logged.');
      } else if (modalType === 'add-revision') {
        await api.post('/payroll/salary-revisions', formData);
        showToast('success', 'Salary Revision request logged.');
      } else if (modalType === 'add-tax-slab') {
        await api.post('/payroll/tax-slabs', formData);
        showToast('success', 'Tax Slab set created successfully.');
      } else if (modalType === 'edit-tax-slab') {
        await api.put(`/payroll/tax-slabs/${formData._id}`, formData);
        showToast('success', 'Tax Slab set updated successfully.');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      showToast('error', err.response?.data?.message || 'Action execution failed.');
    }
  };

  // Helper Actions (Approve / Reject / Delete)
  const handleApprove = async (id, path) => {
    try {
      await api.post(`/payroll/${path}/approve/${id}`);
      showToast('success', 'Record approved successfully.');
      fetchData();
    } catch (err) {
      showToast('error', 'Approval action failed.');
    }
  };

  const handleReject = async (id, path) => {
    try {
      await api.post(`/payroll/${path}/reject/${id}`);
      showToast('success', 'Record marked as rejected.');
      fetchData();
    } catch (err) {
      showToast('error', 'Rejection action failed.');
    }
  };

  const handleApprovePayroll = async (id) => {
    try {
      await api.post(`/payrolls/approve/${id}`);
      showToast('success', 'Payroll run approved and status marked Paid.');
      fetchData();
    } catch (err) {
      showToast('error', 'Failed to approve payroll.');
    }
  };

  const handleDelete = async (id, path) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    try {
      await api.delete(`/payroll/${path}/${id}`);
      showToast('success', 'Record removed successfully.');
      fetchData();
    } catch (err) {
      showToast('error', 'Deletion failed.');
    }
  };

  const triggerExport = async (path) => {
    try {
      const res = await api.post(`/payroll/${path}/export`);
      window.open(res.data.fileUrl, '_blank');
      showToast('success', 'Export file triggered in new window.');
    } catch (err) {
      showToast('error', 'Export failed.');
    }
  };

  // Get Lucide Icon for Header Banner
  const getBannerIcon = () => {
    switch (activeTab) {
      case 'Tax Regimes': return <FileText className="w-6 h-6 text-cyan-300" />;
      case 'Declarations': return <CheckSquare className="w-6 h-6 text-emerald-300" />;
      case 'IT Proofs': return <ClipboardList className="w-6 h-6 text-amber-300" />;
      case 'Previous Deductions': return <DollarSign className="w-6 h-6 text-pink-300" />;
      case 'Advance Salary': return <Briefcase className="w-6 h-6 text-indigo-300" />;
      case 'Generate Payroll': return <Sliders className="w-6 h-6 text-purple-300" />;
      case 'Final Settlements': return <Users className="w-6 h-6 text-teal-300" />;
      case 'Payslips': return <FileText className="w-6 h-6 text-rose-300" />;
      case 'Salary Revisions': return <Award className="w-6 h-6 text-yellow-300" />;
      default: return <DollarSign className="w-6 h-6 text-blue-300" />;
    }
  };

  return (
    <div className="space-y-6 p-0 text-left">
      {/* Premium Glassmorphism Page Banner Header matching Core HR color theme (Compact) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 py-5 px-6 md:py-6 md:px-8 shadow-lg border border-blue-100/50">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-48 h-48 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
        <div className="absolute bottom-0 left-1/3 -mb-16 w-56 h-56 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-25 animate-pulse" />
        
        <div className="relative z-10 flex flex-col items-start gap-2 text-left">
          <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-indigo-200 bg-indigo-800/50 rounded-full border border-indigo-700">
            Payroll Suite
          </span>
          <h1 className="text-lg md:text-xl font-bold text-white tracking-tight flex items-center gap-2 m-0">
            {getBannerIcon()} {activeTab}
          </h1>
          <p className="text-indigo-100 text-xs md:text-sm font-medium max-w-3xl m-0">
            {TAB_DESCRIPTIONS[activeTab] || 'Calculate employee gross earnings, manage dynamic tax regimes, log declarations, and approve payouts.'}
          </p>
        </div>
      </div>

      {/* Horizontal Tabs Selection Bar */}
      <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap pb-2 scrollbar-none border-b border-gray-150">
        {PAYROLL_TABS.map((tab) => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSearchParams({ tab: tab.id })}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100/50'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <TabIcon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Toast Alert Feedback */}
      {feedbackMsg && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${
          feedbackMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="font-semibold text-sm">{feedbackMsg.text}</span>
        </div>
      )}

      {/* Main Content Area */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8">
        
        {/* TAB 1: TAX REGIMES */}
        {activeTab === 'Tax Regimes' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => {
                    setModalType('add-regime');
                    setFormData({ employee_id: '', new_regime: 'New Regime' });
                    setIsModalOpen(true);
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-all border-0 cursor-pointer shadow-sm shadow-blue-200"
                >
                  <Plus className="w-4 h-4" /> Declare Regime
                </button>
                <button
                  onClick={() => {
                    setModalType('bulk-regime');
                    setFormData({ employee_id: '', new_regime: 'New Regime' });
                    setIsModalOpen(true);
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-semibold text-sm transition-all border-0 cursor-pointer"
                >
                  <Upload className="w-4 h-4" /> Bulk Regime Assignment
                </button>
                <button
                  onClick={() => {
                    setModalType('add-tax-slab');
                    setFormData({
                      regime_type: 'New Regime',
                      age_group: 'Below 60',
                      slabs: [
                        { income_slab_name: 'Upto 3L', from_amount: 0, to_amount: 300000, tax_percentage: 0 }
                      ]
                    });
                    setIsModalOpen(true);
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl font-semibold text-sm transition-all border-0 cursor-pointer shadow-sm shadow-indigo-100"
                >
                  <Plus className="w-4 h-4" /> Create Custom Slab
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={async () => {
                    try {
                      await api.post('/payroll/seed-slabs');
                      showToast('success', 'Default Tax Slabs seeded successfully.');
                      fetchData();
                    } catch (e) {
                      showToast('error', 'Seeding slabs failed.');
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-xl font-semibold text-xs bg-white hover:bg-gray-50 transition-all cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Reset Tax Slabs
                </button>
              </div>
            </div>

            {/* Slabs Summary Widgets */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              {taxSlabs.map((slabSet, idx) => (
                <div key={slabSet._id || idx} className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-indigo-500" /> {slabSet.regime_type} ({slabSet.age_group})
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setFormData(JSON.parse(JSON.stringify(slabSet)));
                          setModalType('edit-tax-slab');
                          setIsModalOpen(true);
                        }}
                        className="p-1.5 text-gray-500 hover:text-indigo-600 bg-white border border-gray-100 hover:border-indigo-100 hover:bg-indigo-50 rounded-lg cursor-pointer transition-all flex items-center justify-center"
                        title="Edit Slabs"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={async () => {
                          if (window.confirm("Bhai, kya aap sach me is tax slab set ko delete karna chahte hain?")) {
                            try {
                              await api.delete(`/payroll/tax-slabs/${slabSet._id}`);
                              showToast('success', 'Tax slab set deleted successfully.');
                              fetchData();
                            } catch (e) {
                              showToast('error', 'Tax slab set delete fail ho gaya.');
                            }
                          }
                        }}
                        className="p-1.5 text-gray-500 hover:text-red-600 bg-white border border-gray-100 hover:border-red-100 hover:bg-red-50 rounded-lg cursor-pointer transition-all flex items-center justify-center"
                        title="Delete Slabs"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {slabSet.slabs.map((s, sIdx) => (
                      <div key={sIdx} className="flex justify-between text-xs font-semibold text-slate-600 border-b border-dashed border-slate-200 pb-1.5">
                        <span>{s.income_slab_name} ({s.from_amount.toLocaleString()} - {s.to_amount.toLocaleString()})</span>
                        <span className="text-indigo-600 font-bold">{s.tax_percentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="overflow-x-auto rounded-2xl border border-gray-100">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-bold text-xs uppercase tracking-wider border-b border-gray-100">
                    <th className="p-4">Employee</th>
                    <th className="p-4">Prev Regime</th>
                    <th className="p-4">Declared Regime</th>
                    <th className="p-4">Submission Date</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-slate-700 text-sm font-medium">
                  {taxRegimes.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-gray-400">No regime applications registered.</td>
                    </tr>
                  ) : (
                    taxRegimes.map((reg) => (
                      <tr key={reg._id} className="hover:bg-slate-50/50">
                        <td className="p-4">
                          <div className="font-bold text-slate-900">{reg.employee_name}</div>
                          <div className="text-xs text-slate-400">{reg.employee_code}</div>
                        </td>
                        <td className="p-4 text-slate-500">{reg.previous_regime || 'Old Regime'}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 text-xs font-bold rounded-lg ${
                            reg.new_regime === 'New Regime' ? 'bg-cyan-50 text-cyan-700 border border-cyan-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                          }`}>
                            {reg.new_regime}
                          </span>
                        </td>
                        <td className="p-4 text-slate-500">{new Date(reg.submitted_date).toLocaleDateString()}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                            reg.approval_status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                            reg.approval_status === 'Rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {reg.approval_status}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-2">
                          {reg.approval_status === 'Applied' && (
                            <>
                              <button
                                onClick={() => handleApprove(reg._id, 'tax-regimes')}
                                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg border-0 bg-transparent cursor-pointer"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleReject(reg._id, 'tax-regimes')}
                                className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg border-0 bg-transparent cursor-pointer"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: DECLARATIONS */}
        {activeTab === 'Declarations' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <button
                onClick={() => {
                  setModalType('add-declaration');
                  setFormData({ employee_id: '', financial_year: '2026-2027', general_declared_amount: 0, hra_declared_amount: 0, lta_declared_amount: 0 });
                  setIsModalOpen(true);
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-all border-0 cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4" /> New Tax Declaration
              </button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-gray-100">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-bold text-xs uppercase tracking-wider border-b border-gray-100">
                    <th className="p-4">Employee</th>
                    <th className="p-4">Financial Year</th>
                    <th className="p-4">General (Sec 80C)</th>
                    <th className="p-4">HRA Exemption</th>
                    <th className="p-4">LTA Exemption</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-slate-700 text-sm font-medium">
                  {declarations.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-gray-400">No tax declarations filed yet.</td>
                    </tr>
                  ) : (
                    declarations.map((dec) => (
                      <tr key={dec._id} className="hover:bg-slate-50/50">
                        <td className="p-4 font-bold text-slate-900">
                          {dec.employee_id?.first_name ? `${dec.employee_id.first_name} ${dec.employee_id.last_name}` : 'Unknown Employee'}
                        </td>
                        <td className="p-4 text-slate-600">{dec.financial_year}</td>
                        <td className="p-4 text-slate-800 font-semibold">₹{(dec.general_declared_amount || 0).toLocaleString()}</td>
                        <td className="p-4 text-slate-800 font-semibold">₹{(dec.hra_declared_amount || 0).toLocaleString()}</td>
                        <td className="p-4 text-slate-800 font-semibold">₹{(dec.lta_declared_amount || 0).toLocaleString()}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                            dec.approval_status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                            dec.approval_status === 'Rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {dec.approval_status}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-2">
                          {dec.approval_status === 'Applied' && (
                            <>
                              <button
                                onClick={() => handleApprove(dec._id, 'declarations')}
                                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg border-0 bg-transparent cursor-pointer"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleReject(dec._id, 'declarations')}
                                className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg border-0 bg-transparent cursor-pointer"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: IT PROOFS */}
        {activeTab === 'IT Proofs' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <button
                onClick={() => {
                  setModalType('add-itproof');
                  setFormData({ employee_id: '', financial_year: '2026-2027', general_declared_amount: 0, hra_declared_amount: 0, lta_declared_amount: 0 });
                  setIsModalOpen(true);
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-all border-0 cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4" /> Submit Investment Proofs
              </button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-gray-100">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-bold text-xs uppercase tracking-wider border-b border-gray-100">
                    <th className="p-4">Employee</th>
                    <th className="p-4">Financial Year</th>
                    <th className="p-4">General Verified</th>
                    <th className="p-4">HRA Verified</th>
                    <th className="p-4">LTA Verified</th>
                    <th className="p-4">Documents</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-slate-700 text-sm font-medium">
                  {itProofs.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="p-8 text-center text-gray-400">No IT Proof files uploaded.</td>
                    </tr>
                  ) : (
                    itProofs.map((prf) => (
                      <tr key={prf._id} className="hover:bg-slate-50/50">
                        <td className="p-4 font-bold text-slate-900">
                          {prf.employee_id?.first_name ? `${prf.employee_id.first_name} ${prf.employee_id.last_name}` : 'Unknown Employee'}
                        </td>
                        <td className="p-4 text-slate-600">{prf.financial_year}</td>
                        <td className="p-4 text-slate-800 font-semibold">₹{(prf.general_declared_amount || 0).toLocaleString()}</td>
                        <td className="p-4 text-slate-800 font-semibold">₹{(prf.hra_declared_amount || 0).toLocaleString()}</td>
                        <td className="p-4 text-slate-800 font-semibold">₹{(prf.lta_declared_amount || 0).toLocaleString()}</td>
                        <td className="p-4 text-blue-600">
                          {prf.proof_documents?.map((d, dIdx) => (
                            <a key={dIdx} href="#" onClick={(e) => {e.preventDefault(); alert('Proof doc: ' + d)}} className="hover:underline flex items-center gap-1">
                              <FileText className="w-3.5 h-3.5" /> Receipt #{dIdx+1}
                            </a>
                          ))}
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                            prf.approval_status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                            prf.approval_status === 'Rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {prf.approval_status}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-2">
                          {prf.approval_status === 'Applied' && (
                            <>
                              <button
                                onClick={() => handleApprove(prf._id, 'it-proofs')}
                                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg border-0 bg-transparent cursor-pointer"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleReject(prf._id, 'it-proofs')}
                                className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg border-0 bg-transparent cursor-pointer"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: PREVIOUS DEDUCTIONS */}
        {activeTab === 'Previous Deductions' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <button
                onClick={() => {
                  setModalType('add-prevdeduction');
                  setFormData({ employee_id: '', financial_year: '2026-2027', previous_basic_amount: 0, previous_hra_amount: 0, previous_gross_amount: 0, previous_income_tax: 0, previous_pf_amount: 0, previous_prof_tax: 0 });
                  setIsModalOpen(true);
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-all border-0 cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4" /> Record Previous Deduction
              </button>

              <button
                onClick={() => triggerExport('previous-deductions')}
                className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-semibold text-xs transition-all bg-white cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Export Sheet
              </button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-gray-100">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-bold text-xs uppercase tracking-wider border-b border-gray-100">
                    <th className="p-4">Employee</th>
                    <th className="p-4">Financial Year</th>
                    <th className="p-4">Gross Earnings</th>
                    <th className="p-4">Basic Component</th>
                    <th className="p-4">HRA Exemption</th>
                    <th className="p-4">TDS / Income Tax</th>
                    <th className="p-4">EPF Contribution</th>
                    <th className="p-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-slate-700 text-sm font-medium">
                  {prevDeductions.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="p-8 text-center text-gray-400">No previous company salary history found.</td>
                    </tr>
                  ) : (
                    prevDeductions.map((ded) => (
                      <tr key={ded._id} className="hover:bg-slate-50/50">
                        <td className="p-4 font-bold text-slate-900">{ded.employee_name}</td>
                        <td className="p-4 text-slate-500">{ded.financial_year}</td>
                        <td className="p-4 text-slate-800 font-semibold">₹{(ded.previous_company_gross_amount || 0).toLocaleString()}</td>
                        <td className="p-4 text-slate-800 font-semibold">₹{(ded.previous_company_basic_amount || 0).toLocaleString()}</td>
                        <td className="p-4 text-slate-800 font-semibold">₹{(ded.previous_company_hra_amount || 0).toLocaleString()}</td>
                        <td className="p-4 text-rose-600 font-semibold">₹{(ded.previous_company_income_tax || 0).toLocaleString()}</td>
                        <td className="p-4 text-slate-800 font-semibold">₹{(ded.previous_company_pf_amount || 0).toLocaleString()}</td>
                        <td className="p-4">
                          <button
                            onClick={() => handleDelete(ded._id, 'previous-deductions')}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg border-0 bg-transparent cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: ADVANCE SALARY */}
        {activeTab === 'Advance Salary' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <button
                onClick={() => {
                  setModalType('add-advance');
                  setFormData({ employee_id: '', advance_date: new Date().toISOString().split('T')[0], advance_amount: 0, recovery_cycle: 1, recovery_from: '2026-06', recovery_mode: 'Installments' });
                  setIsModalOpen(true);
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-all border-0 cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4" /> Request Advance Salary
              </button>

              <button
                onClick={() => triggerExport('advance-salaries')}
                className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-semibold text-xs transition-all bg-white cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Export Adv Sheet
              </button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-gray-100">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-bold text-xs uppercase tracking-wider border-b border-gray-100">
                    <th className="p-4">Advance Number</th>
                    <th className="p-4">Employee</th>
                    <th className="p-4">Advance Date</th>
                    <th className="p-4">Advance Amount</th>
                    <th className="p-4">Recovery Start</th>
                    <th className="p-4">Mode</th>
                    <th className="p-4">Installment Count</th>
                    <th className="p-4">Monthly Recovery</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-slate-700 text-sm font-medium">
                  {advSalaries.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="p-8 text-center text-gray-400">No advance salary claims requested.</td>
                    </tr>
                  ) : (
                    advSalaries.map((adv) => (
                      <tr key={adv._id} className="hover:bg-slate-50/50">
                        <td className="p-4 font-mono font-bold text-slate-800">{adv.advance_salary_number}</td>
                        <td className="p-4">
                          <div className="font-bold text-slate-900">{adv.employee_name}</div>
                          <div className="text-xs text-slate-400">{adv.employee_code}</div>
                        </td>
                        <td className="p-4 text-slate-500">{new Date(adv.advance_date).toLocaleDateString()}</td>
                        <td className="p-4 font-semibold text-slate-800">₹{adv.advance_amount?.toLocaleString()}</td>
                        <td className="p-4 text-slate-600">{adv.recovery_from}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 text-xs font-bold rounded-lg ${
                            adv.recovery_mode === 'Lumpsum' ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'
                          }`}>
                            {adv.recovery_mode}
                          </span>
                        </td>
                        <td className="p-4 text-center">{adv.number_of_installments}</td>
                        <td className="p-4 text-slate-950 font-bold">₹{adv.installment_amount?.toLocaleString()} / mo</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 6: GENERATE PAYROLL */}
        {activeTab === 'Generate Payroll' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setModalType('add-payroll');
                    setFormData({ salary_month: '2026-05', payroll_type: 'Monthly' });
                    setIsModalOpen(true);
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-all border-0 cursor-pointer shadow-sm shadow-blue-200"
                >
                  <Sliders className="w-4 h-4 animate-spin" /> Run Payroll Generation
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => alert('Print command triggered for full register.')}
                  className="flex items-center gap-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-xl font-semibold text-xs bg-white hover:bg-gray-50 transition-all cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Sheet
                </button>
              </div>
            </div>

            {/* Payroll History */}
            <div className="overflow-x-auto rounded-2xl border border-gray-100">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-bold text-xs uppercase tracking-wider border-b border-gray-100">
                    <th className="p-4">Payroll ID</th>
                    <th className="p-4">Month</th>
                    <th className="p-4">Run Date</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Total Net Payout</th>
                    <th className="p-4">Employees</th>
                    <th className="p-4">Approval Status</th>
                    <th className="p-4">Disbursal Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-slate-700 text-sm font-medium">
                  {payrolls.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="p-8 text-center text-gray-400">No payroll cycles run yet.</td>
                    </tr>
                  ) : (
                    payrolls.map((pay) => (
                      <tr key={pay._id} className="hover:bg-slate-50/50">
                        <td className="p-4 font-mono font-bold text-slate-900">{pay.payroll_number}</td>
                        <td className="p-4 text-slate-950 font-bold">{pay.salary_month}</td>
                        <td className="p-4 text-slate-500">{new Date(pay.payroll_date).toLocaleDateString()}</td>
                        <td className="p-4">{pay.payroll_type}</td>
                        <td className="p-4 text-blue-600 font-extrabold">₹{pay.total_salary?.toLocaleString()}</td>
                        <td className="p-4 text-slate-500">{pay.employees?.length || 0} active</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                            pay.approval_status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                            pay.approval_status === 'Pending' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {pay.approval_status}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 text-xs font-bold rounded-lg ${
                            pay.payroll_status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                          }`}>
                            {pay.payroll_status}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-2">
                          {pay.approval_status === 'Draft' && (
                            <button
                              onClick={async () => {
                                try {
                                  await api.post('/payrolls/submit-approval', { id: pay._id });
                                  showToast('success', 'Submitted for review.');
                                  fetchData();
                                } catch (e) {
                                  showToast('error', 'Submission failed.');
                                }
                              }}
                              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold text-xs border-0 cursor-pointer"
                            >
                              Submit Review
                            </button>
                          )}
                          {pay.approval_status === 'Pending' && (
                            <button
                              onClick={() => handleApprovePayroll(pay._id)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs border-0 cursor-pointer animate-pulse"
                            >
                              Disburse Payout
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 7: FINAL SETTLEMENTS */}
        {activeTab === 'Final Settlements' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <button
                onClick={() => {
                  setModalType('add-settlement');
                  setFormData({ employee_id: '', settlement_date: new Date().toISOString().split('T')[0], month: '2026-05', settlement_amount: 0, payment_status: 'Pending', template: 'Standard' });
                  setIsModalOpen(true);
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-all border-0 cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4" /> Calculate Full & Final Settlement
              </button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-gray-100">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-bold text-xs uppercase tracking-wider border-b border-gray-100">
                    <th className="p-4">Settlement ID</th>
                    <th className="p-4">Employee</th>
                    <th className="p-4">Settlement Date</th>
                    <th className="p-4">Month</th>
                    <th className="p-4">Settlement Net Amount</th>
                    <th className="p-4">Payment Status</th>
                    <th className="p-4">Template Used</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-slate-700 text-sm font-medium">
                  {settlements.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-gray-400">No resignation full settlements parsed.</td>
                    </tr>
                  ) : (
                    settlements.map((setl) => (
                      <tr key={setl._id} className="hover:bg-slate-50/50">
                        <td className="p-4 font-mono font-bold text-slate-700">{setl.settlement_number}</td>
                        <td className="p-4">
                          <div className="font-bold text-slate-900">{setl.employee_name}</div>
                          <div className="text-xs text-slate-400">{setl.employee_code}</div>
                        </td>
                        <td className="p-4 text-slate-500">{new Date(setl.settlement_date).toLocaleDateString()}</td>
                        <td className="p-4">{setl.month}</td>
                        <td className="p-4 text-blue-700 font-bold">₹{setl.settlement_amount?.toLocaleString()}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                            setl.payment_status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {setl.payment_status}
                          </span>
                        </td>
                        <td className="p-4 text-slate-500">{setl.template}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 8: PAYSLIPS */}
        {activeTab === 'Payslips' && (
          <div className="space-y-6">
            <div className="overflow-x-auto rounded-2xl border border-gray-100">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-bold text-xs uppercase tracking-wider border-b border-gray-100">
                    <th className="p-4">Employee</th>
                    <th className="p-4">Salary Month</th>
                    <th className="p-4">Gross Earnings</th>
                    <th className="p-4">Net Payout</th>
                    <th className="p-4">Working Days</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-slate-700 text-sm font-medium">
                  {payslips.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-gray-400">Generate payroll cycle first to construct monthly payslips.</td>
                    </tr>
                  ) : (
                    payslips.map((slip) => (
                      <tr key={slip._id} className="hover:bg-slate-50/50">
                        <td className="p-4">
                          <div className="font-bold text-slate-900">{slip.employee_name}</div>
                          <div className="text-xs text-slate-400">{slip.employee_code}</div>
                        </td>
                        <td className="p-4 font-bold text-slate-700">{slip.salary_month}</td>
                        <td className="p-4">₹{slip.gross_amount?.toLocaleString()}</td>
                        <td className="p-4 font-bold text-slate-900">₹{slip.net_amount?.toLocaleString()}</td>
                        <td className="p-4">{slip.working_days} days</td>
                        <td className="p-4 text-right">
                          <button
                            onClick={async () => {
                              try {
                                const dRes = await api.get(`/payslips/download/${slip._id}`);
                                window.open(dRes.data.pdfUrl, '_blank');
                                showToast('success', 'Downloading payslip PDF template.');
                              } catch (e) {
                                showToast('error', 'Download failed.');
                              }
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-250 text-gray-800 rounded-lg font-bold text-xs border-0 cursor-pointer ml-auto"
                          >
                            <Download className="w-3.5 h-3.5" /> PDF Slips
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 9: SALARY REVISIONS */}
        {activeTab === 'Salary Revisions' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <button
                onClick={() => {
                  setModalType('add-revision');
                  setFormData({ employee_id: '', revision_type: 'Increment', revision_reason: '', adjustment_type: 'Flat', amount: 0, payout_from: '2026-06', calculation_type: 'Manual', notes: '' });
                  setIsModalOpen(true);
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-all border-0 cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4" /> Create Salary Revision
              </button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-gray-100">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-bold text-xs uppercase tracking-wider border-b border-gray-100">
                    <th className="p-4">Employee</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Adjustment Amount</th>
                    <th className="p-4">Old CTC / mo</th>
                    <th className="p-4">New CTC / mo</th>
                    <th className="p-4">Effective Date</th>
                    <th className="p-4">Workflow Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-slate-700 text-sm font-medium">
                  {revisions.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="p-8 text-center text-gray-400">No revisions registered.</td>
                    </tr>
                  ) : (
                    revisions.map((rev) => (
                      <tr key={rev._id} className="hover:bg-slate-50/50">
                        <td className="p-4">
                          <div className="font-bold text-slate-900">{rev.employee_name}</div>
                          <div className="text-xs text-slate-400">{rev.employee_code}</div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 text-xs font-bold rounded-lg ${
                            rev.revision_type === 'Increment' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {rev.revision_type}
                          </span>
                        </td>
                        <td className="p-4 font-bold text-slate-800">₹{rev.amount?.toLocaleString()}</td>
                        <td className="p-4 text-slate-500">₹{rev.old_salary_per_month?.toLocaleString()}</td>
                        <td className="p-4 text-blue-900 font-bold">₹{rev.new_salary_per_month?.toLocaleString()}</td>
                        <td className="p-4 text-slate-600">{rev.payout_from}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                            rev.approval_status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                            rev.approval_status === 'Rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {rev.approval_status}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-2">
                          {rev.approval_status === 'Applied' && (
                            <>
                              <button
                                onClick={() => handleApprove(rev._id, 'salary-revisions')}
                                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg border-0 bg-transparent cursor-pointer"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleReject(rev._id, 'salary-revisions')}
                                className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg border-0 bg-transparent cursor-pointer"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDelete(rev._id, 'salary-revisions')}
                            className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg border-0 bg-transparent cursor-pointer"
                          >
                            <Trash2 className="w-4.5 h-4.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Stepper Navigation Buttons */}
        <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
          {PAYROLL_TABS.findIndex(t => t.id === activeTab) > 0 ? (
            <button
              onClick={() => {
                const idx = PAYROLL_TABS.findIndex(t => t.id === activeTab);
                setSearchParams({ tab: PAYROLL_TABS[idx - 1].id });
              }}
              className="flex items-center gap-2 px-4 py-2 border border-gray-250 text-gray-700 rounded-xl font-bold text-xs bg-white hover:bg-gray-50 hover:text-gray-900 transition-all cursor-pointer"
            >
              ← Previous Step: {PAYROLL_TABS[PAYROLL_TABS.findIndex(t => t.id === activeTab) - 1].label}
            </button>
          ) : (
            <div />
          )}

          {PAYROLL_TABS.findIndex(t => t.id === activeTab) < PAYROLL_TABS.length - 1 ? (
            <button
              onClick={() => {
                const idx = PAYROLL_TABS.findIndex(t => t.id === activeTab);
                setSearchParams({ tab: PAYROLL_TABS[idx + 1].id });
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-blue-700 transition-all cursor-pointer shadow-sm"
            >
              Next Step: {PAYROLL_TABS[PAYROLL_TABS.findIndex(t => t.id === activeTab) + 1].label} →
            </button>
          ) : (
            <div />
          )}
        </div>

      </div>

      {/* POPUP MODALS FOR VARIOUS TAB OPERATIONS */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-xl p-6 md:p-8 shadow-2xl relative text-left">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 border-0 bg-transparent cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl md:text-2xl font-black text-slate-800 mb-6">
              {modalType === 'add-regime' && 'Declare New Tax Regime'}
              {modalType === 'bulk-regime' && 'Bulk Regime Assignment'}
              {modalType === 'add-declaration' && 'Submit Tax Declaration'}
              {modalType === 'add-itproof' && 'Upload IT Investment Proof'}
              {modalType === 'add-prevdeduction' && 'Record Previous Employer Deductions'}
              {modalType === 'add-advance' && 'Request Advance Salary Repayment Cycle'}
              {modalType === 'add-payroll' && 'Run Monthly Payroll Run calculation'}
              {modalType === 'add-settlement' && 'Calculate Resigning Settlement Payout'}
              {modalType === 'add-revision' && 'Log Employee Salary Revision Increment'}
              {modalType === 'add-tax-slab' && 'Create Custom Tax Slab Set'}
              {modalType === 'edit-tax-slab' && 'Edit Custom Tax Slab Set'}
            </h2>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              
              {/* Employee Selection (Common field) */}
              {modalType !== 'add-payroll' && modalType !== 'add-tax-slab' && modalType !== 'edit-tax-slab' && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Select Employee</label>
                  <select
                    required
                    value={formData.employee_id || ''}
                    onChange={(e) => {
                      const empId = e.target.value;
                      let updated = { ...formData, employee_id: empId };
                      if (modalType === 'add-settlement') {
                        const struct = salaryStructures.find(s => (s.employee_id?._id === empId || s.employee_id === empId));
                        const gross = struct ? (struct.gross_salary || 25000) : 25000;
                        const template = formData.template || 'Standard';
                        updated.settlement_amount = template === 'Standard' ? gross * 1.5 : gross;
                      }
                      setFormData(updated);
                    }}
                    className="w-full p-3 rounded-xl border border-gray-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Choose Employee --</option>
                    {employees.map(emp => (
                      <option key={emp._id} value={emp._id}>
                        {emp.first_name} {emp.last_name} ({emp.employee_code})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Specific Modal Inputs */}
              {(modalType === 'add-regime' || modalType === 'bulk-regime') && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Select Tax Regime</label>
                  <select
                    value={formData.new_regime || 'New Regime'}
                    onChange={(e) => setFormData({ ...formData, new_regime: e.target.value })}
                    className="w-full p-3 rounded-xl border border-gray-200 text-sm font-semibold focus:outline-none focus:ring-2"
                  >
                    <option value="New Regime">New Regime (Default 115BAC)</option>
                    <option value="Old Regime">Old Regime (Exemptions applicable)</option>
                  </select>
                </div>
              )}

              {modalType === 'add-declaration' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Financial Year</label>
                    <input
                      type="text"
                      required
                      value={formData.financial_year || '2026-2027'}
                      onChange={(e) => setFormData({ ...formData, financial_year: e.target.value })}
                      className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">General Amount (Sec 80C) (₹)</label>
                    <input
                      type="number"
                      required
                      value={formData.general_declared_amount || 0}
                      onChange={(e) => setFormData({ ...formData, general_declared_amount: Number(e.target.value) })}
                      className="w-full p-3 rounded-xl border border-gray-200 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">HRA Declared Amount (₹)</label>
                    <input
                      type="number"
                      required
                      value={formData.hra_declared_amount || 0}
                      onChange={(e) => setFormData({ ...formData, hra_declared_amount: Number(e.target.value) })}
                      className="w-full p-3 rounded-xl border border-gray-200 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">LTA Declared Amount (₹)</label>
                    <input
                      type="number"
                      required
                      value={formData.lta_declared_amount || 0}
                      onChange={(e) => setFormData({ ...formData, lta_declared_amount: Number(e.target.value) })}
                      className="w-full p-3 rounded-xl border border-gray-200 text-sm hover:border-gray-300"
                    />
                  </div>
                </div>
              )}

              {modalType === 'add-itproof' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Financial Year</label>
                    <input
                      type="text"
                      required
                      value={formData.financial_year || '2026-2027'}
                      onChange={(e) => setFormData({ ...formData, financial_year: e.target.value })}
                      className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Sec 80C Receipts Amount (₹)</label>
                    <input
                      type="number"
                      required
                      value={formData.general_declared_amount || 0}
                      onChange={(e) => setFormData({ ...formData, general_declared_amount: Number(e.target.value) })}
                      className="w-full p-3 rounded-xl border border-gray-200 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Rent Receipts HRA Amount (₹)</label>
                    <input
                      type="number"
                      required
                      value={formData.hra_declared_amount || 0}
                      onChange={(e) => setFormData({ ...formData, hra_declared_amount: Number(e.target.value) })}
                      className="w-full p-3 rounded-xl border border-gray-200 text-sm"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Upload Files (Bills, receipts)</label>
                    <input
                      type="file"
                      className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs"
                      onChange={() => showToast('success', 'File pre-uploaded to memory cache.')}
                    />
                  </div>
                </div>
              )}

              {modalType === 'add-prevdeduction' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Financial Year</label>
                    <input
                      type="text"
                      required
                      value={formData.financial_year || '2026-2027'}
                      onChange={(e) => setFormData({ ...formData, financial_year: e.target.value })}
                      className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Previous Gross Salary (₹)</label>
                    <input
                      type="number"
                      required
                      value={formData.previous_gross_amount || 0}
                      onChange={(e) => setFormData({ ...formData, previous_gross_amount: Number(e.target.value) })}
                      className="w-full p-3 rounded-xl border border-gray-200 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Previous Basic Salary (₹)</label>
                    <input
                      type="number"
                      required
                      value={formData.previous_basic_amount || 0}
                      onChange={(e) => setFormData({ ...formData, previous_basic_amount: Number(e.target.value) })}
                      className="w-full p-3 rounded-xl border border-gray-200 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Previous HRA Amount (₹)</label>
                    <input
                      type="number"
                      required
                      value={formData.previous_hra_amount || 0}
                      onChange={(e) => setFormData({ ...formData, previous_hra_amount: Number(e.target.value) })}
                      className="w-full p-3 rounded-xl border border-gray-200 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">TDS / Income Tax Deducted (₹)</label>
                    <input
                      type="number"
                      required
                      value={formData.previous_income_tax || 0}
                      onChange={(e) => setFormData({ ...formData, previous_income_tax: Number(e.target.value) })}
                      className="w-full p-3 rounded-xl border border-gray-200 text-sm text-red-600 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">EPF Deduction Amount (₹)</label>
                    <input
                      type="number"
                      required
                      value={formData.previous_pf_amount || 0}
                      onChange={(e) => setFormData({ ...formData, previous_pf_amount: Number(e.target.value) })}
                      className="w-full p-3 rounded-xl border border-gray-200 text-sm"
                    />
                  </div>
                </div>
              )}

              {modalType === 'add-advance' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Advance Amount (₹)</label>
                    <input
                      type="number"
                      required
                      value={formData.advance_amount || 0}
                      onChange={(e) => setFormData({ ...formData, advance_amount: Number(e.target.value) })}
                      className="w-full p-3 rounded-xl border border-gray-200 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Recovery Month</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 2026-06"
                      value={formData.recovery_from || ''}
                      onChange={(e) => setFormData({ ...formData, recovery_from: e.target.value })}
                      className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Recovery Mode</label>
                    <select
                      value={formData.recovery_mode || 'Installments'}
                      onChange={(e) => setFormData({ ...formData, recovery_mode: e.target.value })}
                      className="w-full p-3 rounded-xl border border-gray-200 text-sm font-semibold"
                    >
                      <option value="Installments">Installments</option>
                      <option value="Lumpsum">Lumpsum (One shot recovery)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Recovery Cycles (Months)</label>
                    <input
                      type="number"
                      required
                      disabled={formData.recovery_mode === 'Lumpsum'}
                      value={formData.recovery_mode === 'Lumpsum' ? 1 : formData.recovery_cycle || 1}
                      onChange={(e) => setFormData({ ...formData, recovery_cycle: Number(e.target.value) })}
                      className="w-full p-3 rounded-xl border border-gray-200 text-sm disabled:bg-gray-50"
                    />
                  </div>
                </div>
              )}

              {modalType === 'add-payroll' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Salary Month</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 2026-05"
                      value={formData.salary_month || ''}
                      onChange={(e) => setFormData({ ...formData, salary_month: e.target.value })}
                      className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Payroll Model Type</label>
                    <select
                      value={formData.payroll_type || 'Monthly'}
                      onChange={(e) => setFormData({ ...formData, payroll_type: e.target.value })}
                      className="w-full p-3 rounded-xl border border-gray-200 text-sm font-semibold"
                    >
                      <option value="Monthly">Monthly Salary Schedule</option>
                      <option value="Hourly">Hourly Freelancer Schedule</option>
                    </select>
                  </div>
                </div>
              )}

              {modalType === 'add-settlement' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Settlement Month</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 2026-05"
                      value={formData.month || ''}
                      onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                      className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Net Settlement Amount (₹)</label>
                    <input
                      type="number"
                      required
                      value={formData.settlement_amount || 0}
                      onChange={(e) => setFormData({ ...formData, settlement_amount: Number(e.target.value) })}
                      className="w-full p-3 rounded-xl border border-gray-200 text-sm"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Gratuity and Leave Template</label>
                    <select
                      value={formData.template || 'Standard'}
                      onChange={(e) => {
                        const templateVal = e.target.value;
                        let updated = { ...formData, template: templateVal };
                        if (modalType === 'add-settlement') {
                          const struct = salaryStructures.find(s => (s.employee_id?._id === formData.employee_id || s.employee_id === formData.employee_id));
                          const gross = struct ? (struct.gross_salary || 25000) : 25000;
                          updated.settlement_amount = templateVal === 'Standard' ? gross * 1.5 : gross;
                        }
                        setFormData(updated);
                      }}
                      className="w-full p-3 rounded-xl border border-gray-200 text-sm font-semibold"
                    >
                      <option value="Standard">Standard (Notice period adjust)</option>
                      <option value="Immediate Release">Immediate Release (No notice recovery)</option>
                    </select>
                  </div>
                </div>
              )}

              {modalType === 'add-revision' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Revision Type</label>
                    <select
                      value={formData.revision_type || 'Increment'}
                      onChange={(e) => setFormData({ ...formData, revision_type: e.target.value })}
                      className="w-full p-3 rounded-xl border border-gray-200 text-sm font-semibold"
                    >
                      <option value="Increment">Increment (+ CTC)</option>
                      <option value="Decrement">Decrement (- CTC)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Adjustment Amount (₹/mo)</label>
                    <input
                      type="number"
                      required
                      value={formData.amount || 0}
                      onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                      className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Effective Salary Month</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 2026-06"
                      value={formData.payout_from || ''}
                      onChange={(e) => setFormData({ ...formData, payout_from: e.target.value })}
                      className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Revision Reason</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Annual Appraisal / Promotion"
                      value={formData.revision_reason || ''}
                      onChange={(e) => setFormData({ ...formData, revision_reason: e.target.value })}
                      className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {(modalType === 'add-tax-slab' || modalType === 'edit-tax-slab') && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Tax Regime Type</label>
                      <select
                        value={formData.regime_type || 'New Regime'}
                        onChange={(e) => setFormData({ ...formData, regime_type: e.target.value })}
                        className="w-full p-3 rounded-xl border border-gray-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="New Regime">New Regime</option>
                        <option value="Old Regime">Old Regime</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Age Group</label>
                      <select
                        value={formData.age_group || 'Below 60'}
                        onChange={(e) => setFormData({ ...formData, age_group: e.target.value })}
                        className="w-full p-3 rounded-xl border border-gray-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Below 60">Below 60</option>
                        <option value="60 to 80">60 to 80 (Senior Citizen)</option>
                        <option value="Above 80">Above 80 (Super Senior Citizen)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">Slab Entry Ranges</label>
                      <button
                        type="button"
                        onClick={() => {
                          const currentSlabs = [...(formData.slabs || [])];
                          currentSlabs.push({ income_slab_name: '', from_amount: 0, to_amount: 99999999, tax_percentage: 0 });
                          setFormData({ ...formData, slabs: currentSlabs });
                        }}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg border-0 cursor-pointer flex items-center gap-1 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Slab Row
                      </button>
                    </div>

                    <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                      {(formData.slabs || []).map((slab, sIdx) => (
                        <div key={sIdx} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end bg-slate-50 p-3 rounded-xl border border-slate-100 relative group">
                          <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Slab Name</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. 3L to 6L"
                              value={slab.income_slab_name || ''}
                              onChange={(e) => {
                                const currentSlabs = [...(formData.slabs || [])];
                                currentSlabs[sIdx].income_slab_name = e.target.value;
                                setFormData({ ...formData, slabs: currentSlabs });
                              }}
                              className="w-full p-2 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Min (₹)</label>
                            <input
                              type="number"
                              required
                              placeholder="0"
                              value={slab.from_amount === 0 ? 0 : slab.from_amount || ''}
                              onChange={(e) => {
                                const currentSlabs = [...(formData.slabs || [])];
                                currentSlabs[sIdx].from_amount = Number(e.target.value);
                                setFormData({ ...formData, slabs: currentSlabs });
                              }}
                              className="w-full p-2 rounded-lg border border-gray-250 text-xs focus:outline-none bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Max (₹)</label>
                            <input
                              type="number"
                              required
                              placeholder="300000"
                              value={slab.to_amount === 0 ? 0 : slab.to_amount || ''}
                              onChange={(e) => {
                                const currentSlabs = [...(formData.slabs || [])];
                                currentSlabs[sIdx].to_amount = Number(e.target.value);
                                setFormData({ ...formData, slabs: currentSlabs });
                              }}
                              className="w-full p-2 rounded-lg border border-gray-250 text-xs focus:outline-none bg-white"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1">
                              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Tax (%)</label>
                              <input
                                type="number"
                                required
                                placeholder="5"
                                value={slab.tax_percentage === 0 ? 0 : slab.tax_percentage || ''}
                                onChange={(e) => {
                                  const currentSlabs = [...(formData.slabs || [])];
                                  currentSlabs[sIdx].tax_percentage = Number(e.target.value);
                                  setFormData({ ...formData, slabs: currentSlabs });
                                }}
                                className="w-full p-2 rounded-lg border border-gray-250 text-xs focus:outline-none bg-white"
                              />
                            </div>
                            {formData.slabs.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const currentSlabs = (formData.slabs || []).filter((_, i) => i !== sIdx);
                                  setFormData({ ...formData, slabs: currentSlabs });
                                }}
                                className="p-2 text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg border-0 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-semibold text-sm border-0 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm border-0 cursor-pointer shadow-sm shadow-blue-250"
                >
                  Confirm Submission
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Payroll;
