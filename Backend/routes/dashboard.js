const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const Department = require('../models/Department');
const { AttendanceLog } = require('../models/AttendanceModels');
const { NoticeLetter, ConfirmationLetter, RelievingLetter } = require('../models/CoreHrModels');
const { Holiday } = require('../models/MasterModels');
const ApiResponse = require('../utils/apiResponse');
const { protect } = require('../middleware/auth');

// Protect all dashboard routes
router.use(protect);

// 1. Get employee statistics
router.get('/employee-stats', async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const activeCount = await Employee.countDocuments({ employee_status: 'Active' });
    const inactiveCount = await Employee.countDocuments({ employee_status: { $in: ['Inactive', 'Resigned', 'Terminated'] } });
    const totalCount = await Employee.countDocuments({});

    // Absent today calculation
    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    const todayEnd = new Date(); todayEnd.setHours(23,59,59,999);
    const presentToday = await AttendanceLog.countDocuments({
      attendance_date: { $gte: todayStart, $lte: todayEnd },
      attendance_status: { $in: ['Present', 'Half Day'] }
    });
    const absentToday = Math.max(0, activeCount - presentToday);

    // Notice count
    const noticeCount = await NoticeLetter.countDocuments({});

    // Confirmation due this month
    const confirmationCount = await ConfirmationLetter.countDocuments({
      created_at: { $gte: startOfMonth, $lte: endOfMonth }
    });

    // Additions this month
    const additionCount = await Employee.countDocuments({
      joining_date: { $gte: startOfMonth, $lte: endOfMonth }
    });

    // Separations this month
    const separationCount = await RelievingLetter.countDocuments({
      last_working_date: { $gte: startOfMonth, $lte: endOfMonth }
    });

    // Retiring this month (approaching age 60)
    const sixtyYearsAgoStart = new Date(now.getFullYear() - 60, now.getMonth(), 1);
    const sixtyYearsAgoEnd = new Date(now.getFullYear() - 60, now.getMonth() + 1, 0);
    const retiringCount = await Employee.countDocuments({
      dob: { $gte: sixtyYearsAgoStart, $lte: sixtyYearsAgoEnd }
    });

    // Previous month active count comparison
    const prevMonthActive = await Employee.countDocuments({
      employee_status: 'Active',
      joining_date: { $lt: startOfMonth }
    });
    const activeGrowth = prevMonthActive > 0 ? parseFloat(((activeCount - prevMonthActive) / prevMonthActive * 100).toFixed(1)) : 0;

    const stats = [
      { title: "Total Active", count: activeCount, growth: activeGrowth, color: "green", icon: "UserCheck" },
      { title: "Inactive", count: inactiveCount, growth: 0.0, color: "red", icon: "UserX" },
      { title: "Total Employees", count: totalCount, growth: activeGrowth, color: "blue", icon: "Users" },
      { title: "Today's Absent", count: absentToday, growth: 0.0, color: "orange", icon: "Clock" },
      { title: "On Notice", count: noticeCount, growth: 0.0, color: "purple", icon: "AlertCircle" },
      { title: "Confirmation Due This Month", count: confirmationCount, growth: 0.0, color: "indigo", icon: "CalendarCheck" },
      { title: "This Month Addition", count: additionCount, growth: 0.0, color: "teal", icon: "UserPlus" },
      { title: "This Month Separation", count: separationCount, growth: 0.0, color: "red", icon: "UserMinus" },
      { title: "This Month Retiring", count: retiringCount, growth: 0.0, color: "orange", icon: "Briefcase" }
    ];

    return ApiResponse.success(res, 'Employee stats fetched', stats);
  } catch (error) {
    console.error('Error fetching dashboard employee stats:', error);
    return ApiResponse.error(res, 'Error fetching employee stats', null, 500);
  }
});

// 2. Get department-wise statistics
router.get('/department-stats', async (req, res) => {
  try {
    const departments = await Department.find({
      $or: [
        { status: 'active' },
        { status: { $exists: false } },
        { isActive: true }
      ]
    });
    const deptStats = [];

    const deptIcons = {
      "IT": "Monitor",
      "Engineering": "Monitor",
      "Software": "Monitor",
      "Human Resources": "UserCheck",
      "HR": "UserCheck",
      "Finance": "DollarSign",
      "Accounts": "DollarSign",
      "Support": "Headphones",
      "Sales": "ShoppingCart",
      "Marketing": "Megaphone",
      "Production": "Factory",
      "Admin": "Building2"
    };

    for (const dept of departments) {
      const count = await Employee.countDocuments({ department_id: dept._id, employee_status: 'Active' });
      const deptName = dept.name || dept.department_name;
      
      // Determine suitable icon based on name matching
      let icon = "Building2";
      for (const key of Object.keys(deptIcons)) {
        if (deptName.toLowerCase().includes(key.toLowerCase())) {
          icon = deptIcons[key];
          break;
        }
      }

      deptStats.push({
        name: deptName,
        count: count,
        icon: icon
      });
    }

    // Sort by count descending
    deptStats.sort((a, b) => b.count - a.count);

    return ApiResponse.success(res, 'Department stats fetched', deptStats);
  } catch (error) {
    console.error('Error fetching department stats:', error);
    return ApiResponse.error(res, 'Error fetching department stats', null, 500);
  }
});

// 3. Get migrant statistics
router.get('/migrant-stats', async (req, res) => {
  try {
    const migrantCount = await Employee.countDocuments({ migrant: true, employee_status: 'Active' });
    const nonMigrantCount = await Employee.countDocuments({ migrant: { $ne: true }, employee_status: 'Active' });

    const totalActive = migrantCount + nonMigrantCount;
    const migrantGrowth = totalActive > 0 ? parseFloat((migrantCount / totalActive * 100).toFixed(1)) : 0;
    const nonMigrantGrowth = totalActive > 0 ? parseFloat((nonMigrantCount / totalActive * 100).toFixed(1)) : 0;

    const stats = [
      { title: "Total Migrants", count: migrantCount, growth: migrantGrowth, color: "blue", icon: "Globe" },
      { title: "Non Migrants", count: nonMigrantCount, growth: nonMigrantGrowth, color: "green", icon: "Users" }
    ];

    return ApiResponse.success(res, 'Migrant stats fetched', stats);
  } catch (error) {
    console.error('Error fetching migrant stats:', error);
    return ApiResponse.error(res, 'Error fetching migrant stats', null, 500);
  }
});

// 4. Get workforce insights
router.get('/workforce-insights', async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const activeCount = await Employee.countDocuments({ employee_status: 'Active' });
    const separationCount = await RelievingLetter.countDocuments({
      last_working_date: { $gte: startOfMonth, $lte: endOfMonth }
    });

    const baseCount = activeCount + separationCount;
    const attritionRate = baseCount > 0 ? parseFloat((separationCount / baseCount * 100).toFixed(1)) : 0.0;
    const retentionRate = parseFloat((100 - attritionRate).toFixed(1));

    const insights = [
      {
        title: "Attrition Rate",
        value: `${attritionRate}%`,
        percentage: Math.round(attritionRate),
        trend: attritionRate > 5 ? "up" : "down"
      },
      {
        title: "Retention Rate",
        value: `${retentionRate}%`,
        percentage: Math.round(retentionRate),
        trend: retentionRate > 95 ? "up" : "down"
      }
    ];

    return ApiResponse.success(res, 'Workforce insights fetched', insights);
  } catch (error) {
    console.error('Error fetching workforce insights:', error);
    return ApiResponse.error(res, 'Error fetching workforce insights', null, 500);
  }
});

// 5. Get attendance statistics
router.get('/attendance-stats', async (req, res) => {
  try {
    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    const todayEnd = new Date(); todayEnd.setHours(23,59,59,999);

    const presentCount = await AttendanceLog.countDocuments({
      attendance_date: { $gte: todayStart, $lte: todayEnd },
      attendance_status: 'Present'
    });
    
    const absentCount = await AttendanceLog.countDocuments({
      attendance_date: { $gte: todayStart, $lte: todayEnd },
      attendance_status: 'Absent'
    });

    const leaveCount = await AttendanceLog.countDocuments({
      attendance_date: { $gte: todayStart, $lte: todayEnd },
      attendance_status: 'Leave'
    });

    const halfDayCount = await AttendanceLog.countDocuments({
      attendance_date: { $gte: todayStart, $lte: todayEnd },
      attendance_status: 'Half Day'
    });

    const stats = [
      { title: "Total Present Today", count: presentCount, growth: 0.0, color: "green", icon: "UserCheck" },
      { title: "Today's Absent", count: absentCount, growth: 0.0, color: "red", icon: "UserX" },
      { title: "Today's Leave", count: leaveCount, growth: 0.0, color: "purple", icon: "CalendarCheck" },
      { title: "Today's Half Day", count: halfDayCount, growth: 0.0, color: "blue", icon: "AlertCircle" }
    ];

    return ApiResponse.success(res, 'Attendance stats fetched', stats);
  } catch (error) {
    console.error('Error fetching attendance stats:', error);
    return ApiResponse.error(res, 'Error fetching attendance stats', null, 500);
  }
});

// 6. Get calendar events (Holidays + HR events)
router.get('/calendar-events', async (req, res) => {
  try {
    const holidays = await Holiday.find({});
    
    const mappedHolidays = holidays.map(h => ({
      date: h.holiday_date.toISOString().split('T')[0],
      name: h.holiday_name,
      type: 'holiday'
    }));

    return ApiResponse.success(res, 'Calendar events fetched', mappedHolidays);
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return ApiResponse.error(res, 'Error fetching calendar events', null, 500);
  }
});

module.exports = router;
