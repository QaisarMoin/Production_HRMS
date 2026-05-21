const mongoose = require('mongoose');

const employeeCategorySchema = new mongoose.Schema({
  category_name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true
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

module.exports = mongoose.model('EmployeeCategory', employeeCategorySchema);