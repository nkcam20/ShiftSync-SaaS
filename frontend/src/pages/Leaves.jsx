import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../api/axios';
import { format } from 'date-fns';
import { Plane, CheckCircle, XCircle } from 'lucide-react';
import Button from '../components/Button';
import Input from '../components/Input';
import { AnimatePresence, motion } from 'framer-motion';

export default function Leaves() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    startDate: '', endDate: '', leaveType: 'vacation', reason: ''
  });

  useEffect(() => {
    fetchLeaves();
    
    if (socket) {
      socket.on('leave:created', fetchLeaves);
      socket.on('leave:updated', fetchLeaves);
    }
    return () => {
      if (socket) {
        socket.off('leave:created');
        socket.off('leave:updated');
      }
    };
  }, [socket, user]);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const res = await api.get('/leaves');
      setLeaves(res.data.leaves);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/leaves', formData);
      setIsModalOpen(false);
      fetchLeaves();
      setFormData({ startDate: '', endDate: '', leaveType: 'vacation', reason: '' });
      alert('Leave request submitted!');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to submit leave request');
    }
  };

  const reviewLeave = async (id, status) => {
    if (!window.confirm(`Are you sure you want to ${status} this leave request?`)) return;
    try {
      await api.put(`/leaves/${id}/review`, { status, reviewNotes: '' });
      fetchLeaves();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to review');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved': return <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Approved</span>;
      case 'denied': return <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">Denied</span>;
      default: return <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">Pending Review</span>;
    }
  };

  if (loading) return <div className="p-8">Loading leaves...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Plane className="w-6 h-6 mr-2 text-brand-600" /> 
            Leave Requests
          </h1>
          <p className="text-gray-500 mt-1">Manage time off and vacations.</p>
        </div>
        {user?.role === 'employee' && (
          <Button onClick={() => setIsModalOpen(true)}>Request Time Off</Button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <ul className="divide-y divide-gray-200">
          {leaves.map((leave) => (
            <li key={leave.id} className="p-6">
               <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    {user?.role === 'manager' && <p className="font-bold text-gray-900 mb-1">{leave.user?.full_name}</p>}
                    <div className="flex items-center space-x-4">
                      <span className="font-medium text-gray-800 capitalize">{leave.leave_type} Leave</span>
                      {getStatusBadge(leave.status)}
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                       <span className="font-medium">Dates:</span> {format(new Date(leave.start_date), 'MMM d, yyyy')} - {format(new Date(leave.end_date), 'MMM d, yyyy')}
                    </p>
                    {leave.reason && <p className="text-sm text-gray-600 mt-1 italic">"{leave.reason}"</p>}
                  </div>

                  {user?.role === 'manager' && leave.status === 'pending' && (
                    <div className="flex space-x-2">
                       <Button variant="secondary" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => reviewLeave(leave.id, 'denied')}>
                         <XCircle className="w-4 h-4 mr-1" /> Deny
                       </Button>
                       <Button className="bg-green-600 hover:bg-green-700" onClick={() => reviewLeave(leave.id, 'approved')}>
                         <CheckCircle className="w-4 h-4 mr-1" /> Approve
                       </Button>
                    </div>
                  )}
               </div>
            </li>
          ))}
          {leaves.length === 0 && (
            <div className="p-12 text-center text-gray-500">No leave requests found.</div>
          )}
        </ul>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
              <h2 className="text-xl font-bold mb-4">Request Leave</h2>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                   <Input label="Start Date" type="date" required value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
                   <Input label="End Date" type="date" required value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Leave Type</label>
                   <select className="w-full border-gray-300 rounded-md shadow-sm h-10 px-3 border focus:ring-brand-500 focus:border-brand-500" value={formData.leaveType} onChange={e => setFormData({...formData, leaveType: e.target.value})}>
                     <option value="vacation">Vacation</option>
                     <option value="sick">Sick Leave</option>
                     <option value="personal">Personal Leave</option>
                     <option value="emergency">Emergency</option>
                   </select>
                </div>
                <Input label="Reason / Notes" required as="textarea" placeholder="Heading out of town..." value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} />
                
                <div className="flex space-x-3 mt-6">
                   <Button variant="secondary" onClick={() => setIsModalOpen(false)} className="flex-1" type="button">Cancel</Button>
                   <Button type="submit" className="flex-1">Submit Request</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
