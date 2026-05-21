const mongoose = require('mongoose');

// 1. ATTENDANCE_LOGS COLLECTION
const AttendanceLogSchema = new mongoose.Schema({
  employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  employee_code: { type: String, required: true },
  employee_name: { type: String, required: true },
  department_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  designation_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Designation' },
  attendance_rule_id: { type: mongoose.Schema.Types.ObjectId, ref: 'AttendanceRules' },
  shift_roster_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Shift' }, // ref shift_rosters/shifts
  attendance_date: { type: Date, required: true },
  in_date: { type: Date },
  in_time: { type: String }, // e.g. "09:00"
  out_date: { type: Date },
  out_time: { type: String }, // e.g. "18:00"
  overnight_shift: { type: Boolean, default: false },
  permission_hours: { type: Number, default: 0 },
  worked_hours: { type: Number, default: 0 },
  work_day: { type: Number, default: 1 }, // e.g. 1, 0.5, 0
  leave_type_id: { type: mongoose.Schema.Types.ObjectId, ref: 'LeaveType' },
  leave_session: { type: String },
  work_date: { type: Date },
  early_out: { type: Boolean, default: false },
  late_in: { type: Boolean, default: false },
  attendance_status: {
    type: String,
    enum: ["Present", "Absent", "Half Day", "Leave", "Holiday"],
    default: 'Absent'
  },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

AttendanceLogSchema.index({ employee_id: 1, attendance_date: 1 }, { unique: true });

// 2. ATTENDANCE_HISTORY COLLECTION
const AttendanceHistorySchema = new mongoose.Schema({
  attendance_log_id: { type: mongoose.Schema.Types.ObjectId, ref: 'AttendanceLog', required: true },
  employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  attendance_date: { type: Date, required: true },
  old_in_time: { type: String },
  new_in_time: { type: String },
  old_out_time: { type: String },
  new_out_time: { type: String },
  modified_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  modified_at: { type: Date, default: Date.now }
});

// 3. ATTENDANCE_REGULARIZATIONS COLLECTION
const AttendanceRegularizationSchema = new mongoose.Schema({
  employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  attendance_log_id: { type: mongoose.Schema.Types.ObjectId, ref: 'AttendanceLog' },
  attendance_type: { type: String },
  in_date: { type: Date },
  in_time: { type: String },
  out_date: { type: Date },
  out_time: { type: String },
  regularization_reason_id: { type: mongoose.Schema.Types.ObjectId, ref: 'RegularizationReason' }, // ref regularization_reasons
  remarks: { type: String },
  overnight_shift: { type: Boolean, default: false },
  half_salary: { type: Boolean, default: false },
  attachment_urls: [{ type: String }],
  approval_status: {
    type: String,
    enum: ["Applied", "Approved", "Rejected"],
    default: "Applied"
  },
  approved_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approved_at: { type: Date },
  created_at: { type: Date, default: Date.now }
});

AttendanceRegularizationSchema.index({ approval_status: 1 });

// 4. OVERTIME_REQUESTS COLLECTION
const OvertimeRequestSchema = new mongoose.Schema({
  employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  employee_code: { type: String },
  employee_name: { type: String },
  overtime_entries: [
    {
      overtime_date: { type: Date },
      overtime_hours: { type: Number }
    }
  ],
  overtime_reason: { type: String },
  overtime_notes: { type: String },
  total_hours: { type: Number, default: 0 },
  attachment_urls: [{ type: String }],
  approval_status: {
    type: String,
    enum: ["Applied", "Approved", "Rejected"],
    default: "Applied"
  },
  approved_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approved_at: { type: Date },
  created_at: { type: Date, default: Date.now }
});

// 5. PERMISSION_REQUESTS COLLECTION
const PermissionRequestSchema = new mongoose.Schema({
  permission_number: { type: String, required: true },
  employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  employee_code: { type: String },
  employee_name: { type: String },
  department_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  permission_entries: [
    {
      permission_type_id: { type: mongoose.Schema.Types.ObjectId, ref: 'PermissionType' },
      permission_date: { type: Date },
      manual_entry: { type: Boolean, default: false },
      from_time: { type: String },
      to_time: { type: String },
      total_hours: { type: Number }
    }
  ],
  reason: { type: String },
  total_hours: { type: Number, default: 0 },
  attachment_urls: [{ type: String }],
  approval_status: {
    type: String,
    enum: ["Applied", "Approved", "Rejected"],
    default: "Applied"
  },
  approved_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  applied_date: { type: Date, default: Date.now },
  created_at: { type: Date, default: Date.now }
});

PermissionRequestSchema.index({ employee_id: 1 });

module.exports = {
  AttendanceLog: mongoose.model('AttendanceLog', AttendanceLogSchema),
  AttendanceHistory: mongoose.model('AttendanceHistory', AttendanceHistorySchema),
  AttendanceRegularization: mongoose.model('AttendanceRegularization', AttendanceRegularizationSchema),
  OvertimeRequest: mongoose.model('OvertimeRequest', OvertimeRequestSchema),
  PermissionRequest: mongoose.model('PermissionRequest', PermissionRequestSchema)
};
