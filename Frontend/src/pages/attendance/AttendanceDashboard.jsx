import { useState, useEffect } from 'react';
import { Users, CheckCircle, XCircle, Clock, Coffee, Plane, Sun, Calendar, TrendingUp, TrendingDown, Building2, Filter } from 'lucide-react';
import api from '../../utils/api';

const StatCard = ({ icon: Icon, label, value, color, bg }) => (
  <div className={`${bg} rounded-2xl p-5 flex items-center gap-4 border border-gray-100 shadow-sm`}>
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div>
      <p className="text-xs font-semibold text-gray-500 m-0">{label}</p>
      <p className="text-2xl font-black text-gray-900 m-0">{value ?? '—'}</p>
    </div>
  </div>
);

const AttendanceDashboard = () => {
  const [stats, setStats] = useState(null);
  const [deptWise, setDeptWise] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/attendance/dashboard?date=${filterDate}`);
      setStats(res.data.data.stats);
      setDeptWise(res.data.data.deptWise || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { fetchDashboard(); }, [filterDate]);

  const cards = [
    { icon: Users, label: 'Total Employees', value: stats?.total, color: 'bg-blue-600', bg: 'bg-blue-50' },
    { icon: CheckCircle, label: 'Present', value: stats?.present, color: 'bg-emerald-500', bg: 'bg-emerald-50' },
    { icon: XCircle, label: 'Absent', value: stats?.absent, color: 'bg-red-500', bg: 'bg-red-50' },
    { icon: Clock, label: 'Late Comers', value: stats?.late, color: 'bg-amber-500', bg: 'bg-amber-50' },
    { icon: Coffee, label: 'Half Day', value: stats?.halfDay, color: 'bg-orange-500', bg: 'bg-orange-50' },
    { icon: Plane, label: 'On Leave', value: stats?.onLeave, color: 'bg-indigo-500', bg: 'bg-indigo-50' },
    { icon: Sun, label: 'Week Off', value: stats?.weekOff, color: 'bg-purple-500', bg: 'bg-purple-50' },
    { icon: Calendar, label: 'Holiday', value: stats?.holiday, color: 'bg-pink-500', bg: 'bg-pink-50' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h3 className="text-lg font-black text-gray-900 flex items-center gap-2 m-0">
            <span className="w-2.5 h-5 bg-blue-600 rounded-full inline-block" />
            Attendance Dashboard
          </h3>
          <p className="text-xs text-gray-500 mt-1 m-0">Real-time workforce attendance overview and insights</p>
        </div>
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-gray-400" />
          <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold" />
        </div>
      </div>

      {/* Stat Cards */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {cards.map(c => <StatCard key={c.label} {...c} />)}
        </div>
      )}

      {/* Attendance Rate + Dept Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Attendance % */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col items-center justify-center gap-4">
          <TrendingUp className="w-8 h-8 text-emerald-500" />
          <div className="text-center">
            <p className="text-xs text-gray-500 font-semibold m-0">Attendance Rate</p>
            <p className="text-5xl font-black text-emerald-600 m-0">{stats?.attendancePct ?? 0}%</p>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div className="bg-emerald-500 h-2 rounded-full transition-all" style={{ width: `${stats?.attendancePct ?? 0}%` }} />
          </div>
        </div>

        {/* Dept Wise */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h4 className="text-sm font-black text-gray-900 flex items-center gap-2 mb-4">
            <Building2 className="w-4 h-4 text-blue-500" /> Department-wise Attendance
          </h4>
          <div className="space-y-3">
            {deptWise.length > 0 ? deptWise.map(d => (
              <div key={d._id} className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-600 w-28 truncate">{d._id || 'N/A'}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: d.total > 0 ? `${Math.round((d.present / d.total) * 100)}%` : '0%' }} />
                </div>
                <span className="text-xs font-black text-blue-600 w-10 text-right">{d.present}/{d.total}</span>
              </div>
            )) : (
              <p className="text-xs text-gray-400 text-center py-4">No department data for today</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceDashboard;
