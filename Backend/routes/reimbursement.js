const express = require('express');
const router  = express.Router();
const Reimbursement = require('../models/ReimbursementModel');
const Employee      = require('../models/Employee');

// ─── helpers ──────────────────────────────────────────────────────────────────
const autoClaimNumber = () => `CLAIM-${Date.now()}`;

const calcAmounts = (items = []) => {
  const total = items.reduce((s, i) => s + (Number(i.bill_amount) || 0), 0);
  return { total_amount: total, due_amount: total };
};

// ─── GET /api/reimbursements ───────────────────────────────────────────────────
router.get('/reimbursements', async (req, res) => {
  try {
    const { search, approval_status, payment_status, page = 1, limit = 50 } = req.query;
    const query = {};
    if (approval_status) query.approval_status = approval_status;
    if (payment_status)  query.payment_status  = payment_status;
    if (search) {
      const re = { $regex: search, $options: 'i' };
      query.$or = [{ employee_name: re }, { employee_code: re }, { claim_number: re }];
    }

    const [data, total] = await Promise.all([
      Reimbursement.find(query)
        .populate('employee_id', 'first_name last_name employee_code')
        .populate('department_id', 'name department_name')
        .populate('designation_id', 'designation_name')
        .populate('reimbursement_items.reimbursement_type_id', 'reimbursement_type')
        .sort({ created_at: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      Reimbursement.countDocuments(query)
    ]);

    res.json({ success: true, data, total, page: Number(page), limit: Number(limit) });
  } catch (e) {
    console.error('GET /reimbursements:', e.message);
    res.status(500).json({ success: false, message: e.message });
  }
});

// ─── GET /api/reimbursements/:id ──────────────────────────────────────────────
router.get('/reimbursements/:id', async (req, res) => {
  try {
    const doc = await Reimbursement.findById(req.params.id)
      .populate('employee_id')
      .populate('department_id', 'name department_name')
      .populate('designation_id', 'designation_name')
      .populate('reimbursement_items.reimbursement_type_id', 'reimbursement_type');
    if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: doc });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ─── POST /api/reimbursements ─────────────────────────────────────────────────
router.post('/reimbursements', async (req, res) => {
  try {
    const { employee_id, claim_date, reimbursement_items = [], remarks } = req.body;

    const emp = await Employee.findById(employee_id).populate('department_id').populate('designation_id');
    if (!emp) return res.status(404).json({ success: false, message: 'Employee not found' });

    const { total_amount, due_amount } = calcAmounts(reimbursement_items);

    const doc = new Reimbursement({
      employee_id,
      employee_code:  emp.employee_code,
      employee_name:  `${emp.first_name} ${emp.last_name}`,
      department_id:  emp.department_id?._id || null,
      designation_id: emp.designation_id?._id || null,
      claim_number:   autoClaimNumber(),
      claim_date:     claim_date || new Date(),
      reimbursement_items,
      total_amount,
      paid_amount:    0,
      due_amount,
      remarks
    });

    await doc.save();
    res.status(201).json({ success: true, data: doc });
  } catch (e) {
    console.error('POST /reimbursements:', e.message);
    res.status(500).json({ success: false, message: e.message });
  }
});

// ─── PUT /api/reimbursements/:id ──────────────────────────────────────────────
router.put('/reimbursements/:id', async (req, res) => {
  try {
    const doc = await Reimbursement.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Not found' });

    if (doc.approval_status !== 'Applied') {
      return res.status(400).json({ success: false, message: 'Cannot edit a processed claim' });
    }

    const { reimbursement_items = doc.reimbursement_items, claim_date, remarks } = req.body;
    const { total_amount, due_amount } = calcAmounts(reimbursement_items);

    Object.assign(doc, {
      reimbursement_items,
      claim_date: claim_date || doc.claim_date,
      total_amount,
      due_amount,
      remarks: remarks ?? doc.remarks
    });

    await doc.save();
    res.json({ success: true, data: doc });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ─── DELETE /api/reimbursements/:id ───────────────────────────────────────────
router.delete('/reimbursements/:id', async (req, res) => {
  try {
    await Reimbursement.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Reimbursement claim deleted' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ─── POST /api/reimbursements/upload ─────────────────────────────────────────
router.post('/reimbursements/upload', (req, res) => {
  // Placeholder — integrate multer / S3 for production
  res.json({ success: true, fileUrl: 'https://example.com/attachments/bill.pdf' });
});

// ─── POST /api/reimbursements/export ─────────────────────────────────────────
router.post('/reimbursements/export', (req, res) => {
  res.json({ success: true, url: 'https://example.com/reimbursements.xlsx' });
});

// ─── POST /api/reimbursements/import ─────────────────────────────────────────
router.post('/reimbursements/import', (req, res) => {
  res.json({ success: true, message: 'Import endpoint ready — attach excel_file via FormData' });
});

// ─── POST /api/reimbursements/approve/:id ─────────────────────────────────────
router.post('/reimbursements/approve/:id', async (req, res) => {
  try {
    const doc = await Reimbursement.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Not found' });

    doc.approval_status = 'Approved';
    doc.approved_by     = req.body.approved_by || null;
    await doc.save();

    res.json({ success: true, message: 'Reimbursement approved', data: doc });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ─── POST /api/reimbursements/reject/:id ──────────────────────────────────────
router.post('/reimbursements/reject/:id', async (req, res) => {
  try {
    const doc = await Reimbursement.findByIdAndUpdate(
      req.params.id,
      { approval_status: 'Rejected', remarks: req.body.remarks || '' },
      { new: true }
    );
    res.json({ success: true, message: 'Reimbursement rejected', data: doc });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ─── POST /api/reimbursements/mark-paid/:id ───────────────────────────────────
router.post('/reimbursements/mark-paid/:id', async (req, res) => {
  try {
    const { paid_amount, payment_date, payment_mode } = req.body;
    const doc = await Reimbursement.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Not found' });

    if (doc.approval_status !== 'Approved') {
      return res.status(400).json({ success: false, message: 'Claim must be approved before payment' });
    }

    const payVal = Number(paid_amount) || doc.due_amount;
    doc.paid_amount    = (doc.paid_amount || 0) + payVal;
    doc.due_amount     = doc.total_amount - doc.paid_amount;
    doc.payment_status = doc.due_amount <= 0 ? 'Paid' : 'Pending';
    doc.payment_date   = payment_date || new Date();
    doc.payment_mode   = payment_mode || 'Bank Transfer';
    await doc.save();

    res.json({ success: true, message: 'Payment recorded', data: doc });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
