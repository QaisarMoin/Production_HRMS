import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, MapPin, Navigation, ToggleLeft, ToggleRight } from 'lucide-react';
import Modal from '../../components/common/Modal';
import api from '../../utils/api';

const LocationMaster = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);

  const [formData, setFormData] = useState({
    location_name: '',
    radius: 100, // in meters
    latitude: 40.7128,
    longitude: -74.0060,
    status: true
  });

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const res = await api.get('/locations');
      setLocations(res.data.data || []);
    } catch (err) {
      console.error('Error fetching locations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleAdd = () => {
    setEditingLocation(null);
    setFormData({
      location_name: '',
      radius: 100,
      latitude: 12.9716,
      longitude: 77.5946,
      status: true
    });
    setIsModalOpen(true);
  };

  const handleEdit = (loc) => {
    setEditingLocation(loc);
    setFormData({
      location_name: loc.location_name,
      radius: loc.radius,
      latitude: loc.latitude,
      longitude: loc.longitude,
      status: loc.status
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this geofence office location?')) {
      try {
        await api.delete(`/locations/${id}`);
        fetchLocations();
      } catch (err) {
        console.error('Error deleting location:', err);
      }
    }
  };

  const handleToggleStatus = async (loc) => {
    try {
      await api.put(`/locations/${loc._id}`, { status: !loc.status });
      fetchLocations();
    } catch (err) {
      console.error('Error toggling location status:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const lat = parseFloat(formData.latitude);
    const lng = parseFloat(formData.longitude);
    const rad = parseInt(formData.radius);

    try {
      const payload = {
        ...formData,
        latitude: lat,
        longitude: lng,
        radius: rad
      };

      if (editingLocation) {
        await api.put(`/locations/${editingLocation._id}`, payload);
      } else {
        await api.post('/locations', payload);
      }
      setIsModalOpen(false);
      fetchLocations();
    } catch (err) {
      console.error('Error saving location:', err);
      alert('Error saving record: ' + (err.response?.data?.message || err.message));
    }
  };

  const filteredLocations = locations.filter(loc =>
    loc.location_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
            <span className="w-2.5 h-5 bg-blue-600 rounded-full inline-block" />
            Office Locations Geofencing Setup
          </h3>
          <p className="text-xs text-gray-500 mt-1 m-0">
            Define office coordinates (Latitude / Longitude) and fence boundaries in meters to enable biometric check-in range validations.
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center space-x-1.5 px-4 py-2.5 bg-blue-600 text-white text-xs font-black rounded-xl hover:bg-blue-700 transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Location</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search office locations..."
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
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Office Name</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Fencing Coordinates</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Fencing Radius</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Geo Check Status</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center text-xs text-gray-400">Loading locations...</td>
                </tr>
              ) : filteredLocations.length > 0 ? (
                filteredLocations.map((loc) => (
                  <tr key={loc._id} className="hover:bg-gray-50/40 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-red-500" />
                        <span>{loc.location_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600">
                      <div className="flex items-center gap-1.5 font-semibold">
                        <Navigation className="w-3.5 h-3.5 text-blue-500 rotate-45" />
                        <span>Lat: {loc.latitude} | Lng: {loc.longitude}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-700 font-bold">
                      {loc.radius} meters
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                      <button onClick={() => handleToggleStatus(loc)} className="bg-transparent border-0 cursor-pointer p-0">
                        {loc.status ? (
                          <span className="flex items-center text-green-600 font-bold gap-1"><ToggleRight className="w-5 h-5" /> Enabled</span>
                        ) : (
                          <span className="flex items-center text-red-500 font-bold gap-1"><ToggleLeft className="w-5 h-5" /> Disabled</span>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-medium">
                      <div className="flex space-x-2.5">
                        <button onClick={() => handleEdit(loc)} className="text-blue-600 hover:text-blue-900 bg-transparent border-0"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(loc._id)} className="text-red-600 hover:text-red-900 bg-transparent border-0"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center text-xs text-gray-400">No office locations registered.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingLocation ? 'Edit Fencing Coordinates' : 'Create Fencing Location'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Office Name</label>
            <input
              type="text"
              name="location_name"
              value={formData.location_name}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
              placeholder="e.g. Bangalore Development Center"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Latitude</label>
              <input
                type="number"
                step="any"
                name="latitude"
                value={formData.latitude}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Longitude</label>
              <input
                type="number"
                step="any"
                name="longitude"
                value={formData.longitude}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Fencing Radius (meters)</label>
              <input
                type="number"
                name="radius"
                value={formData.radius}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Fencing Validation</label>
              <select
                name="status"
                value={formData.status ? 'true' : 'false'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value === 'true' })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 font-bold"
              >
                <option value="true">Enable Range Checks</option>
                <option value="false">Skip Geofencing Check</option>
              </select>
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
              {editingLocation ? 'Save Fencing Coordinates' : 'Establish Geofence'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default LocationMaster;
