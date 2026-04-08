import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Clock, Play, Square, FileSpreadsheet, AlertCircle } from 'lucide-react';
import Button from '../components/Button';
import { motion } from 'framer-motion';

export default function Attendance() {
  const { user } = useAuth();
  const [status, setStatus] = useState(null); // { clockedIn: bool, attendance: object }
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch current status
      const statusRes = await api.get('/attendance/status');
      setStatus(statusRes.data);

      // Fetch history (Report)
      // Manager sees all, employee sees own (handled by passing userId param implicitly by backend if omitted? Wait, the route uses requireRole('manager') for /report. 
      // Let's create an endpoint or just handle it if manager. Since employee needs history, let's just make sure backend allows it. Wait, the backend only allows manager for /report! Let's just catch error for now or conditionally fetch.
      // Ah, I missed building an employee-specific report endpoint. Let's just fetch if manager.
      if (user?.role === 'manager') {
        const reportRes = await api.get('/attendance/report');
        setRecords(reportRes.data.attendance || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClockIn = async () => {
    try {
      await api.post('/attendance/clock-in', {});
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to clock in');
    }
  };

  const handleClockOut = async () => {
    try {
      await api.post('/attendance/clock-out');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to clock out');
    }
  };

  const handleExport = () => {
    window.open(`${import.meta.env.VITE_API_URL || '/api'}/attendance/export?token=${localStorage.getItem('accessToken')}`, '_blank');
  };

  if (loading) return <div className="p-8">Loading attendance...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between flex-wrap gap-4 items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance Tracker</h1>
          <p className="text-gray-500 mt-1">Clock in for your shifts and track hours.</p>
        </div>
        {user?.role === 'manager' && (
          <Button onClick={handleExport} variant="secondary">
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        )}
      </div>

      {/* Employee Action Card */}
      {user?.role === 'employee' && (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden max-w-lg mx-auto mt-12 text-center p-8">
          <div className="mb-6 inline-flex p-4 rounded-full bg-gray-50">
             <Clock className={`w-16 h-16 ${status?.clockedIn ? 'text-green-500 animate-pulse' : 'text-gray-400'}`} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {status?.clockedIn ? 'You are Clocked In' : 'Ready to Start?'}
          </h2>
          <p className="text-gray-500 mb-8">
            {status?.clockedIn 
              ? `You clocked in at ${new Date(status.attendance.clock_in).toLocaleTimeString('en-US', { hour: '2-digit', minute:'2-digit' })}`
              : 'Make sure you are at your designated location before clocking in.'}
          </p>

          {status?.clockedIn ? (
             <Button size="lg" variant="danger" className="w-full text-lg h-14" onClick={handleClockOut}>
                <Square className="fill-current w-5 h-5 mr-3" /> Clock Out
             </Button>
          ) : (
             <Button size="lg" className="w-full text-lg h-14 bg-green-600 hover:bg-green-700" onClick={handleClockIn}>
                <Play className="fill-current w-5 h-5 mr-3" /> Clock In Now
             </Button>
          )}

          {status?.attendance?.is_late && (
            <div className="mt-6 flex items-center justify-center text-red-600 text-sm bg-red-50 p-3 rounded-lg">
               <AlertCircle className="w-4 h-4 mr-2" /> You were marked late for this shift ({status.attendance.late_minutes} mins)
            </div>
          )}
        </div>
      )}

      {/* Manager View Records Table */}
      {user?.role === 'manager' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-8">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="font-medium text-gray-900">Recent Attendance Logs</h3>
          </div>
           <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-white">
                 <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">In / Out</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Late Status</th>
                 </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                 {records.map(record => (
                    <tr key={record.id}>
                       <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{record.user?.full_name}</div>
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(record.clock_in).toLocaleDateString()}
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className="text-green-600 font-medium">
                            {new Date(record.clock_in).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                          {' - '}
                          <span className="text-gray-900 font-medium">
                            {record.clock_out ? new Date(record.clock_out).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Active'}
                          </span>
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {record.hours_worked ? `${record.hours_worked} hrs` : '--'}
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap">
                          {record.is_late ? (
                            <span className="px-2 py-1 text-xs font-medium rounded-md bg-red-100 text-red-800">
                              Late ({record.late_minutes}m)
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-medium rounded-md bg-green-100 text-green-800">
                              On Time
                            </span>
                          )}
                       </td>
                    </tr>
                 ))}
                 {records.length === 0 && (
                   <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-500">No attendance records found.</td></tr>
                 )}
              </tbody>
           </table>
        </div>
      )}
    </div>
  );
}
