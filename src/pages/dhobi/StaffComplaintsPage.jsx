import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useStaffComplaints } from '../../hooks/useComplaints';
import Loader from '../../components/common/Loader';
import { Link, useNavigate } from 'react-router-dom';
import StaffComplaintCard from '../../components/complaints/StaffComplaintCard';
import { supabase } from '../../supabase';

const StaffComplaintsPage = () => {
  const { userData, currentUser } = useAuth();
  const navigate = useNavigate();
  // Role string is literally 'staff' or 'paidStaff'
  const { complaints, loading } = useStaffComplaints(currentUser?.uid, userData?.role);
  
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterCategory, setFilterCategory] = useState('');

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (loading) return <Loader fullScreen />;

  // Derived metrics
  const newCount = complaints.filter(c => c.status === 'submitted').length;
  const actionCount = complaints.filter(c => c.status === 'acknowledged' || c.status === 'inReview').length;
  const resolvedCount = complaints.filter(c => c.status === 'resolvedByStaff' && c.staffRespondedBy === currentUser?.uid).length;

  const filtered = complaints.filter(c => {
    if (filterStatus !== 'All' && filterStatus !== 'New' && c.status !== filterStatus) return false;
    if (filterStatus === 'New' && c.status !== 'submitted') return false;
    if (filterCategory && c.category !== filterCategory) return false;
    return true;
  });

  const uniqueCategories = [...new Set(complaints.map(c => c.category))];

  return (
    <div className="flex bg-slate-100 min-h-screen">
      
      {/* Dynamic Sidebar based on role */}
      {userData?.role === 'paidStaff' ? (
        <div className="hidden lg:flex w-64 bg-amber-900 text-amber-100 flex-col py-6 shrink-0 h-screen sticky top-0">
          <div className="px-6 mb-8 flex items-center gap-3">
             <div className="w-10 h-10 bg-amber-800 rounded-xl flex items-center justify-center text-xl shadow-inner border border-amber-700/50">✨</div>
             <div><h1 className="text-xl font-bold text-white leading-tight">Paid<br/>Laundry</h1></div>
          </div>
          <nav className="flex-1 space-y-1 px-3">
            <Link to="/paid-dhobi/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-amber-200 hover:bg-amber-800 transition-colors">
               <span>📊</span> Dashboard
            </Link>
            <Link to="/paid-dhobi/orders" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-amber-200 hover:bg-amber-800 transition-colors">
               <span>🧾</span> All Orders
            </Link>
            <Link to="/paid-dhobi/pricing" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-amber-200 hover:bg-amber-800 transition-colors">
               <span>🏷️</span> Pricing Editor
            </Link>
            <Link to="/paid-dhobi/schedules" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-amber-200 hover:bg-amber-800 transition-colors">
               <span>📅</span> Manage Schedules
            </Link>
            <Link to="/paid-dhobi/analytics" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-amber-200 hover:bg-amber-800 transition-colors">
               <span>📈</span> Revenue Analytics
            </Link>
            <Link to="/paid-dhobi/complaints" className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-amber-800/80 text-white font-bold transition-colors">
               <div className="flex items-center gap-3"><span>⚠️</span> Complaints</div>
               {newCount > 0 && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{newCount} New</span>}
            </Link>
          </nav>
          <div className="px-6 mt-auto">
            <button onClick={handleLogout} className="flex items-center gap-3 text-amber-300 hover:text-white w-full py-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
              Logout
            </button>
          </div>
        </div>
      ) : (
        <div className="hidden lg:flex w-64 bg-slate-900 text-slate-300 flex-col shrink-0 h-screen sticky top-0">
          <div className="p-6 border-b border-slate-800 flex items-center gap-3">
             <span className="text-3xl">🧺</span>
             <span className="font-bold text-xl text-white">Dhobi Panel</span>
          </div>
          <nav className="flex-1 py-4 flex flex-col gap-1">
             <Link to="/dhobi/dashboard" className="px-6 py-3 hover:bg-slate-800 transition-colors">Orders</Link>
             <Link to="/dhobi/analytics" className="px-6 py-3 hover:bg-slate-800 transition-colors">Analytics</Link>
             <Link to="/dhobi/lost-and-found" className="px-6 py-3 hover:bg-slate-800 transition-colors mb-2">Lost & Found</Link>
             <div className="px-4 text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Operations</div>
             <Link to="/dhobi/complaints" className="px-6 py-3 bg-indigo-600/20 border-l-4 border-indigo-500 text-indigo-300 font-bold flex justify-between items-center transition-colors">
               Complaints Hub
               {newCount > 0 && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{newCount}</span>}
             </Link>
          </nav>
          <div className="p-6 border-t border-slate-800">
             <button onClick={handleLogout} className="flex items-center gap-2 hover:text-white"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>Logout</button>
          </div>
        </div>
      )}

      {/* Main View */}
      <div className="flex-1 overflow-auto max-w-5xl mx-auto p-4 md:p-8 animate-fade-in-up">
        
        <header className="mb-8">
           <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
             <svg className="w-8 h-8 text-teal-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd"></path></svg>
             Complaints Operations Hub
           </h1>
           <p className="text-slate-500 mt-1 font-medium">Review and resolve issues raised by students.</p>
        </header>

        {/* Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
           <div className={`p-4 rounded-xl border ${newCount > 0 ? 'bg-red-50 border-red-200 text-red-800' : 'bg-white border-slate-200 text-slate-700'}`}>
              <p className="text-xs uppercase font-bold tracking-wider mb-1">New Complaints</p>
              <p className="text-3xl font-black">{newCount}</p>
           </div>
           <div className={`p-4 rounded-xl border ${actionCount > 0 ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-white border-slate-200 text-slate-700'}`}>
              <p className="text-xs uppercase font-bold tracking-wider mb-1">Awaiting Attention</p>
              <p className="text-3xl font-black">{actionCount}</p>
           </div>
           <div className="p-4 rounded-xl border bg-white border-slate-200 text-green-700">
              <p className="text-xs uppercase font-bold tracking-wider mb-1">Resolved by Me</p>
              <p className="text-3xl font-black">{resolvedCount}</p>
           </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
           <div className="flex gap-2 w-full overflow-x-auto hide-scrollbar">
              {['All', 'New', 'acknowledged', 'inReview', 'resolvedByStaff', 'closed'].map(f => (
                <button 
                  key={f}
                  onClick={() => setFilterStatus(f)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors whitespace-nowrap ${filterStatus === f ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  {f === 'New' ? 'New (Submitted)' : f === 'acknowledged' ? 'Acknowledged' : f === 'inReview' ? 'In Review' : f === 'resolvedByStaff' ? 'Resolved' : f === 'closed' ? 'Closed' : 'All Requests'}
                </button>
              ))}
           </div>
           <select 
             value={filterCategory} 
             onChange={e => setFilterCategory(e.target.value)}
             className="border border-slate-300 rounded p-1.5 text-sm w-full sm:w-auto font-medium focus:ring-1 focus:ring-teal-500"
           >
             <option value="">All Categories</option>
             {uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}
           </select>
        </div>

        {/* Complaints Feed */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
            <span className="text-5xl">✅</span>
            <h3 className="text-xl font-bold text-slate-700 mt-4">All caught up!</h3>
            <p className="text-slate-500 mt-1">There are no complaints matching this filter.</p>
          </div>
        ) : (
          <div>
             {filtered.map(comp => <StaffComplaintCard key={comp.id} complaint={comp} />)}
          </div>
        )}

      </div>
    </div>
  );
};

export default StaffComplaintsPage;
