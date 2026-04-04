import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../firebase';
import { collection, query, getDocs } from 'firebase/firestore';
import Loader from '../../components/common/Loader';
import { seedFirestore } from '../../utils/seedData';
import toast from 'react-hot-toast';
import AdminComplaintsPage from './AdminComplaintsPage';

const AdminDashboard = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Simple tabs: users, schedules
  const [activeTab, setActiveTab] = useState('users');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'users'));
      const snap = await getDocs(q);
      setUsers(snap.docs.map(d => ({id: d.id, ...d.data()})));
    } catch (e) {
      console.error(e);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleLogout = () => {
    auth.signOut();
    navigate('/login');
  };

  const handleSeedData = async () => {
    const isDev = import.meta.env.DEV; // Vite environment variable
    if (!isDev) {
      toast.error("Seed Data is only available in development mode.");
      return;
    }

    if (window.confirm("This will write dummy data to Firestore. Proceed?")) {
      await seedFirestore();
      fetchUsers();
    }
  };

  const students = users.filter(u => u.role === 'student');
  const staff = users.filter(u => u.role === 'staff');

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      {/* Sidebar */}
      <div className="w-[240px] bg-slate-900 text-white flex flex-col shrink-0 hidden md:flex">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <span className="text-3xl">🧺</span>
          <span className="font-bold text-xl text-white">Admin Panel</span>
        </div>
        
        <div className="flex-1 py-6 flex flex-col gap-2 relative">
          <button onClick={() => setActiveTab('users')} className={`px-6 py-3 flex items-center gap-3 transition-colors text-left ${activeTab==='users' ? 'bg-white/10 border-l-4 border-indigo-400 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
            User Management
          </button>
          
          <button onClick={() => setActiveTab('complaints')} className={`px-6 py-3 flex items-center gap-3 transition-colors text-left ${activeTab==='complaints' ? 'bg-white/10 border-l-4 border-red-400 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            Feedbacks & Complaints
          </button>
          
          {import.meta.env.DEV && (
            <div className="absolute bottom-6 left-6 right-6">
              <button onClick={handleSeedData} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded shadow text-sm font-medium transition-colors">
                🌱 Seed Demo Data
              </button>
            </div>
          )}
        </div>
        
        <div className="p-6 border-t border-slate-800">
          <button onClick={handleLogout} className="flex items-center gap-3 text-slate-400 hover:text-red-400 transition-colors w-full">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-[72px] bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <h2 className="text-xl font-bold text-gray-800">System Dashboard</h2>
          <div className="flex items-center gap-3 bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100">
             <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
             <span className="text-sm font-semibold text-indigo-800">Admin Live</span>
          </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 overflow-auto p-4 md:p-8 bg-slate-50">
          {activeTab === 'users' && (
            <div className="max-w-[1200px] mx-auto space-y-8">

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center text-xl font-bold">
                  {students.length}
                </div>
                <div>
                  <h4 className="font-bold text-gray-800">Total Students</h4>
                  <p className="text-sm text-slate-500">Registered</p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-lg flex items-center justify-center text-xl font-bold">
                  {staff.length}
                </div>
                <div>
                  <h4 className="font-bold text-gray-800">Laundry Staff</h4>
                  <p className="text-sm text-slate-500">Active accounts</p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-center">
                 <button className="text-indigo-600 font-medium hover:text-indigo-800 flexItems-center gap-2">
                   <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path></svg>
                   Manage System Settings
                 </button>
              </div>
            </div>

            {loading ? <Loader /> : (
              <>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                     <h3 className="font-bold text-gray-800">Student Directory</h3>
                     <button className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded transition-colors">+ Add Student</button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-white text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                          <th className="p-4 font-medium">Name</th>
                          <th className="p-4 font-medium">Email</th>
                          <th className="p-4 font-medium">Phone</th>
                          <th className="p-4 font-medium">Room</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm divide-y divide-slate-100">
                        {students.map(user => (
                          <tr key={user.id} className="hover:bg-slate-50">
                            <td className="p-4 font-medium text-slate-800">{user.name}</td>
                            <td className="p-4 text-slate-600">{user.email}</td>
                            <td className="p-4 text-slate-600">{user.phone}</td>
                            <td className="p-4 text-slate-600">{user.roomNo} ({user.hostelBlock})</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                     <h3 className="font-bold text-gray-800">Staff Accounts</h3>
                     <button className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded transition-colors">+ Add Staff</button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-white text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                          <th className="p-4 font-medium">Name</th>
                          <th className="p-4 font-medium">Email</th>
                          <th className="p-4 font-medium">Location</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm divide-y divide-slate-100">
                        {staff.map(user => (
                          <tr key={user.id} className="hover:bg-slate-50">
                            <td className="p-4 font-medium text-slate-800 text-teal-700">{user.name}</td>
                            <td className="p-4 text-slate-600">{user.email}</td>
                            <td className="p-4 text-slate-600">{user.hostelBlock}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            </div>
          )}
          {activeTab === 'complaints' && (
            <AdminComplaintsPage />
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
