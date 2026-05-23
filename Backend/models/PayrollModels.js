const mongoose = require('mongoose');

// ==========================================
// 1. TAX REGIME SCHEMA
// ==========================================
const taxRegimeSchema = new mongoose.Schema({
  employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  employee_code: { type: String, required: true },
  employee_name: { type: String, required: true },
  previous_regime: { type: String, default: "Old Regime" },
  new_regime: {
    type: String,
    enum: ["Old Regime", "New Regime"],
    required: true
  },
  submitted_date: { type: Date, default: Date.now },
  approval_status: {
    type: String,
    enum: ["Applied", "Approved", "Rejected"],
    default: "Applied"
  },
  approved_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  created_at: { type: Date, default: Date.now }
});

// ==========================================
// 2. TAX SLAB SCHEMA
// ==========================================
const taxSlabSchema = new mongoose.Schema({
  regime_type: { type: String, required: true }, // "Old Regime", "New Regime"
  age_group: { type: String, required: true },   // "Below 60", "60 to 80", "Above 80"
  slabs: [
    {
      income_slab_name: { type: String, required: true },
      from_amount: { type: Number, required: true },
      to_amount: { type: Number, required: true },
      tax_percentage: { type: Number, required: true }
    }
  ]
});

// ==========================================
// 3. TAX DECLARATION SCHEMA
// ==========================================
const taxDeclarationSchema = new mongoose.Schema({
  employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  financial_year: { type: String, required: true },
  general_declared_amount: { type: Number, default: 0 },
  hra_declared_amount: { type: Number, default: 0 },
  lta_declared_amount: { type: Number, default: 0 },
  approval_status: { type: String, enum: ["Applied", "Approved", "Rejected"], default: "Applied" },
  approved_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  created_at: { type: Date, default: Date.now }
});

// ==========================================
// 4. APPROVED IT PROOF SCHEMA
// ==========================================
const itProofSchema = new mongoose.Schema({
  employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  financial_year: { type: String, required: true },
  general_declared_amount: { type: Number, default: 0 },
  hra_declared_amount: { type: Number, default: 0 },
  lta_declared_amount: { type: Number, default: 0 },
  proof_documents: [{ type: String }],
  approval_status: { type: String, enum: ["Applied", "Approved", "Rejected"], default: "Applied" },
  approved_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  created_at: { type: Date, default: Date.now }
});

// ==========================================
// 5. PREVIOUS DEDUCTION SCHEMA
// ==========================================
const previousDeductionSchema = new mongoose.Schema({
  financial_year: { type: String, required: true },
  employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  employee_name: { type: String, required: true },
  previous_company_basic_amount: { type: Number, default: 0 },
  previous_company_hra_amount: { type: Number, default: 0 },
  previous_company_gross_amount: { type: Number, default: 0 },
  previous_company_income_tax: { type: Number, default: 0 },
  previous_company_pf_amount: { type: Number, default: 0 },
  previous_company_prof_tax: { type: Number, default: 0 },
  attachments: [{ type: String }],
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  created_at: { type: Date, default: Date.now }
});

// ==========================================
// 6. ADVANCE SALARY SCHEMA
// ==========================================
const advanceSalarySchema = new mongoose.Schema({
  advance_salary_number: { type: String, required: true },
  employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  employee_code: { type: String, required: true },
  employee_name: { type: String, required: true },
  advance_date: { type: Date, default: Date.now },
  advance_amount: { type: Number, required: true },
  recovery_cycle: { type: Number, required: true }, // In Months
  recovery_from: { type: String, required: true },  // e.g. "2026-06"
  recovery_mode: {
    type: String,
    enum: ["Lumpsum", "Installments"],
    default: "Installments"
  },
  number_of_installments: { type: Number, default: 1 },
  installment_amount: { type: Number, required: true },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  created_at: { type: Date, default: Date.now }
});

// ==========================================
// 7. PAYROLL SCHEMA
// ==========================================
const payrollSchema = new mongoose.Schema({
  payroll_number: { type: String, required: true },
  payroll_date: { type: Date, default: Date.now },
  payroll_type: {
    type: String,
    enum: ["Monthly", "Hourly"],
    default: "Monthly"
  },
  salary_month: { type: String, required: true }, // e.g. "2026-05"
  total_work_day: { type: Number, default: 30 },
  total_salary: { type: Number, default: 0 },
  approval_status: { type: String, enum: ["Draft", "Pending", "Approved", "Rejected"], default: "Draft" },
  payroll_status: { type: String, enum: ["Generated", "Paid", "Voided"], default: "Generated" },
  employees: [
    {
      employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
      employee_code: { type: String },
      employee_name: { type: String },
      gross_amount: { type: Number, default: 0 },
      net_amount: { type: Number, default: 0 },
      deductions: { type: Number, default: 0 },
      overtime_amount: { type: Number, default: 0 },
      bonus_amount: { type: Number, default: 0 }
    }
  ],
  generated_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  created_at: { type: Date, default: Date.now }
});

// ==========================================
// 8. PAYROLL SETTINGS SCHEMA
// ==========================================
const payrollSettingsSchema = new mongoose.Schema({
  prefix: { type: String, default: "PAY" },
  initial_number: { type: Number, default: 1001 },
  suffix: { type: String, default: "2026" },
  reset_number: { type: Boolean, default: false },
  send_payslip_email: { type: Boolean, default: true },
  enable_table_doc_number: { type: Boolean, default: true }
});

// ==========================================
// 9. FINAL SETTLEMENT SCHEMA
// ==========================================
const finalSettlementSchema = new mongoose.Schema({
  settlement_number: { type: String, required: true },
  employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  employee_code: { type: String, required: true },
  employee_name: { type: String, required: true },
  settlement_date: { type: Date, default: Date.now },
  month: { type: String, required: true }, // e.g. "2026-05"
  settlement_amount: { type: Number, required: true },
  payment_status: { type: String, enum: ["Pending", "Paid"], default: "Pending" },
  template: { type: String, default: "Standard" },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  created_at: { type: Date, default: Date.now }
});

// ==========================================
// 10. FINAL SETTLEMENT SETTINGS SCHEMA
// ==========================================
const finalSettlementSettingsSchema = new mongoose.Schema({
  notice_period_recovery: { type: Boolean, default: true },
  gratuity_calculation_years: { type: Number, default: 5 },
  leave_encashment_applicable: { type: Boolean, default: true }
});

// ==========================================
// 11. PAYSLIP SCHEMA
// ==========================================
const payslipSchema = new mongoose.Schema({
  employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  employee_code: { type: String, required: true },
  employee_name: { type: String, required: true },
  salary_month: { type: String, required: true }, // e.g. "2026-05"
  gross_amount: { type: Number, required: true },
  net_amount: { type: Number, required: true },
  working_days: { type: Number, required: true },
  payroll_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Payroll' },
  pdf_url: { type: String, default: "" },
  generated_at: { type: Date, default: Date.now }
});

// ==========================================
// 12. SALARY REVISION SCHEMA
// ==========================================
const salaryRevisionSchema = new mongoose.Schema({
  employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  employee_code: { type: String, required: true },
  employee_name: { type: String, required: true },
  revision_type: {
    type: String,
    enum: ["Increment", "Decrement"],
    required: true
  },
  revision_reason: { type: String },
  adjustment_type: { type: String }, // e.g. "Flat", "Percentage"
  amount: { type: Number, required: true },
  old_salary_per_month: { type: Number, default: 0 },
  old_salary_per_year: { type: Number, default: 0 },
  new_salary_per_month: { type: Number, default: 0 },
  new_salary_per_year: { type: Number, default: 0 },
  payout_from: { type: String, required: true }, // e.g. "2026-06"
  calculation_type: {
    type: String,
    enum: ["Based On Formula", "Manual"],
    default: "Manual"
  },
  breakup_type: { type: String },
  pay_arrears: { type: Boolean, default: false },
  arrears_month: { type: String },
  arrears_for: { type: String },
  salary_components: [
    {
      component_name: { type: String },
      component_value: { type: Number },
      revised_breakup: { type: Number },
      total_breakup: { type: Number }
    }
  ],
  notes: { type: String },
  approval_status: { type: String, enum: ["Applied", "Approved", "Rejected"], default: "Applied" },
  approved_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  created_at: { type: Date, default: Date.now }
});

// Register and Export Models
module.exports = {
  TaxRegime: mongoose.model('TaxRegime', taxRegimeSchema),
  TaxSlab: mongoose.model('TaxSlab', taxSlabSchema),
  TaxDeclaration: mongoose.model('TaxDeclaration', taxDeclarationSchema),
  ITProof: mongoose.model('ITProof', itProofSchema),
  PreviousDeduction: mongoose.model('PreviousDeduction', previousDeductionSchema),
  AdvanceSalary: mongoose.model('AdvanceSalary', advanceSalarySchema),
  Payroll: mongoose.model('Payroll', payrollSchema),
  PayrollSettings: mongoose.model('PayrollSettings', payrollSettingsSchema),
  FinalSettlement: mongoose.model('FinalSettlement', finalSettlementSchema),
  FinalSettlementSettings: mongoose.model('FinalSettlementSettings', finalSettlementSettingsSchema),
  Payslip: mongoose.model('Payslip', payslipSchema),
  SalaryRevision: mongoose.model('SalaryRevision', salaryRevisionSchema)
};
