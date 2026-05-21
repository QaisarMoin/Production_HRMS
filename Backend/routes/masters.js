const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Import Custom Models
const Employee = require('../models/Employee');
const Department = require('../models/Department');
const Designation = require('../models/Designation');
const AttendanceRules = require('../models/AttendanceRules');
const EmployeeCategory = require('../models/EmployeeCategory');

// Import Master Lookups
const MasterModels = require('../models/MasterModels');
const {
  Holiday, Location, LeaveType, EmployeeLeaveAssignment,
  ShiftRoster, PermissionType, ReimbursementType,
  RegularizationReason, ResignReason, SalaryStructure,
  SourceOfHire, BonusPolicy, Degree
} = MasterModels;

// Helper function to dynamically map lookup model parameter
const getLookupModel = (name) => {
  const mapping = {
    'Holiday': Holiday,
    'EmployeeCategory': EmployeeCategory,
    'LeaveType': LeaveType,
    'PermissionType': PermissionType,
    'ReimbursementType': ReimbursementType,
    'RegularizationReason': RegularizationReason,
    'ResignReason': ResignReason,
    'SourceOfHire': SourceOfHire,
    'BonusPolicy': BonusPolicy,
    'Degree': Degree
  };
  return mapping[name] || null;
};

// ==========================================
// 1. EMPLOYEE MODULE ENDPOINTS
// ==========================================

// Get Employees
router.get('/employees', async (req, res) => {
  try {
    const { search, department, designation, employee_status } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { first_name: { $regex: search, $options: 'i' } },
        { last_name: { $regex: search, $options: 'i' } },
        { employee_code: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (department) query.department_id = department;
    if (designation) query.designation_id = designation;
    if (employee_status) query.employee_status = employee_status;

    const employees = await Employee.find(query)
      .populate('department_id')
      .populate('designation_id')
      .populate('employee_category_id')
      .populate('location_id')
      .populate('reporting_manager_id')
      .sort({ created_at: -1 });

    return res.status(200).json({ success: true, message: 'Employees fetched', data: employees });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Create Employee
router.post('/employees', async (req, res) => {
  try {
    const payload = { ...req.body };
    for (const key in payload) {
      if (payload[key] === '') {
        payload[key] = null;
      }
    }
    const employee = await Employee.create(payload);
    return res.status(201).json({ success: true, message: 'Employee created', data: employee });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Update Employee
router.put('/employees/:id', async (req, res) => {
  try {
    const payload = { ...req.body };
    for (const key in payload) {
      if (payload[key] === '') {
        payload[key] = null;
      }
    }
    const employee = await Employee.findByIdAndUpdate(req.params.id, payload, { new: true });
    return res.status(200).json({ success: true, message: 'Employee updated', data: employee });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Delete Employee
router.delete('/employees/:id', async (req, res) => {
  try {
    await Employee.findByIdAndDelete(req.params.id);
    return res.status(200).json({ success: true, message: 'Employee deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Reset password ESS
router.post('/employees/reset-ess-password', (req, res) => {
  return res.status(200).json({
    success: true,
    message: `ESS Password reset trigger fired. Mail sent to designated employee address.`
  });
});

// Bulk upload mockup
router.post('/employees/bulk-upload', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Parsed Excel upload sheet successfully. Imported 3 mock employee accounts.'
  });
});

// Export mockups
router.post('/employees/export', (req, res) => {
  return res.status(200).json({ success: true, message: 'Full list spreadsheet sheet ready' });
});

router.post('/employees/custom-export', (req, res) => {
  return res.status(200).json({ success: true, message: 'Custom columns spreadsheet sheet ready' });
});

// ==========================================
// 2. DESIGNATION MODULE ENDPOINTS
// ==========================================
router.get('/designations', async (req, res) => {
  try {
    const data = await Designation.find().sort({ created_at: -1 });
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});
router.post('/designations', async (req, res) => {
  try {
    const item = await Designation.create(req.body);
    return res.status(201).json({ success: true, data: item });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});
router.put('/designations/:id', async (req, res) => {
  try {
    const item = await Designation.findByIdAndUpdate(req.params.id, req.body, { new: true });
    return res.status(200).json({ success: true, data: item });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});
router.delete('/designations/:id', async (req, res) => {
  try {
    await Designation.findByIdAndDelete(req.params.id);
    return res.status(200).json({ success: true, message: 'Deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 3. ATTENDANCE RULE MODULE ENDPOINTS
// ==========================================
router.get('/attendance-rules', async (req, res) => {
  try {
    const data = await AttendanceRules.find().sort({ created_at: -1 });
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});
router.post('/attendance-rules', async (req, res) => {
  try {
    const item = await AttendanceRules.create(req.body);
    return res.status(201).json({ success: true, data: item });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});
router.put('/attendance-rules/:id', async (req, res) => {
  try {
    const item = await AttendanceRules.findByIdAndUpdate(req.params.id, req.body, { new: true });
    return res.status(200).json({ success: true, data: item });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});
router.delete('/attendance-rules/:id', async (req, res) => {
  try {
    await AttendanceRules.findByIdAndDelete(req.params.id);
    return res.status(200).json({ success: true, message: 'Deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 4. SHIFT ROSTER MODULE ENDPOINTS
// ==========================================
router.get('/shift-rosters', async (req, res) => {
  try {
    const { year, month } = req.query;
    const rosters = await ShiftRoster.find({ financial_year: year, month }).populate('employees.employee_id');
    return res.status(200).json({ success: true, data: rosters });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});
router.post('/shift-rosters/save', async (req, res) => {
  try {
    const { financial_year, month, employees } = req.body;
    let roster = await ShiftRoster.findOne({ financial_year, month });
    if (roster) {
      roster.employees = employees;
      await roster.save();
    } else {
      roster = await ShiftRoster.create(req.body);
    }
    return res.status(200).json({ success: true, message: 'Shift Roster saved successfully', data: roster });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 5. LOCATION MODULE ENDPOINTS
// ==========================================
router.get('/locations', async (req, res) => {
  try {
    const data = await Location.find().sort({ created_at: -1 });
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});
router.post('/locations', async (req, res) => {
  try {
    const item = await Location.create(req.body);
    return res.status(201).json({ success: true, data: item });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});
router.put('/locations/:id', async (req, res) => {
  try {
    const item = await Location.findByIdAndUpdate(req.params.id, req.body, { new: true });
    return res.status(200).json({ success: true, data: item });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});
router.delete('/locations/:id', async (req, res) => {
  try {
    await Location.findByIdAndDelete(req.params.id);
    return res.status(200).json({ success: true, message: 'Deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 6. ASSIGN LEAVE MODULE ENDPOINTS
// ==========================================
router.get('/employee-leave-assignments', async (req, res) => {
  try {
    const data = await EmployeeLeaveAssignment.find().populate('employee_id');
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});
router.post('/employee-leave-assignments', async (req, res) => {
  try {
    const item = await EmployeeLeaveAssignment.create(req.body);
    return res.status(201).json({ success: true, data: item });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});
router.put('/employee-leave-assignments/:id', async (req, res) => {
  try {
    const item = await EmployeeLeaveAssignment.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('employee_id');
    return res.status(200).json({ success: true, data: item });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});
router.delete('/employee-leave-assignments/:id', async (req, res) => {
  try {
    await EmployeeLeaveAssignment.findByIdAndDelete(req.params.id);
    return res.status(200).json({ success: true, message: 'Deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 7. SALARY STRUCTURE MODULE ENDPOINTS
// ==========================================
router.get('/salary-structures', async (req, res) => {
  try {
    const data = await SalaryStructure.find().populate('employee_id');
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});
router.post('/salary-structures', async (req, res) => {
  try {
    const item = await SalaryStructure.create(req.body);
    return res.status(201).json({ success: true, data: item });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});
router.put('/salary-structures/:id', async (req, res) => {
  try {
    const item = await SalaryStructure.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('employee_id');
    return res.status(200).json({ success: true, data: item });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});
router.delete('/salary-structures/:id', async (req, res) => {
  try {
    await SalaryStructure.findByIdAndDelete(req.params.id);
    return res.status(200).json({ success: true, message: 'Deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 8. DYNAMIC GENERIC LOOKUPS CRUD ENDPOINTS
// ==========================================

// Get dynamic lookup list
router.get('/lookup/:modelName', async (req, res) => {
  try {
    const Model = getLookupModel(req.params.modelName);
    if (!Model) {
      return res.status(400).json({ success: false, message: 'Invalid model configuration' });
    }
    const data = await Model.find().sort({ created_at: -1, modified_date: -1 });
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Create dynamic lookup record
router.post('/lookup/:modelName', async (req, res) => {
  try {
    const Model = getLookupModel(req.params.modelName);
    if (!Model) {
      return res.status(400).json({ success: false, message: 'Invalid model configuration' });
    }
    const item = await Model.create(req.body);
    return res.status(201).json({ success: true, data: item });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Update dynamic lookup record
router.put('/lookup/:modelName/:id', async (req, res) => {
  try {
    const Model = getLookupModel(req.params.modelName);
    if (!Model) {
      return res.status(400).json({ success: false, message: 'Invalid model configuration' });
    }
    const item = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true });
    return res.status(200).json({ success: true, data: item });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Delete dynamic lookup record
router.delete('/lookup/:modelName/:id', async (req, res) => {
  try {
    const Model = getLookupModel(req.params.modelName);
    if (!Model) {
      return res.status(400).json({ success: false, message: 'Invalid model configuration' });
    }
    await Model.findByIdAndDelete(req.params.id);
    return res.status(200).json({ success: true, message: 'Deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
