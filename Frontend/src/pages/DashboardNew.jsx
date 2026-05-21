import { useState, useEffect } from "react";
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  AlertCircle,
  CalendarCheck,
  UserPlus,
  UserMinus,
  Briefcase,
  Monitor,
  Headphones,
  ShoppingCart,
  Factory,
  Building2,
  Megaphone,
  Globe,
  DollarSign,
} from "lucide-react";
import StatCard from "../components/dashboard/StatCard";
import DepartmentCard from "../components/dashboard/DepartmentCard";
import AnalyticsCard from "../components/dashboard/AnalyticsCard";
import LoadingSkeleton from "../components/dashboard/LoadingSkeleton";
import CalendarWidget from "../components/dashboard/CalendarWidget";
import { dashboardService } from "../services/dashboardService";

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState("monthly");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [employeeStats, setEmployeeStats] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [migrantStats, setMigrantStats] = useState([]);
  const [workforceInsights, setWorkforceInsights] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, [selectedType, selectedMonth]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [
        employeeData,
        departmentData,
        migrantData,
        insightsData,
        attendanceData,
      ] = await Promise.all([
        dashboardService.getEmployeeStats(),
        dashboardService.getDepartmentStats(),
        dashboardService.getMigrantStats(),
        dashboardService.getWorkforceInsights(selectedType, selectedMonth),
        dashboardService.getAttendanceStats(),
      ]);

      setEmployeeStats(employeeData);
      setDepartments(departmentData);
      setMigrantStats(migrantData);
      setWorkforceInsights(insightsData);
      setAttendanceStats(attendanceData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      // Use mock data if API fails
      setEmployeeStats([
        {
          title: "Total Active",
          count: 142,
          icon: UserCheck,
          growth: 5.2,
          color: "green",
        },
        {
          title: "Inactive",
          count: 14,
          icon: UserX,
          growth: -2.1,
          color: "red",
        },
        {
          title: "Total Employees",
          count: 156,
          icon: Users,
          growth: 3.8,
          color: "blue",
        },
        {
          title: "Today's Absent",
          count: 8,
          icon: Clock,
          growth: -1.5,
          color: "orange",
        },
        {
          title: "On Notice",
          count: 5,
          icon: AlertCircle,
          growth: 0,
          color: "purple",
        },
        {
          title: "Confirmation Due",
          count: 3,
          icon: CalendarCheck,
          growth: 1.2,
          color: "indigo",
        },
        {
          title: "This Month Addition",
          count: 4,
          icon: UserPlus,
          growth: 2.5,
          color: "teal",
        },
        {
          title: "This Month Separation",
          count: 2,
          icon: UserMinus,
          growth: -0.8,
          color: "red",
        },
        {
          title: "This Month Retiring",
          count: 1,
          icon: Briefcase,
          growth: 0,
          color: "orange",
        },
      ]);
      setDepartments([
        { name: "IT", count: 45, icon: Monitor },
        { name: "HR", count: 12, icon: UserCheck },
        { name: "Accounts", count: 18, icon: DollarSign },
        { name: "Support", count: 25, icon: Headphones },
        { name: "Sales", count: 30, icon: ShoppingCart },
        { name: "Onboarding", count: 8, icon: UserPlus },
        { name: "Production", count: 22, icon: Factory },
        { name: "Administration", count: 15, icon: Building2 },
        { name: "Digital Marketing", count: 10, icon: Megaphone },
      ]);
      setMigrantStats([
        {
          title: "Total Migrants",
          count: 45,
          icon: Globe,
          growth: 8.5,
          color: "blue",
        },
        {
          title: "Non Migrants",
          count: 111,
          icon: Users,
          growth: 2.3,
          color: "green",
        },
      ]);
      setWorkforceInsights([
        {
          title: "Attrition Rate",
          value: "2.5%",
          percentage: 15,
          trend: "down",
        },
        {
          title: "Retention Rate",
          value: "97.5%",
          percentage: 85,
          trend: "up",
        },
        { title: "Absent Rate", value: "5.1%", percentage: 20, trend: "down" },
        {
          title: "Female to Male Ratio",
          value: "45:55",
          percentage: 45,
          trend: "up",
        },
        {
          title: "Headcount Growth Rate",
          value: "3.8%",
          percentage: 38,
          trend: "up",
        },
      ]);
      setAttendanceStats([
        {
          title: "Total Attendance",
          count: 148,
          icon: UserCheck,
          growth: 4.2,
          color: "green",
        },
        {
          title: "Present On Time",
          count: 135,
          icon: Clock,
          growth: 3.5,
          color: "blue",
        },
        {
          title: "Late Comers",
          count: 13,
          icon: AlertCircle,
          growth: -2.1,
          color: "orange",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <LoadingSkeleton count={4} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>

      {/* Employees Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Employees</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {employeeStats.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </div>
      </div>

      {/* Department Wise Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Department Wise
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map((dept) => (
            <DepartmentCard key={dept.name} {...dept} />
          ))}
        </div>
      </div>

      {/* Migrant Wise Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Migrant Wise
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {migrantStats.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </div>
      </div>

      {/* Workforce Insight Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Workforce Insight
          </h2>
          <div className="flex space-x-4">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              {months.map((month, index) => (
                <option key={month} value={index}>
                  {month}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workforceInsights.map((insight) => (
            <AnalyticsCard key={insight.title} {...insight} />
          ))}
        </div>
      </div>

      {/* Attendance Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Attendance</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {attendanceStats.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </div>
      </div>

      {/* Calendar Widget */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Calendar</h2>
        <CalendarWidget />
      </div>
    </div>
  );
};

export default Dashboard;
