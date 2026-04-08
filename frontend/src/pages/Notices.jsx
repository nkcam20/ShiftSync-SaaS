import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../api/axios';
import { format } from 'date-fns';
import { Bell, Trash2, Megaphone } from 'lucide-react';
import Button from '../components/Button';
import Input from '../components/Input';
import { motion, AnimatePresence } from 'framer-motion';

export default function Notices() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ title: '', content: '', priority: 'normal' });

  useEffect(() => {
    fetchNotices();
    
    if (socket) {
      socket.on('notice:created', fetchNotices);
    }
    return () => {
      if (socket) socket.off('notice:created');
    }
  }, [socket]);

  const fetchNotices = async () => {
    try {
      const res = await api.get('/notices');
      setNotices(res.data.notices);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/notices', formData);
      setIsModalOpen(false);
      setFormData({ title: '', content: '', priority: 'normal' });
      fetchNotices();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to post notice');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await api.delete(`/notices/${id}`);
      fetchNotices();
    } catch (err) {
      alert('Failed to delete');
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Megaphone className="w-6 h-6 mr-2 text-brand-600" /> 
            Team Announcements
          </h1>
          <p className="text-gray-500 mt-1">Public updates broadcasted to all employees.</p>
        </div>
        {user?.role === 'manager' && (
          <Button onClick={() => setIsModalOpen(true)}>Post Announcement</Button>
        )}
      </div>

      <div className="space-y-4">
         {loading ? (
           <div className="p-8 text-center text-gray-500">Loading notices...</div>
         ) : notices.length === 0 ? (
           <div className="bg-white p-12 text-center rounded-xl border border-gray-200 shadow-sm text-gray-500">
             No announcements right now.
           </div>
         ) : (
           notices.map(notice => (
             <motion.div key={notice.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`bg-white rounded-xl shadow-sm border p-6 relative overflow-hidden ${
               notice.priority === 'high' || notice.priority === 'urgent' ? 'border-red-200' : 'border-gray-200'
             }`}>
               {/* Accent line for priority */}
               <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                 notice.priority === 'urgent' ? 'bg-red-600' : (notice.priority === 'high' ? 'bg-orange-500' : 'bg-brand-500')
               }`} />

               <div className="pl-4">
                  <div className="flex justify-between items-start">
                     <div>
                        <h3 className="text-lg font-bold text-gray-900">{notice.title}</h3>
                        <p className="text-xs text-gray-500 mt-1">Posted by {notice.author?.full_name} on {format(new Date(notice.created_at), 'MMM d, yyyy')}</p>
                     </div>
                     {user?.role === 'manager' && (
                        <button onClick={() => handleDelete(notice.id)} className="text-gray-400 hover:text-red-600 transition">
                           <Trash2 className="w-5 h-5" />
                        </button>
                     )}
                  </div>
                  <div className="mt-4 text-gray-700 whitespace-pre-wrap">
                     {notice.content}
                  </div>
               </div>
             </motion.div>
           ))
         )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
              <h2 className="text-xl font-bold mb-4">Post Announcement</h2>
              <form onSubmit={handleCreate} className="space-y-4">
                <Input label="Title" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Holiday Schedule Change" />
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                   <select className="w-full border-gray-300 rounded-md shadow-sm h-10 px-3 border" value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})}>
                     <option value="low">Low Priority</option>
                     <option value="normal">Normal</option>
                     <option value="high">High Info</option>
                     <option value="urgent">Urgent Action Required</option>
                   </select>
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Message Content</label>
                   <textarea required className="w-full border-gray-300 rounded-md border shadow-sm p-3 focus:ring-brand-500 focus:border-brand-500" rows={5} value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} />
                </div>
                
                <div className="flex space-x-3 mt-6">
                   <Button variant="secondary" onClick={() => setIsModalOpen(false)} className="flex-1" type="button">Cancel</Button>
                   <Button type="submit" className="flex-1 hover:bg-brand-700">Post Notice</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
