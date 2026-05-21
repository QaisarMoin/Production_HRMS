const mongoose = require('mongoose');

// 1. HOLIDAYS MODEL
const HolidaySchema = new mongoose.Schema({
  holiday_name: { type: String, required: true },
  holiday_date: { type: Date, required: true },
  description: { type: String },
  holiday_type: { type: String },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  created_at: { type: Date, default: Date.now }
});

// 2. LOCATIONS MODEL
const LocationSchema = new mongoose.Schema({
  location_name: { type: String, required: true },
  radius: { type: Number, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  status: { type: Boolean, default: true },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  created_at: { type: Date, default: Date.now }
});

// 3. LEAVE TYPES MODEL
const LeaveTypeSchema = new mongoose.Schema({
  leave_name: { type: String, required: true },
  allowed_days: { type: Number, required: true },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  created_at: { type: Date, default: Date.now }
});

// 4. EMPLOYEE LEAVE ASSIGNMENTS MODEL
const EmployeeLeaveAssignmentSchema = new mongoose.Schema({
  employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  employee_code: { type: String },
  employee_name: { type: String },
  casual_leave: { type: Number, default: 0 },
  sick_leave: { type: Number, default: 0 },
  marriage_leave: { type: Number, default: 0 },
  leave_balances: [{
    leave_type_id: { type: mongoose.Schema.Types.ObjectId, ref: 'LeaveType' },
    total_leave: { type: Number }
  }],
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  created_at: { type: Date, default: Date.now }
});

// 5. SHIFT ROSTERS MODEL
const ShiftRosterSchema = new mongoose.Schema({
  financial_year: { type: String, required: true },
  month: { type: String, required: true },
  from_date: { type: Date },
  to_date: { type: Date },
  load_employee_based_on: { type: String },
  employees: [{
    employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
    employee_code: { type: String },
    employee_name: { type: String },
    shifts: [{
      date: { type: Date },
      shift_name: { type: String }
    }]
  }],
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  created_at: { type: Date, default: Date.now }
});

// 6. PERMISSION TYPES MODEL
const PermissionTypeSchema = new mongoose.Schema({
  permission_type: { type: String, required: true },
  modified_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  modified_date: { type: Date, default: Date.now }
});

// 7. REIMBURSEMENT TYPES MODEL
const ReimbursementTypeSchema = new mongoose.Schema({
  reimbursement_type: { type: String, required: true },
  modified_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  modified_date: { type: Date, default: Date.now }
});

// 8. REGULARIZATION REASONS MODEL
const RegularizationReasonSchema = new mongoose.Schema({
  reason: { type: String, required: true },
  modified_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  modified_date: { type: Date, default: Date.now }
});

// 9. RESIGN REASONS MODEL
const ResignReasonSchema = new mongoose.Schema({
  reason: { type: String, required: true },
  modified_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  modified_date: { type: Date, default: Date.now }
});

// 10. SALARY STRUCTURES MODEL
const SalaryStructureSchema = new mongoose.Schema({
  employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  employee_code: { type: String },
  employee_name: { type: String },
  calculation_type: { type: String, enum: ["Manual", "Based On Formula"], default: "Based On Formula" },
  basic: { type: Number },
  hra: { type: Number },
  da: { type: Number },
  medical: { type: Number },
  other_allowances: { type: Number },
  deductions_pf: { type: Number, default: 0 },
  deductions_tax: { type: Number, default: 0 },
  deductions: [{
    component_name: { type: String },
    amount: { type: Number }
  }],
  gross_salary: { type: Number },
  component_group: { type: String, enum: ["A", "B"] },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  created_at: { type: Date, default: Date.now }
});

// 11. SOURCE OF HIRE MODEL
const SourceOfHireSchema = new mongoose.Schema({
  source_name: { type: String, required: true },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  created_at: { type: Date, default: Date.now }
});

// 12. BONUS POLICIES MODEL
const BonusPolicySchema = new mongoose.Schema({
  policy_name: { type: String, required: true },
  policy_type: { type: String },
  calculation_type: { type: String },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  created_at: { type: Date, default: Date.now }
});

// 13. DEGREES MODEL
const DegreeSchema = new mongoose.Schema({
  degree_name: { type: String, required: true },
  modified_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  modified_date: { type: Date, default: Date.now }
});

// Export all models
module.exports = {
  Holiday: mongoose.model('Holiday', HolidaySchema),
  Location: mongoose.model('Location', LocationSchema),
  LeaveType: mongoose.model('LeaveType', LeaveTypeSchema),
  EmployeeLeaveAssignment: mongoose.model('EmployeeLeaveAssignment', EmployeeLeaveAssignmentSchema),
  ShiftRoster: mongoose.model('ShiftRoster', ShiftRosterSchema),
  PermissionType: mongoose.model('PermissionType', PermissionTypeSchema),
  ReimbursementType: mongoose.model('ReimbursementType', ReimbursementTypeSchema),
  RegularizationReason: mongoose.model('RegularizationReason', RegularizationReasonSchema),
  ResignReason: mongoose.model('ResignReason', ResignReasonSchema),
  SalaryStructure: mongoose.model('SalaryStructure', SalaryStructureSchema),
  SourceOfHire: mongoose.model('SourceOfHire', SourceOfHireSchema),
  BonusPolicy: mongoose.model('BonusPolicy', BonusPolicySchema),
  Degree: mongoose.model('Degree', DegreeSchema)
};
