const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Import Custom Models
const Employee = require('../models/Employee');
const { SalaryStructure, LeaveType } = require('../models/MasterModels');
const { AttendanceLog } = require('../models/AttendanceModels');
const { 
  LeaveRequest, 
  LeaveBalance, 
  LeaveBalanceHistory, 
  LeaveEncashment, 
  LeaveEncashmentSettings, 
  LeaveEncashmentComponent,
  LeaveSettings
} = require('../models/LeaveModels');

// Helper to determine financial year from date
const getFinancialYearString = (dateStr) => {
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = d.getMonth(); // 0-indexed: 0 = Jan, 3 = April
  if (month >= 3) {
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
};

// Helper to calculate days between two dates inclusive
const calculateDaysInclusive = (from, to, session) => {
  if (session && session !== 'Full Day') {
    return 0.5;
  }
  const f = new Date(from);
  const t = new Date(to);
  const diffTime = Math.abs(t - f);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays;
};

// ==========================================
// 1. LEAVE SETTINGS (Global Attendance Mode)
// ==========================================

// GET /api/leave-settings
router.get('/leave-settings', async (req, res) => {
  try {
    let settings = await LeaveSettings.findOne();
    if (!settings) {
      settings = await LeaveSettings.create({ attendance_mode: 'Device Attendance' });
    }
    return res.status(200).json({ success: true, data: settings });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/leave-settings
router.post('/leave-settings', async (req, res) => {
  try {
    const { attendance_mode } = req.body;
    let settings = await LeaveSettings.findOne();
    if (settings) {
      settings.attendance_mode = attendance_mode;
      await settings.save();
    } else {
      settings = await LeaveSettings.create({ attendance_mode });
    }
    return res.status(200).json({ success: true, message: 'Settings updated successfully', data: settings });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 2. APPROVE LEAVE MODULE ENDPOINTS
// ==========================================

// GET /api/leaves
router.get('/leaves', async (req, res) => {
  try {
    const { search, approval_status, page = 1, limit = 10 } = req.query;
    let query = {};

    if (approval_status) {
      query.approval_status = approval_status;
    }

    let list = await LeaveRequest.find(query)
      .populate('employee_id')
      .sort({ created_at: -1 });

    // In-memory filters for search matching name/code
    if (search && search.trim()) {
      const term = search.trim().toLowerCase();
      list = list.filter(l => 
        (l.employee_name || '').toLowerCase().includes(term) ||
        (l.employee_code || '').toLowerCase().includes(term) ||
        (l.leave_type || '').toLowerCase().includes(term)
      );
    }

    const total = list.length;
    const paginated = list.slice((page - 1) * limit, page * limit);

    return res.status(200).json({ 
      success: true, 
      data: paginated, 
      total,
      page: Number(page),
      limit: Number(limit)
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/leaves (Apply Leave)
router.post('/leaves', async (req, res) => {
  try {
    const { employee_id, leave_type, from_date, to_date, reason, leave_session = 'Full Day' } = req.body;

    // 1. Check Attendance Setting manual restriction
    const settings = await LeaveSettings.findOne();
    if (settings && settings.attendance_mode === 'Manual Attendance') {
      return res.status(400).json({
        success: false,
        message: 'Leave Apply is NOT allowed when attendance setting is set to Manual Attendance'
      });
    }

    // Fetch employee details
    const employee = await Employee.findById(employee_id);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // Calc leave days
    const total_leave_days = calculateDaysInclusive(from_date, to_date, leave_session);

    // 2. Overlap Validation
    const startRange = new Date(from_date);
    const endRange = new Date(to_date);

    const overlap = await LeaveRequest.findOne({
      employee_id,
      approval_status: { $ne: 'Rejected' },
      $or: [
        { from_date: { $lte: endRange }, to_date: { $gte: startRange } }
      ]
    });

    if (overlap) {
      return res.status(400).json({
        success: false,
        message: `Selected dates overlap with an existing request (${overlap.leave_type} - ${overlap.approval_status})`
      });
    }

    // 3. Leave Balance Validation
    const financial_year = getFinancialYearString(from_date);
    const balance = await LeaveBalance.findOne({ employee_id, financial_year });
    if (!balance) {
      return res.status(400).json({
        success: false,
        message: `Leave balance records not initialized for Employee for financial year ${financial_year}. Please configure opening balances first.`
      });
    }

    const currentBalance = balance[leave_type] || 0;
    if (currentBalance < total_leave_days) {
      return res.status(400).json({
        success: false,
        message: `Insufficient leave balance. Remaining ${leave_type.replace('_', ' ')} is ${currentBalance} day(s), but requested ${total_leave_days} day(s).`
      });
    }

    // Create leave request
    const newLeave = await LeaveRequest.create({
      employee_id,
      employee_code: employee.employee_code,
      employee_name: `${employee.first_name} ${employee.last_name}`,
      leave_type,
      from_date,
      to_date,
      total_leave_days,
      leave_session,
      reason,
      approval_status: 'Applied'
    });

    return res.status(201).json({
      success: true,
      message: 'Leave application submitted successfully',
      data: newLeave
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/leaves/approve/:id
router.post('/leaves/approve/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;
    const request = await LeaveRequest.findById(id);

    if (!request) {
      return res.status(404).json({ success: false, message: 'Leave request not found' });
    }

    if (request.approval_status === 'Approved') {
      return res.status(400).json({ success: false, message: 'Leave request is already approved' });
    }

    const financial_year = getFinancialYearString(request.from_date);

    // Get Employee balance
    const balance = await LeaveBalance.findOne({ employee_id: request.employee_id, financial_year });
    if (!balance) {
      return res.status(400).json({ success: false, message: 'Employee leave balance record not found for this financial year' });
    }

    const leaveField = request.leave_type;
    const oldVal = balance[leaveField] || 0;

    if (oldVal < request.total_leave_days) {
      return res.status(400).json({ success: false, message: 'Employee has insufficient leave balance to approve this request' });
    }

    // Deduct leave balance
    const newVal = oldVal - request.total_leave_days;
    balance[leaveField] = newVal;
    await balance.save();

    // Log history
    await LeaveBalanceHistory.create({
      employee_id: request.employee_id,
      employee_code: request.employee_code,
      employee_name: request.employee_name,
      leave_type: request.leave_type,
      old_balance: oldVal,
      new_balance: newVal,
      transaction_type: 'Debit',
      remarks: `Deduction for Leave Request #${request._id}`,
      financial_year
    });

    // Update leave request
    request.approval_status = 'Approved';
    request.remarks = remarks || request.remarks;
    request.updated_at = new Date();
    await request.save();

    // Sync with Attendance Module:
    // Create/override AttendanceLog for each day in range to status "Leave"
    const start = new Date(request.from_date);
    const end = new Date(request.to_date);

    // Fetch the LeaveType model to reference if present
    const leaveTypeLookup = await LeaveType.findOne({ leave_name: { $regex: new RegExp(request.leave_type.replace('_', ' '), 'i') } });

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const targetDate = new Date(d);
      const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
      const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59);

      // Try updating or creating log
      await AttendanceLog.findOneAndUpdate(
        { employee_id: request.employee_id, attendance_date: { $gte: startOfDay, $lte: endOfDay } },
        {
          employee_id: request.employee_id,
          employee_code: request.employee_code,
          employee_name: request.employee_name,
          attendance_date: targetDate,
          attendance_status: 'Leave',
          leave_type_id: leaveTypeLookup?._id || null,
          leave_session: request.leave_session,
          worked_hours: 0,
          work_day: request.leave_session === 'Full Day' ? 0 : 0.5,
          updated_at: new Date()
        },
        { upsert: true, new: true }
      );
    }

    return res.status(200).json({
      success: true,
      message: 'Leave request approved, balance deducted and attendance synced successfully',
      data: request
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/leaves/reject/:id
router.post('/leaves/reject/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;
    const request = await LeaveRequest.findById(id);

    if (!request) {
      return res.status(404).json({ success: false, message: 'Leave request not found' });
    }

    request.approval_status = 'Rejected';
    request.remarks = remarks || request.remarks;
    request.updated_at = new Date();
    await request.save();

    return res.status(200).json({
      success: true,
      message: 'Leave request rejected',
      data: request
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/leaves/under-check/:id
router.post('/leaves/under-check/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;
    const request = await LeaveRequest.findById(id);

    if (!request) {
      return res.status(404).json({ success: false, message: 'Leave request not found' });
    }

    request.approval_status = 'Under Check';
    request.remarks = remarks || request.remarks;
    request.updated_at = new Date();
    await request.save();

    return res.status(200).json({
      success: true,
      message: 'Leave request marked as Under Check',
      data: request
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/leaves/:id
router.delete('/leaves/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const request = await LeaveRequest.findById(id);

    if (!request) {
      return res.status(404).json({ success: false, message: 'Leave request not found' });
    }

    if (request.approval_status === 'Approved') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete an already approved leave request. Please reject or adjust first.'
      });
    }

    await LeaveRequest.findByIdAndDelete(id);
    return res.status(200).json({ success: true, message: 'Leave request deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 3. LEAVE BALANCE MODULE ENDPOINTS
// ==========================================

// GET /api/leave-balances
router.get('/leave-balances', async (req, res) => {
  try {
    const { year, search } = req.query;
    let query = {};
    if (year) {
      query.financial_year = year;
    }

    let balances = await LeaveBalance.find(query).populate('employee_id');

    if (search && search.trim()) {
      const term = search.trim().toLowerCase();
      balances = balances.filter(b => 
        (b.employee_name || '').toLowerCase().includes(term) ||
        (b.employee_code || '').toLowerCase().includes(term)
      );
    }

    return res.status(200).json({ success: true, data: balances });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/leave-balances/opening
router.get('/leave-balances/opening', async (req, res) => {
  try {
    const { year } = req.query;
    const query = year ? { financial_year: year } : {};
    const list = await LeaveBalance.find(query);
    return res.status(200).json({ success: true, data: list });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/leave-balances/opening
router.post('/leave-balances/opening', async (req, res) => {
  try {
    const { financial_year, employees } = req.body;
    if (!financial_year || !employees || !Array.isArray(employees)) {
      return res.status(400).json({ success: false, message: 'financial_year and employees array are required' });
    }

    const saved = [];
    for (const empData of employees) {
      const employee = await Employee.findById(empData.employee_id);
      if (!employee) continue;

      const casual = Number(empData.casual_leave) || 0;
      const sick = Number(empData.sick_leave) || 0;
      const marriage = Number(empData.marriage_leave) || 0;

      const filter = { employee_id: empData.employee_id, financial_year };
      const update = {
        employee_code: employee.employee_code,
        employee_name: `${employee.first_name} ${employee.last_name}`,
        casual_leave: casual,
        sick_leave: sick,
        marriage_leave: marriage,
        total_leave: casual + sick + marriage
      };

      // Find old balance to track in history
      const oldBalance = await LeaveBalance.findOne(filter);
      const doc = await LeaveBalance.findOneAndUpdate(
        filter,
        update,
        { upsert: true, new: true }
      );
      saved.push(doc);

      // Log history
      await LeaveBalanceHistory.create({
        employee_id: employee._id,
        employee_code: employee.employee_code,
        employee_name: `${employee.first_name} ${employee.last_name}`,
        leave_type: 'opening_balance',
        old_balance: oldBalance ? oldBalance.total_leave : 0,
        new_balance: doc.total_leave,
        transaction_type: 'Adjust',
        remarks: 'Opening Balance initialized / modified',
        financial_year
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Opening balances configured successfully',
      data: saved
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/leave-balances/import
router.post('/leave-balances/import', async (req, res) => {
  try {
    const { financial_year, balances } = req.body;
    if (!financial_year || !balances || !Array.isArray(balances)) {
      return res.status(400).json({ success: false, message: 'financial_year and balances array are required' });
    }

    const saved = [];
    const errors = [];

    for (const item of balances) {
      const employee = await Employee.findOne({ employee_code: item.employee_code });
      if (!employee) {
        errors.push(`Employee code ${item.employee_code} not found in database`);
        continue;
      }

      const casual = Number(item.casual_leave) || 0;
      const sick = Number(item.sick_leave) || 0;
      const marriage = Number(item.marriage_leave) || 0;

      const filter = { employee_id: employee._id, financial_year };
      const oldBalance = await LeaveBalance.findOne(filter);
      const update = {
        employee_code: employee.employee_code,
        employee_name: `${employee.first_name} ${employee.last_name}`,
        casual_leave: casual,
        sick_leave: sick,
        marriage_leave: marriage,
        total_leave: casual + sick + marriage
      };

      const doc = await LeaveBalance.findOneAndUpdate(
        filter,
        update,
        { upsert: true, new: true }
      );
      saved.push(doc);

      await LeaveBalanceHistory.create({
        employee_id: employee._id,
        employee_code: employee.employee_code,
        employee_name: `${employee.first_name} ${employee.last_name}`,
        leave_type: 'import',
        old_balance: oldBalance ? oldBalance.total_leave : 0,
        new_balance: doc.total_leave,
        transaction_type: 'Import',
        remarks: 'Imported leave balance from spreadsheet',
        financial_year
      });
    }

    return res.status(200).json({
      success: true,
      message: `Parsed and imported ${saved.length} employee balance records.`,
      errors,
      data: saved
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/leave-balances/export
router.post('/leave-balances/export', async (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Leave Balance export compiled successfully',
    url: 'https://example.com/exports/leave-balances.xlsx'
  });
});

// PUT /api/leave-balances/:id
router.put('/leave-balances/:id', async (req, res) => {
  try {
    const { casual_leave, sick_leave, marriage_leave, remarks } = req.body;
    const balance = await LeaveBalance.findById(req.params.id);
    if (!balance) {
      return res.status(404).json({ success: false, message: 'Balance record not found' });
    }

    const oldCasual = balance.casual_leave;
    const oldSick = balance.sick_leave;
    const oldMarriage = balance.marriage_leave;
    const oldTotal = balance.total_leave;

    balance.casual_leave = Number(casual_leave) !== undefined ? Number(casual_leave) : balance.casual_leave;
    balance.sick_leave = Number(sick_leave) !== undefined ? Number(sick_leave) : balance.sick_leave;
    balance.marriage_leave = Number(marriage_leave) !== undefined ? Number(marriage_leave) : balance.marriage_leave;
    await balance.save(); // pre-save hook will recalculate total

    // Audit logs
    await LeaveBalanceHistory.create({
      employee_id: balance.employee_id,
      employee_code: balance.employee_code,
      employee_name: balance.employee_name,
      leave_type: 'adjustment',
      old_balance: oldTotal,
      new_balance: balance.total_leave,
      transaction_type: 'Adjust',
      remarks: remarks || `Manual adjustment. Casual: ${oldCasual}->${balance.casual_leave}, Sick: ${oldSick}->${balance.sick_leave}, Marriage: ${oldMarriage}->${balance.marriage_leave}`,
      financial_year: balance.financial_year
    });

    return res.status(200).json({ success: true, message: 'Balance updated successfully', data: balance });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});


// ==========================================
// 4. LEAVE ENCASHMENT MODULE ENDPOINTS
// ==========================================

// GET /api/leave-encashments
router.get('/leave-encashments', async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    let query = {};

    let list = await LeaveEncashment.find(query).sort({ encashment_date: -1 });

    if (search && search.trim()) {
      const term = search.trim().toLowerCase();
      list = list.filter(l => 
        l.encashment_number.toLowerCase().includes(term) ||
        l.month_name.toLowerCase().includes(term)
      );
    }

    const total = list.length;
    const paginated = list.slice((page - 1) * limit, page * limit);

    return res.status(200).json({ 
      success: true, 
      data: paginated, 
      total 
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/leave-encashments/settings
router.get('/leave-encashments/settings', async (req, res) => {
  try {
    let settings = await LeaveEncashmentSettings.findOne();
    if (!settings) {
      settings = await LeaveEncashmentSettings.create({});
    }
    return res.status(200).json({ success: true, data: settings });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/leave-encashments/settings
router.post('/leave-encashments/settings', async (req, res) => {
  try {
    let settings = await LeaveEncashmentSettings.findOne();
    if (settings) {
      Object.assign(settings, req.body);
      await settings.save();
    } else {
      settings = await LeaveEncashmentSettings.create(req.body);
    }
    return res.status(200).json({ success: true, message: 'Settings saved successfully', data: settings });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/leave-encashments/component-mappings
router.get('/leave-encashments/component-mappings', async (req, res) => {
  try {
    const mappings = await LeaveEncashmentComponent.find();
    return res.status(200).json({ success: true, data: mappings });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/leave-encashments/component-mapping
router.post('/leave-encashments/component-mapping', async (req, res) => {
  try {
    const { component_group, leave_type, component_type, payroll_component } = req.body;
    
    const filter = { component_group, leave_type };
    const update = { component_type, payroll_component };
    
    const mapping = await LeaveEncashmentComponent.findOneAndUpdate(
      filter,
      update,
      { upsert: true, new: true }
    );
    
    return res.status(200).json({ success: true, message: 'Component mapping saved successfully', data: mapping });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/leave-encashments/load-employees
router.post('/leave-encashments/load-employees', async (req, res) => {
  try {
    const { department, designation, employee_category, component_group, financial_year, leave_type } = req.body;

    // Build filter for employees
    let empQuery = {};
    if (department) empQuery.department_id = department;
    if (designation) empQuery.designation_id = designation;
    if (employee_category) empQuery.employee_category_id = employee_category;
    if (component_group) empQuery.component_group = component_group;

    const employees = await Employee.find(empQuery)
      .populate('department_id')
      .populate('designation_id');

    // Get salary structures
    const salaries = await SalaryStructure.find();
    const salaryMap = new Map(salaries.map(s => [s.employee_id?.toString(), s]));

    // Get leave balances
    const balances = await LeaveBalance.find({ financial_year });
    const balanceMap = new Map(balances.map(b => [b.employee_id.toString(), b]));

    // Get settings and component mapping
    const settings = await LeaveEncashmentSettings.findOne() || { per_day_wages_type: 'Month Days', custom_days: 30 };
    const mapping = await LeaveEncashmentComponent.findOne({ component_group, leave_type }) || {
      component_type: 'Gross Salary',
      payroll_component: []
    };

    // Calculate details for each employee
    const results = [];
    for (const emp of employees) {
      const sal = salaryMap.get(emp._id.toString());
      const bal = balanceMap.get(emp._id.toString());

      if (!bal) continue; // Must have leave balance initialized

      const availableBalance = bal[leave_type] || 0;
      if (availableBalance <= 0) continue; // Only load employees with positive balance

      let monthlyBaseSalary = 0;
      if (sal) {
        if (mapping.component_type === 'Gross Salary') {
          monthlyBaseSalary = sal.gross_salary || 0;
        } else {
          // Specific Component Summation
          (mapping.payroll_component || []).forEach(comp => {
            const compKey = comp.toLowerCase().replace(' ', '_');
            monthlyBaseSalary += (sal[compKey] || 0);
          });
        }
      }

      // Calculate divisor for per day wages
      let divisor = 30;
      if (settings.per_day_wages_type === 'Month') {
        // Find current days in active month
        const now = new Date();
        divisor = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      } else if (settings.per_day_wages_type === 'Custom Days') {
        divisor = settings.custom_days || 26;
      }

      const perDayWages = parseFloat((monthlyBaseSalary / divisor).toFixed(2));

      results.push({
        employee_id: emp._id,
        employee_code: emp.employee_code,
        employee_name: `${emp.first_name} ${emp.last_name}`,
        gross_salary: monthlyBaseSalary,
        per_day_wages: perDayWages,
        leave_balance: availableBalance,
        encashed_days: Math.min(availableBalance, 10), // default preview to max 10 days or full balance
        amount: parseFloat((perDayWages * Math.min(availableBalance, 10)).toFixed(2))
      });
    }

    return res.status(200).json({ success: true, data: results });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/leave-encashments/generate
router.post('/leave-encashments/generate', async (req, res) => {
  try {
    const { financial_year, encashment_month, leave_type, include_in_payroll, employees } = req.body;

    if (!employees || !Array.isArray(employees) || employees.length === 0) {
      return res.status(400).json({ success: false, message: 'Employees details are required for encashment generation' });
    }

    // Load settings for sequence number
    const settings = await LeaveEncashmentSettings.findOne() || { prefix: 'ENC-', initial: 1 };
    
    // Compute encashment count
    const encCount = await LeaveEncashment.countDocuments();
    const nextNumber = (settings.initial || 1) + encCount;
    const encashment_number = `${settings.prefix}${nextNumber.toString().padStart(4, '0')}`;

    let totalAmount = 0;
    const finalEmployees = [];

    for (const empData of employees) {
      if (Number(empData.encashed_days) <= 0) continue;

      const balance = await LeaveBalance.findOne({ employee_id: empData.employee_id, financial_year });
      if (!balance) continue;

      const oldVal = balance[leave_type] || 0;
      if (oldVal < empData.encashed_days) continue; // skip if balance decreased in the meantime

      // Deduct Leave Balance
      const newVal = oldVal - empData.encashed_days;
      balance[leave_type] = newVal;
      await balance.save();

      // Log balance history
      await LeaveBalanceHistory.create({
        employee_id: empData.employee_id,
        employee_code: empData.employee_code,
        employee_name: empData.employee_name,
        leave_type,
        old_balance: oldVal,
        new_balance: newVal,
        transaction_type: 'Encashment',
        remarks: `Leave Encashment Reference #${encashment_number}`,
        financial_year
      });

      totalAmount += empData.amount;
      finalEmployees.push(empData);
    }

    const doc = await LeaveEncashment.create({
      encashment_number,
      encashment_date: new Date(),
      month_name: encashment_month,
      number_of_employees: finalEmployees.length,
      total_amount: totalAmount,
      payroll_status: 'Pending',
      payment_status: 'Unpaid',
      financial_year,
      leave_type,
      include_in_payroll,
      employees: finalEmployees
    });

    return res.status(201).json({
      success: true,
      message: `Successfully generated encashment ${encashment_number} for ${finalEmployees.length} employees.`,
      data: doc
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/leave-encashments/export
router.post('/leave-encashments/export', async (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Leave Encashment export compiled successfully',
    url: 'https://example.com/exports/leave-encashments.xlsx'
  });
});

module.exports = router;
