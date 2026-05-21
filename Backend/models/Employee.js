const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  employee_code: {
    type: String,
    required: [true, 'Employee code is required'],
    unique: true,
    trim: true
  },
  first_name: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  last_name: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  full_name: {
    type: String
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true
  },
  mobile: {
    type: String,
    trim: true
  },
  gender: {
    type: String
  },
  dob: {
    type: Date
  },
  joining_date: {
    type: Date
  },
  department_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  designation_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Designation'
  },
  employee_category_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EmployeeCategory'
  },
  location_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location'
  },
  reporting_manager_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  component_group: {
    type: String,
    enum: ["A", "B"]
  },
  branch: {
    type: String
  },
  employee_status: {
    type: String,
    enum: ["Active", "Inactive", "Resigned", "Terminated"],
    default: "Active"
  },
  state: {
    type: String
  },
  migrant: {
    type: Boolean,
    default: false
  },
  salary_structure_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SalaryStructure'
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Auto generate full name and set updated timestamp
employeeSchema.pre('save', function(next) {
  this.full_name = `${this.first_name} ${this.last_name}`;
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('Employee', employeeSchema);