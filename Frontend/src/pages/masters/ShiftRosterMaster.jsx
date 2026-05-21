import { useState } from 'react';
import { Layers, Save, Users, RefreshCw } from 'lucide-react';
import api from '../../utils/api';

const ShiftRosterMaster = () => {
  const [financialYear, setFinancialYear] = useState('2026-2027');
  const [month, setMonth] = useState('May');
  const [loadBasedOn, setLoadBasedOn] = useState('All');
  
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const monthsList = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const yearsList = ['2025-2026', '2026-2027', '2027-2028'];

  // Load employees and merge with saved roster shifts if any exist
  const handleLoadEmployees = async () => {
    setLoading(true);
    try {
      // 1. Fetch active employees list
      const empRes = await api.get('/employees');
      const activeEmps = empRes.data.data || [];

      // 2. Fetch existing roster for the selected period
      const rosterRes = await api.get('/shift-rosters', {
        params: { year: financialYear, month: month }
      });
      const savedRosters = rosterRes.data.data || [];
      const savedRoster = savedRosters[0]; // Match the first matching month roster

      const daysCount = 31;

      // 3. Map employees to their schedules
      const matrix = activeEmps.map(emp => {
        // Look if this employee has shifts saved in database
        const savedEmp = savedRoster?.employees?.find(se => se.employee_id === emp._id || se.employee_code === emp.employee_code);

        let employeeShifts = [];
        if (savedEmp && savedEmp.shifts && savedEmp.shifts.length > 0) {
          employeeShifts = savedEmp.shifts.map(s => ({
            date: s.date,
            shift_name: s.shift_name
          }));
        } else {
          // Fallback to default shifts
          employeeShifts = Array.from({ length: daysCount }, (_, i) => ({
            date: new Date(2026, monthsList.indexOf(month), i + 1).toISOString(),
            shift_name: i % 7 === 6 ? 'OFF' : 'Morning General'
          }));
        }

        return {
          employee_id: emp._id,
          employee_code: emp.employee_code,
          employee_name: emp.full_name || `${emp.first_name} ${emp.last_name}`,
          shifts: employeeShifts
        };
      });

      setEmployees(matrix);
      setLoaded(true);
    } catch (err) {
      console.error('Error loading roster matrix:', err);
      alert('Failed to load roster matrix from server.');
    } finally {
      setLoading(false);
    }
  };

  const handleShiftChange = (empId, dayIndex, newShift) => {
    setEmployees(employees.map(emp => {
      if (emp.employee_id === empId) {
        const updatedShifts = [...emp.shifts];
        updatedShifts[dayIndex] = {
          ...updatedShifts[dayIndex],
          shift_name: newShift
        };
        return { ...emp, shifts: updatedShifts };
      }
      return emp;
    }));
  };

  const handleSaveRoster = async () => {
    try {
      const payload = {
        financial_year: financialYear,
        month,
        employees
      };

      await api.post('/shift-rosters/save', payload);
      alert(`Shift Roster Saved Successfully to Server!\nFinancial Year: ${financialYear}\nMonth: ${month}\nSynced to Payroll & Attendance Engines.`);
    } catch (err) {
      console.error('Error saving shift roster:', err);
      alert('Error saving roster: ' + (err.response?.data?.message || err.message));
    }
  };

  const daysCount = 31;

  return (
    <div className="space-y-6 text-left">
      {/* 1. Architecture Controller Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
            <span className="w-2.5 h-5 bg-blue-600 rounded-full inline-block" />
            Dynamic Shift Roster Scheduler
          </h3>
          <p className="text-xs text-gray-500 mt-1 m-0">
            Define employee shifts chronologically. Connects rosters with the Attendance engine for late markings and Payroll calculations.
          </p>
        </div>
        {loaded && (
          <button
            onClick={handleSaveRoster}
            className="flex items-center space-x-1.5 px-5 py-2.5 bg-blue-600 text-white text-xs font-black rounded-xl hover:bg-blue-700 transition shadow-sm self-stretch sm:self-auto justify-center"
          >
            <Save className="w-4 h-4" />
            <span>Save Shift Roster</span>
          </button>
        )}
      </div>

      {/* 2. Roster Form Controller */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Financial Year</label>
            <select
              value={financialYear}
              onChange={(e) => setFinancialYear(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 cursor-pointer"
            >
              {yearsList.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Month Selection</label>
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 cursor-pointer"
            >
              {monthsList.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Load Employees Based On</label>
            <select
              value={loadBasedOn}
              onChange={(e) => setLoadBasedOn(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 cursor-pointer"
            >
              <option value="All">All Employees</option>
              <option value="Department">Department Wise</option>
              <option value="Branch">Branch Wise</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleLoadEmployees}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Load Shift Matrix</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Shift Mapping Spreadsheet Grid */}
      {loaded ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 bg-gray-50/50 border-b border-gray-100 flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-400" />
            <span className="text-xs font-bold text-gray-600">Assign Shifts to Employee Directory (Days 1 - 31)</span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 table-fixed border-collapse">
              <thead className="bg-gray-50/75 select-none">
                <tr>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest w-36 sticky left-0 bg-gray-50 z-10 border-r border-gray-100">
                    Employee Info
                  </th>
                  {Array.from({ length: daysCount }, (_, i) => (
                    <th key={i} className="px-2 py-3 text-center text-[10px] font-bold text-gray-500 uppercase tracking-wider w-16 border-r border-gray-100">
                      Day {i + 1}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {employees.map((emp) => (
                  <tr key={emp.employee_id} className="hover:bg-gray-50/20">
                    <td className="px-4 py-3 whitespace-nowrap sticky left-0 bg-white z-10 border-r border-gray-100 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                      <p className="m-0 text-xs font-bold text-gray-900 truncate">{emp.employee_name}</p>
                      <p className="m-0 text-[10px] text-blue-600 font-bold tracking-wide mt-0.5">{emp.employee_code}</p>
                    </td>
                    {emp.shifts.map((s, idx) => (
                      <td key={idx} className="p-1 text-center border-r border-gray-100">
                        <select
                          value={s.shift_name}
                          onChange={(e) => handleShiftChange(emp.employee_id, idx, e.target.value)}
                          className={`w-full py-1 text-[10px] font-bold border-0 rounded text-center cursor-pointer focus:ring-1 focus:ring-blue-500 ${
                            s.shift_name === 'Morning General' ? 'bg-green-50 text-green-700' :
                            s.shift_name === 'Evening Support' ? 'bg-blue-50 text-blue-700' :
                            s.shift_name === 'Night Operations' ? 'bg-purple-50 text-purple-700' :
                            'bg-red-50 text-red-600'
                          }`}
                        >
                          <option value="Morning General">M (Gen)</option>
                          <option value="Evening Support">E (Sup)</option>
                          <option value="Night Operations">N (Ops)</option>
                          <option value="OFF">OFF</option>
                        </select>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="p-4 bg-gray-50/40 border-t border-gray-100 flex flex-wrap gap-4 text-xs font-semibold text-gray-500 select-none">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-green-500" /> Morning General (09:00 - 18:00)</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-blue-500" /> Evening Support (14:00 - 23:00)</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-purple-500" /> Night Operations (22:00 - 07:00)</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-red-500" /> OFF (Weekly Off Day)</span>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center flex flex-col items-center">
          <Layers className="w-12 h-12 text-gray-300 mb-3" />
          <p className="text-sm font-bold text-gray-700">No shift roster loaded yet.</p>
          <p className="text-xs text-gray-400 mt-1 max-w-sm">
            Select the financial year, target month, and employee parameters, then click the Load button to display the spreadsheet.
          </p>
        </div>
      )}
    </div>
  );
};

export default ShiftRosterMaster;
