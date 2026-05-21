import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Sliders, ChevronDown, ChevronUp, Building2, Users, Calendar, 
  Clock, Layers, MapPin, Coffee, FileText, CheckSquare, DollarSign, LogOut, 
  Briefcase, Gift, GraduationCap, Award, HelpCircle, BarChart2, Settings,
  ClipboardList, UserCheck, Timer, AlertTriangle, Sun, Cpu, Activity, Shield
} from 'lucide-react';
import { useDispatch } from 'react-redux';
import { logout } from '../store/slices/authSlice';

const menuItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Masters', path: '/masters', icon: Sliders, isAccordion: true },
  { name: 'Core HR', path: '/core-hr', icon: Briefcase, isCoreHrAccordion: true },
  // { name: 'Departments', path: '/departments', icon: Building2 },
  // { name: 'Employees', path: '/employees', icon: Users },
  { name: 'Attendance', path: '/attendance', icon: Calendar, 
    isAttendanceAccordion: true },
  { name: 'Reimbursement', path: '/reimbursement', icon: DollarSign },
  { name: 'Leave', path: '/leave', icon: FileText },
  { name: 'Payroll', path: '/payroll', icon: DollarSign },
  { name: 'Reports', path: '/reports', icon: FileText },
  
  { name: 'Geo Location', path: '/geo-location', icon: MapPin },
];

const masterSubItems = [
  { id: 'Employee', icon: Users, label: 'Employee' },
  { id: 'Holiday', icon: Calendar, label: 'Holiday' },
  { id: 'Designation', icon: Award, label: 'Designation' },
  { id: 'Attendance Rule', icon: Clock, label: 'Attendance Rule' },
  { id: 'Shift Roster', icon: Layers, label: 'Shift Roster' },
  { id: 'Department', icon: Building2, label: 'Department' },
  { id: 'Employee Category', icon: Users, label: 'Employee Category' },
  { id: 'Location', icon: MapPin, label: 'Location' },
  { id: 'Assign Leave Type', icon: Coffee, label: 'Assign Leave Type' },
  { id: 'Leave Type', icon: FileText, label: 'Leave Type' },
  { id: 'Permission Type', icon: CheckSquare, label: 'Permission Type' },
  { id: 'Reimbursement Type', icon: DollarSign, label: 'Reimbursement Type' },
  { id: 'Regularization Reason', icon: HelpCircle, label: 'Regularization Reason' },
  { id: 'Resign Reason', icon: LogOut, label: 'Resign Reason' },
  { id: 'Salary Structure', icon: Briefcase, label: 'Salary Structure' },
  { id: 'Source of Hire', icon: Users, label: 'Source of Hire' },
  { id: 'Bonus Policy', icon: Gift, label: 'Bonus Policy' },
  { id: 'Degree', icon: GraduationCap, label: 'Degree' },
];

const coreHrSubItems = [
  { id: 'Candidates', icon: Users, label: 'Candidates' },
  { id: 'Offer Letters', icon: FileText, label: 'Offer Letters' },
  { id: 'Relieving Letters', icon: LogOut, label: 'Relieving Letters' },
  { id: 'Experience Letters', icon: Award, label: 'Experience Letters' },
  { id: 'Notice Letters', icon: Clock, label: 'Notice Letters' },
  { id: 'Confirmation Letters', icon: CheckSquare, label: 'Confirmation Letters' },
];

const attendanceSubItems = [
  { id: 'Attendance Log', icon: ClipboardList, label: 'Attendance Log' },
  { id: 'Attendance History', icon: Activity, label: 'Attendance History' },
  { id: 'Approve Regularization', icon: UserCheck, label: 'Approve Regularization' },
  { id: 'Approve Overtime', icon: Timer, label: 'Approve Overtime' },
  { id: 'Approve Permission', icon: Shield, label: 'Approve Permission' },
];

const Sidebar = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  const [mastersExpanded, setMastersExpanded] = useState(false);
  const [coreHrExpanded, setCoreHrExpanded] = useState(false);
  const [attendanceExpanded, setAttendanceExpanded] = useState(false);

  useEffect(() => {
    if (location.pathname.startsWith('/masters')) setMastersExpanded(true);
    if (location.pathname.startsWith('/core-hr')) setCoreHrExpanded(true);
    if (location.pathname.startsWith('/attendance')) setAttendanceExpanded(true);
  }, [location.pathname]);

  const handleLogout = () => {
    dispatch(logout());
  };

  const isSubItemActive = (subId) => {
    if (location.pathname !== '/masters') return false;
    const searchParams = new URLSearchParams(location.search);
    const activeTab = searchParams.get('tab') || 'Employee';
    return activeTab === subId;
  };

  const isCoreHrSubActive = (subId) => {
    if (location.pathname !== '/core-hr') return false;
    const searchParams = new URLSearchParams(location.search);
    const activeTab = searchParams.get('tab') || 'Candidates';
    return activeTab === subId;
  };

  const isAttendanceSubActive = (subId) => {
    if (location.pathname !== '/attendance') return false;
    const searchParams = new URLSearchParams(location.search);
    const activeTab = searchParams.get('tab') || 'Attendance Log';
    return activeTab === subId;
  };

  return (
    <div className="w-64 bg-white shadow-lg min-h-screen flex flex-col border-r border-gray-200">
      <div className="p-6 border-b border-gray-200 flex items-center justify-between">
        <h1 className="text-2xl font-black text-blue-600 m-0">Isaii HRMS</h1>
      </div>
      
      <nav className="flex-1 p-4 overflow-y-auto max-h-[calc(100vh-140px)]">
        <ul className="space-y-1 text-left list-none p-0 m-0">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            if (item.isAccordion) {
              return (
                <li key={item.path} className="space-y-1">
                  <button
                    onClick={() => setMastersExpanded(!mastersExpanded)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all border-0 bg-transparent cursor-pointer font-semibold text-sm ${
                      location.pathname.startsWith('/masters')
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center">
                      <Icon className="w-5 h-5 mr-3 text-gray-500" />
                      <span>{item.name}</span>
                    </div>
                    {mastersExpanded ? (
                      <ChevronUp className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    )}
                  </button>

                  {mastersExpanded && (
                    <ul className="pl-4 pr-1 py-1 space-y-1 list-none m-0 border-l border-gray-100 ml-6">
                      {masterSubItems.map((subItem) => {
                        const SubIcon = subItem.icon;
                        const isSubActive = isSubItemActive(subItem.id);
                        return (
                          <li key={subItem.id}>
                            <Link
                              to={`/masters?tab=${encodeURIComponent(subItem.id)}`}
                              className={`flex items-center px-3 py-2 rounded-lg text-xs font-medium transition-all no-underline ${
                                isSubActive
                                  ? 'bg-blue-600 text-white shadow-sm'
                                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                              }`}
                            >
                              <SubIcon className={`w-3.5 h-3.5 mr-2 ${isSubActive ? 'text-white' : 'text-gray-400'}`} />
                              <span>{subItem.label}</span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            }

            if (item.isCoreHrAccordion) {
              return (
                <li key={item.path} className="space-y-1">
                  <button
                    onClick={() => setCoreHrExpanded(!coreHrExpanded)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all border-0 bg-transparent cursor-pointer font-semibold text-sm ${
                      location.pathname.startsWith('/core-hr')
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center">
                      <Icon className="w-5 h-5 mr-3 text-gray-500" />
                      <span>{item.name}</span>
                    </div>
                    {coreHrExpanded ? (
                      <ChevronUp className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    )}
                  </button>

                  {coreHrExpanded && (
                    <ul className="pl-4 pr-1 py-1 space-y-1 list-none m-0 border-l border-gray-100 ml-6">
                      {coreHrSubItems.map((subItem) => {
                        const SubIcon = subItem.icon;
                        const isSubActive = isCoreHrSubActive(subItem.id);
                        return (
                          <li key={subItem.id}>
                            <Link
                              to={`/core-hr?tab=${encodeURIComponent(subItem.id)}`}
                              className={`flex items-center px-3 py-2 rounded-lg text-xs font-medium transition-all no-underline ${
                                isSubActive
                                  ? 'bg-blue-600 text-white shadow-sm'
                                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                              }`}
                            >
                              <SubIcon className={`w-3.5 h-3.5 mr-2 ${isSubActive ? 'text-white' : 'text-gray-400'}`} />
                              <span>{subItem.label}</span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            }

            if (item.isAttendanceAccordion) {
              return (
                <li key={item.path} className="space-y-1">
                  <button
                    onClick={() => setAttendanceExpanded(!attendanceExpanded)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all border-0 bg-transparent cursor-pointer font-semibold text-sm ${
                      location.pathname.startsWith('/attendance')
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center">
                      <Icon className="w-5 h-5 mr-3 text-gray-500" />
                      <span>{item.name}</span>
                    </div>
                    {attendanceExpanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                  </button>

                  {attendanceExpanded && (
                    <ul className="pl-4 pr-1 py-1 space-y-1 list-none m-0 border-l border-gray-100 ml-6">
                      {attendanceSubItems.map((subItem) => {
                        const SubIcon = subItem.icon;
                        const isSubActive = isAttendanceSubActive(subItem.id);
                        return (
                          <li key={subItem.id}>
                            <Link
                              to={`/attendance?tab=${encodeURIComponent(subItem.id)}`}
                              className={`flex items-center px-3 py-2 rounded-lg text-xs font-medium transition-all no-underline ${
                                isSubActive
                                  ? 'bg-blue-600 text-white shadow-sm'
                                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                              }`}
                            >
                              <SubIcon className={`w-3.5 h-3.5 mr-2 ${isSubActive ? 'text-white' : 'text-gray-400'}`} />
                              <span>{subItem.label}</span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            }

            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center px-4 py-3 rounded-xl transition-all font-semibold text-sm no-underline ${
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-4 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all border-0 bg-transparent cursor-pointer font-semibold text-sm"
        >
          <LogOut className="w-5 h-5 mr-3 text-gray-500" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;