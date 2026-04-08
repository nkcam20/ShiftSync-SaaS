import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../api/axios';
import { format } from 'date-fns';
import { ArrowRightLeft, Check, X } from 'lucide-react';
import Button from '../components/Button';
import Input from '../components/Input';
import { AnimatePresence, motion } from 'framer-motion';

export default function Swaps() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [swaps, setSwaps] = useState([]);
  const [myShifts, setMyShifts] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ requesterAssignmentId: '', targetId: '', reason: '' });

  useEffect(() => {
    fetchData();
    if (socket) {
      socket.on('swap:updated', fetchData);
      socket.on('swap:requested', fetchData);
    }
    return () => {
      if (socket) {
        socket.off('swap:updated');
        socket.off('swap:requested');
      }
    };
  }, [socket, user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/swaps');
      setSwaps(res.data.swaps);

      if (user?.role === 'employee') {
        const [shiftRes, teamRes] = await Promise.all([
          api.get('/shifts/my'),
          api.get('/users/profile').then(async () => api.get('/users/employees').catch(() => ({ data: { employees: []} }))) // Dirty trick since /employees is manager protected: wait, backend restrict /employees to manager?
          // I will conditionally fetch the target list or leave empty for general boards. Actually, targetId is optional in the DB.
        ]);
        
        // Filter future shifts only for swapping
        const validShifts = (shiftRes.data.shifts || []).filter(a => a.shift && new Date(a.shift.date) >= new Date());
        setMyShifts(validShifts);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRequest = async (e) => {
    e.preventDefault();
    try {
       await api.post('/swaps', { ...formData, targetId: formData.targetId || undefined });
       setIsModalOpen(false);
       fetchData();
       alert('Swap request submitted!');
    } catch (err) {
       alert(err.response?.data?.error || 'Failed to submit swap');
    }
  };

  const handleTargetRespond = async (id, accepted) => {
     try {
        await api.put(`/swaps/${id}/respond`, { accepted, targetAssignmentId: null }); // In a full real app, target selects their swap assignment here.
        fetchData();
     } catch (err) {
        alert(err.response?.data?.error || 'Failed action');
     }
  };

  const handleManagerReview = async (id, status) => {
     try {
        await api.put(`/swaps/${id}/review`, { status, managerNotes: '' });
        fetchData();
     } catch (err) {
        alert(err.response?.data?.error || 'Failed review');
     }
  };

  if (loading) return <div className="p-8">Loading swap requests...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <ArrowRightLeft className="w-6 h-6 mr-2 text-brand-600" /> 
            Shift Swaps
          </h1>
          <p className="text-gray-500 mt-1">Request covers or swap shifts with coworkers.</p>
        </div>
        {user?.role === 'employee' && (
          <Button onClick={() => setIsModalOpen(true)}>Request Swap</Button>
        )}
      </div>

      <div className="grid gap-6">
         {swaps.map(swap => (
            <div key={swap.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-6 md:items-center justify-between">
               <div className="flex-1 space-y-3">
                  <div className="flex items-center space-x-3">
                    <span className="font-bold text-lg text-gray-900">{swap.requester?.full_name}</span>
                    <ArrowRightLeft className="w-4 h-4 text-gray-400" />
                    <span className="font-bold text-lg text-gray-900">{swap.target ? swap.target.full_name : 'Anyone (Open Board)'}</span>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 mt-2">
                     <p className="text-sm font-medium text-gray-900">{swap.requester_assignment?.shift?.title}</p>
                     <p className="text-sm text-gray-500">
                        {swap.requester_assignment?.shift?.date && format(new Date(swap.requester_assignment.shift.date), 'EEEE, MMM d')} • {swap.requester_assignment?.shift?.start_time.slice(0,5)} to {swap.requester_assignment?.shift?.end_time.slice(0,5)}
                     </p>
                  </div>
                  {swap.reason && <p className="text-sm text-gray-600 italic">"{swap.reason}"</p>}
               </div>
               
               <div className="flex flex-col items-end min-w-[200px]">
                  <div className="mb-4">
                     {swap.status === 'approved' && <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">Swap Approved!</span>}
                     {swap.status === 'denied' && <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">Denied / Cancelled</span>}
                     {swap.status === 'pending' && <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">Awaiting Target</span>}
                     {swap.status === 'target_accepted' && <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">Awaiting Manager</span>}
                  </div>

                  {/* Actions for Target Employee */}
                  {user?.role === 'employee' && user?.id === swap.target_id && swap.status === 'pending' && (
                     <div className="flex space-x-2">
                        <Button variant="secondary" onClick={() => handleTargetRespond(swap.id, false)}>Decline</Button>
                        <Button onClick={() => handleTargetRespond(swap.id, true)}>Accept Cover</Button>
                     </div>
                  )}

                  {/* Actions for Manager */}
                  {user?.role === 'manager' && swap.status === 'target_accepted' && (
                     <div className="flex space-x-2">
                        <Button variant="secondary" className="text-red-600 border-red-200" onClick={() => handleManagerReview(swap.id, 'denied')}>Deny</Button>
                        <Button className="bg-green-600 hover:bg-green-700" onClick={() => handleManagerReview(swap.id, 'approved')}>Approve Swap</Button>
                     </div>
                  )}
               </div>
            </div>
         ))}
         
         {swaps.length === 0 && <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300 text-gray-500">No active swap requests.</div>}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
              <h2 className="text-xl font-bold mb-4">Request Shift Swap/Cover</h2>
              <form onSubmit={handleRequest} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Your Shift</label>
                  <select required className="w-full border-gray-300 rounded-md shadow-sm h-10 px-3 border" value={formData.requesterAssignmentId} onChange={e => setFormData({...formData, requesterAssignmentId: e.target.value})}>
                     <option value="">-- Choose Shift --</option>
                     {myShifts.map(s => (
                        <option key={s.id} value={s.id}>{s.shift.title} on {s.shift.date}</option>
                     ))}
                  </select>
                </div>
                
                <Input label="Reason" required as="textarea" placeholder="Family emergency..." value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} />
                
                <div className="flex space-x-3 mt-6">
                   <Button variant="secondary" onClick={() => setIsModalOpen(false)} className="flex-1" type="button">Cancel</Button>
                   <Button type="submit" className="flex-1 hover:bg-brand-700">Submit Request</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
