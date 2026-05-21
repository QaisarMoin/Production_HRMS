import { useSelector } from 'react-redux';
import { User, Bell } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const Navbar = () => {
  const { user } = useSelector((state) => state.auth);
  const location = useLocation();

  const getPageTitle = (pathname) => {
    switch (pathname) {
      case '/dashboard':
        return 'Dashboard Overview';
      case '/masters':
        return 'Masters Module';
      case '/departments':
        return 'Departments';
      case '/employees':
        return 'Employees';
      case '/attendance':
        return 'Attendance';
      case '/leave':
        return 'Leave Management';
      case '/payroll':
        return 'Payroll';
      case '/reports':
        return 'Reports';
      case '/reimbursement':
        return 'Reimbursement';
      case '/geo-location':
        return 'Geo Location';
      default:
        return 'HRMS Admin';
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-gray-800">{getPageTitle(location.pathname)}</h2>
        </div>

        
        <div className="flex items-center space-x-4">
          <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
            <Bell className="w-5 h-5" />
          </button>
          
          <div className="flex items-center space-x-3 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
            <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-gray-900">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;