import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, CalendarDays, Users, Clock, Settings, Bell, LayoutDashboard, Menu, X, ArrowRightLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Define navigation based on role
  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Schedule', href: '/shifts', icon: CalendarDays },
    { name: 'Attendance', href: '/attendance', icon: Clock },
  ];

  if (user?.role === 'manager') {
    navigation.push(
      { name: 'Team', href: '/employees', icon: Users },
      { name: 'Notices', href: '/notices', icon: Bell }
    );
  } else {
    navigation.push(
      { name: 'Availability', href: '/availability', icon: Settings },
      { name: 'Swaps', href: '/swaps', icon: ArrowRightLeft }
    );
  }

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItemClasses = ({ isActive }) => 
    `group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
      isActive
        ? 'bg-brand-50 text-brand-700'
        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
    }`;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200">
        <div className="flex h-16 items-center flex-shrink-0 px-6 border-b border-gray-200 bg-brand-600 text-white">
          <CalendarDays className="h-6 w-6 mr-2" />
          <span className="font-bold text-lg tracking-tight">ShiftSync</span>
        </div>
        
        <div className="flex-1 overflow-y-auto pt-5 pb-4">
          <nav className="mt-2 px-3 space-y-1">
            {navigation.map((item) => (
              <NavLink key={item.name} to={item.href} className={navItemClasses}>
                <item.icon className="mr-3 flex-shrink-0 h-5 w-5 opacity-70 group-hover:opacity-100" />
                {item.name}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center mb-4">
            <div className="h-8 w-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold">
              {user?.full_name?.charAt(0)}
            </div>
            <div className="ml-3 truncate">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.full_name}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex justify-center items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between bg-brand-600 border-b border-gray-200 px-4 py-2 sm:px-6">
          <div className="flex items-center text-white">
            <CalendarDays className="h-6 w-6 mr-2" />
            <span className="font-bold text-lg">ShiftSync</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="text-white hover:bg-brand-700 rounded-md p-1"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40 md:hidden"
                onClick={() => setMobileMenuOpen(false)}
              />
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                className="fixed inset-y-0 left-0 w-64 bg-white z-50 flex flex-col md:hidden"
              >
                <div className="flex items-center justify-between bg-brand-600 text-white h-16 px-4 border-b border-gray-200">
                  <div className="flex items-center">
                    <CalendarDays className="h-6 w-6 mr-2" />
                    <span className="font-bold text-lg tracking-tight">ShiftSync</span>
                  </div>
                  <button onClick={() => setMobileMenuOpen(false)} className="text-white">
                    <X className="h-6 w-6" />
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
                  {navigation.map((item) => (
                    <NavLink
                      key={item.name}
                      to={item.href}
                      className={navItemClasses}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <item.icon className="mr-3 h-5 w-5" />
                      {item.name}
                    </NavLink>
                  ))}
                </div>

                <div className="border-t border-gray-200 p-4">
                  <div className="flex items-center mb-4">
                    <div className="h-8 w-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold">
                      {user?.full_name?.charAt(0)}
                    </div>
                    <div className="ml-3 truncate">
                      <p className="text-sm font-medium text-gray-900 truncate">{user?.full_name}</p>
                      <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex justify-center items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
