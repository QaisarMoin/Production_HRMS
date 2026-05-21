const mongoose = require('mongoose');

const designationSchema = new mongoose.Schema({
  designation_name: {
    type: String,
    required: [true, 'Designation name is required'],
    trim: true
  },
  component_group: {
    type: String,
    enum: ["A", "B"],
    default: "A"
  },
  reporting_required: {
    type: Boolean,
    default: true
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

module.exports = mongoose.model('Designation', designationSchema);