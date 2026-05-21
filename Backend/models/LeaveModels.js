const mongoose = require('mongoose');

// 1. LEAVE_REQUESTS COLLECTION
const LeaveRequestSchema = new mongoose.Schema({
  employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  employee_code: { type: String, required: true },
  employee_name: { type: String, required: true },
  leave_type: { 
    type: String, 
    enum: ['casual_leave', 'sick_leave', 'marriage_leave'], 
    required: true 
  },
  from_date: { type: Date, required: true },
  to_date: { type: Date, required: true },
  total_leave_days: { type: Number, required: true },
  leave_session: { 
    type: String, 
    enum: ['Full Day', 'Session 1', 'Session 2'], 
    default: 'Full Day' 
  },
  reason: { type: String },
  approval_status: { 
    type: String, 
    enum: ['Applied', 'Approved', 'Under Check', 'Rejected'], 
    default: 'Applied' 
  },
  approved_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  remarks: { type: String },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// 2. LEAVE_BALANCES COLLECTION
const LeaveBalanceSchema = new mongoose.Schema({
  employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  employee_code: { type: String, required: true },
  employee_name: { type: String, required: true },
  casual_leave: { type: Number, default: 0 },
  sick_leave: { type: Number, default: 0 },
  marriage_leave: { type: Number, default: 0 },
  total_leave: { type: Number, default: 0 },
  financial_year: { type: String, required: true }
});

LeaveBalanceSchema.index({ employee_id: 1, financial_year: 1 }, { unique: true });

// Auto calculate total_leave
LeaveBalanceSchema.pre('save', function(next) {
  this.total_leave = (this.casual_leave || 0) + (this.sick_leave || 0) + (this.marriage_leave || 0);
  next();
});

// 3. LEAVE_BALANCE_HISTORY COLLECTION
const LeaveBalanceHistorySchema = new mongoose.Schema({
  employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  employee_code: { type: String, required: true },
  employee_name: { type: String, required: true },
  leave_type: { type: String, required: true },
  old_balance: { type: Number, required: true },
  new_balance: { type: Number, required: true },
  transaction_type: { 
    type: String, 
    enum: ['Credit', 'Debit', 'Adjust', 'Import', 'Encashment'], 
    required: true 
  },
  remarks: { type: String },
  financial_year: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
});

// 4. LEAVE_ENCASHMENTS COLLECTION
const LeaveEncashmentSchema = new mongoose.Schema({
  encashment_number: { type: String, required: true, unique: true },
  encashment_date: { type: Date, default: Date.now },
  month_name: { type: String, required: true },
  number_of_employees: { type: Number, default: 0 },
  total_amount: { type: Number, default: 0 },
  payroll_status: { 
    type: String, 
    enum: ['Pending', 'Synced'], 
    default: 'Pending' 
  },
  payment_status: { 
    type: String, 
    enum: ['Unpaid', 'Paid'], 
    default: 'Unpaid' 
  },
  financial_year: { type: String, required: true },
  leave_type: { type: String, required: true },
  include_in_payroll: { type: Boolean, default: true },
  employees: [{
    employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    employee_code: { type: String },
    employee_name: { type: String },
    gross_salary: { type: Number },
    per_day_wages: { type: Number },
    leave_balance: { type: Number },
    encashed_days: { type: Number },
    amount: { type: Number }
  }]
});

// 5. LEAVE_ENCASHMENT_SETTINGS COLLECTION
const LeaveEncashmentSettingsSchema = new mongoose.Schema({
  prefix: { type: String, default: 'ENC-' },
  initial: { type: Number, default: 1 },
  suffix: { type: String, default: '' },
  reset_number: { type: Boolean, default: false },
  enable_date: { type: Boolean, default: true },
  enhancement: { type: Boolean, default: false },
  per_day_wages_type: { 
    type: String, 
    enum: ['Month', 'Month Days', 'Custom Days'], 
    default: 'Month Days' 
  },
  custom_days: { type: Number, default: 30 }
});

// 6. LEAVE_ENCASHMENT_COMPONENTS COLLECTION
const LeaveEncashmentComponentSchema = new mongoose.Schema({
  component_group: { type: String, enum: ['A', 'B'], required: true },
  leave_type: { type: String, required: true },
  component_type: { 
    type: String, 
    enum: ['Gross Salary', 'Specific Component'], 
    default: 'Gross Salary' 
  },
  payroll_component: [{ 
    type: String 
  }] // e.g. ['Basic', 'HRA', 'Medical', 'Other Allowances']
});

LeaveEncashmentComponentSchema.index({ component_group: 1, leave_type: 1 }, { unique: true });

// 7. LEAVE_SETTINGS COLLECTION (For global attendance settings blocking etc)
const LeaveSettingsSchema = new mongoose.Schema({
  attendance_mode: { 
    type: String, 
    enum: ['Manual Attendance', 'Device Attendance'], 
    default: 'Device Attendance' 
  }
});

module.exports = {
  LeaveRequest: mongoose.model('LeaveRequest', LeaveRequestSchema),
  LeaveBalance: mongoose.model('LeaveBalance', LeaveBalanceSchema),
  LeaveBalanceHistory: mongoose.model('LeaveBalanceHistory', LeaveBalanceHistorySchema),
  LeaveEncashment: mongoose.model('LeaveEncashment', LeaveEncashmentSchema),
  LeaveEncashmentSettings: mongoose.model('LeaveEncashmentSettings', LeaveEncashmentSettingsSchema),
  LeaveEncashmentComponent: mongoose.model('LeaveEncashmentComponent', LeaveEncashmentComponentSchema),
  LeaveSettings: mongoose.model('LeaveSettings', LeaveSettingsSchema)
};
