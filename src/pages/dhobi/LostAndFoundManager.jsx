import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAllComplaints } from '../../hooks/useLostAndFound';
import { NavLink, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase';
import StaffComplaintCard from '../../components/lostAndFound/StaffComplaintCard';
import Loader from '../../components/common/Loader';
import { formatStandardDate } from '../../utils/formatDate';

const STATUS_FILTERS = ['All', 'open', 'underReview', 'found', 'notFound', 'closed'];

const statusLabels = {
  All: 'All',
  open: 'Open',
  underReview: 'Under Review',
  found: 'Found',
  notFound: 'Not Found',
  closed: 'Closed'
};

const LostAndFoundManager = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const { complaints, loading } = useAllComplaints();

  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  // Stats
  const stats = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    return {
      open: complaints.filter(c => c.status === 'open').length,
      underReview: complaints.filter(c => c.status === 'underReview').length,
      foundToday: complaints.filter(c => {
        if (c.status !== 'found' || !c.resolvedAt) return false;
        const resolved = c.resolvedAt.toDate ? c.resolvedAt.toDate() : new Date(c.resolvedAt);
        return resolved.toISOString().split('T')[0] === todayStr;
      }).length,
      closedThisWeek: complaints.filter(c => {
        if (c.status !== 'closed') return false;
        const updated = c.updatedAt?.toDate ? c.updatedAt.toDate() : new Date(c.updatedAt || 0);
        return updated >= weekAgo;
      }).length,
    };
  }, [complaints]);

  // Filtered + sorted complaints
  const filteredComplaints = useMemo(() => {
    let data = [...complaints];

    // Status filter
    if (statusFilter !== 'All') {
      data = data.filter(c => c.status === statusFilter);
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      data = data.filter(c =>
        (c.studentName || '').toLowerCase().includes(q) ||
        (c.relatedTokenId || '').toLowerCase().includes(q) ||
        (c.itemType || '').toLowerCase().includes(q) ||
        (c.itemColor || '').toLowerCase().includes(q) ||
        (c.itemDescription || '').toLowerCase().includes(q)
      );
    }

    // Sort
    if (sortBy === 'oldest') {
      data.sort((a, b) => (a.createdAt?.toMillis?.() || 0) - (b.createdAt?.toMillis?.() || 0));
    } else if (sortBy === 'priority') {
      const pOrder = { high: 0, medium: 1, low: 2 };
      data.sort((a, b) => (pOrder[a.priority] ?? 1) - (pOrder[b.priority] ?? 1));
    }
    // 'newest' is default (already sorted from Firestore)

    return data;
  }, [complaints, statusFilter, searchQuery, sortBy]);

  if (loading) return <Loader fullScreen />;

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      {/* Sidebar */}
      <div className="w-[240px] bg-[#0F172A] text-white flex flex-col shrink-0 hidden md:flex">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <span className="text-3xl">🧺</span>
          <span className="font-bold text-xl text-teal-400">SmartDhobi</span>
        </div>
        
        <div className="flex-1 py-6 flex flex-col gap-2">
          <NavLink to="/dhobi/dashboard" className={({isActive}) => `px-6 py-3 flex items-center gap-3 transition-colors ${isActive ? 'bg-white/10 border-l-4 border-teal-400 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
            Dashboard
          </NavLink>
          <NavLink to="/dhobi/analytics" className={({isActive}) => `px-6 py-3 flex items-center gap-3 transition-colors ${isActive ? 'bg-white/10 border-l-4 border-teal-400 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
            Analytics
          </NavLink>
          <NavLink to="/dhobi/lost-and-found" className={({isActive}) => `px-6 py-3 flex items-center gap-3 transition-colors ${isActive ? 'bg-white/10 border-l-4 border-teal-400 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"></path></svg>
            Lost & Found
          </NavLink>
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
          <div>
            <h2 className="text-xl font-bold text-gray-800">Lost & Found Manager</h2>
            <p className="text-sm text-slate-500">{formatStandardDate(new Date())}</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleLogout}
              className="text-xs font-bold text-slate-500 hover:text-red-500 transition-colors px-3 py-1.5 rounded-md border border-slate-200"
            >
              Logout
            </button>
            <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 font-bold flex items-center justify-center">
              {userData?.name?.charAt(0) || 'S'}
            </div>
          </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 overflow-auto p-4 md:p-8 bg-slate-50">
          <div className="max-w-[1200px] mx-auto">

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-800">{stats.open}</p>
                    <p className="text-xs text-slate-500 font-medium">Open Complaints</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-800">{stats.underReview}</p>
                    <p className="text-xs text-slate-500 font-medium">Under Review</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-800">{stats.foundToday}</p>
                    <p className="text-xs text-slate-500 font-medium">Found Today</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-800">{stats.closedThisWeek}</p>
                    <p className="text-xs text-slate-500 font-medium">Closed This Week</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 mb-6">
              <div className="flex flex-wrap items-center gap-3">
                {/* Status pills */}
                <div className="flex flex-wrap gap-1.5">
                  {STATUS_FILTERS.map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatusFilter(s)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        statusFilter === s
                          ? 'bg-teal-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {statusLabels[s]}
                    </button>
                  ))}
                </div>
                <div className="flex-1"></div>
                {/* Search */}
                <div className="relative">
                  <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, token, item..."
                    className="border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                </div>
                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="priority">Priority (High First)</option>
                </select>
              </div>
            </div>

            {/* Complaints List */}
            {filteredComplaints.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-12 text-center">
                <span className="text-4xl block mb-3">📋</span>
                <p className="font-semibold text-slate-700">No complaints found</p>
                <p className="text-sm text-slate-500 mt-1">
                  {statusFilter !== 'All' ? 'Try changing the filter.' : 'No lost item complaints have been filed yet.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredComplaints.map((c) => (
                  <StaffComplaintCard key={c.id} complaint={c} dhobiName={userData?.name || 'Staff'} />
                ))}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default LostAndFoundManager;
