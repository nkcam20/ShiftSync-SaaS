import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../api/axios';
import { format, addDays, startOfWeek } from 'date-fns';
import { Calendar as CalendarIcon, Clock, Users, Plus, BrainCircuit, X } from 'lucide-react';
import Button from '../components/Button';
import Input from '../components/Input';
import { motion, AnimatePresence } from 'framer-motion';

export default function Schedule() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Date range tracking (current week)
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  
  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '', date: format(new Date(), 'yyyy-MM-dd'), start_time: '09:00', end_time: '17:00', required_count: 1
  });

  // AI Scheduler Modal
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);

  useEffect(() => {
    fetchShifts();
    
    if (socket) {
      socket.on('schedule:published', (data) => {
        // Soft refresh
        fetchShifts();
      });
    }

    return () => {
      if (socket) socket.off('schedule:published');
    }
  }, [weekStart, socket]);

  const fetchShifts = async () => {
    setLoading(true);
    try {
      const start = format(weekStart, 'yyyy-MM-dd');
      const end = format(addDays(weekStart, 6), 'yyyy-MM-dd');
      
      const endpoint = user?.role === 'manager' ? '/shifts' : '/shifts/my';
      const res = await api.get(`${endpoint}?startDate=${start}&endDate=${end}`);
      setShifts(res.data.shifts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/shifts', formData);
      setIsCreateOpen(false);
      fetchShifts();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create shift');
    }
  };

  const handlePublish = async () => {
    const draftIds = shifts.filter(s => s.status === 'draft').map(s => s.id);
    if(draftIds.length === 0) return alert('No drafts to publish.');
    
    try {
      await api.post('/shifts/publish', { shiftIds: draftIds });
      fetchShifts();
      alert('Published successfully!');
    } catch (err) {
      alert(err.response?.data?.error || 'Fail');
    }
  };

  const handleRunAI = async () => {
    setAiLoading(true);
    setAiResult(null);
    try {
      const start = format(weekStart, 'yyyy-MM-dd');
      const end = format(addDays(weekStart, 6), 'yyyy-MM-dd');
      
      const res = await api.post('/scheduler/generate', { startDate: start, endDate: end });
      setAiResult(res.data);
      fetchShifts(); // Refresh to see new assignments
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to run AI scheduling');
    } finally {
      setAiLoading(false);
    }
  };

  // Build 7 columns for the week
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

  return (
    <div className="p-4 sm:p-8 flex flex-col h-full bg-white">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4 border-b pb-4">
        <div className="flex items-center space-x-4">
          <CalendarIcon className="h-8 w-8 text-brand-600 bg-brand-50 p-1.5 rounded-lg" />
          <div>
            <h1 className="text-xl font-bold text-gray-900">Weekly Schedule</h1>
            <p className="text-sm text-gray-500">
              {format(weekStart, 'MMM d')} - {format(weekDays[6], 'MMM d, yyyy')}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="secondary" onClick={() => setWeekStart(addDays(weekStart, -7))}>Prev</Button>
          <Button variant="secondary" onClick={() => setWeekStart(addDays(weekStart, 7))}>Next</Button>
          
          {user?.role === 'manager' && (
            <>
              <Button variant="ghost" className="text-brand-600 bg-brand-50" onClick={() => setIsAIOpen(true)}>
                 <BrainCircuit className="h-4 w-4 mr-2" /> Auto-Schedule
              </Button>
              <Button onClick={() => setIsCreateOpen(true)}>
                 <Plus className="h-4 w-4 mr-2" /> New Shift
              </Button>
              <Button variant="secondary" onClick={handlePublish}>Publish Drafts</Button>
            </>
          )}
        </div>
      </div>

      {/* Calendar Grid */}
      {loading ? (
        <div className="flex-1 flex justify-center pt-20 text-gray-500">Loading schedule...</div>
      ) : (
        <div className="flex-1 overflow-x-auto min-h-[500px]">
          <div className="grid grid-cols-7 min-w-[800px] divide-x divide-gray-200 border-t border-gray-200">
            {weekDays.map(day => {
              const dayStr = format(day, 'yyyy-MM-dd');
              
              // Depending on role, the structure of 'shifts' array differs slightly.
              // For manager: shifts is array of actual shifts.
              // For employee: shifts is array of assignments, which have a nested a.shift object.
              const dayShifts = user?.role === 'manager' 
                ? shifts.filter(s => s.date === dayStr)
                : shifts.filter(a => a.shift?.date === dayStr).map(a => a.shift);
                
              return (
                <div key={dayStr} className="flex flex-col bg-gray-50/30">
                  <div className="text-center py-3 border-b border-gray-200 bg-gray-50 sticky top-0">
                    <p className="text-sm font-medium text-gray-900">{format(day, 'EEEE')}</p>
                    <p className="text-xs text-gray-500">{format(day, 'MMM d')}</p>
                  </div>
                  <div className="flex-1 p-2 space-y-2 relative">
                    {dayShifts.map(shift => (
                      <motion.div 
                        key={shift.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`p-3 rounded-lg border shadow-sm text-sm ${
                          shift.status === 'draft' ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-200'
                        }`}
                      >
                        <p className="font-semibold text-gray-900 truncate">{shift.title}</p>
                        <div className="flex items-center text-xs text-gray-500 mt-1">
                          <Clock className="w-3 h-3 mr-1" />
                          {shift.start_time.slice(0,5)} - {shift.end_time.slice(0,5)}
                        </div>
                        {user?.role === 'manager' && (
                          <div className="flex items-center text-xs text-blue-600 mt-2 bg-blue-50 w-fit px-1.5 py-0.5 rounded">
                            <Users className="w-3 h-3 mr-1" />
                            {shift.assignments?.length || 0} / {shift.required_count} Assigned
                          </div>
                        )}
                        {shift.status === 'draft' && <span className="absolute top-2 right-2 flex h-2 w-2 rounded-full bg-orange-400"></span>}
                      </motion.div>
                    ))}
                    {dayShifts.length === 0 && (
                      <div className="h-full flex items-center justify-center">
                        <span className="text-xs text-gray-300">No shifts</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* AI Modal */}
      <AnimatePresence>
        {isAIOpen && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
             <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y:0 }} exit={{ opacity:0 }} className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
                <div className="bg-gradient-to-r from-brand-600 to-purple-600 p-6 text-white flex justify-between items-center">
                   <div>
                      <h2 className="text-xl font-bold flex items-center"><BrainCircuit className="mr-2"/> AI Auto-Scheduler</h2>
                      <p className="text-sm opacity-90 mt-1">Matches availability & fair distribution</p>
                   </div>
                   <button onClick={() => setIsAIOpen(false)} className="opacity-70 hover:opacity-100"><X/></button>
                </div>
                <div className="p-6">
                   {aiResult ? (
                     <div className="space-y-4">
                        <div className="bg-green-50 text-green-700 p-4 rounded-lg border border-green-200">
                           <p className="font-bold flex items-center">
                             <Check className="w-5 h-5 mr-2"/> Scheduling Complete
                           </p>
                           <p className="text-sm mt-1">Generated {aiResult.newAssignments} new shift assignments across the week.</p>
                        </div>
                        {aiResult.unfilledShifts?.length > 0 && (
                          <div className="bg-yellow-50 text-yellow-700 p-3 rounded text-sm">
                             ⚠️ {aiResult.unfilledShifts.length} shifts could not be fully staffed due to lack of availability.
                          </div>
                        )}
                     </div>
                   ) : (
                     <div className="text-center py-6">
                        <p className="text-gray-600 mb-6">This will analyze all active employee availabilities, approved leave data, and current shift gaps for the week of <strong>{format(weekStart, 'MMM d')}</strong>, and optimaly assign workers.</p>
                        <Button size="lg" className="w-full bg-purple-600 hover:bg-purple-700" onClick={handleRunAI} isLoading={aiLoading}>
                           Run Algorithm Now
                        </Button>
                     </div>
                   )}
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create Modal */}
      <AnimatePresence>
        {isCreateOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Create New Shift</h3>
                <button onClick={() => setIsCreateOpen(false)}><X className="w-5 h-5 text-gray-500 hover:text-gray-900"/></button>
              </div>
              <form onSubmit={handleCreateSubmit} className="space-y-4">
                 <Input label="Shift Title" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Morning Cashier" />
                 <Input label="Date" type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                 <div className="flex gap-4">
                    <Input label="Start Time" type="time" required value={formData.start_time} onChange={e => setFormData({...formData, start_time: e.target.value})} />
                    <Input label="End Time" type="time" required value={formData.end_time} onChange={e => setFormData({...formData, end_time: e.target.value})} />
                 </div>
                 <Input label="Required Employees" type="number" min="1" required value={formData.required_count} onChange={e => setFormData({...formData, required_count: parseInt(e.target.value)})} />
                 <Button type="submit" className="w-full mt-4">Create & Save as Draft</Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
