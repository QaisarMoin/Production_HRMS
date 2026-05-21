const mongoose = require('mongoose');

const ReimbursementItemSchema = new mongoose.Schema({
  reimbursement_type_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ReimbursementType' },
  bill_number:           { type: String },
  bill_date:             { type: Date },
  bill_amount:           { type: Number, required: true, min: 0 },
  attachment_url:        { type: String }
});

const ReimbursementSchema = new mongoose.Schema({
  employee_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  employee_code:  { type: String, required: true },
  employee_name:  { type: String, required: true },
  department_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  designation_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Designation' },

  claim_number: {
    type: String,
    required: true,
    unique: true
  },
  claim_date: { type: Date, default: Date.now },

  reimbursement_items: [ReimbursementItemSchema],

  total_amount: { type: Number, default: 0 },
  paid_amount:  { type: Number, default: 0 },
  due_amount:   { type: Number, default: 0 },

  approval_status: {
    type: String,
    enum: ['Applied', 'Approved', 'Rejected'],
    default: 'Applied'
  },

  payment_status: {
    type: String,
    enum: ['Pending', 'Paid'],
    default: 'Pending'
  },

  remarks:      { type: String },
  approved_by:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  payment_date: { type: Date },
  payment_mode: { type: String },

  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// Auto-calculate amounts before save
ReimbursementSchema.pre('save', function (next) {
  this.total_amount = this.reimbursement_items.reduce(
    (sum, item) => sum + (Number(item.bill_amount) || 0), 0
  );
  this.due_amount = this.total_amount - (this.paid_amount || 0);
  this.updated_at = new Date();
  next();
});

ReimbursementSchema.index({ employee_id: 1, claim_date: -1 });
ReimbursementSchema.index({ approval_status: 1 });
ReimbursementSchema.index({ payment_status: 1 });

module.exports = mongoose.model('Reimbursement', ReimbursementSchema);
