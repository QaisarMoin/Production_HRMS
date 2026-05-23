const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const { SalaryStructure } = require('../models/MasterModels');
const {
  TaxRegime, TaxSlab, TaxDeclaration, ITProof,
  PreviousDeduction, AdvanceSalary, Payroll,
  PayrollSettings, FinalSettlement, FinalSettlementSettings,
  Payslip, SalaryRevision
} = require('../models/PayrollModels');

const resolveEmployeeNames = (records) => {
  return records.map(doc => {
    let obj = doc.toObject ? doc.toObject() : doc;
    if (obj.employee_id && typeof obj.employee_id === 'object') {
      const emp = obj.employee_id;
      if (emp.first_name) {
        obj.employee_name = `${emp.first_name} ${emp.last_name}`;
      }
      if (emp.employee_code) {
        obj.employee_code = emp.employee_code;
      }
    }
    return obj;
  });
};

// ==========================================
// SEED TAX SLABS ROUTE
// ==========================================
router.post('/payroll/seed-slabs', async (req, res) => {
  try {
    await TaxSlab.deleteMany({});
    const seedSlabs = [
      {
        regime_type: "New Regime",
        age_group: "Below 60",
        slabs: [
          { income_slab_name: "Upto 3L", from_amount: 0, to_amount: 300000, tax_percentage: 0 },
          { income_slab_name: "3L to 6L", from_amount: 300001, to_amount: 600000, tax_percentage: 5 },
          { income_slab_name: "6L to 9L", from_amount: 600001, to_amount: 900000, tax_percentage: 10 },
          { income_slab_name: "9L to 12L", from_amount: 900001, to_amount: 1200000, tax_percentage: 15 },
          { income_slab_name: "12L to 15L", from_amount: 1200001, to_amount: 1500000, tax_percentage: 20 },
          { income_slab_name: "Above 15L", from_amount: 1500001, to_amount: 99999999, tax_percentage: 30 }
        ]
      },
      {
        regime_type: "Old Regime",
        age_group: "Below 60",
        slabs: [
          { income_slab_name: "Upto 2.5L", from_amount: 0, to_amount: 250000, tax_percentage: 0 },
          { income_slab_name: "2.5L to 5L", from_amount: 250001, to_amount: 500000, tax_percentage: 5 },
          { income_slab_name: "5L to 10L", from_amount: 500001, to_amount: 1000000, tax_percentage: 20 },
          { income_slab_name: "Above 10L", from_amount: 1000001, to_amount: 99999999, tax_percentage: 30 }
        ]
      }
    ];
    const inserted = await TaxSlab.insertMany(seedSlabs);
    res.json({ success: true, message: "Tax Slabs seeded successfully", data: inserted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 1. TAX REGIMES ENDPOINTS
// ==========================================

// Get Approved Tax Regimes
router.get('/payroll/tax-regimes', async (req, res) => {
  try {
    const { page = 1, limit = 50, approval_status, search } = req.query;
    let query = {};
    if (approval_status) query.approval_status = approval_status;
    if (search) {
      const re = { $regex: search, $options: 'i' };
      query.$or = [{ employee_name: re }, { employee_code: re }];
    }

    const records = await TaxRegime.find(query)
      .populate('employee_id', 'first_name last_name employee_code')
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const data = resolveEmployeeNames(records);
    const total = await TaxRegime.countDocuments(query);
    res.json({ success: true, data, total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Bulk Insert Tax Regime
router.post('/payroll/tax-regimes/bulk-insert', async (req, res) => {
  try {
    const { employees } = req.body;
    if (!employees || !Array.isArray(employees)) {
      return res.status(400).json({ success: false, message: "Employees list is required" });
    }

    const insertedList = [];
    for (const item of employees) {
      const emp = await Employee.findById(item.employee_id);
      if (!emp) continue;

      const newDoc = new TaxRegime({
        employee_id: emp._id,
        employee_code: emp.employee_code,
        employee_name: `${emp.first_name} ${emp.last_name}`,
        new_regime: item.tax_regime || "New Regime",
        approval_status: "Approved",
        previous_regime: "Old Regime"
      });
      await newDoc.save();
      insertedList.push(newDoc);
    }
    res.status(201).json({ success: true, message: `Successfully inserted ${insertedList.length} tax regimes`, data: insertedList });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create Single Regime Request (helper route for UI compatibility)
router.post('/payroll/tax-regimes', async (req, res) => {
  try {
    const { employee_id, new_regime } = req.body;
    const emp = await Employee.findById(employee_id);
    if (!emp) return res.status(404).json({ success: false, message: "Employee not found" });

    const newDoc = new TaxRegime({
      employee_id: emp._id,
      employee_code: emp.employee_code,
      employee_name: `${emp.first_name} ${emp.last_name}`,
      new_regime,
      approval_status: "Applied"
    });
    await newDoc.save();
    res.status(201).json({ success: true, data: newDoc });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update Employee Tax Regime
router.put('/payroll/tax-regimes/:id', async (req, res) => {
  try {
    const doc = await TaxRegime.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!doc) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data: doc });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Approve Tax Regime
router.post('/payroll/tax-regimes/approve/:id', async (req, res) => {
  try {
    const doc = await TaxRegime.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: "Not found" });
    doc.approval_status = "Approved";
    doc.approved_by = req.body.approved_by || null;
    await doc.save();
    res.json({ success: true, message: "Regime choice approved", data: doc });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Reject Tax Regime
router.post('/payroll/tax-regimes/reject/:id', async (req, res) => {
  try {
    const doc = await TaxRegime.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: "Not found" });
    doc.approval_status = "Rejected";
    doc.approved_by = req.body.approved_by || null;
    await doc.save();
    res.json({ success: true, message: "Regime choice rejected", data: doc });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get Tax Slabs
router.get('/payroll/tax-slabs', async (req, res) => {
  try {
    const { regime_type, age_group } = req.query;
    let query = {};
    if (regime_type) query.regime_type = regime_type;
    if (age_group) query.age_group = age_group;

    const data = await TaxSlab.find(query);
    if (data.length === 0) {
      // Return seed data dynamically if DB is empty
      return res.json({
        success: true,
        data: [
          {
            regime_type: "New Regime",
            age_group: "Below 60",
            slabs: [
              { income_slab_name: "Upto 3L", from_amount: 0, to_amount: 300000, tax_percentage: 0 },
              { income_slab_name: "3L to 6L", from_amount: 300001, to_amount: 600000, tax_percentage: 5 },
              { income_slab_name: "6L to 9L", from_amount: 600001, to_amount: 900000, tax_percentage: 10 },
              { income_slab_name: "Above 9L", from_amount: 900001, to_amount: 9999999, tax_percentage: 20 }
            ]
          }
        ]
      });
    }
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update Tax Slab
router.put('/payroll/tax-slabs/:id', async (req, res) => {
  try {
    const { regime_type, age_group, slabs } = req.body;
    const doc = await TaxSlab.findByIdAndUpdate(
      req.params.id,
      { regime_type, age_group, slabs },
      { new: true, runValidators: true }
    );
    if (!doc) return res.status(404).json({ success: false, message: "Tax Slab set not found" });
    res.json({ success: true, message: "Tax Slabs updated successfully", data: doc });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create Tax Slab
router.post('/payroll/tax-slabs', async (req, res) => {
  try {
    const { regime_type, age_group, slabs } = req.body;
    if (!regime_type || !age_group || !slabs || !Array.isArray(slabs)) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }
    const newDoc = new TaxSlab({ regime_type, age_group, slabs });
    await newDoc.save();
    res.status(201).json({ success: true, message: "Tax Slab set created successfully", data: newDoc });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete Tax Slab
router.delete('/payroll/tax-slabs/:id', async (req, res) => {
  try {
    const doc = await TaxSlab.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: "Tax Slab set not found" });
    res.json({ success: true, message: "Tax Slab set deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 2. APPROVED DECLARATION MODULE
// ==========================================
router.get('/payroll/declarations', async (req, res) => {
  try {
    const { approval_status, employee_name } = req.query;
    let query = {};
    if (approval_status) query.approval_status = approval_status;
    if (employee_name) {
      query.employee_name = { $regex: employee_name, $options: 'i' };
    }

    const records = await TaxDeclaration.find(query).populate('employee_id', 'first_name last_name employee_code');
    const data = resolveEmployeeNames(records);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/payroll/declarations', async (req, res) => {
  try {
    const { employee_id, financial_year, general_declared_amount, hra_declared_amount, lta_declared_amount } = req.body;
    const emp = await Employee.findById(employee_id);
    if (!emp) return res.status(404).json({ success: false, message: "Employee not found" });

    const doc = new TaxDeclaration({
      employee_id,
      financial_year,
      general_declared_amount,
      hra_declared_amount,
      lta_declared_amount,
      approval_status: "Applied"
    });
    await doc.save();
    res.status(201).json({ success: true, data: doc });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/payroll/declarations/approve/:id', async (req, res) => {
  try {
    const doc = await TaxDeclaration.findByIdAndUpdate(req.params.id, { approval_status: "Approved" }, { new: true });
    res.json({ success: true, message: "Declaration approved", data: doc });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/payroll/declarations/reject/:id', async (req, res) => {
  try {
    const doc = await TaxDeclaration.findByIdAndUpdate(req.params.id, { approval_status: "Rejected" }, { new: true });
    res.json({ success: true, message: "Declaration rejected", data: doc });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 3. APPROVED IT PROOF MODULE
// ==========================================
router.get('/payroll/it-proofs', async (req, res) => {
  try {
    const { approval_status, employee_name } = req.query;
    let query = {};
    if (approval_status) query.approval_status = approval_status;
    if (employee_name) {
      query.employee_name = { $regex: employee_name, $options: 'i' };
    }
    const records = await ITProof.find(query).populate('employee_id', 'first_name last_name employee_code');
    const data = resolveEmployeeNames(records);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/payroll/it-proofs', async (req, res) => {
  try {
    const { employee_id, financial_year, general_declared_amount, hra_declared_amount, lta_declared_amount, proof_documents } = req.body;
    const doc = new ITProof({
      employee_id,
      financial_year,
      general_declared_amount,
      hra_declared_amount,
      lta_declared_amount,
      proof_documents: proof_documents || [],
      approval_status: "Applied"
    });
    await doc.save();
    res.status(201).json({ success: true, data: doc });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/payroll/it-proofs/approve/:id', async (req, res) => {
  try {
    const doc = await ITProof.findByIdAndUpdate(req.params.id, { approval_status: "Approved" }, { new: true });
    res.json({ success: true, message: "IT Proof approved", data: doc });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/payroll/it-proofs/reject/:id', async (req, res) => {
  try {
    const doc = await ITProof.findByIdAndUpdate(req.params.id, { approval_status: "Rejected" }, { new: true });
    res.json({ success: true, message: "IT Proof rejected", data: doc });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 4. PREVIOUS DEDUCTION MODULE
// ==========================================
router.get('/payroll/previous-deductions', async (req, res) => {
  try {
    const records = await PreviousDeduction.find({}).populate('employee_id', 'first_name last_name employee_code');
    const data = resolveEmployeeNames(records);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/payroll/previous-deductions', async (req, res) => {
  try {
    const {
      financial_year, employee_id, previous_basic_amount, previous_hra_amount,
      previous_gross_amount, previous_income_tax, previous_pf_amount, previous_prof_tax
    } = req.body;

    const emp = await Employee.findById(employee_id);
    if (!emp) return res.status(404).json({ success: false, message: "Employee not found" });

    const doc = new PreviousDeduction({
      financial_year,
      employee_id,
      employee_name: `${emp.first_name} ${emp.last_name}`,
      previous_company_basic_amount: previous_basic_amount || 0,
      previous_company_hra_amount: previous_hra_amount || 0,
      previous_company_gross_amount: previous_gross_amount || 0,
      previous_company_income_tax: previous_income_tax || 0,
      previous_company_pf_amount: previous_pf_amount || 0,
      previous_company_prof_tax: previous_prof_tax || 0,
      attachments: req.body.attachments || []
    });

    await doc.save();
    res.status(201).json({ success: true, data: doc });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/payroll/previous-deductions/upload', (req, res) => {
  res.json({ success: true, fileUrl: "https://example.com/attachments/prev_company_payout.pdf" });
});

router.delete('/payroll/previous-deductions/:id', async (req, res) => {
  try {
    await PreviousDeduction.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Previous deduction details deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/payroll/previous-deductions/export', (req, res) => {
  res.json({ success: true, fileUrl: "https://example.com/exports/previous-deductions.xlsx" });
});

// ==========================================
// 5. ADVANCE SALARY MODULE
// ==========================================
router.get('/payroll/advance-salaries', async (req, res) => {
  try {
    const { range, search } = req.query;
    let query = {};
    if (search) {
      const re = { $regex: search, $options: 'i' };
      query.$or = [{ employee_code: re }, { employee_name: re }];
    }
    const records = await AdvanceSalary.find(query).populate('employee_id', 'first_name last_name employee_code');
    const data = resolveEmployeeNames(records);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/payroll/advance-salaries', async (req, res) => {
  try {
    const { employee_id, advance_date, advance_amount, recovery_cycle, recovery_from, recovery_mode } = req.body;
    const emp = await Employee.findById(employee_id);
    if (!emp) return res.status(404).json({ success: false, message: "Employee not found" });

    const instNum = recovery_mode === "Lumpsum" ? 1 : Number(recovery_cycle) || 1;
    const instAmt = Math.round(Number(advance_amount) / instNum);

    const doc = new AdvanceSalary({
      advance_salary_number: `ADV-${Date.now()}`,
      employee_id,
      employee_code: emp.employee_code,
      employee_name: `${emp.first_name} ${emp.last_name}`,
      advance_date: advance_date || new Date(),
      advance_amount,
      recovery_cycle: instNum,
      recovery_from,
      recovery_mode,
      number_of_installments: instNum,
      installment_amount: instAmt
    });

    await doc.save();
    res.status(201).json({ success: true, data: doc });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/payroll/advance-salaries/export', (req, res) => {
  res.json({ success: true, fileUrl: "https://example.com/exports/advance-salaries.xlsx" });
});

// ==========================================
// 6. GENERATE PAYROLL MODULE
// ==========================================
router.get('/payrolls', async (req, res) => {
  try {
    const records = await Payroll.find({}).populate('employees.employee_id', 'first_name last_name employee_code').sort({ created_at: -1 });
    const data = records.map(p => {
      let pObj = p.toObject();
      if (pObj.employees) {
        pObj.employees = pObj.employees.map(e => {
          if (e.employee_id && typeof e.employee_id === 'object') {
            e.employee_name = `${e.employee_id.first_name} ${e.employee_id.last_name}`;
            e.employee_code = e.employee_id.employee_code;
          }
          return e;
        });
      }
      return pObj;
    });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/payrolls', async (req, res) => {
  try {
    const { payroll_type, salary_month, payroll_date } = req.body;

    const count = await Payroll.countDocuments();
    const payNum = `PAY-${(count + 1).toString().padStart(4, '0')}`;

    const doc = new Payroll({
      payroll_number: payNum,
      payroll_date: payroll_date || new Date(),
      payroll_type: payroll_type || "Monthly",
      salary_month,
      approval_status: "Draft",
      payroll_status: "Generated"
    });

    await doc.save();
    res.status(201).json({ success: true, data: doc });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Generate Payroll (simulates calculations using templates/employees)
router.post('/payrolls/generate', async (req, res) => {
  try {
    const { salary_month, payroll_type } = req.body;
    
    // Clear any existing payroll runs and payslips for this specific month first to avoid duplicates/outdated records!
    await Payroll.deleteMany({ salary_month });
    await Payslip.deleteMany({ salary_month });

    const employees = await Employee.find({ employee_status: 'Active' });

    let calculatedEmployees = [];
    let totalSalary = 0;

    for (const emp of employees) {
      // 1. Fetch Salary Structure
      const salaryStruct = await SalaryStructure.findOne({ 
        $or: [{ employee_id: emp._id }, { employee_code: emp.employee_code }] 
      });
      
      let baseGross = salaryStruct ? (salaryStruct.gross_salary || 25000) : 25000;
      let pfDeduction = salaryStruct ? (salaryStruct.deductions_pf || 0) : 1500;
      let ptDeduction = salaryStruct ? (salaryStruct.deductions_tax || 0) : 300;
      
      // 2. Fetch Approved Salary Revision (overwrite gross if present)
      const latestRevision = await SalaryRevision.findOne({
        employee_id: emp._id,
        approval_status: 'Approved'
      }).sort({ created_at: -1 });
      
      if (latestRevision && latestRevision.new_salary_per_month) {
        baseGross = latestRevision.new_salary_per_month;
      }

      // 3. Fetch Tax Regime & Tax Slabs
      const taxRegime = await TaxRegime.findOne({
        employee_id: emp._id,
        approval_status: 'Approved'
      });
      const selectedRegime = taxRegime ? taxRegime.new_regime : 'New Regime';
      
      const taxSlabDoc = await TaxSlab.findOne({ regime_type: selectedRegime });
      let taxRate = 0.05; // 5% default rate
      
      if (taxSlabDoc && taxSlabDoc.slabs && taxSlabDoc.slabs.length > 0) {
        const annualIncome = baseGross * 12;
        const matchingSlab = taxSlabDoc.slabs.find(s => annualIncome >= s.from_amount && annualIncome <= s.to_amount);
        if (matchingSlab) {
          taxRate = (matchingSlab.tax_percentage || 0) / 100;
        }
      }
      
      // 4. Fetch Approved Declarations / IT Proofs
      const declaration = await TaxDeclaration.findOne({
        employee_id: emp._id,
        approval_status: 'Approved'
      });
      const decAmount = declaration ? (
        (declaration.general_declared_amount || 0) + 
        (declaration.hra_declared_amount || 0) + 
        (declaration.lta_declared_amount || 0)
      ) : 0;
      
      // Calculate TDS Tax: (Annual Gross - Declared Exemption) * TaxRate / 12 months
      const taxableIncome = Math.max(0, (baseGross * 12) - decAmount);
      let tdsDeduction = Math.round((taxableIncome * taxRate) / 12);
      if (isNaN(tdsDeduction) || tdsDeduction < 0) tdsDeduction = 0;

      // 5. Fetch Advance Salary deductions
      const advanceRecord = await AdvanceSalary.findOne({ employee_id: emp._id });
      let advanceDeduction = 0;
      if (advanceRecord && advanceRecord.installment_amount) {
        advanceDeduction = advanceRecord.installment_amount;
      }
      
      // Compute Net Payout
      const totalDeductions = pfDeduction + ptDeduction + tdsDeduction + advanceDeduction;
      const overtime = 0;
      const bonus = 0;
      const net = Math.max(0, baseGross + overtime + bonus - totalDeductions);

      calculatedEmployees.push({
        employee_id: emp._id,
        employee_code: emp.employee_code,
        employee_name: `${emp.first_name} ${emp.last_name}`,
        gross_amount: baseGross,
        deductions: totalDeductions,
        overtime_amount: overtime,
        bonus_amount: bonus,
        net_amount: net
      });
      
      totalSalary += net;
    }

    const payNum = `PAY-${Date.now().toString().slice(-4)}`;
    const newPayroll = new Payroll({
      payroll_number: payNum,
      payroll_date: new Date(),
      payroll_type: payroll_type || "Monthly",
      salary_month,
      total_work_day: 30,
      total_salary: totalSalary,
      approval_status: "Draft",
      payroll_status: "Generated",
      employees: calculatedEmployees
    });

    await newPayroll.save();

    // Auto generate payslip records matching this month's calculations
    for (const empPay of calculatedEmployees) {
      await Payslip.create({
        employee_id: empPay.employee_id,
        employee_code: empPay.employee_code,
        employee_name: empPay.employee_name,
        salary_month,
        gross_amount: empPay.gross_amount,
        net_amount: empPay.net_amount,
        working_days: 30,
        payroll_id: newPayroll._id
      });
    }

    res.json({ success: true, message: `Payroll generated successfully for ${employees.length} employees`, data: newPayroll });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/payrolls/submit-approval', async (req, res) => {
  try {
    const { id } = req.body;
    const doc = await Payroll.findByIdAndUpdate(id, { approval_status: "Pending" }, { new: true });
    res.json({ success: true, message: "Payroll submitted for approval", data: doc });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/payrolls/approve/:id', async (req, res) => {
  try {
    const doc = await Payroll.findByIdAndUpdate(req.params.id, { approval_status: "Approved", payroll_status: "Paid" }, { new: true });
    res.json({ success: true, message: "Payroll approved and disbursed", data: doc });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/payrolls/print', (req, res) => {
  res.json({ success: true, printUrl: "https://example.com/reports/payroll-sheet.pdf" });
});

router.post('/payrolls/settings', async (req, res) => {
  try {
    const settings = await PayrollSettings.findOneAndUpdate({}, req.body, { upsert: true, new: true });
    res.json({ success: true, message: "Settings updated successfully", data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 7. FINAL SETTLEMENT MODULE
// ==========================================
router.get('/payroll/final-settlements', async (req, res) => {
  try {
    const records = await FinalSettlement.find({}).populate('employee_id', 'first_name last_name employee_code');
    const data = resolveEmployeeNames(records);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/payroll/final-settlements', async (req, res) => {
  try {
    const { employee_id, settlement_date, month, settlement_amount, payment_status, template } = req.body;
    const emp = await Employee.findById(employee_id);
    if (!emp) return res.status(404).json({ success: false, message: "Employee not found" });

    let finalAmount = settlement_amount;
    if (!finalAmount || finalAmount === 0) {
      const struct = await SalaryStructure.findOne({ employee_id });
      const gross = struct ? (struct.gross_salary || 25000) : 25000;
      finalAmount = template === 'Immediate Release' ? gross : gross * 1.5;
    }

    const doc = new FinalSettlement({
      settlement_number: `SET-${Date.now()}`,
      employee_id,
      employee_code: emp.employee_code,
      employee_name: `${emp.first_name} ${emp.last_name}`,
      settlement_date: settlement_date || new Date(),
      month,
      settlement_amount: finalAmount,
      payment_status: payment_status || "Pending",
      template: template || "Standard"
    });

    await doc.save();
    res.status(201).json({ success: true, data: doc });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/payroll/final-settlement-settings', async (req, res) => {
  try {
    const doc = await FinalSettlementSettings.findOneAndUpdate({}, req.body, { upsert: true, new: true });
    res.json({ success: true, message: "Final settlement config updated", data: doc });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 8. PAYSLIP MODULE
// ==========================================
router.get('/payslips', async (req, res) => {
  try {
    const { salary_month } = req.query;
    let query = {};
    if (salary_month) query.salary_month = salary_month;

    const records = await Payslip.find(query).populate('employee_id', 'first_name last_name employee_code');
    const data = resolveEmployeeNames(records);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/payslips/generate', async (req, res) => {
  try {
    const { employee_id, salary_month, gross_amount, net_amount, working_days } = req.body;
    const emp = await Employee.findById(employee_id);
    if (!emp) return res.status(404).json({ success: false, message: "Employee not found" });

    const doc = new Payslip({
      employee_id,
      employee_code: emp.employee_code,
      employee_name: `${emp.first_name} ${emp.last_name}`,
      salary_month,
      gross_amount,
      net_amount,
      working_days,
      pdf_url: `https://example.com/slips/payslip-${emp.employee_code}-${salary_month}.pdf`
    });

    await doc.save();
    res.status(201).json({ success: true, data: doc });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/payslips/download/:id', async (req, res) => {
  try {
    const doc = await Payslip.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: "Payslip not found" });
    res.json({ success: true, pdfUrl: doc.pdf_url || "https://example.com/default-payslip.pdf" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 9. SALARY REVISION MODULE
// ==========================================
router.get('/payroll/salary-revisions', async (req, res) => {
  try {
    const records = await SalaryRevision.find({}).populate('employee_id', 'first_name last_name employee_code');
    const data = resolveEmployeeNames(records);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/payroll/salary-revisions', async (req, res) => {
  try {
    const {
      revision_type, revision_reason, employee_id, adjustment_type,
      amount, payout_from, calculation_type, notes
    } = req.body;

    const emp = await Employee.findById(employee_id);
    if (!emp) return res.status(404).json({ success: false, message: "Employee not found" });

    const oldMonthly = 30000; // Simulated default
    const newMonthly = revision_type === "Increment" ? (oldMonthly + Number(amount)) : (oldMonthly - Number(amount));

    const doc = new SalaryRevision({
      employee_id,
      employee_code: emp.employee_code,
      employee_name: `${emp.first_name} ${emp.last_name}`,
      revision_type,
      revision_reason,
      adjustment_type,
      amount,
      old_salary_per_month: oldMonthly,
      old_salary_per_year: oldMonthly * 12,
      new_salary_per_month: newMonthly,
      new_salary_per_year: newMonthly * 12,
      payout_from,
      calculation_type,
      notes,
      approval_status: "Applied"
    });

    await doc.save();
    res.status(201).json({ success: true, data: doc });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/payroll/salary-revisions/approve/:id', async (req, res) => {
  try {
    const doc = await SalaryRevision.findByIdAndUpdate(req.params.id, { approval_status: "Approved" }, { new: true });
    res.json({ success: true, message: "Revision approved", data: doc });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/payroll/salary-revisions/reject/:id', async (req, res) => {
  try {
    const doc = await SalaryRevision.findByIdAndUpdate(req.params.id, { approval_status: "Rejected" }, { new: true });
    res.json({ success: true, message: "Revision rejected", data: doc });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/payroll/salary-revisions/import', (req, res) => {
  res.json({ success: true, message: "Salary revisions uploaded/imported successfully" });
});

router.delete('/payroll/salary-revisions/:id', async (req, res) => {
  try {
    await SalaryRevision.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Revision record deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
