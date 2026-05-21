import { useSearchParams } from 'react-router-dom';
import AttendanceLogPage from './attendance/AttendanceLogPage';
import AttendanceHistoryPage from './attendance/AttendanceHistoryPage';
import RegularizationPage from './attendance/RegularizationPage';
import OvertimePage from './attendance/OvertimePage';
import PermissionPage from './attendance/PermissionPage';

const TAB_MAP = {
  'Attendance Log': AttendanceLogPage,
  'Attendance History': AttendanceHistoryPage,
  'Approve Regularization': RegularizationPage,
  'Approve Overtime': OvertimePage,
  'Approve Permission': PermissionPage,
};

const Attendance = () => {
  const [searchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'Attendance Log';
  const Component = TAB_MAP[tab] || AttendanceLogPage;
  return (
    <div className="p-6 text-left">
      <Component />
    </div>
  );
};

export default Attendance;
