import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { format } from 'date-fns';
import { Mail, Check, X, Phone, AlertCircle, Copy } from 'lucide-react';
import Button from '../components/Button';
import Input from '../components/Input';
import { motion } from 'framer-motion';

export default function Employees() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [empRes, invRes] = await Promise.all([
        api.get('/users/employees'),
        api.get('/invites')
      ]);
      setEmployees(empRes.data.employees);
      setInvites(invRes.data.invites);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvite = async (e) => {
    e.preventDefault();
    setInviteError('');
    setInviteSuccess('');
    setInviteLoading(true);

    try {
      const res = await api.post('/invites', { email: inviteEmail });
      setInviteSuccess(res.data.inviteUrl ? 'Invite link generated!' : 'Invite email sent!');
      setInviteEmail('');
      fetchData(); // refresh lists
    } catch (err) {
      setInviteError(err.response?.data?.error || 'Failed to send invite');
    } finally {
      setInviteLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Invite link copied to clipboard!');
  };

  if (loading) return <div className="p-8">Loading team...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
        <p className="text-gray-500 mt-1">Manage your employees and send invitations.</p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-lg font-medium mb-4 flex items-center">
          <Mail className="h-5 w-5 mr-2 text-brand-600" />
          Invite Team Member
        </h2>
        
        <form onSubmit={handleSendInvite} className="flex gap-4 items-end">
          <div className="flex-1">
            <Input
              label="Employee Email"
              type="email"
              required
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              placeholder="employee@example.com"
            />
          </div>
          <Button type="submit" isLoading={inviteLoading}>
            Send Invite
          </Button>
        </form>
        {inviteError && <p className="text-red-500 text-sm mt-2">{inviteError}</p>}
        {inviteSuccess && <p className="text-green-600 text-sm mt-2 font-medium">{inviteSuccess}</p>}
      </div>

      {/* Pending Invites */}
      {invites.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="font-medium text-gray-900">Pending Invitations</h3>
          </div>
          <ul className="divide-y divide-gray-200">
            {invites.map((invite) => (
              <li key={invite.id} className="p-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <p className="text-sm font-medium text-gray-900 truncate">{invite.email}</p>
                    <p className="flex items-center text-sm text-gray-500">
                      Expires: {format(new Date(invite.expires_at), 'PP p')}
                    </p>
                  </div>
                  <div className="flex flex-col items-end">
                    {invite.used ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Accepted
                      </span>
                    ) : (
                      <div className="flex items-center gap-2">
                         <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                           Pending
                         </span>
                         <button 
                           onClick={() => copyToClipboard(`${window.location.origin}/invite/${invite.token}`)}
                           className="text-gray-400 hover:text-brand-600"
                           title="Copy Manual Link"
                         >
                           <Copy className="h-4 w-4" />
                         </button>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Active Employees */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
         <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="font-medium text-gray-900">Active Team Members</h3>
         </div>
         <div className="overflow-x-auto">
           <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                 <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                 </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                 {employees.map(emp => (
                    <tr key={emp.id} className="hover:bg-gray-50">
                       <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{emp.full_name}</div>
                          <div className="text-sm text-gray-500">Joined {format(new Date(emp.created_at), 'MMM d, yyyy')}</div>
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-500 mb-1">
                             <Mail className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                             <a href={`mailto:${emp.email}`} className="hover:text-gray-900">{emp.email}</a>
                          </div>
                          {emp.phone && (
                             <div className="flex items-center text-sm text-gray-500">
                                <Phone className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                <span>{emp.phone}</span>
                             </div>
                          )}
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                          {emp.role}
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap">
                          {emp.is_active ? (
                             <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <Check className="mr-1 h-3 w-3" /> Active
                             </span>
                          ) : (
                             <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                <X className="mr-1 h-3 w-3" /> Inactive
                             </span>
                          )}
                       </td>
                    </tr>
                 ))}
              </tbody>
           </table>
         </div>
      </div>
    </div>
  );
}
