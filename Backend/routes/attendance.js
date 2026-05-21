const express = require('express');
const router = express.Router();
const { AttendanceLog, AttendanceHistory, AttendanceRegularization, OvertimeRequest, PermissionRequest } = require('../models/AttendanceModels');
const Employee = require('../models/Employee');
const mongoose = require('mongoose');

// Helper to calc hours
const calculateHours = (inStr, outStr) => {
  if (!inStr || !outStr) return 0;
  const [inH, inM] = inStr.split(':').map(Number);
  const [outH, outM] = outStr.split(':').map(Number);
  let diffMs = (outH * 60 + outM) - (inH * 60 + inM);
  if (diffMs < 0) diffMs += 24 * 60; // Overnight
  return parseFloat((diffMs / 60).toFixed(2));
};

// ----------------------------------------------------
// 1. ATTENDANCE LOG MODULE
// ----------------------------------------------------

// GET /api/attendance-logs
router.get('/attendance-logs', async (req, res) => {
  try {
    const { search, employee, month, department, designation } = req.query;
    let query = {};
    if (employee)    query.employee_id    = employee;
    if (department)  query.department_id  = department;
    if (designation) query.designation_id = designation;

    if (month) {
      const [yr, mn] = month.split('-');
      const start = new Date(yr, mn - 1, 1);
      const end   = new Date(yr, mn, 0, 23, 59, 59);
      query.attendance_date = { $gte: start, $lte: end };
    }

    let logs = await AttendanceLog.find(query)
      .populate('employee_id')
      .populate('department_id', 'name')
      .populate('designation_id', 'designation_name')
      .sort({ attendance_date: -1 });

    // In-memory search on employee name/code (populated after query)
    if (search && search.trim()) {
      const term = search.trim().toLowerCase();
      logs = logs.filter(l =>
        (l.employee_name || '').toLowerCase().includes(term) ||
        (l.employee_code || '').toLowerCase().includes(term)
      );
    }

    res.json({ success: true, data: logs });
  } catch (e) {
    console.error('GET /attendance-logs error:', e.message);
    res.status(500).json({ success: false, message: e.message });
  }
});


// POST /api/attendance-logs/load-employees
router.post('/attendance-logs/load-employees', async (req, res) => {
  try {
    const { date, filters } = req.body;
    let query = {};
    if (filters?.department) query.department_id = filters.department;
    if (filters?.designation) query.designation_id = filters.designation;

    const employees = await Employee.find(query).populate('department_id').populate('designation_id');
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59);

    // Get existing logs for this date
    const existingLogs = await AttendanceLog.find({
      attendance_date: { $gte: startOfDay, $lte: endOfDay }
    });

    const existingMap = new Map(existingLogs.map(l => [l.employee_id.toString(), l]));

    const responseData = employees.map(emp => {
      const log = existingMap.get(emp._id.toString());
      return {
        employee_id: emp._id,
        employee_code: emp.employee_code,
        employee_name: `${emp.first_name} ${emp.last_name}`,
        department_id: emp.department_id?._id || null,
        designation_id: emp.designation_id?._id || null,
        in_date: log?.in_date || targetDate,
        in_time: log?.in_time || '09:00',
        out_date: log?.out_date || targetDate,
        out_time: log?.out_time || '18:00',
        overnight_shift: log?.overnight_shift || false,
        permission_hours: log?.permission_hours || 0,
        worked_hours: log?.worked_hours || 8,
        work_day: log?.work_day || 1,
        attendance_status: log?.attendance_status || 'Present',
        leave_type_id: log?.leave_type_id || null,
        leave_session: log?.leave_session || '',
        early_out: log?.early_out || false,
        late_in: log?.late_in || false
      };
    });


    res.json({ success: true, data: responseData });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// POST /api/attendance-logs
router.post('/attendance-logs', async (req, res) => {
  try {
    const { attendance_date, employees } = req.body;
    const targetDate = new Date(attendance_date);
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59);

    const saved = [];
    for (const empData of employees) {
      const worked_hours = calculateHours(empData.in_time, empData.out_time);
      const isLate = empData.in_time && empData.in_time > '09:15';
      const isEarly = empData.out_time && empData.out_time < '17:45';

      const updateData = {
        employee_id: empData.employee_id,
        employee_code: empData.employee_code,
        employee_name: empData.employee_name,
        department_id: empData.department_id || null,
        designation_id: empData.designation_id || null,
        attendance_date: targetDate,
        in_date: empData.in_date || targetDate,
        in_time: empData.in_time,
        out_date: empData.out_date || targetDate,
        out_time: empData.out_time,
        overnight_shift: empData.overnight_shift || false,
        permission_hours: empData.permission_hours || 0,
        worked_hours: worked_hours,
        work_day: empData.work_day || 1,
        attendance_status: empData.attendance_status || 'Present',
        early_out: isEarly,
        late_in: isLate,
        updated_at: new Date()
      };

      const doc = await AttendanceLog.findOneAndUpdate(
        { employee_id: empData.employee_id, attendance_date: { $gte: startOfDay, $lte: endOfDay } },
        updateData,
        { upsert: true, new: true }
      );
      saved.push(doc);
    }
    res.json({ success: true, message: 'Attendance logs saved successfully', data: saved });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// PUT /api/attendance-logs
router.put('/attendance-logs', async (req, res) => {
  try {
    const { _id, in_time, out_time, attendance_status } = req.body;
    const oldLog = await AttendanceLog.findById(_id);
    if (!oldLog) return res.status(404).json({ success: false, message: 'Log not found' });

    // Track modification in history
    await AttendanceHistory.create({
      attendance_log_id: oldLog._id,
      employee_id: oldLog.employee_id,
      attendance_date: oldLog.attendance_date,
      old_in_time: oldLog.in_time,
      new_in_time: in_time,
      old_out_time: oldLog.out_time,
      new_out_time: out_time
    });

    const worked_hours = calculateHours(in_time, out_time);
    const updated = await AttendanceLog.findByIdAndUpdate(_id, {
      in_time,
      out_time,
      worked_hours,
      attendance_status,
      updated_at: new Date()
    }, { new: true });

    res.json({ success: true, data: updated });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// POST /api/attendance-logs/regularize
router.post('/attendance-logs/regularize', async (req, res) => {
  try {
    const { employee_id, attendance_log_id, in_time, out_time, reason } = req.body;
    const reg = await AttendanceRegularization.create({
      employee_id,
      attendance_log_id,
      in_time,
      out_time,
      remarks: reason,
      approval_status: 'Applied'
    });
    res.json({ success: true, data: reg });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// POST /api/attendance-logs/export/excel
router.post('/attendance-logs/export/excel', (req, res) => {
  res.json({ success: true, message: 'Excel export ready', url: 'https://example.com/attendance-export.xlsx' });
});

// POST /api/attendance-logs/export/pdf
router.post('/attendance-logs/export/pdf', (req, res) => {
  res.json({ success: true, message: 'PDF export ready', url: 'https://example.com/attendance-export.pdf' });
});


// ----------------------------------------------------
// 2. ATTENDANCE HISTORY MODULE
// ----------------------------------------------------

// GET /api/attendance-history
router.get('/attendance-history', async (req, res) => {
  try {
    const { employee } = req.query;
    let query = {};
    if (employee) query.employee_id = employee;
    const history = await AttendanceHistory.find(query)
      .populate('employee_id')
      .populate('attendance_log_id')
      .sort({ modified_at: -1 });
    res.json({ success: true, data: history });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// POST /api/attendance-history/export
router.post('/attendance-history/export', (req, res) => {
  res.json({ success: true, message: 'History export ready', url: 'https://example.com/history-export.csv' });
});


// ----------------------------------------------------
// 3. APPROVE REGULARIZATION MODULE
// ----------------------------------------------------

// GET /api/regularizations
router.get('/regularizations', async (req, res) => {
  try {
    const { approval_status } = req.query;
    let query = {};
    if (approval_status) query.approval_status = approval_status;
    const list = await AttendanceRegularization.find(query).populate('employee_id').sort({ created_at: -1 });
    res.json({ success: true, data: list });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// POST /api/regularizations
router.post('/regularizations', async (req, res) => {
  try {
    const reg = await AttendanceRegularization.create(req.body);
    res.json({ success: true, data: reg });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// POST /api/regularizations/upload
router.post('/regularizations/upload', (req, res) => {
  res.json({ success: true, fileUrl: 'https://example.com/attachments/regularization-doc.png' });
});

// POST /api/regularizations/approve/:id
router.post('/regularizations/approve/:id', async (req, res) => {
  try {
    const reg = await AttendanceRegularization.findById(req.params.id).populate('employee_id');
    if (!reg) return res.status(404).json({ success: false, message: 'Request not found' });

    reg.approval_status = 'Approved';
    reg.approved_at = new Date();
    await reg.save();

    // Fetch full employee record for name/code
    const emp = await Employee.findById(reg.employee_id);

    // Update actual AttendanceLog if attached
    if (reg.attendance_log_id) {
      await AttendanceLog.findByIdAndUpdate(reg.attendance_log_id, {
        in_time:    reg.in_time,
        out_time:   reg.out_time,
        worked_hours: calculateHours(reg.in_time, reg.out_time),
        attendance_status: 'Present',
        updated_at: new Date()
      });
    } else {
      // Create new Present Attendance Log with real employee data
      await AttendanceLog.create({
        employee_id:       emp?._id || reg.employee_id,
        employee_code:     emp?.employee_code || 'EMP',
        employee_name:     emp ? `${emp.first_name} ${emp.last_name}` : 'Employee',
        department_id:     emp?.department_id || null,
        designation_id:    emp?.designation_id || null,
        attendance_date:   reg.in_date || new Date(),
        in_date:           reg.in_date,
        in_time:           reg.in_time,
        out_date:          reg.out_date,
        out_time:          reg.out_time,
        worked_hours:      calculateHours(reg.in_time, reg.out_time),
        attendance_status: 'Present',
        late_in:           false,
        early_out:         false
      });
    }

    res.json({ success: true, message: 'Regularization approved and attendance updated' });
  } catch (e) {
    console.error('Approve regularization error:', e.message);
    res.status(500).json({ success: false, message: e.message });
  }
});


// POST /api/regularizations/reject/:id
router.post('/regularizations/reject/:id', async (req, res) => {
  try {
    const reg = await AttendanceRegularization.findByIdAndUpdate(req.params.id, {
      approval_status: 'Rejected',
      approved_at: new Date()
    }, { new: true });
    res.json({ success: true, data: reg });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// POST /api/regularizations/export/excel
router.post('/regularizations/export/excel', (req, res) => {
  res.json({ success: true, url: 'https://example.com/regularizations.xlsx' });
});

// POST /api/regularizations/export/pdf
router.post('/regularizations/export/pdf', (req, res) => {
  res.json({ success: true, url: 'https://example.com/regularizations.pdf' });
});


// ----------------------------------------------------
// 4. APPROVE OVERTIME MODULE
// ----------------------------------------------------

// GET /api/overtime-requests
router.get('/overtime-requests', async (req, res) => {
  try {
    const list = await OvertimeRequest.find().populate('employee_id').sort({ created_at: -1 });
    res.json({ success: true, data: list });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// POST /api/overtime-requests
router.post('/overtime-requests', async (req, res) => {
  try {
    const emp = await Employee.findById(req.body.employee_id);
    const total_hours = req.body.overtime_entries?.reduce((sum, entry) => sum + (Number(entry.overtime_hours) || 0), 0) || 0;

    const ot = await OvertimeRequest.create({
      ...req.body,
      employee_code: emp?.employee_code || 'EMP',
      employee_name: emp ? `${emp.first_name} ${emp.last_name}` : 'Employee',
      total_hours
    });
    res.json({ success: true, data: ot });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// POST /api/overtime-requests/upload
router.post('/overtime-requests/upload', (req, res) => {
  res.json({ success: true, fileUrl: 'https://example.com/attachments/ot-doc.png' });
});

// POST /api/overtime-requests/approve/:id
router.post('/overtime-requests/approve/:id', async (req, res) => {
  try {
    const ot = await OvertimeRequest.findByIdAndUpdate(req.params.id, {
      approval_status: 'Approved',
      approved_at: new Date()
    }, { new: true });
    res.json({ success: true, data: ot });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// POST /api/overtime-requests/reject/:id
router.post('/overtime-requests/reject/:id', async (req, res) => {
  try {
    const ot = await OvertimeRequest.findByIdAndUpdate(req.params.id, {
      approval_status: 'Rejected',
      approved_at: new Date()
    }, { new: true });
    res.json({ success: true, data: ot });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// POST /api/overtime-requests/export
router.post('/overtime-requests/export', (req, res) => {
  res.json({ success: true, url: 'https://example.com/overtime.xlsx' });
});


// ----------------------------------------------------
// 5. APPROVE PERMISSION MODULE
// ----------------------------------------------------

// GET /api/permission-requests
router.get('/permission-requests', async (req, res) => {
  try {
    const { approval_status } = req.query;
    let query = {};
    if (approval_status) query.approval_status = approval_status;
    const list = await PermissionRequest.find(query)
      .populate('employee_id')
      .populate('department_id')
      .sort({ created_at: -1 });
    res.json({ success: true, data: list });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// POST /api/permission-requests
router.post('/permission-requests', async (req, res) => {
  try {
    const emp = await Employee.findById(req.body.employee_id).populate('department_id');
    const total_hours = req.body.permission_entries?.reduce((sum, entry) => sum + (Number(entry.total_hours) || 0), 0) || 0;

    const pr = await PermissionRequest.create({
      ...req.body,
      permission_number: 'PERM-' + Date.now(),
      employee_code: emp?.employee_code || 'EMP',
      employee_name: emp ? `${emp.first_name} ${emp.last_name}` : 'Employee',
      department_id: emp?.department_id?._id || null,
      total_hours
    });
    res.json({ success: true, data: pr });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// POST /api/permission-requests/upload
router.post('/permission-requests/upload', (req, res) => {
  res.json({ success: true, fileUrl: 'https://example.com/attachments/permission-doc.png' });
});

// POST /api/permission-requests/approve/:id
router.post('/permission-requests/approve/:id', async (req, res) => {
  try {
    const pr = await PermissionRequest.findByIdAndUpdate(req.params.id, {
      approval_status: 'Approved',
      approved_at: new Date()
    }, { new: true });
    res.json({ success: true, data: pr });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// POST /api/permission-requests/reject/:id
router.post('/permission-requests/reject/:id', async (req, res) => {
  try {
    const pr = await PermissionRequest.findByIdAndUpdate(req.params.id, {
      approval_status: 'Rejected',
      approved_at: new Date()
    }, { new: true });
    res.json({ success: true, data: pr });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// DELETE /api/permission-requests/:id
router.delete('/permission-requests/:id', async (req, res) => {
  try {
    await PermissionRequest.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Permission request deleted' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// POST /api/permission-requests/export
router.post('/permission-requests/export', (req, res) => {
  res.json({ success: true, url: 'https://example.com/permissions.xlsx' });
});

module.exports = router;
