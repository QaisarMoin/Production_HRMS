import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, DollarSign } from 'lucide-react';
import Modal from '../../components/common/Modal';
import api from '../../utils/api';

const SalaryStructureMaster = () => {
  const [structures, setStructures] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStructure, setEditingStructure] = useState(null);

  // Main Form State matching the MongoDB collections precisely
  const [formData, setFormData] = useState({
    employee_name: '',
    employee_code: '',
    calculation_type: 'Based On Formula', // "Manual" | "Based On Formula"
    gross_salary: 5000,
    basic: 2500,
    hra: 1000,
    da: 500,
    medical: 250,
    other_allowances: 750,
    deductions_pf: 300,
    deductions_tax: 200,
    component_group: 'A'
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [structuresRes, employeesRes] = await Promise.all([
        api.get('/salary-structures'),
        api.get('/employees')
      ]);
      setStructures(structuresRes.data.data || []);
      setEmployees(employeesRes.data.data || []);
    } catch (err) {
      console.error('Error fetching salary structure data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Recalculates formula parameters when gross changes (Formula engine simulation)
  const handleGrossChange = (val) => {
    const gross = parseFloat(val) || 0;
    if (formData.calculation_type === 'Based On Formula') {
      setFormData(prev => ({
        ...prev,
        gross_salary: gross,
        basic: gross * 0.50,
        hra: gross * 0.20,
        da: gross * 0.10,
        medical: gross * 0.05,
        other_allowances: gross * 0.15,
        deductions_pf: gross * 0.06,
        deductions_tax: gross * 0.04
      }));
    } else {
      setFormData(prev => ({ ...prev, gross_salary: gross }));
    }
  };

  // Recalculates total gross when individual components are modified manually
  const handleComponentChange = (name, value) => {
    const numericVal = parseFloat(value) || 0;
    setFormData(prev => {
      const updated = { ...prev, [name]: numericVal };
      if (prev.calculation_type === 'Manual') {
        const calculatedGross = 
          updated.basic + 
          updated.hra + 
          updated.da + 
          updated.medical + 
          updated.other_allowances;
        return { ...updated, gross_salary: calculatedGross };
      }
      return updated;
    });
  };

  const handleAdd = () => {
    setEditingStructure(null);
    setFormData({
      employee_name: '',
      employee_code: '',
      calculation_type: 'Based On Formula',
      gross_salary: 5000,
      basic: 2500,
      hra: 1000,
      da: 500,
      medical: 250,
      other_allowances: 750,
      deductions_pf: 300,
      deductions_tax: 200,
      component_group: 'A'
    });
    setIsModalOpen(true);
  };

  const handleEdit = (sal) => {
    setEditingStructure(sal);
    setFormData({
      employee_name: sal.employee_name || '',
      employee_code: sal.employee_code || '',
      calculation_type: sal.calculation_type || 'Based On Formula',
      gross_salary: sal.gross_salary || 0,
      basic: sal.basic || 0,
      hra: sal.hra || 0,
      da: sal.da || 0,
      medical: sal.medical || 0,
      other_allowances: sal.other_allowances || 0,
      deductions_pf: sal.deductions_pf || 0,
      deductions_tax: sal.deductions_tax || 0,
      component_group: sal.component_group || 'A'
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this salary structure record?')) {
      try {
        await api.delete(`/salary-structures/${id}`);
        fetchData();
      } catch (err) {
        console.error('Error deleting salary structure:', err);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const selectedEmp = employees.find(x => x.employee_code === formData.employee_code);
      const payload = {
        ...formData,
        employee_id: selectedEmp?._id || null
      };

      if (editingStructure) {
        await api.put(`/salary-structures/${editingStructure._id}`, payload);
      } else {
        await api.post('/salary-structures', payload);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Error saving salary structure:', err);
      alert('Error saving record: ' + (err.response?.data?.message || err.message));
    }
  };

  const filteredStructures = structures.filter(sal =>
    sal.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sal.employee_code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 text-left">
      {/* Upper header controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
            <span className="w-2.5 h-5 bg-blue-600 rounded-full inline-block" />
            Salary Structures Formula Engine
          </h3>
          <p className="text-xs text-gray-500 mt-1 m-0">
            Define salary bands, deduction rates, and gross components. Computes allowances dynamically or on-demand based on custom ratios.
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center space-x-1.5 px-4 py-2.5 bg-blue-600 text-white text-xs font-black rounded-xl hover:bg-blue-700 transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Setup Structure</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search salary bands by code or employee..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50/60 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50/75">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Employee Info</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Calculation Type</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-widest">Gross Allowance</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-widest">Deductions (PF + Tax)</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-widest">Net Payout Est.</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-xs text-gray-400">Loading structures list...</td>
                </tr>
              ) : filteredStructures.length > 0 ? (
                filteredStructures.map((sal) => (
                  <tr key={sal._id} className="hover:bg-gray-50/40 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-emerald-500" />
                        <div>
                          <p className="m-0 font-bold">{sal.employee_name || 'Generic Employee'}</p>
                          <p className="m-0 text-[10px] text-blue-600 font-bold mt-0.5">{sal.employee_code || 'N/A'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        sal.calculation_type === 'Based On Formula' ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'
                      }`}>{sal.calculation_type}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-black text-right text-gray-900">
                      ${(sal.gross_salary || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold text-right text-red-600">
                      -${((sal.deductions_pf || 0) + (sal.deductions_tax || 0)).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-right text-green-600">
                      ${((sal.gross_salary || 0) - ((sal.deductions_pf || 0) + (sal.deductions_tax || 0))).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-medium">
                      <div className="flex space-x-2.5">
                        <button onClick={() => handleEdit(sal)} className="text-blue-600 hover:text-blue-900 bg-transparent border-0"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(sal._id)} className="text-red-600 hover:text-red-900 bg-transparent border-0"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-xs text-gray-400">No employee salary structures built.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingStructure ? 'Edit Salary Components' : 'Establish Salary Structure'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[480px] overflow-y-auto pr-2 text-left">
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Select Employee</label>
            <select
              value={formData.employee_code}
              onChange={(e) => {
                const code = e.target.value;
                const emp = employees.find(x => x.employee_code === code);
                if (emp) {
                  setFormData(prev => ({
                    ...prev,
                    employee_code: emp.employee_code,
                    employee_name: `${emp.first_name} ${emp.last_name}`
                  }));
                } else {
                  setFormData(prev => ({
                    ...prev,
                    employee_code: '',
                    employee_name: ''
                  }));
                }
              }}
              required
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 cursor-pointer"
            >
              <option value="">-- Choose Employee --</option>
              {employees.map(emp => (
                <option key={emp._id} value={emp.employee_code}>
                  {emp.first_name} {emp.last_name} ({emp.employee_code})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Calculation Type</label>
              <select
                name="calculation_type"
                value={formData.calculation_type}
                onChange={(e) => {
                  const type = e.target.value;
                  setFormData(prev => ({ ...prev, calculation_type: type }));
                  if (type === 'Based On Formula') {
                    const currentGross = formData.gross_salary;
                    setFormData(prev => ({
                      ...prev,
                      calculation_type: type,
                      basic: currentGross * 0.50,
                      hra: currentGross * 0.20,
                      da: currentGross * 0.10,
                      medical: currentGross * 0.05,
                      other_allowances: currentGross * 0.15,
                      deductions_pf: currentGross * 0.06,
                      deductions_tax: currentGross * 0.04
                    }));
                  }
                }}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 cursor-pointer"
              >
                <option value="Based On Formula">Based On Formula (Automatic)</option>
                <option value="Manual">Manual Components</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Gross Salary Band</label>
              <input
                type="number"
                value={formData.gross_salary}
                onChange={(e) => handleGrossChange(e.target.value)}
                disabled={formData.calculation_type === 'Manual'}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-black text-green-700 disabled:opacity-70 disabled:cursor-not-allowed"
              />
              {formData.calculation_type === 'Manual' && (
                <span className="text-[10px] text-amber-500 font-bold mt-1 block">Recalculates based on manual parameters below.</span>
              )}
            </div>
          </div>

          <div className="bg-gray-50/75 p-4 rounded-2xl border border-gray-100 space-y-3">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider m-0">Basic Allowances Breakdown</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[9px] font-bold text-gray-500 mb-1">Basic Allowance (50% ratio)</label>
                <input
                  type="number"
                  value={formData.basic}
                  disabled={formData.calculation_type === 'Based On Formula'}
                  onChange={(e) => handleComponentChange('basic', e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-gray-500 mb-1">HRA (20% ratio)</label>
                <input
                  type="number"
                  value={formData.hra}
                  disabled={formData.calculation_type === 'Based On Formula'}
                  onChange={(e) => handleComponentChange('hra', e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[9px] font-bold text-gray-500 mb-1">DA (10%)</label>
                <input
                  type="number"
                  value={formData.da}
                  disabled={formData.calculation_type === 'Based On Formula'}
                  onChange={(e) => handleComponentChange('da', e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-gray-500 mb-1">Medical (5%)</label>
                <input
                  type="number"
                  value={formData.medical}
                  disabled={formData.calculation_type === 'Based On Formula'}
                  onChange={(e) => handleComponentChange('medical', e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-gray-500 mb-1">Other (15%)</label>
                <input
                  type="number"
                  value={formData.other_allowances}
                  disabled={formData.calculation_type === 'Based On Formula'}
                  onChange={(e) => handleComponentChange('other_allowances', e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold"
                />
              </div>
            </div>
          </div>

          <div className="bg-red-50/50 p-4 rounded-2xl border border-red-100/50 space-y-3">
            <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider m-0">Standard Deductions</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[9px] font-bold text-gray-500 mb-1">Provident Fund (PF)</label>
                <input
                  type="number"
                  value={formData.deductions_pf}
                  onChange={(e) => setFormData({ ...formData, deductions_pf: parseFloat(e.target.value) || 0 })}
                  className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-red-700"
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-gray-500 mb-1">Professional Tax / TDS</label>
                <input
                  type="number"
                  value={formData.deductions_tax}
                  onChange={(e) => setFormData({ ...formData, deductions_tax: parseFloat(e.target.value) || 0 })}
                  className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-red-700"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 text-white text-xs font-black rounded-xl hover:bg-blue-700 shadow-sm"
            >
              {editingStructure ? 'Save Calculations' : 'Allocate Salary Band'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SalaryStructureMaster;
