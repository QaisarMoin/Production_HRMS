
import { ArrowUp, ArrowDown } from 'lucide-react';

const StatCard = ({ title, count, icon: Icon, growth, color = 'blue' }) => {
  const colorMap = {
    blue: { bg: 'bg-blue-50/50 border border-blue-100', text: 'text-blue-600' },
    green: { bg: 'bg-green-50/50 border border-green-100', text: 'text-green-600' },
    purple: { bg: 'bg-purple-50/50 border border-purple-100', text: 'text-purple-600' },
    orange: { bg: 'bg-orange-50/50 border border-orange-100', text: 'text-orange-600' },
    red: { bg: 'bg-red-50/50 border border-red-100', text: 'text-red-600' },
    indigo: { bg: 'bg-indigo-50/50 border border-indigo-100', text: 'text-indigo-600' },
    teal: { bg: 'bg-teal-50/50 border border-teal-100', text: 'text-teal-600' },
  };

  const isPositive = growth >= 0;
  const colors = colorMap[color] || colorMap.blue;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1 text-left">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{title}</p>
          <p className="text-3xl font-black text-gray-900 leading-tight">{count}</p>
          {growth !== undefined && (
            <div className={`flex items-center mt-3 text-xs font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? <ArrowUp className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDown className="w-3.5 h-3.5 mr-0.5" />}
              <span>{Math.abs(growth)}%</span>
              <span className="text-gray-400 font-medium ml-1">vs last month</span>
            </div>
          )}
        </div>
        <div className={`${colors.bg} p-2.5 rounded-xl`}>
          <Icon className={`w-5 h-5 ${colors.text}`} />
        </div>
      </div>
    </div>
  );
};

export default StatCard;
