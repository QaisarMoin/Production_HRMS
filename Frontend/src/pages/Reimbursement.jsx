import { useState, useEffect, useCallback } from 'react';
import { 
  Search, Plus, Check, X, Download, Upload, Trash, Eye, 
  DollarSign, FileText, Calendar, Paperclip, AlertCircle, RefreshCw,
  Wallet, CheckCircle, XCircle, Clock, CreditCard, Landmark, Coins,CheckSquare
} from 'lucide-react';
import api from '../utils/api';

const STATUS_COLORS = {
  Applied: 'bg-amber-50 text-amber-700 border-amber-100',
  Approved: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  Rejected: 'bg-rose-50 text-rose-700 border-rose-100'
};

const PAYMENT_COLORS = {
  Pending: 'bg-orange-50 text-orange-700 border-orange-100',
  Paid: 'bg-emerald-50 text-emerald-800 border-emerald-250'
};

const Reimbursement = () => {
  const [activeTab, setActiveTab] = useState('registry'); // 'registry', 'approvals', 'finance'
  
  const [claims, setClaims] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [reimbursementTypes, setReimbursementTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalClaims, setTotalClaims] = useState(0);

  // Filter States
  const [search, setSearch] = useState('');
  const [approvalStatus, setApprovalStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  // Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState(null);

  // Form Fields
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [claimDate, setClaimDate] = useState(new Date().toISOString().slice(0, 10));
  const [remarks, setRemarks] = useState('');
  const [items, setItems] = useState([
    { reimbursement_type_id: '', bill_number: '', bill_date: new Date().toISOString().slice(0, 10), bill_amount: '', attachment_url: '', file_loading: false }
  ]);

  // Payment Form Fields
  const [paidAmount, setPaidAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMode, setPaymentMode] = useState('Bank Transfer');
  
  // Notification Toast State
  const [toastMessage, setToastMessage] = useState('');

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 4000);
  };

  // Load baseline data (employees & reimbursement types)
  const loadBaselines = async () => {
    try {
      const [empRes, typeRes] = await Promise.all([
        api.get('/employees'),
        api.get('/lookup/ReimbursementType')
      ]);
      setEmployees(empRes.data.data || []);
      setReimbursementTypes(typeRes.data.data || []);
    } catch (err) {
      console.error('Error loading baselines:', err);
    }
  };

  useEffect(() => {
    loadBaselines();
  }, []);

  // Fetch Claims
  const fetchClaims = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page);
      params.set('limit', limit);
      if (search) params.set('search', search);

      // Filter queries based on active tab view
      if (activeTab === 'approvals') {
        params.set('approval_status', 'Applied');
      } else if (activeTab === 'finance') {
        params.set('approval_status', 'Approved');
        if (paymentStatus) params.set('payment_status', paymentStatus);
      } else {
        if (approvalStatus) params.set('approval_status', approvalStatus);
        if (paymentStatus) params.set('payment_status', paymentStatus);
      }

      const res = await api.get(`/reimbursements?${params.toString()}`);
      setClaims(res.data.data || []);
      setTotalClaims(res.data.total || 0);
    } catch (err) {
      console.error('Error fetching claims:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, approvalStatus, paymentStatus, activeTab]);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  // Add new item row
  const addItemRow = () => {
    setItems([...items, { reimbursement_type_id: '', bill_number: '', bill_date: new Date().toISOString().slice(0, 10), bill_amount: '', attachment_url: '', file_loading: false }]);
  };

  // Remove item row
  const removeItemRow = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  // Update item field
  const updateItemField = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  // Handle file upload with type and size checks
  const handleFileUpload = async (index, file) => {
    if (!file) return;
    
    // PDF, JPG, PNG only
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      alert('Upload failed: Only PDF, JPG, and PNG formats are allowed.');
      return;
    }
    // Max 5MB
    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      alert('Upload failed: Bill document must be smaller than 5MB.');
      return;
    }

    const updated = [...items];
    updated[index].file_loading = true;
    setItems(updated);

    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.post('/reimbursements/upload', fd);
      
      const nextItems = [...items];
      nextItems[index].attachment_url = res.data.fileUrl;
      nextItems[index].file_loading = false;
      setItems(nextItems);
      triggerToast('Bill receipt attached successfully.');
    } catch (err) {
      alert('Upload failed: ' + err.message);
      const nextItems = [...items];
      nextItems[index].file_loading = false;
      setItems(nextItems);
    }
  };

  // Calculate Total Amount
  const totalAmount = items.reduce((sum, item) => sum + (Number(item.bill_amount) || 0), 0);

  // Submit Claim Request
  const handleSubmitClaim = async (e) => {
    e.preventDefault();
    if (!selectedEmployeeId) {
      alert('Please select an employee');
      return;
    }
    const invalidItem = items.some(item => !item.reimbursement_type_id || !item.bill_amount);
    if (invalidItem) {
      alert('Please enter a valid Reimbursement Type and Amount for all lines.');
      return;
    }

    try {
      const payload = {
        employee_id: selectedEmployeeId,
        claim_date: claimDate,
        reimbursement_items: items.map(item => ({
          reimbursement_type_id: item.reimbursement_type_id,
          bill_number: item.bill_number,
          bill_date: item.bill_date,
          bill_amount: Number(item.bill_amount),
          attachment_url: item.attachment_url
        })),
        remarks
      };

      if (selectedClaim) {
        await api.put(`/reimbursements/${selectedClaim._id}`, payload);
        triggerToast(`Claim #${selectedClaim.claim_number} updated successfully.`);
      } else {
        await api.post('/reimbursements', payload);
        triggerToast('New reimbursement claim applied and submitted for approval.');
      }

      setIsFormOpen(false);
      fetchClaims();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  // Approval flow handlers
  const handleApprove = async (id, claimNum) => {
    if (!confirm(`Approve claim #${claimNum}?`)) return;
    try {
      await api.post(`/reimbursements/approve/${id}`);
      triggerToast(`Claim #${claimNum} approved and synced with upcoming payroll cycle.`);
      fetchClaims();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleReject = async (id, claimNum) => {
    const reason = prompt('Provide comments/remarks for rejection:');
    if (reason === null) return;
    try {
      await api.post(`/reimbursements/reject/${id}`, { remarks: reason });
      triggerToast(`Claim #${claimNum} has been rejected.`);
      fetchClaims();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleDelete = async (id, claimNum) => {
    if (!confirm(`Delete claim #${claimNum}?`)) return;
    try {
      await api.delete(`/reimbursements/${id}`);
      triggerToast(`Claim #${claimNum} deleted.`);
      fetchClaims();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };
  const openPaymentModal = (claim) => {
    setSelectedClaim(claim);
    setPaidAmount(claim.due_amount);
    setPaymentDate(new Date().toISOString().slice(0, 10));
    setPaymentMode('Bank Transfer');
    setIsPaymentOpen(true);
  };

  // Payment Mark as Paid
  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!paidAmount || Number(paidAmount) <= 0) {
      alert('Enter a valid amount to pay.');
      return;
    }
    try {
      await api.post(`/reimbursements/mark-paid/${selectedClaim._id}`, {
        paid_amount: Number(paidAmount),
        payment_date: paymentDate,
        payment_mode: paymentMode
      });
      setIsPaymentOpen(false);
      triggerToast(`Payment logged: ₹${paidAmount} paid via ${paymentMode}.`);
      fetchClaims();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  // Prefill Edit modal
  const handleEditPrefill = (claim) => {
    setSelectedClaim(claim);
    setSelectedEmployeeId(claim.employee_id?._id || claim.employee_id);
    setClaimDate(new Date(claim.claim_date).toISOString().slice(0, 10));
    setRemarks(claim.remarks || '');
    setItems(claim.reimbursement_items.map(item => ({
      reimbursement_type_id: item.reimbursement_type_id?._id || item.reimbursement_type_id,
      bill_number: item.bill_number || '',
      bill_date: item.bill_date ? new Date(item.bill_date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      bill_amount: item.bill_amount,
      attachment_url: item.attachment_url || '',
      file_loading: false
    })));
    setIsFormOpen(true);
  };

  // Stats calculation
  const stats = claims.reduce((acc, c) => {
    acc.total += c.total_amount || 0;
    acc.paid += c.paid_amount || 0;
    acc.due += c.due_amount || 0;
    if (c.approval_status === 'Applied') acc.applied++;
    if (c.approval_status === 'Approved') acc.approved++;
    if (c.approval_status === 'Rejected') acc.rejected++;
    return acc;
  }, { total: 0, paid: 0, due: 0, applied: 0, approved: 0, rejected: 0 });

  return (
    <div className="p-6 text-left space-y-6 bg-gray-50/50 min-h-screen">
      
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 bg-gray-900 text-white px-5 py-3.5 rounded-2xl shadow-xl border border-gray-800 text-xs font-black animate-slide-in">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hero Header */}
      <div className="flex flex-wrap justify-between items-center gap-4 bg-white p-6 rounded-3xl border border-gray-150 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-gray-950 flex items-center gap-2.5 m-0">
            <span className="w-3 h-6 bg-blue-600 rounded-full inline-block" />
            Reimbursement Desk
          </h2>
          <p className="text-xs text-gray-500 mt-1.5 m-0">
            Automated expense claim registry, multiple receipt uploads, multi-stage approval flows & payroll updates.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => handleExport('excel')}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 text-xs font-black rounded-xl border-0 cursor-pointer hover:bg-emerald-100 transition"
          >
            <Download className="w-4 h-4" /> Export Report
          </button>
          <button 
            onClick={() => {
              setSelectedClaim(null);
              setSelectedEmployeeId('');
              setClaimDate(new Date().toISOString().slice(0, 10));
              setRemarks('');
              setItems([{ reimbursement_type_id: '', bill_number: '', bill_date: new Date().toISOString().slice(0, 10), bill_amount: '', attachment_url: '', file_loading: false }]);
              setIsFormOpen(true);
            }}
            className="flex items-center gap-1.5 px-4.5 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl border-0 shadow-sm cursor-pointer transition"
          >
            <Plus className="w-4 h-4" /> New Expense Claim
          </button>
        </div>
      </div>

      {/* Module Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4.5 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase m-0">Total Claims amount</p>
            <p className="text-lg font-black text-gray-950 m-0 mt-0.5">₹{stats.total.toLocaleString('en-IN')}</p>
          </div>
        </div>
        <div className="bg-white p-4.5 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <CheckSquare className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase m-0">Amount Disbursed</p>
            <p className="text-lg font-black text-gray-950 m-0 mt-0.5">₹{stats.paid.toLocaleString('en-IN')}</p>
          </div>
        </div>
        <div className="bg-white p-4.5 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase m-0">Pending Due</p>
            <p className="text-lg font-black text-gray-950 m-0 mt-0.5">₹{stats.due.toLocaleString('en-IN')}</p>
          </div>
        </div>
        <div className="bg-white p-4.5 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase m-0">Review Queue</p>
            <p className="text-lg font-black text-gray-950 m-0 mt-0.5">{stats.applied} requests</p>
          </div>
        </div>
      </div>

      {/* Internal Navigation Tabs */}
      <div className="flex border-b border-gray-200">
        <button 
          onClick={() => { setActiveTab('registry'); setPage(1); }}
          className={`px-6 py-3 text-xs font-black border-0 bg-transparent cursor-pointer transition ${
            activeTab === 'registry' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          Claims Registry
        </button>
        <button 
          onClick={() => { setActiveTab('approvals'); setPage(1); }}
          className={`px-6 py-3 text-xs font-black border-0 bg-transparent cursor-pointer transition flex items-center gap-1.5 ${
            activeTab === 'approvals' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          Approval Worklist 
          {stats.applied > 0 && <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full text-[9px] font-black">{stats.applied}</span>}
        </button>
        <button 
          onClick={() => { setActiveTab('finance'); setPage(1); }}
          className={`px-6 py-3 text-xs font-black border-0 bg-transparent cursor-pointer transition ${
            activeTab === 'finance' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          Disbursal Desk
        </button>
      </div>

      {/* Active Tab Filters */}
      <div className="bg-white p-4.5 rounded-3xl border border-gray-100 shadow-sm flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[260px] relative">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
          <input 
            type="text"
            placeholder="Search claim, employee name, or code..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-blue-500"
          />
        </div>

        {activeTab === 'registry' && (
          <>
            <div className="w-48">
              <select
                value={approvalStatus}
                onChange={(e) => { setApprovalStatus(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none"
              >
                <option value="">All Approval Status</option>
                <option value="Applied">Applied</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
            <div className="w-48">
              <select
                value={paymentStatus}
                onChange={(e) => { setPaymentStatus(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none"
              >
                <option value="">All Payment Status</option>
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
              </select>
            </div>
          </>
        )}

        {activeTab === 'finance' && (
          <div className="w-48">
            <select
              value={paymentStatus}
              onChange={(e) => { setPaymentStatus(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none"
            >
              <option value="">All Payments</option>
              <option value="Pending">Pending</option>
              <option value="Paid">Paid</option>
            </select>
          </div>
        )}

        <button 
          onClick={fetchClaims}
          className="p-2.5 bg-gray-150 hover:bg-gray-200 rounded-xl transition cursor-pointer border-0"
        >
          <RefreshCw className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {/* Claims Data Table */}
      <div className="bg-white rounded-3xl border border-gray-150 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/70 border-b border-gray-100">
                <th className="px-5 py-4.5 text-xs font-black text-gray-500 uppercase">Emp Code</th>
                <th className="px-5 py-4.5 text-xs font-black text-gray-500 uppercase">Employee Name</th>
                <th className="px-5 py-4.5 text-xs font-black text-gray-500 uppercase">Claim #</th>
                <th className="px-5 py-4.5 text-xs font-black text-gray-500 uppercase">Claim Date</th>
                <th className="px-5 py-4.5 text-xs font-black text-gray-500 uppercase">Total</th>
                {activeTab !== 'approvals' && (
                  <>
                    <th className="px-5 py-4.5 text-xs font-black text-gray-500 uppercase">Paid</th>
                    <th className="px-5 py-4.5 text-xs font-black text-gray-500 uppercase">Due</th>
                  </>
                )}
                <th className="px-5 py-4.5 text-xs font-black text-gray-500 uppercase">Approval</th>
                {activeTab !== 'approvals' && <th className="px-5 py-4.5 text-xs font-black text-gray-500 uppercase">Payment</th>}
                <th className="px-5 py-4.5 text-xs font-black text-gray-500 text-center uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={activeTab === 'approvals' ? 7 : 10} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs text-gray-400 font-semibold">Loading data desk...</span>
                    </div>
                  </td>
                </tr>
              ) : claims.length > 0 ? (
                claims.map((claim) => (
                  <tr key={claim._id} className="hover:bg-gray-50/40 transition">
                    <td className="px-5 py-4 text-xs font-bold text-gray-800">{claim.employee_code}</td>
                    <td className="px-5 py-4 text-xs font-black text-gray-900">{claim.employee_name}</td>
                    <td className="px-5 py-4 text-xs font-mono font-bold text-blue-600">{claim.claim_number}</td>
                    <td className="px-5 py-4 text-xs text-gray-600">
                      {new Date(claim.claim_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-4 text-xs font-black text-gray-950">₹{claim.total_amount?.toLocaleString('en-IN')}</td>
                    {activeTab !== 'approvals' && (
                      <>
                        <td className="px-5 py-4 text-xs font-bold text-emerald-600">₹{claim.paid_amount?.toLocaleString('en-IN') || 0}</td>
                        <td className="px-5 py-4 text-xs font-bold text-rose-600">₹{claim.due_amount?.toLocaleString('en-IN') || 0}</td>
                      </>
                    )}
                    <td className="px-5 py-4 text-xs">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${STATUS_COLORS[claim.approval_status] || 'bg-gray-50 text-gray-500'}`}>
                        {claim.approval_status}
                      </span>
                    </td>
                    {activeTab !== 'approvals' && (
                      <td className="px-5 py-4 text-xs">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${PAYMENT_COLORS[claim.payment_status] || 'bg-gray-50 text-gray-500'}`}>
                          {claim.payment_status}
                        </span>
                      </td>
                    )}
                    <td className="px-5 py-4 text-xs">
                      <div className="flex items-center justify-center gap-1.5">
                        <button 
                          onClick={() => { setSelectedClaim(claim); setIsDetailOpen(true); }}
                          title="View Receipt Summary"
                          className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700 cursor-pointer border-0"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Registry View Actions */}
                        {activeTab === 'registry' && claim.approval_status === 'Applied' && (
                          <>
                            <button 
                              onClick={() => handleEditPrefill(claim)}
                              title="Edit Expense Claim"
                              className="p-1.5 hover:bg-gray-100 rounded-lg text-blue-500 hover:text-blue-700 cursor-pointer border-0"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDelete(claim._id, claim.claim_number)}
                              title="Cancel & Delete"
                              className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-500 hover:text-rose-700 cursor-pointer border-0"
                            >
                              <Trash className="w-4 h-4" />
                            </button>
                          </>
                        )}

                        {/* Approvals Worklist Actions */}
                        {activeTab === 'approvals' && (
                          <>
                            <button 
                              onClick={() => handleApprove(claim._id, claim.claim_number)}
                              className="flex items-center gap-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-0 px-2 py-1 rounded cursor-pointer font-black text-[10px]"
                            >
                              <Check className="w-3.5 h-3.5" /> Approve
                            </button>
                            <button 
                              onClick={() => handleReject(claim._id, claim.claim_number)}
                              className="flex items-center gap-0.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border-0 px-2 py-1 rounded cursor-pointer font-black text-[10px]"
                            >
                              <X className="w-3.5 h-3.5" /> Reject
                            </button>
                          </>
                        )}

                        {/* Disbursal Desk Actions */}
                        {activeTab === 'finance' && claim.payment_status !== 'Paid' && (
                          <button 
                            onClick={() => openPaymentModal(claim)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-750 text-white rounded-lg text-[10px] font-black cursor-pointer border-0 transition"
                          >
                            <DollarSign className="w-3.5 h-3.5" /> Mark Paid
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={activeTab === 'approvals' ? 7 : 10} className="py-14 text-center text-xs text-gray-400 font-semibold">
                    No claims or receipts under this category queue.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info counts */}
        {totalClaims > limit && (
          <div className="bg-gray-50/50 border-t border-gray-100 px-5 py-3 flex items-center justify-between">
            <span className="text-[11px] text-gray-400 font-semibold">
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, totalClaims)} of {totalClaims} claims
            </span>
            <div className="flex gap-1.5">
              <button 
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="px-2.5 py-1 text-xs font-bold bg-white border border-gray-200 rounded-lg disabled:opacity-50 cursor-pointer"
              >
                Prev
              </button>
              <button 
                disabled={page * limit >= totalClaims}
                onClick={() => setPage(page + 1)}
                className="px-2.5 py-1 text-xs font-bold bg-white border border-gray-200 rounded-lg disabled:opacity-50 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Claim Form Modal (Full layout for dynamic receipt lines) */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-xl overflow-hidden my-8 animate-scale-up">
            <div className="px-6 py-4.5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-black text-gray-900">
                {selectedClaim ? `Modify Reimbursement Request (${selectedClaim.claim_number})` : 'New Reimbursement Application'}
              </h3>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition cursor-pointer border-0 bg-transparent"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitClaim} className="p-6 space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Select Employee *</label>
                  <select
                    value={selectedEmployeeId}
                    onChange={(e) => setSelectedEmployeeId(e.target.value)}
                    required
                    disabled={!!selectedClaim}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-250 rounded-xl text-xs focus:outline-none"
                  >
                    <option value="">-- Choose employee --</option>
                    {employees.map(e => (
                      <option key={e._id} value={e._id}>{e.first_name} {e.last_name} ({e.employee_code})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Claim Application Date *</label>
                  <input
                    type="date"
                    value={claimDate}
                    onChange={(e) => setClaimDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-250 rounded-xl text-xs focus:outline-none"
                  />
                </div>
              </div>

              {/* Items Section */}
              <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="bg-gray-50/50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                  <span className="text-xs font-black text-gray-800">Add Bill / Expense Entries</span>
                  <button
                    type="button"
                    onClick={addItemRow}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl text-[10px] font-black cursor-pointer border-0"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Bill Row
                  </button>
                </div>

                <div className="p-4 space-y-3 max-h-[280px] overflow-y-auto">
                  {items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end border-b border-gray-100 pb-3 md:pb-0 md:border-0">
                      <div className="md:col-span-2">
                        <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Expense Type *</label>
                        <select
                          value={item.reimbursement_type_id}
                          onChange={(e) => updateItemField(idx, 'reimbursement_type_id', e.target.value)}
                          required
                          className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none"
                        >
                          <option value="">-- Select Type --</option>
                          {reimbursementTypes.map(t => (
                            <option key={t._id} value={t._id}>{t.reimbursement_type}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Bill Number</label>
                        <input
                          type="text"
                          placeholder="Bill Ref #"
                          value={item.bill_number}
                          onChange={(e) => updateItemField(idx, 'bill_number', e.target.value)}
                          className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Bill Date</label>
                        <input
                          type="date"
                          value={item.bill_date}
                          onChange={(e) => updateItemField(idx, 'bill_date', e.target.value)}
                          className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Bill Amount *</label>
                        <input
                          type="number"
                          placeholder="Amount ₹"
                          value={item.bill_amount}
                          onChange={(e) => updateItemField(idx, 'bill_amount', e.target.value)}
                          required
                          min="0"
                          className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none"
                        />
                      </div>

                      <div className="flex items-center gap-1.5">
                        <div className="flex-1">
                          <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Receipt Attachment</label>
                          {item.attachment_url ? (
                            <a href={item.attachment_url} target="_blank" rel="noreferrer" className="text-blue-600 font-bold hover:underline flex items-center gap-0.5 py-1.5">
                              <Paperclip className="w-3.5 h-3.5" /> View
                            </a>
                          ) : (
                            <label className="flex items-center justify-center gap-1 px-2.5 py-1.5 bg-gray-150 hover:bg-gray-200 text-gray-650 rounded-lg cursor-pointer border border-dashed border-gray-300">
                              <Upload className="w-3.5 h-3.5" /> 
                              {item.file_loading ? 'Uploading' : 'Attach File'}
                              <input
                                type="file"
                                onChange={(e) => handleFileUpload(idx, e.target.files[0])}
                                className="hidden"
                              />
                            </label>
                          )}
                        </div>
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItemRow(idx)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer transition border-0 mt-5 bg-transparent"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex items-center justify-between text-xs font-black text-gray-800">
                  <span>Calculated Total Claim</span>
                  <span>₹{totalAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Claim Remarks / Purpose Description</label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows="2"
                  placeholder="Enter comments about this expense claim..."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl font-bold text-gray-500 hover:bg-gray-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl border-0 shadow-sm transition cursor-pointer"
                >
                  {selectedClaim ? 'Save Changes' : 'Submit Claim'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Claim Detail View Modal */}
      {isDetailOpen && selectedClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-xl overflow-hidden">
            <div className="px-6 py-4.5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-black text-gray-900">Summary Sheet - {selectedClaim.claim_number}</h3>
              <button 
                onClick={() => setIsDetailOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition cursor-pointer border-0 bg-transparent"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Employee Name</span>
                  <span className="font-black text-gray-950 block mt-0.5">{selectedClaim.employee_name} ({selectedClaim.employee_code})</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Submission Date</span>
                  <span className="font-bold text-gray-900 block mt-0.5">
                    {new Date(selectedClaim.claim_date).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Department / Designation</span>
                  <span className="font-bold text-gray-900 block mt-0.5">
                    {selectedClaim.department_id?.name || selectedClaim.department_id?.department_name || '—'} / {selectedClaim.designation_id?.designation_name || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Statuses</span>
                  <div className="flex gap-1.5 mt-1">
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black border ${STATUS_COLORS[selectedClaim.approval_status] || 'bg-gray-50 text-gray-500'}`}>
                      {selectedClaim.approval_status}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black border ${PAYMENT_COLORS[selectedClaim.payment_status] || 'bg-gray-50 text-gray-500'}`}>
                      {selectedClaim.payment_status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Items list */}
              <div className="border border-gray-150 rounded-2xl overflow-hidden">
                <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-150 text-[10px] font-bold text-gray-500 uppercase">
                  Reimbursement Itemized Log
                </div>
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-50/50">
                    <tr className="border-b border-gray-150">
                      <th className="px-4 py-2 font-bold text-gray-500">Expense Category</th>
                      <th className="px-4 py-2 font-bold text-gray-500">Bill Number</th>
                      <th className="px-4 py-2 font-bold text-gray-500">Bill Date</th>
                      <th className="px-4 py-2 font-bold text-gray-500 text-right">Amount</th>
                      <th className="px-4 py-2 font-bold text-gray-500 text-center">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selectedClaim.reimbursement_items?.map((item, i) => (
                      <tr key={i} className="hover:bg-gray-50/30">
                        <td className="px-4 py-2.5 font-bold text-gray-900">
                          {item.reimbursement_type_id?.reimbursement_type || 'General'}
                        </td>
                        <td className="px-4 py-2.5 text-gray-600">{item.bill_number || '—'}</td>
                        <td className="px-4 py-2.5 text-gray-600">
                          {item.bill_date ? new Date(item.bill_date).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-4 py-2.5 font-black text-gray-900 text-right">₹{item.bill_amount?.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-2.5 text-center">
                          {item.attachment_url ? (
                            <a href={item.attachment_url} target="_blank" rel="noreferrer" className="text-blue-600 font-bold hover:underline">
                              View Receipt
                            </a>
                          ) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50/70 border-t border-gray-150 font-black text-gray-900">
                    <tr>
                      <td colSpan="3" className="px-4 py-2.5">Total Amount</td>
                      <td className="px-4 py-2.5 text-right">₹{selectedClaim.total_amount?.toLocaleString('en-IN')}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {selectedClaim.remarks && (
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Remarks / Notes</span>
                  <p className="text-xs text-gray-700 bg-gray-50 p-3 rounded-xl mt-1 border border-gray-100 font-medium">{selectedClaim.remarks}</p>
                </div>
              )}

              {selectedClaim.approval_status === 'Approved' && (
                <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                  <p className="text-xs text-emerald-800 m-0 font-medium">
                    This request has been approved by the HR manager and synced to the upcoming payroll batch run.
                  </p>
                </div>
              )}

              <div className="flex justify-end pt-4 border-t border-gray-100">
                <button
                  onClick={() => setIsDetailOpen(false)}
                  className="px-5 py-2 bg-gray-900 hover:bg-gray-800 text-white text-xs font-black rounded-xl cursor-pointer border-0 shadow-sm"
                >
                  Close Summary
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Finance Disbursal Modal */}
      {isPaymentOpen && selectedClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-xl overflow-hidden">
            <div className="px-6 py-4.5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-black text-gray-900">Record Claim Disbursement</h3>
              <button 
                onClick={() => setIsPaymentOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition cursor-pointer border-0 bg-transparent"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="p-6 space-y-4 text-xs font-semibold">
              <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-150 flex items-center gap-3">
                <Landmark className="w-5 h-5 text-blue-600 shrink-0" />
                <div>
                  <p className="text-[10px] font-black text-blue-800 m-0">Claim Amount Outstanding</p>
                  <p className="text-base font-black text-blue-900 m-0 mt-0.5">₹{selectedClaim.due_amount?.toLocaleString('en-IN')}</p>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Disbursed Amount (₹) *</label>
                <input
                  type="number"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  required
                  min="1"
                  max={selectedClaim.due_amount}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Payment/Disbursal Date *</label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Disbursement Mode *</label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none"
                >
                  <option>Bank Transfer</option>
                  <option>UPI</option>
                  <option>Cheque</option>
                  <option>Cash</option>
                </select>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsPaymentOpen(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl border-0 shadow-sm transition cursor-pointer"
                >
                  Log Disbursement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reimbursement;
