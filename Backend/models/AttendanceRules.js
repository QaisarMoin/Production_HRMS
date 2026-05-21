const mongoose = require('mongoose');

const attendanceRulesSchema = new mongoose.Schema({
  rule_name: {
    type: String,
    required: [true, 'Rule name is required'],
    trim: true
  },
  device_count: {
    type: Number,
    default: 1
  },
  rule_type: {
    type: String
  },
  work_day_calculation: {
    type: String
  },
  in_time: {
    type: String
  },
  out_time: {
    type: String
  },
  in_time_grace: {
    type: Number,
    default: 0
  },
  out_time_grace: {
    type: Number,
    default: 0
  },
  overnight_shift: {
    type: Boolean,
    default: false
  },
  continuous_shift: {
    type: Boolean,
    default: false
  },
  recover_leave_hours: {
    type: Boolean,
    default: false
  },
  description: {
    type: String
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('AttendanceRules', attendanceRulesSchema);