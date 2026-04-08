import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Users, CalendarDays, ArrowRightLeft, Plane } from 'lucide-react';
import { motion } from 'framer-motion';

const StatCard = ({ title, value, icon: Icon, colorClass }) => (
  <motion.div 
    whileHover={{ y: -4 }}
    className="bg-white overflow-hidden shadow rounded-xl border border-gray-100 p-5"
  >
    <div className="flex items-center">
      <div className={`flex-shrink-0 p-3 rounded-lg ${colorClass}`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <div className="ml-5 w-0 flex-1">
        <dl>
          <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
          <dd>
            <div className="text-2xl font-bold text-gray-900">{value}</div>
          </dd>
        </dl>
      </div>
    </div>
  </motion.div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/users/dashboard');
        setStats(res.data.stats);
      } catch (err) {
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [user]);

  if (loading) return <div className="p-8">Loading dashboard...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.full_name?.split(' ')[0]} 👋</h1>
        <p className="text-gray-500 mt-1">Here is what is happening today in your business.</p>
      </div>

      {user?.role === 'manager' && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard 
            title="Total Employees" 
            value={stats.totalEmployees || 0} 
            icon={Users} 
            colorClass="bg-blue-500" 
          />
          <StatCard 
            title="Shifts Today" 
            value={stats.todayShifts || 0} 
            icon={CalendarDays} 
            colorClass="bg-brand-500" 
          />
          <StatCard 
            title="Pending Leave" 
            value={stats.pendingLeaveRequests || 0} 
            icon={Plane} 
            colorClass="bg-amber-500" 
          />
          <StatCard 
            title="Swap Requests" 
            value={stats.pendingSwapRequests || 0} 
            icon={ArrowRightLeft} 
            colorClass="bg-purple-500" 
          />
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Attendance Summary Panel for Managers */}
        {user?.role === 'manager' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              Today's Attendance Overview
            </h3>
            <div className="flex items-center space-x-8">
              <div>
                <p className="text-4xl font-bold text-green-600">{stats.todayClockedIn || 0}</p>
                <p className="text-sm font-medium text-gray-500 mt-1">Clocked In</p>
              </div>
              <div className="h-12 w-px bg-gray-200"></div>
              <div>
                <p className="text-4xl font-bold text-red-600">{stats.todayLate || 0}</p>
                <p className="text-sm font-medium text-gray-500 mt-1">Late Arrivals</p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
           <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
           <div className="space-y-4">
             {user?.role === 'manager' ? (
                <>
                  <button onClick={() => window.location.href = '/shifts'} className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                    <span className="block font-medium text-gray-900">Manage Schedule</span>
                    <span className="block text-sm text-gray-500">Create shifts and assign employees</span>
                  </button>
                  <button onClick={() => window.location.href = '/employees'} className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                    <span className="block font-medium text-gray-900">Invite Team Member</span>
                    <span className="block text-sm text-gray-500">Add new employees to your business</span>
                  </button>
                </>
             ) : (
                <>
                  <button onClick={() => window.location.href = '/attendance'} className="w-full px-4 py-4 bg-brand-600 text-white font-bold rounded-lg hover:bg-brand-700 transition shadow-sm text-center">
                    Clock In / Clock Out
                  </button>
                  <button onClick={() => window.location.href = '/shifts'} className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                    <span className="block font-medium text-gray-900">View My Schedule</span>
                    <span className="block text-sm text-gray-500">See upcoming assigned shifts</span>
                  </button>
                </>
             )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
