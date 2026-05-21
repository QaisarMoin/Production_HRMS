
const DepartmentCard = ({ name, count, icon: Icon }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-blue-100 rounded-lg">
            <Icon className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">{name}</p>
            <p className="text-2xl font-bold text-gray-900">{count}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepartmentCard;
