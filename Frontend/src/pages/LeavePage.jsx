import { useState, useEffect, useCallback } from 'react';
import { 
  Search, Plus, Check, X, Download, Upload, Trash, Eye, 
  Calendar, AlertCircle, RefreshCw, CheckCircle, XCircle, Clock, 
  Settings, Database, Award, DollarSign, Edit, Save, FileSpreadsheet, CheckSquare
} from 'lucide-react';
import api from '../utils/api';

const STATUS_COLORS = {
  Applied: 'bg-amber-50 text-amber-700 border-amber-100',
  'Under Check': 'bg-blue-50 text-blue-700 border-blue-100',
  Approved: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  Rejected: 'bg-rose-50 text-rose-700 border-rose-100'
};

const LeavePage = () => {
  const [activeTab, setActiveTab] = useState('approve-leave'); // 'approve-leave', 'leave-balance', 'leave-encashment'
  
  // Base master data
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [leaveSettings, setLeaveSettings] = useState({ attendance_mode: 'Device Attendance' });

  // 1. Approve Leave states
  const [leaves, setLeaves] = useState([]);
  const [leavesTotal, setLeavesTotal] = useState(0);
  const [leavesLoading, setLeavesLoading] = useState(false);
  const [leavesPage, setLeavesPage] = useState(1);
  const [leavesSearch, setLeavesSearch] = useState('');
  const [leavesStatusFilter, setLeavesStatusFilter] = useState('');
  
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [applyForm, setApplyForm] = useState({
    employee_id: '',
    leave_type: 'casual_leave',
    from_date: new Date().toISOString().slice(0, 10),
    to_date: new Date().toISOString().slice(0, 10),
    leave_session: 'Full Day',
    reason: ''
  });
  const [applyError, setApplyError] = useState('');

  // 2. Leave Balance states
  const [balances, setBalances] = useState([]);
  const [balancesLoading, setBalancesLoading] = useState(false);
  const [balancesSearch, setBalancesSearch] = useState('');
  const [selectedFinancialYear, setSelectedFinancialYear] = useState('2026-2027');
  
  // Opening Balance Modal states
  const [isOpeningModalOpen, setIsOpeningModalOpen] = useState(false);
  const [openingBalances, setOpeningBalances] = useState([]); // [{employee_id, casual, sick, marriage}]

  // Individual Balance Edit states
  const [isEditBalanceOpen, setIsEditBalanceOpen] = useState(false);
  const [editBalanceForm, setEditBalanceForm] = useState({
    id: '',
    employee_name: '',
    casual_leave: 0,
    sick_leave: 0,
    marriage_leave: 0,
    remarks: ''
  });

  // Import Modal states
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [importPreview, setImportPreview] = useState([]);
  const [importStatusMsg, setImportStatusMsg] = useState('');

  // 3. Leave Encashment states
  const [encashments, setEncashments] = useState([]);
  const [encashmentsLoading, setEncashmentsLoading] = useState(false);
  const [encashmentsSearch, setEncashmentsSearch] = useState('');
  const [encashmentsPage, setEncashmentsPage] = useState(1);

  // Settings & Mappings
  const [encSettings, setEncSettings] = useState({
    prefix: 'ENC-',
    initial: 1,
    per_day_wages_type: 'Month Days',
    custom_days: 30
  });
  const [isEncSettingsOpen, setIsEncSettingsOpen] = useState(false);

  const [mappings, setMappings] = useState([]);
  const [isMappingModalOpen, setIsMappingModalOpen] = useState(false);
  const [mappingForm, setMappingForm] = useState({
    component_group: 'A',
    leave_type: 'casual_leave',
    component_type: 'Gross Salary',
    payroll_components: ['Basic', 'HRA']
  });

  // Encashment Run Wizard states
  const [isRunWizardOpen, setIsRunWizardOpen] = useState(false);
  const [wizardForm, setWizardForm] = useState({
    financial_year: '2026-2027',
    encashment_month: 'May 2026',
    component_group: 'A',
    leave_type: 'casual_leave',
    include_in_payroll: true,
    department: '',
    designation: '',
    employee_category: ''
  });
  const [wizardEmployees, setWizardEmployees] = useState([]);
  const [wizardLoading, setWizardLoading] = useState(false);

  // Global settings modal
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Base bootstrap data
  const bootstrapData = async () => {
    try {
      const [empRes, depRes, desRes, catRes, setRes] = await Promise.all([
        api.get('/employees'),
        api.get('/departments').catch(() => ({ data: { data: [] } })),
        api.get('/designations').catch(() => ({ data: { data: [] } })),
        api.get('/lookup/EmployeeCategory').catch(() => ({ data: { data: [] } })),
        api.get('/leave-settings').catch(() => ({ data: { data: { attendance_mode: 'Device Attendance' } } }))
      ]);

      setEmployees(empRes.data.data || []);
      setDepartments(depRes.data.data || []);
      setDesignations(desRes.data.data || []);
      setCategories(catRes.data.data || []);
      if (setRes.data && setRes.data.data) {
        setLeaveSettings(setRes.data.data);
      }
    } catch (error) {
      console.error('Error bootstrapping master data:', error);
    }
  };

  useEffect(() => {
    bootstrapData();
  }, []);

  // Fetch Leaves
  const fetchLeaves = useCallback(async () => {
    setLeavesLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', leavesPage);
      params.set('limit', 10);
      if (leavesSearch) params.set('search', leavesSearch);
      if (leavesStatusFilter) params.set('approval_status', leavesStatusFilter);

      const res = await api.get(`/leaves?${params.toString()}`);
      setLeaves(res.data.data || []);
      setLeavesTotal(res.data.total || 0);
    } catch (error) {
      console.error('Error fetching leaves:', error);
    } finally {
      setLeavesLoading(false);
    }
  }, [leavesPage, leavesSearch, leavesStatusFilter]);

  // Fetch Balances
  const fetchBalances = useCallback(async () => {
    setBalancesLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('year', selectedFinancialYear);
      if (balancesSearch) params.set('search', balancesSearch);

      const res = await api.get(`/leave-balances?${params.toString()}`);
      setBalances(res.data.data || []);
    } catch (error) {
      console.error('Error fetching balances:', error);
    } finally {
      setBalancesLoading(false);
    }
  }, [selectedFinancialYear, balancesSearch]);

  // Fetch Encashments & mappings
  const fetchEncashments = useCallback(async () => {
    setEncashmentsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', encashmentsPage);
      params.set('limit', 10);
      if (encashmentsSearch) params.set('search', encashmentsSearch);

      const [encRes, setRes, mapRes] = await Promise.all([
        api.get(`/leave-encashments?${params.toString()}`),
        api.get('/leave-encashments/settings').catch(() => ({ data: { data: {} } })),
        api.get('/leave-encashments/component-mappings').catch(() => ({ data: { data: [] } }))
      ]);

      setEncashments(encRes.data.data || []);
      if (setRes.data && setRes.data.data) {
        setEncSettings(setRes.data.data);
      }
      setMappings(mapRes.data.data || []);
    } catch (error) {
      console.error('Error fetching encashments:', error);
    } finally {
      setEncashmentsLoading(false);
    }
  }, [encashmentsPage, encashmentsSearch]);

  // Effect depending on active tab
  useEffect(() => {
    if (activeTab === 'approve-leave') {
      fetchLeaves();
    } else if (activeTab === 'leave-balance') {
      fetchBalances();
    } else if (activeTab === 'leave-encashment') {
      fetchEncashments();
    }
  }, [activeTab, fetchLeaves, fetchBalances, fetchEncashments]);

  // Handle global settings change
  const handleToggleSettings = async (mode) => {
    try {
      const res = await api.post('/leave-settings', { attendance_mode: mode });
      setLeaveSettings(res.data.data);
      triggerToast(`Attendance Mode switched to ${mode}`);
    } catch (error) {
      alert(error.response?.data?.message || error.message);
    }
  };

  // ==========================================
  // APPROVE LEAVE ACTIONS
  // ==========================================
  const handleApplyLeave = async (e) => {
    e.preventDefault();
    setApplyError('');
    try {
      await api.post('/leaves', applyForm);
      triggerToast('Leave application submitted successfully.');
      setIsApplyModalOpen(false);
      fetchLeaves();
    } catch (err) {
      setApplyError(err.response?.data?.message || err.message);
    }
  };

  const handleStatusChange = async (id, status, remarksText = '') => {
    let endpoint = '';
    if (status === 'Approved') endpoint = `/leaves/approve/${id}`;
    else if (status === 'Rejected') endpoint = `/leaves/reject/${id}`;
    else if (status === 'Under Check') endpoint = `/leaves/under-check/${id}`;

    try {
      await api.post(endpoint, { remarks: remarksText });
      triggerToast(`Leave request updated to ${status}.`);
      fetchLeaves();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleDeleteLeave = async (id) => {
    if (!confirm('Are you sure you want to delete this leave request?')) return;
    try {
      await api.delete(`/leaves/${id}`);
      triggerToast('Leave request deleted.');
      fetchLeaves();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  // ==========================================
  // LEAVE BALANCE ACTIONS
  // ==========================================
  const openOpeningBalanceModal = () => {
    // Populate opening balance array with existing or empty fields for all employees
    const list = employees.map(emp => {
      const current = balances.find(b => b.employee_id?._id === emp._id || b.employee_id === emp._id);
      return {
        employee_id: emp._id,
        employee_code: emp.employee_code,
        employee_name: `${emp.first_name} ${emp.last_name}`,
        casual_leave: current ? current.casual_leave : 12,
        sick_leave: current ? current.sick_leave : 10,
        marriage_leave: current ? current.marriage_leave : 15
      };
    });
    setOpeningBalances(list);
    setIsOpeningModalOpen(true);
  };

  const handleSaveOpeningBalances = async () => {
    try {
      await api.post('/leave-balances/opening', {
        financial_year: selectedFinancialYear,
        employees: openingBalances
      });
      triggerToast('Opening balances configured successfully.');
      setIsOpeningModalOpen(false);
      fetchBalances();
    } catch (error) {
      alert(error.response?.data?.message || error.message);
    }
  };

  const handleEditBalance = (b) => {
    setEditBalanceForm({
      id: b._id,
      employee_name: b.employee_name,
      casual_leave: b.casual_leave,
      sick_leave: b.sick_leave,
      marriage_leave: b.marriage_leave,
      remarks: ''
    });
    setIsEditBalanceOpen(true);
  };

  const handleSaveIndividualBalance = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/leave-balances/${editBalanceForm.id}`, editBalanceForm);
      triggerToast('Employee leave balance updated successfully.');
      setIsEditBalanceOpen(false);
      fetchBalances();
    } catch (error) {
      alert(error.response?.data?.message || error.message);
    }
  };

  // CSV Parsing helper
  const handleParseCSV = () => {
    if (!csvText.trim()) {
      setImportPreview([]);
      setImportStatusMsg('Please enter or paste CSV text first.');
      return;
    }
    const lines = csvText.trim().split('\n');
    const preview = [];
    let count = 0;
    
    // Column header verification
    // Expected: employee_code,casual_leave,sick_leave,marriage_leave
    lines.forEach((line, idx) => {
      const parts = line.split(',').map(p => p.trim());
      if (idx === 0) return; // skip header
      if (parts.length >= 4) {
        preview.push({
          employee_code: parts[0],
          casual_leave: Number(parts[1]) || 0,
          sick_leave: Number(parts[2]) || 0,
          marriage_leave: Number(parts[3]) || 0
        });
        count++;
      }
    });

    setImportPreview(preview);
    setImportStatusMsg(`Successfully parsed ${count} rows. Ready for import.`);
  };

  const handleImportSubmit = async () => {
    if (importPreview.length === 0) return;
    try {
      const res = await api.post('/leave-balances/import', {
        financial_year: selectedFinancialYear,
        balances: importPreview
      });
      triggerToast(`Imported ${res.data.data.length} records successfully.`);
      if (res.data.errors && res.data.errors.length > 0) {
        alert('Warning: Some rows failed:\n' + res.data.errors.join('\n'));
      }
      setIsImportModalOpen(false);
      setCsvText('');
      setImportPreview([]);
      fetchBalances();
    } catch (error) {
      alert(error.response?.data?.message || error.message);
    }
  };

  const handleExportBalances = async () => {
    try {
      const res = await api.post('/leave-balances/export');
      window.open(res.data.url, '_blank');
      triggerToast('Spreadsheet download triggered.');
    } catch (error) {
      console.error(error);
    }
  };

  // ==========================================
  // LEAVE ENCASHMENT ACTIONS
  // ==========================================
  const handleSaveEncSettings = async (e) => {
    e.preventDefault();
    try {
      await api.post('/leave-encashments/settings', encSettings);
      triggerToast('Encashment settings saved.');
      setIsEncSettingsOpen(false);
    } catch (error) {
      alert(error.message);
    }
  };

  const openMappingModal = (group, type) => {
    const existing = mappings.find(m => m.component_group === group && m.leave_type === type);
    setMappingForm({
      component_group: group,
      leave_type: type,
      component_type: existing ? existing.component_type : 'Gross Salary',
      payroll_components: existing ? existing.payroll_component : ['Basic', 'HRA']
    });
    setIsMappingModalOpen(true);
  };

  const handleSaveMapping = async (e) => {
    e.preventDefault();
    try {
      await api.post('/leave-encashments/component-mapping', {
        component_group: mappingForm.component_group,
        leave_type: mappingForm.leave_type,
        component_type: mappingForm.component_type,
        payroll_component: mappingForm.payroll_components
      });
      triggerToast('Payroll component mapping saved successfully.');
      setIsMappingModalOpen(false);
      fetchEncashments();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleLoadWizardEmployees = async () => {
    setWizardLoading(true);
    try {
      const res = await api.post('/leave-encashments/load-employees', wizardForm);
      setWizardEmployees(res.data.data || []);
      if (res.data.data.length === 0) {
        alert('No eligible employees found matching these parameters.');
      }
    } catch (error) {
      alert(error.response?.data?.message || error.message);
    } finally {
      setWizardLoading(false);
    }
  };

  const handleWizardEmpDaysChange = (idx, val) => {
    const nextList = [...wizardEmployees];
    const days = Math.min(Number(val) || 0, nextList[idx].leave_balance);
    nextList[idx].encashed_days = days;
    nextList[idx].amount = parseFloat((nextList[idx].per_day_wages * days).toFixed(2));
    setWizardEmployees(nextList);
  };

  const handleGenerateEncashmentRun = async () => {
    if (wizardEmployees.length === 0) {
      alert('Please load employees first.');
      return;
    }
    const hasActive = wizardEmployees.some(e => e.encashed_days > 0);
    if (!hasActive) {
      alert('Must select at least one employee with encashed days greater than 0.');
      return;
    }

    try {
      const res = await api.post('/leave-encashments/generate', {
        financial_year: wizardForm.financial_year,
        encashment_month: wizardForm.encashment_month,
        leave_type: wizardForm.leave_type,
        include_in_payroll: wizardForm.include_in_payroll,
        employees: wizardEmployees
      });
      triggerToast(res.data.message);
      setIsRunWizardOpen(false);
      setWizardEmployees([]);
      fetchEncashments();
    } catch (error) {
      alert(error.response?.data?.message || error.message);
    }
  };

  // Stats calculation
  const appliedCount = leaves.filter(l => l.approval_status === 'Applied').length;
  const underCheckCount = leaves.filter(l => l.approval_status === 'Under Check').length;
  const approvedCount = leaves.filter(l => l.approval_status === 'Approved').length;
  const rejectedCount = leaves.filter(l => l.approval_status === 'Rejected').length;

  return (
    <div className="space-y-6 text-left min-h-screen pb-12 bg-gray-50/50 p-6 rounded-3xl">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 bg-gray-900 text-white text-xs font-bold py-3 px-5 rounded-xl shadow-2xl flex items-center gap-2.5 z-[9999] border border-gray-800 animate-slide-up">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Header Card */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-gray-900 m-0 flex items-center gap-2">
            <span className="w-3 h-6 bg-blue-600 rounded-full inline-block" />
            Leave & Encashment Workspace
          </h2>
          <p className="text-xs text-gray-500 mt-1 m-0 font-medium">
            Manage leave applications, configure opening balances, adjust rosters, and calculate payroll-integrated encashment structures.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-50 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-100 border border-gray-200 cursor-pointer shadow-sm"
          >
            <Settings className="w-4 h-4 text-gray-400" />
            <span>Settings</span>
          </button>

          {activeTab === 'approve-leave' && (
            <button
              onClick={() => {
                setApplyForm({
                  employee_id: '',
                  leave_type: 'casual_leave',
                  from_date: new Date().toISOString().slice(0, 10),
                  to_date: new Date().toISOString().slice(0, 10),
                  leave_session: 'Full Day',
                  reason: ''
                });
                setApplyError('');
                setIsApplyModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-4.5 py-2.5 bg-blue-600 text-white text-xs font-black rounded-xl hover:bg-blue-700 cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Apply Leave</span>
            </button>
          )}

          {activeTab === 'leave-balance' && (
            <div className="flex items-center gap-2">
              <button
                onClick={openOpeningBalanceModal}
                className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-700 text-xs font-bold rounded-xl border border-blue-150 cursor-pointer hover:bg-blue-100"
              >
                <Database className="w-4 h-4" />
                <span>Opening Balances</span>
              </button>
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 text-gray-700 text-xs font-bold rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-100"
              >
                <Upload className="w-4 h-4 text-gray-400" />
                <span>Import CSV</span>
              </button>
              <button
                onClick={handleExportBalances}
                className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 text-gray-700 text-xs font-bold rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-100"
              >
                <Download className="w-4 h-4 text-gray-400" />
                <span>Export</span>
              </button>
            </div>
          )}

          {activeTab === 'leave-encashment' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEncSettingsOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-50 text-gray-700 text-xs font-bold rounded-xl border border-gray-200 hover:bg-gray-100 cursor-pointer"
              >
                <Settings className="w-4 h-4 text-gray-400" />
                <span>Rules</span>
              </button>
              <button
                onClick={() => {
                  setWizardEmployees([]);
                  setIsRunWizardOpen(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-black rounded-xl hover:bg-blue-700 cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Generate Encashment Run</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="border-b border-gray-200 flex space-x-6 pb-0.5">
        {[
          { id: 'approve-leave', label: 'Approve Leaves', count: appliedCount + underCheckCount },
          { id: 'leave-balance', label: 'Leave Balances', count: null },
          { id: 'leave-encashment', label: 'Leave Encashments', count: null }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setLeavesPage(1);
              setEncashmentsPage(1);
            }}
            className={`pb-3 text-xs font-bold relative bg-transparent border-0 cursor-pointer transition-colors ${
              activeTab === tab.id ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <span className="flex items-center gap-2">
              {tab.label}
              {tab.count !== null && tab.count > 0 && (
                <span className="bg-orange-100 text-orange-600 text-[10px] px-2 py-0.2 rounded-full font-extrabold">
                  {tab.count}
                </span>
              )}
            </span>
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.75 bg-blue-600 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* ==========================================================
          TAB CONTENT: APPROVE LEAVE
          ========================================================== */}
      {activeTab === 'approve-leave' && (
        <div className="space-y-6">
          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Applied Leaves', value: leavesTotal, icon: Clock, color: 'text-amber-600 bg-amber-50 border-amber-100/50' },
              { label: 'Under Check', value: leaves.filter(l=>l.approval_status==='Under Check').length, icon: Eye, color: 'text-blue-600 bg-blue-50 border-blue-100/50' },
              { label: 'Approved Leaves', value: leaves.filter(l=>l.approval_status==='Approved').length, icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50 border-emerald-100/50' },
              { label: 'Rejected / Cancelled', value: leaves.filter(l=>l.approval_status==='Rejected').length, icon: XCircle, color: 'text-rose-600 bg-rose-50 border-rose-100/50' }
            ].map((stat, i) => (
              <div key={i} className={`p-4 bg-white border border-gray-100 rounded-2xl shadow-sm flex items-center justify-between`}>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider m-0">{stat.label}</p>
                  <h3 className="text-xl font-black text-gray-900 mt-1 m-0">{stat.value}</h3>
                </div>
                <div className={`p-2.5 rounded-xl ${stat.color} border`}>
                  <stat.icon className="w-5 h-5" />
                </div>
              </div>
            ))}
          </div>

          {/* Filter Bar */}
          <div className="bg-white p-4.5 rounded-2xl shadow-sm border border-gray-150 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, code or leave type..."
                value={leavesSearch}
                onChange={e => { setLeavesSearch(e.target.value); setLeavesPage(1); }}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-semibold"
              />
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <select
                value={leavesStatusFilter}
                onChange={e => { setLeavesStatusFilter(e.target.value); setLeavesPage(1); }}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold w-full sm:w-44"
              >
                <option value="">-- All Approval Status --</option>
                <option value="Applied">Applied</option>
                <option value="Under Check">Under Check</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>

              <button
                onClick={fetchLeaves}
                className="p-2 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition shadow-sm cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 text-gray-500 animate-spin-hover" />
              </button>
            </div>
          </div>

          {/* Leaves Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50/75">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Employee</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Leave Type</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Schedule Duration</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Days</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Session</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Reason</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {leavesLoading ? (
                    <tr>
                      <td colSpan="8" className="px-6 py-10 text-center text-xs text-gray-400">Loading leave requests queue...</td>
                    </tr>
                  ) : leaves.length > 0 ? (
                    leaves.map((l) => (
                      <tr key={l._id} className="hover:bg-gray-50/40 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                          <p className="m-0 font-bold">{l.employee_name}</p>
                          <p className="m-0 text-[10px] text-gray-400 mt-0.5">{l.employee_code}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-blue-700 capitalize">
                          {l.leave_type?.replace('_', ' ')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600 font-semibold">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            <span>
                              {new Date(l.from_date).toLocaleDateString('en-GB')} - {new Date(l.to_date).toLocaleDateString('en-GB')}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs font-black text-gray-800">
                          {l.total_leave_days} Day(s)
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 font-bold">
                          {l.leave_session || 'Full Day'}
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-500 max-w-[200px] truncate">
                          {l.reason || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs">
                          <span className={`px-2.5 py-1 rounded-full border text-[10px] font-black ${STATUS_COLORS[l.approval_status] || 'bg-gray-50 border-gray-100'}`}>
                            {l.approval_status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-center">
                          {l.approval_status === 'Applied' || l.approval_status === 'Under Check' ? (
                            <div className="flex justify-center items-center gap-2">
                              <button
                                onClick={() => handleStatusChange(l._id, 'Approved')}
                                className="p-1.5 bg-emerald-50 text-emerald-600 border border-emerald-150 rounded-lg hover:bg-emerald-100 hover:text-emerald-700 transition cursor-pointer"
                                title="Approve Leave"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              
                              {l.approval_status === 'Applied' && (
                                <button
                                  onClick={() => {
                                    const rem = prompt('Enter comments/remarks for review:');
                                    if (rem !== null) handleStatusChange(l._id, 'Under Check', rem);
                                  }}
                                  className="p-1.5 bg-blue-50 text-blue-600 border border-blue-150 rounded-lg hover:bg-blue-100 hover:text-blue-700 transition cursor-pointer"
                                  title="Mark Under Review"
                                >
                                  <Clock className="w-3.5 h-3.5" />
                                </button>
                              )}

                              <button
                                onClick={() => {
                                  const rem = prompt('Provide comments/remarks for rejection:');
                                  if (rem !== null) handleStatusChange(l._id, 'Rejected', rem);
                                }}
                                className="p-1.5 bg-rose-50 text-rose-600 border border-rose-150 rounded-lg hover:bg-rose-100 hover:text-rose-700 transition cursor-pointer"
                                title="Reject Leave"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleDeleteLeave(l._id)}
                                className="p-1.5 bg-gray-50 text-gray-500 border border-gray-200 rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-150 transition cursor-pointer"
                                title="Delete Request"
                              >
                                <Trash className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-gray-400 font-bold italic">
                              {l.remarks ? `"${l.remarks}"` : 'Logged'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="px-6 py-12 text-center text-xs text-gray-400">No active leave requests found matching filters.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            {leavesTotal > 10 && (
              <div className="bg-gray-50/50 px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                <span className="text-[10px] text-gray-400 font-bold">Showing {leaves.length} of {leavesTotal} items</span>
                <div className="flex gap-2">
                  <button
                    disabled={leavesPage === 1}
                    onClick={() => setLeavesPage(p => p - 1)}
                    className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-xs font-bold hover:bg-gray-50 disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <button
                    disabled={leavesPage * 10 >= leavesTotal}
                    onClick={() => setLeavesPage(p => p + 1)}
                    className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-xs font-bold hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==========================================================
          TAB CONTENT: LEAVE BALANCE
          ========================================================== */}
      {activeTab === 'leave-balance' && (
        <div className="space-y-6">
          {/* Quick Filters */}
          <div className="bg-white p-4.5 rounded-2xl shadow-sm border border-gray-150 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search employee or code..."
                value={balancesSearch}
                onChange={e => setBalancesSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-semibold"
              />
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Financial Year:</label>
              <select
                value={selectedFinancialYear}
                onChange={e => setSelectedFinancialYear(e.target.value)}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold w-full sm:w-44"
              >
                <option value="2025-2026">2025-2026</option>
                <option value="2026-2027">2026-2027</option>
                <option value="2027-2028">2027-2028</option>
              </select>

              <button
                onClick={fetchBalances}
                className="p-2 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition shadow-sm"
              >
                <RefreshCw className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Balances list */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50/75">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Employee</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Casual Leave</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Sick Leave</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Marriage Leave</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Total Leave Allocated</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Financial Year</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {balancesLoading ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-10 text-center text-xs text-gray-400">Loading leave balances...</td>
                    </tr>
                  ) : balances.length > 0 ? (
                    balances.map((b) => (
                      <tr key={b._id} className="hover:bg-gray-50/40 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                          <p className="m-0 font-bold">{b.employee_name}</p>
                          <p className="m-0 text-[10px] text-gray-400 mt-0.5">{b.employee_code}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-gray-800">
                          {b.casual_leave} Day(s)
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-gray-800">
                          {b.sick_leave} Day(s)
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-gray-800">
                          {b.marriage_leave} Day(s)
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs font-black text-blue-600">
                          {b.total_leave} Day(s)
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold text-gray-500">
                          {b.financial_year}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-xs">
                          <button
                            onClick={() => handleEditBalance(b)}
                            className="p-1.5 bg-gray-50 border border-gray-200 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center text-xs text-gray-400">
                        No balances found for financial year {selectedFinancialYear}. Click "Configure Opening Balances" to initialize them.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================================
          TAB CONTENT: LEAVE ENCASHMENT
          ========================================================== */}
      {activeTab === 'leave-encashment' && (
        <div className="space-y-6">
          {/* Header configuration links */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-5 rounded-2xl border border-gray-150">
            <div>
              <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-500" />
                Payroll Component Mappings
              </h4>
              <p className="text-[10px] text-gray-500 mt-1 m-0">
                Map specific salary components to evaluate per-day encashment wages for Group A/B staff.
              </p>
              <div className="mt-3.5 flex flex-wrap gap-2">
                <button
                  onClick={() => openMappingModal('A', 'casual_leave')}
                  className="px-3 py-1.5 bg-gray-50 border border-gray-200 text-[10px] font-bold rounded-lg text-gray-700 hover:bg-gray-100 cursor-pointer"
                >
                  Map Group A (Casual)
                </button>
                <button
                  onClick={() => openMappingModal('A', 'sick_leave')}
                  className="px-3 py-1.5 bg-gray-50 border border-gray-200 text-[10px] font-bold rounded-lg text-gray-700 hover:bg-gray-100 cursor-pointer"
                >
                  Map Group A (Sick)
                </button>
                <button
                  onClick={() => openMappingModal('B', 'casual_leave')}
                  className="px-3 py-1.5 bg-gray-50 border border-gray-200 text-[10px] font-bold rounded-lg text-gray-700 hover:bg-gray-100 cursor-pointer"
                >
                  Map Group B (Casual)
                </button>
                <button
                  onClick={() => openMappingModal('B', 'sick_leave')}
                  className="px-3 py-1.5 bg-gray-50 border border-gray-200 text-[10px] font-bold rounded-lg text-gray-700 hover:bg-gray-100 cursor-pointer"
                >
                  Map Group B (Sick)
                </button>
              </div>
            </div>

            <div className="border-t md:border-t-0 md:border-l border-gray-150 pt-4 md:pt-0 md:pl-6">
              <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-4 h-4 text-blue-500" />
                Active Calculation Settings
              </h4>
              <p className="text-[10px] text-gray-500 mt-1 m-0">
                Current wage divisor: <span className="font-bold text-blue-600">{encSettings.per_day_wages_type}</span> 
                {encSettings.per_day_wages_type === 'Custom Days' && ` (${encSettings.custom_days} days)`}.
              </p>
              <p className="text-[10px] text-gray-400 mt-1 m-0">
                Generated sequence: Prefix: <span className="font-bold text-gray-700">{encSettings.prefix}</span>, Start Sequence: <span className="font-bold text-gray-700">{encSettings.initial}</span>
              </p>
            </div>
          </div>

          {/* Search bar */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-150 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search encashment records..."
                value={encashmentsSearch}
                onChange={e => setEncashmentsSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-semibold"
              />
            </div>
            <button
              onClick={fetchEncashments}
              className="p-2 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition shadow-sm cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* Encashment history table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50/75">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Encashment Ref</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Date Run</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Payout Month</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Employee Count</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Total Payout</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Payroll Sync</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Payment Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {encashmentsLoading ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-10 text-center text-xs text-gray-400">Loading processed encashments...</td>
                    </tr>
                  ) : encashments.length > 0 ? (
                    encashments.map((e) => (
                      <tr key={e._id} className="hover:bg-gray-50/40 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-gray-900">
                          {e.encashment_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600 font-semibold">
                          {new Date(e.encashment_date).toLocaleDateString('en-GB')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-700 font-bold">
                          {e.month_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-gray-650">
                          {e.number_of_employees} Employee(s)
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs font-black text-emerald-600">
                          ₹{e.total_amount.toLocaleString('en-IN')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs">
                          <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${
                            e.payroll_status === 'Synced' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                          }`}>
                            {e.payroll_status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs">
                          <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${
                            e.payment_status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-gray-50 text-gray-600 border-gray-150'
                          }`}>
                            {e.payment_status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center text-xs text-gray-400">No leave encashments generated yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================================
          MODALS SECTION
          ========================================================== */}

      {/* 1. APPLY LEAVE MODAL */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-[999] p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-100 flex flex-col animate-scale-up">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-600" />
                Apply For Leave
              </h3>
              <button onClick={() => setIsApplyModalOpen(false)} className="bg-transparent border-0 cursor-pointer text-gray-400 hover:text-gray-600 p-0">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplyLeave} className="p-6 space-y-4 overflow-y-auto max-h-[500px]">
              {applyError && (
                <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{applyError}</span>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Select Employee *</label>
                <select
                  required
                  value={applyForm.employee_id}
                  onChange={e => setApplyForm(f => ({ ...f, employee_id: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
                >
                  <option value="">-- Choose Employee --</option>
                  {employees.map(emp => (
                    <option key={emp._id} value={emp._id}>{emp.first_name} {emp.last_name} ({emp.employee_code})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Leave Type *</label>
                  <select
                    value={applyForm.leave_type}
                    onChange={e => setApplyForm(f => ({ ...f, leave_type: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
                  >
                    <option value="casual_leave">Casual Leave</option>
                    <option value="sick_leave">Sick Leave</option>
                    <option value="marriage_leave">Marriage Leave</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Leave Session *</label>
                  <select
                    value={applyForm.leave_session}
                    onChange={e => setApplyForm(f => ({ ...f, leave_session: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
                  >
                    <option value="Full Day">Full Day</option>
                    <option value="Session 1">Session 1 (Half Day)</option>
                    <option value="Session 2">Session 2 (Half Day)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">From Date *</label>
                  <input
                    type="date"
                    required
                    value={applyForm.from_date}
                    onChange={e => setApplyForm(f => ({ ...f, from_date: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">To Date *</label>
                  <input
                    type="date"
                    required
                    value={applyForm.to_date}
                    onChange={e => setApplyForm(f => ({ ...f, to_date: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Reason for Leave</label>
                <textarea
                  rows="3"
                  value={applyForm.reason}
                  onChange={e => setApplyForm(f => ({ ...f, reason: e.target.value }))}
                  placeholder="Reason for requesting leave time off..."
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsApplyModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-500 text-xs font-bold rounded-xl hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 text-white text-xs font-black rounded-xl hover:bg-blue-700 shadow-sm cursor-pointer"
                >
                  Apply Leave
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. CONFIGURE OPENING BALANCES MODAL */}
      {isOpeningModalOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-[999] p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden border border-gray-100 flex flex-col animate-scale-up">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-1.5">
                <Database className="w-4 h-4 text-blue-600" />
                Configure Opening Balances ({selectedFinancialYear})
              </h3>
              <button onClick={() => setIsOpeningModalOpen(false)} className="bg-transparent border-0 cursor-pointer text-gray-400 hover:text-gray-600 p-0">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[420px] space-y-4">
              <p className="text-[10px] text-gray-400 m-0">
                Set opening balances for all registered employees. Modifying this initializes or recalculates balances for this year.
              </p>

              <div className="divide-y divide-gray-100 space-y-3.5">
                {openingBalances.map((o, idx) => (
                  <div key={idx} className="pt-3.5 grid grid-cols-1 sm:grid-cols-4 gap-3 items-center">
                    <div className="col-span-1">
                      <p className="m-0 text-xs font-black text-gray-900">{o.employee_name}</p>
                      <p className="m-0 text-[10px] text-gray-450">{o.employee_code}</p>
                    </div>

                    <div className="col-span-3 grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[9px] font-bold text-gray-400 block mb-0.5">Casual</label>
                        <input
                          type="number"
                          value={o.casual_leave}
                          onChange={e => {
                            const next = [...openingBalances];
                            next[idx].casual_leave = Number(e.target.value) || 0;
                            setOpeningBalances(next);
                          }}
                          className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-gray-400 block mb-0.5">Sick</label>
                        <input
                          type="number"
                          value={o.sick_leave}
                          onChange={e => {
                            const next = [...openingBalances];
                            next[idx].sick_leave = Number(e.target.value) || 0;
                            setOpeningBalances(next);
                          }}
                          className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-gray-400 block mb-0.5">Marriage</label>
                        <input
                          type="number"
                          value={o.marriage_leave}
                          onChange={e => {
                            const next = [...openingBalances];
                            next[idx].marriage_leave = Number(e.target.value) || 0;
                            setOpeningBalances(next);
                          }}
                          className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsOpeningModalOpen(false)}
                className="px-4 py-2 border border-gray-200 text-gray-500 text-xs font-bold rounded-xl hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveOpeningBalances}
                className="px-5 py-2 bg-blue-600 text-white text-xs font-black rounded-xl hover:bg-blue-700 shadow-sm cursor-pointer"
              >
                Save Balances
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. EDIT SINGLE BALANCE MODAL */}
      {isEditBalanceOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-[999] p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden border border-gray-100 flex flex-col animate-scale-up">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-1.5">
                <Edit className="w-4 h-4 text-blue-600" />
                Adjust Balance ({editBalanceForm.employee_name})
              </h3>
              <button onClick={() => setIsEditBalanceOpen(false)} className="bg-transparent border-0 cursor-pointer text-gray-400 hover:text-gray-600 p-0">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveIndividualBalance} className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Casual</label>
                  <input
                    type="number"
                    value={editBalanceForm.casual_leave}
                    onChange={e => setEditBalanceForm(f => ({ ...f, casual_leave: Number(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Sick</label>
                  <input
                    type="number"
                    value={editBalanceForm.sick_leave}
                    onChange={e => setEditBalanceForm(f => ({ ...f, sick_leave: Number(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Marriage</label>
                  <input
                    type="number"
                    value={editBalanceForm.marriage_leave}
                    onChange={e => setEditBalanceForm(f => ({ ...f, marriage_leave: Number(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Reason / Remarks *</label>
                <textarea
                  required
                  rows="2"
                  value={editBalanceForm.remarks}
                  onChange={e => setEditBalanceForm(f => ({ ...f, remarks: e.target.value }))}
                  placeholder="Why are you adjusting these balances manually?"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsEditBalanceOpen(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-500 text-xs font-bold rounded-xl hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white text-xs font-black rounded-xl hover:bg-blue-700 shadow-sm cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. IMPORT CSV MODAL */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-[999] p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-xl overflow-hidden border border-gray-100 flex flex-col animate-scale-up">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-blue-600" />
                Import Employee Balances ({selectedFinancialYear})
              </h3>
              <button onClick={() => setIsImportModalOpen(false)} className="bg-transparent border-0 cursor-pointer text-gray-400 hover:text-gray-600 p-0">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200/60 text-gray-600 text-xs leading-relaxed space-y-1.5">
                <p className="font-bold text-gray-900 m-0">📝 CSV File Standard Format:</p>
                <p className="font-mono text-[10px] bg-white p-2 rounded-lg border border-gray-250 m-0">
                  employee_code,casual_leave,sick_leave,marriage_leave<br />
                  EMP001,12,10,15<br />
                  EMP002,10,8,12
                </p>
                <p className="text-[10px] text-gray-400 m-0">
                  Provide comma-separated values matching active employee codes.
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Paste CSV Data here</label>
                <textarea
                  rows="5"
                  value={csvText}
                  onChange={e => setCsvText(e.target.value)}
                  placeholder="employee_code,casual_leave,sick_leave,marriage_leave&#10;EMP001,12,10,15"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono"
                />
              </div>

              <div className="flex justify-between items-center">
                <button
                  onClick={handleParseCSV}
                  className="px-4 py-2 bg-gray-100 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-250 cursor-pointer"
                >
                  Verify & Parse Rows
                </button>
                <span className="text-[10px] text-blue-600 font-bold">{importStatusMsg}</span>
              </div>

              {/* Preview */}
              {importPreview.length > 0 && (
                <div className="border border-gray-150 rounded-xl max-h-[140px] overflow-y-auto bg-gray-50/50">
                  <table className="min-w-full text-left divide-y divide-gray-200">
                    <thead className="bg-gray-50 text-[10px] text-gray-400 uppercase font-black">
                      <tr>
                        <th className="px-3 py-1.5">Code</th>
                        <th className="px-3 py-1.5">Casual</th>
                        <th className="px-3 py-1.5">Sick</th>
                        <th className="px-3 py-1.5">Marriage</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-[11px] font-bold text-gray-800">
                      {importPreview.slice(0, 5).map((row, i) => (
                        <tr key={i}>
                          <td className="px-3 py-1">{row.employee_code}</td>
                          <td className="px-3 py-1">{row.casual_leave}</td>
                          <td className="px-3 py-1">{row.sick_leave}</td>
                          <td className="px-3 py-1">{row.marriage_leave}</td>
                        </tr>
                      ))}
                      {importPreview.length > 5 && (
                        <tr>
                          <td colSpan="4" className="px-3 py-1 text-center text-gray-400">...and {importPreview.length - 5} more rows</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 border border-gray-200 text-gray-500 text-xs font-bold rounded-xl hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={importPreview.length === 0}
                onClick={handleImportSubmit}
                className="px-5 py-2.5 bg-blue-600 text-white text-xs font-black rounded-xl hover:bg-blue-700 shadow-sm cursor-pointer disabled:opacity-50"
              >
                Trigger CSV Import Run
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. ENCASHMENT SETTINGS MODAL */}
      {isEncSettingsOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-[999] p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden border border-gray-100 flex flex-col animate-scale-up">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-1.5">
                <Settings className="w-4 h-4 text-blue-600" />
                Configure Encashment Rules
              </h3>
              <button onClick={() => setIsEncSettingsOpen(false)} className="bg-transparent border-0 cursor-pointer text-gray-400 hover:text-gray-600 p-0">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEncSettings} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Sequence Prefix</label>
                  <input
                    type="text"
                    value={encSettings.prefix}
                    onChange={e => setEncSettings(f => ({ ...f, prefix: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Initial Number</label>
                  <input
                    type="number"
                    value={encSettings.initial}
                    onChange={e => setEncSettings(f => ({ ...f, initial: Number(e.target.value) || 1 }))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Per-Day Wages Divisor Type</label>
                <select
                  value={encSettings.per_day_wages_type}
                  onChange={e => setEncSettings(f => ({ ...f, per_day_wages_type: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
                >
                  <option value="Month">Month Days (Actual Calendar Days, e.g. 31/30/28)</option>
                  <option value="Month Days">Standard Month (Always 30 Days)</option>
                  <option value="Custom Days">Custom Days (Defined below)</option>
                </select>
              </div>

              {encSettings.per_day_wages_type === 'Custom Days' && (
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Custom Days (Divisor)</label>
                  <input
                    type="number"
                    value={encSettings.custom_days}
                    onChange={e => setEncSettings(f => ({ ...f, custom_days: Number(e.target.value) || 26 }))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold"
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsEncSettingsOpen(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-500 text-xs font-bold rounded-xl hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 text-white text-xs font-black rounded-xl hover:bg-blue-700 shadow-sm cursor-pointer"
                >
                  Save Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. PAYROLL COMPONENT MAPPER MODAL */}
      {isMappingModalOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-[999] p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden border border-gray-100 flex flex-col animate-scale-up">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-1.5">
                <Database className="w-4 h-4 text-blue-600" />
                Map Group {mappingForm.component_group} ({mappingForm.leave_type?.replace('_', ' ')})
              </h3>
              <button onClick={() => setIsMappingModalOpen(false)} className="bg-transparent border-0 cursor-pointer text-gray-400 hover:text-gray-600 p-0">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMapping} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Wages Mapped Type</label>
                <select
                  value={mappingForm.component_type}
                  onChange={e => setMappingForm(f => ({ ...f, component_type: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
                >
                  <option value="Gross Salary">Evaluate from Gross Salary</option>
                  <option value="Specific Component">Sum Mapped Components below</option>
                </select>
              </div>

              {mappingForm.component_type === 'Specific Component' && (
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Check Mapped Salary Components</label>
                  <div className="space-y-2.5 bg-gray-50 p-4 rounded-xl border border-gray-150 text-xs font-bold text-gray-700">
                    {['Basic', 'HRA', 'Medical', 'Other Allowances'].map(comp => (
                      <div key={comp} className="flex items-center space-x-2.5">
                        <input
                          type="checkbox"
                          id={`chk-${comp}`}
                          checked={mappingForm.payroll_components.includes(comp)}
                          onChange={e => {
                            const next = [...mappingForm.payroll_components];
                            if (e.target.checked) next.push(comp);
                            else {
                              const idx = next.indexOf(comp);
                              if (idx !== -1) next.splice(idx, 1);
                            }
                            setMappingForm(f => ({ ...f, payroll_components: next }));
                          }}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor={`chk-${comp}`} className="cursor-pointer select-none">{comp}</label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsMappingModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-500 text-xs font-bold rounded-xl hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 text-white text-xs font-black rounded-xl hover:bg-blue-700 shadow-sm cursor-pointer"
                >
                  Save Mapping
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. GENERATE ENCASHMENT RUN WIZARD */}
      {isRunWizardOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-[999] p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-4xl overflow-hidden border border-gray-100 flex flex-col animate-scale-up">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-500" />
                Generate Leave Encashment Run
              </h3>
              <button onClick={() => setIsRunWizardOpen(false)} className="bg-transparent border-0 cursor-pointer text-gray-400 hover:text-gray-600 p-0">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[480px] space-y-4 text-left">
              {/* Controls */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5 bg-gray-50 p-4 rounded-2xl border border-gray-150">
                <div>
                  <label className="text-[9px] font-bold text-gray-400 block mb-0.5 uppercase">Financial Year</label>
                  <select
                    value={wizardForm.financial_year}
                    onChange={e => setWizardForm(f => ({ ...f, financial_year: e.target.value }))}
                    className="w-full px-2.5 py-1.5 bg-white border border-gray-250 rounded-lg text-xs"
                  >
                    <option value="2025-2026">2025-2026</option>
                    <option value="2026-2027">2026-2027</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-bold text-gray-400 block mb-0.5 uppercase">Payout Month</label>
                  <select
                    value={wizardForm.encashment_month}
                    onChange={e => setWizardForm(f => ({ ...f, encashment_month: e.target.value }))}
                    className="w-full px-2.5 py-1.5 bg-white border border-gray-250 rounded-lg text-xs"
                  >
                    <option value="May 2026">May 2026</option>
                    <option value="June 2026">June 2026</option>
                    <option value="July 2026">July 2026</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-bold text-gray-400 block mb-0.5 uppercase">Staff Group</label>
                  <select
                    value={wizardForm.component_group}
                    onChange={e => setWizardForm(f => ({ ...f, component_group: e.target.value }))}
                    className="w-full px-2.5 py-1.5 bg-white border border-gray-250 rounded-lg text-xs"
                  >
                    <option value="A">Group A</option>
                    <option value="B">Group B</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-bold text-gray-400 block mb-0.5 uppercase">Leave Type</label>
                  <select
                    value={wizardForm.leave_type}
                    onChange={e => setWizardForm(f => ({ ...f, leave_type: e.target.value }))}
                    className="w-full px-2.5 py-1.5 bg-white border border-gray-250 rounded-lg text-xs"
                  >
                    <option value="casual_leave">Casual Leave</option>
                    <option value="sick_leave">Sick Leave</option>
                  </select>
                </div>
              </div>

              {/* Dynamic load triggers */}
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="inc-payroll"
                    checked={wizardForm.include_in_payroll}
                    onChange={e => setWizardForm(f => ({ ...f, include_in_payroll: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="inc-payroll" className="text-xs font-bold text-gray-600 cursor-pointer select-none">Include in upcoming payroll cycle</label>
                </div>

                <button
                  disabled={wizardLoading}
                  onClick={handleLoadWizardEmployees}
                  className="px-4.5 py-2 bg-gray-900 text-white text-xs font-black rounded-xl hover:bg-gray-800 cursor-pointer flex items-center gap-1.5"
                >
                  <Database className="w-4 h-4" />
                  <span>{wizardLoading ? 'Evaluating...' : 'Load Eligible Staff'}</span>
                </button>
              </div>

              {/* Employees Grid list */}
              {wizardEmployees.length > 0 ? (
                <div className="border border-gray-150 rounded-2xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto max-h-[220px]">
                    <table className="min-w-full text-left divide-y divide-gray-200">
                      <thead className="bg-gray-50 text-[10px] text-gray-500 font-bold uppercase">
                        <tr>
                          <th className="px-4 py-2.5">Employee</th>
                          <th className="px-4 py-2.5">Mapped Salary Base</th>
                          <th className="px-4 py-2.5">Per-Day Wage</th>
                          <th className="px-4 py-2.5">Active Balance</th>
                          <th className="px-4 py-2.5">Encashed Days</th>
                          <th className="px-4 py-2.5">Amount Pay</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-xs font-bold text-gray-800 bg-white">
                        {wizardEmployees.map((we, idx) => (
                          <tr key={we.employee_id} className="hover:bg-gray-50/50">
                            <td className="px-4 py-2.5">
                              <div>{we.employee_name}</div>
                              <div className="text-[9px] text-gray-400 mt-0.5">{we.employee_code}</div>
                            </td>
                            <td className="px-4 py-2.5">₹{we.gross_salary.toLocaleString('en-IN')}</td>
                            <td className="px-4 py-2.5">₹{we.per_day_wages.toLocaleString('en-IN')}</td>
                            <td className="px-4 py-2.5 text-blue-600">{we.leave_balance} Day(s)</td>
                            <td className="px-4 py-2.5">
                              <input
                                type="number"
                                min="0"
                                max={we.leave_balance}
                                value={we.encashed_days}
                                onChange={e => handleWizardEmpDaysChange(idx, e.target.value)}
                                className="w-16 px-1.5 py-1 border border-gray-250 rounded bg-gray-50/40 text-center text-xs font-black"
                              />
                            </td>
                            <td className="px-4 py-2.5 text-emerald-600 font-black">₹{we.amount.toLocaleString('en-IN')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="py-10 border border-dashed border-gray-250 rounded-2xl text-center text-xs text-gray-400 font-bold">
                  No staff evaluated yet. Click "Load Eligible Staff" to fetch the calculations.
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsRunWizardOpen(false)}
                className="px-4 py-2 border border-gray-200 text-gray-500 text-xs font-bold rounded-xl hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={wizardEmployees.length === 0}
                onClick={handleGenerateEncashmentRun}
                className="px-5 py-2.5 bg-emerald-600 text-white text-xs font-black rounded-xl hover:bg-emerald-700 shadow-sm cursor-pointer disabled:opacity-50"
              >
                Generate Run & Debit Balances
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. GLOBAL LEAVE SETTINGS MODAL */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-[999] p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm overflow-hidden border border-gray-100 flex flex-col animate-scale-up">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-1.5">
                <Settings className="w-4 h-4 text-blue-600" />
                Global Leave Settings
              </h3>
              <button onClick={() => setIsSettingsOpen(false)} className="bg-transparent border-0 cursor-pointer text-gray-400 hover:text-gray-600 p-0">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">System Attendance Setting</label>
                <div className="space-y-2 bg-gray-50 p-4 rounded-xl border border-gray-150">
                  <label className="flex items-center gap-2.5 text-xs font-bold text-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      name="attendanceMode"
                      value="Device Attendance"
                      checked={leaveSettings.attendance_mode === 'Device Attendance'}
                      onChange={() => handleToggleSettings('Device Attendance')}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span>Device / Biometric Punching</span>
                  </label>
                  <label className="flex items-center gap-2.5 text-xs font-bold text-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      name="attendanceMode"
                      value="Manual Attendance"
                      checked={leaveSettings.attendance_mode === 'Manual Attendance'}
                      onChange={() => handleToggleSettings('Manual Attendance')}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span>Manual Attendance Only</span>
                  </label>
                </div>
                <div className="mt-3.5 bg-blue-50/50 p-3 rounded-xl border border-blue-100/50 text-[10px] text-blue-700 leading-normal font-bold">
                  ⚠️ Note: If set to 'Manual Attendance Only', employees are strictly prohibited from applying for leaves.
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="px-5 py-2 bg-gray-900 text-white text-xs font-black rounded-xl hover:bg-gray-800 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default LeavePage;
