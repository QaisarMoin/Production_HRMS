const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  department_name: {
    type: String,
    trim: true
  },
  name: {
    type: String,
    trim: true
  },
  code: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  headOfDepartment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  modified_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  modified_date: {
    type: Date,
    default: Date.now
  }
});

// Middleware to keep department_name and name automatically synchronized
departmentSchema.pre('save', function(next) {
  if (this.name && !this.department_name) {
    this.department_name = this.name;
  } else if (this.department_name && !this.name) {
    this.name = this.department_name;
  }
  
  if (this.status) {
    this.isActive = this.status === 'active';
  } else if (this.isActive !== undefined) {
    this.status = this.isActive ? 'active' : 'inactive';
  }
  
  this.modified_date = Date.now();
  next();
});

module.exports = mongoose.model('Department', departmentSchema);