import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import Button from '../components/Button';
import Input from '../components/Input';
import { Settings, Save } from 'lucide-react';

const DAYS_OF_WEEK = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

export default function Availability() {
  const { user } = useAuth();
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAvailability();
  }, [user]);

  const fetchAvailability = async () => {
    try {
      setLoading(true);
      // Fetch user's existing availability
      const endPoint = user?.role === 'manager' ? '/availability/team' : '/availability/me';
      const res = await api.get(endPoint);
      
      if (user?.role === 'manager') {
        setAvailability(res.data.availability);
      } else {
        // Init default 7 days structure for employee if not exists
        const existing = res.data.availability || [];
        const initialForm = DAYS_OF_WEEK.map((day, index) => {
          const found = existing.find(a => a.day_of_week === index);
          return found || {
            day_of_week: index,
            start_time: '09:00',
            end_time: '17:00',
            is_available: true
          };
        });
        setAvailability(initialForm);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      // Ensure time string format is exactly HH:MM compliant (Vite/HTML5 time inputs are generally okay)
      const payload = availability.map(a => ({
        day_of_week: a.day_of_week,
        start_time: a.start_time.length === 5 ? a.start_time : a.start_time.slice(0, 5),
        end_time: a.end_time.length === 5 ? a.end_time : a.end_time.slice(0, 5),
        is_available: a.is_available
      }));

      await api.post('/availability', { availability: payload });
      alert('Availability updated successfully!');
      fetchAvailability();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save availability');
    } finally {
      setSaving(false);
    }
  };

  const updateDay = (index, field, value) => {
    const newAvail = [...availability];
    newAvail[index] = { ...newAvail[index], [field]: value };
    setAvailability(newAvail);
  };

  if (loading) return <div className="p-8">Loading availability...</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Settings className="w-6 h-6 mr-2 text-brand-600" /> 
            {user?.role === 'manager' ? 'Team Availability Overview' : 'My Availability'}
          </h1>
          <p className="text-gray-500 mt-1">
            {user?.role === 'manager' 
              ? 'View the weekly availability for all employees.' 
              : 'Set your general weekly working hours.'}
          </p>
        </div>
        {user?.role === 'employee' && (
          <Button onClick={handleSave} isLoading={saving}>
            <Save className="w-4 h-4 mr-2" /> Save Changes
          </Button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {user?.role === 'employee' ? (
           <div className="divide-y divide-gray-200">
             {availability.map((day, idx) => (
                <div key={idx} className="p-4 sm:flex items-center justify-between hover:bg-gray-50 transition">
                   <div className="mb-4 sm:mb-0 min-w-[150px]">
                      <label className="flex items-center space-x-3 cursor-pointer">
                         <input 
                           type="checkbox" 
                           checked={day.is_available} 
                           onChange={(e) => updateDay(idx, 'is_available', e.target.checked)}
                           className="w-5 h-5 text-brand-600 rounded border-gray-300 focus:ring-brand-500"
                         />
                         <span className={`font-medium ${day.is_available ? 'text-gray-900' : 'text-gray-400'}`}>
                           {DAYS_OF_WEEK[idx]}
                         </span>
                      </label>
                   </div>
                   
                   <div className={`flex items-center space-x-4 ${!day.is_available ? 'opacity-50 pointer-events-none' : ''}`}>
                      <Input 
                        type="time" 
                        value={day.start_time.slice(0,5)} 
                        onChange={(e) => updateDay(idx, 'start_time', e.target.value)}
                        className="w-32 text-center"
                      />
                      <span className="text-gray-500 font-medium">to</span>
                      <Input 
                        type="time" 
                        value={day.end_time.slice(0,5)} 
                        onChange={(e) => updateDay(idx, 'end_time', e.target.value)}
                        className="w-32 text-center"
                      />
                   </div>
                </div>
             ))}
           </div>
        ) : (
          <div className="overflow-x-auto">
             <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                   <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Day</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Times</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                   </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                   {availability.map((record) => (
                      <tr key={record.id}>
                         <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                           {record.user?.full_name}
                         </td>
                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                           {DAYS_OF_WEEK[record.day_of_week]}
                         </td>
                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                           {record.is_available ? `${record.start_time.slice(0,5)} - ${record.end_time.slice(0,5)}` : 'N/A'}
                         </td>
                         <td className="px-6 py-4 whitespace-nowrap">
                            {record.is_available ? (
                              <span className="px-2 py-1 text-xs font-medium rounded-md bg-green-100 text-green-800">Available</span>
                            ) : (
                              <span className="px-2 py-1 text-xs font-medium rounded-md bg-gray-100 text-gray-800">Unavailable</span>
                            )}
                         </td>
                      </tr>
                   ))}
                   {availability.length === 0 && (
                      <tr><td colSpan="4" className="px-6 py-8 text-center text-gray-500">No availability records provided yet.</td></tr>
                   )}
                </tbody>
             </table>
          </div>
        )}
      </div>
    </div>
  );
}
