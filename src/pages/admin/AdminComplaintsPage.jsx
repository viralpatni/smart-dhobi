import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../firebase';
import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore';
import { useAllComplaints } from '../../hooks/useComplaints';
import Loader from '../../components/common/Loader';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend } from 'recharts';
import AdminComplaintDetail from '../../components/complaints/AdminComplaintDetail';

const AdminComplaintsPage = () => {
  const { complaints, loading } = useAllComplaints();
  const [analytics, setAnalytics] = useState([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  // Detail Modal State
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  // Filters State
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  // Fetch Analytics independently since it hits a different collection
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const q = query(collection(db, 'complaintAnalytics'), orderBy('month', 'desc'), limit(6));
        const snap = await getDocs(q);
        setAnalytics(snap.docs.map(d => ({id: d.id, ...d.data()})).reverse());
      } catch (e) {
        console.error(e);
      } finally {
        setAnalyticsLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) return <Loader fullScreen />;

  // Overview metrics
  const totalOpen = complaints.filter(c => !['closed', 'resolvedByStaff', 'resolvedByAdmin'].includes(c.status) && c.type === 'complaint').length;
  const escalatedUrgent = complaints.filter(c => c.status === 'escalatedToAdmin').length;
  const awaitingStaff = complaints.filter(c => ['submitted', 'acknowledged', 'inReview'].includes(c.status) && c.type === 'complaint').length;
  const resolvedAllTime = complaints.filter(c => ['resolvedByStaff', 'resolvedByAdmin', 'closed'].includes(c.status)).length;
  
  const allFeedback = complaints.filter(c => c.type === 'feedback' && c.rating);
  const avgRating = allFeedback.length > 0 ? (allFeedback.reduce((sum, c) => sum + c.rating, 0) / allFeedback.length).toFixed(1) : 0;

  // Filter logic
  const filteredComplaints = complaints.filter(c => {
    if (filterType && c.type !== filterType) return false;
    if (filterStatus && c.status !== filterStatus) return false;
    if (filterPriority && c.priority !== filterPriority) return false;
    if (search) {
      const s = search.toLowerCase();
      if (!c.id.toLowerCase().includes(s) && 
          !(c.studentName && c.studentName.toLowerCase().includes(s)) &&
          !(c.title && c.title.toLowerCase().includes(s))) {
         return false;
      }
    }
    return true;
  });

  // Recharts Constants
  const COLORS = ['#0f172a', '#3f3f46', '#0d9488', '#f59e0b', '#ef4444', '#8b5cf6'];

  // Current Month Pie Chart Generation
  const currentMonthPieData = useMemo(() => {
    if (!analytics || analytics.length === 0) return [];
    const currentMonth = analytics[analytics.length - 1]; // last one because reversed
    if (!currentMonth.categoryBreakdown) return [];
    return Object.entries(currentMonth.categoryBreakdown).map(([name, value]) => ({ name, value })).filter(d => d.value > 0);
  }, [analytics]);

  const renderBadge = (comp) => {
    if (comp.status === 'escalatedToAdmin') return <span className="bg-red-600 text-white animate-pulse px-2 py-0.5 rounded text-xs font-bold uppercase">Escalated</span>;
    if (comp.status.includes('resolved')) return <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-bold uppercase">Resolved</span>;
    if (comp.status === 'closed') return <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded text-xs font-bold uppercase">Closed</span>;
    if (comp.priority === 'urgent') return <span className="bg-red-500 text-white animate-pulse px-2 py-0.5 rounded text-xs font-bold uppercase">Urgent</span>;
    if (comp.priority === 'high') return <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-xs font-bold uppercase">High Priority</span>;
    return <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-bold uppercase">{comp.status.substring(0, 15)}</span>;
  };

  return (
    <div className="animate-fade-in-up">
      <header className="mb-8">
         <h1 className="text-2xl font-black text-slate-800">Complaints Oversight</h1>
         <p className="text-sm text-slate-500 mt-1">Admin control center for all feedback, escalations, and system performance.</p>
      </header>

      {/* Escalation Banner */}
      {escalatedUrgent > 0 && (
         <div onClick={() => {setFilterStatus('escalatedToAdmin'); setFilterType('complaint');}} className="cursor-pointer mb-6 bg-red-600 rounded-lg p-4 shadow-lg shadow-red-600/20 flex items-center justify-between transition-transform hover:scale-[1.01]">
            <div className="flex items-center gap-3">
               <span className="text-2xl animate-pulse">🚨</span>
               <div>
                  <h3 className="font-bold text-white text-lg leading-tight">{escalatedUrgent} complaint(s) require urgent admin attention!</h3>
                  <p className="text-red-100 text-sm">These tickets have missed their staff SLA or were manual escalations. Click to filter.</p>
               </div>
            </div>
            <svg className="w-6 h-6 text-red-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
         </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
           <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total Open Setup</p>
           <p className="text-2xl font-black text-red-600">{totalOpen}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 relative overflow-hidden">
           <div className={`absolute top-0 right-0 w-2 h-full ${escalatedUrgent > 0 ? 'bg-red-600 animate-pulse' : 'bg-slate-200'}`}></div>
           <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Escalated</p>
           <p className="text-2xl font-black text-slate-800">{escalatedUrgent}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 block md:hidden xl:block">
           <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Awaiting Staff</p>
           <p className="text-2xl font-black text-amber-600">{awaitingStaff}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
           <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Lifetime Resolved</p>
           <p className="text-2xl font-black text-green-600">{resolvedAllTime}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-teal-200 bg-teal-50">
           <p className="text-[10px] uppercase font-bold text-teal-700 tracking-wider">Avg Feedback</p>
           <p className="text-2xl font-black text-teal-900 flex items-center gap-1">{avgRating} <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg></p>
        </div>
      </div>

      {/* Analytics Section */}
      {!analyticsLoading && analytics.length > 0 && (
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white p-5 rounded-xl border border-slate-200">
               <h3 className="font-bold text-slate-800 text-sm mb-4">Volume Trend (6-mo)</h3>
               <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                     <LineChart data={analytics} margin={{ top: 5, right: 30, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="month" tick={{fontSize: 12}} stroke="#94a3b8" />
                        <YAxis tick={{fontSize: 12}} stroke="#94a3b8" />
                        <Tooltip />
                        <Legend wrapperStyle={{fontSize: "12px"}} />
                        <Line type="monotone" dataKey="totalComplaints" name="Complaints" stroke="#ef4444" strokeWidth={3} dot={{r:4}} />
                        <Line type="monotone" dataKey="totalFeedback" name="Feedback" stroke="#0d9488" strokeWidth={3} dot={{r:4}} />
                     </LineChart>
                  </ResponsiveContainer>
               </div>
            </div>
            
            <div className="bg-white p-5 rounded-xl border border-slate-200">
               <h3 className="font-bold text-slate-800 text-sm mb-4">Current Month Complaint Breakdown</h3>
               {currentMonthPieData.length > 0 ? (
                  <div className="h-64 flex items-center">
                     <ResponsiveContainer width="60%" height="100%">
                        <PieChart>
                           <Pie data={currentMonthPieData} innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value" stroke="none">
                              {currentMonthPieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                           </Pie>
                           <Tooltip />
                        </PieChart>
                     </ResponsiveContainer>
                     <div className="w-[40%] text-xs space-y-2">
                        {currentMonthPieData.map((entry, index) => (
                           <div key={entry.name} className="flex items-center justify-between">
                              <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[index % COLORS.length]}}></div><span className="truncate max-w-[100px]" title={entry.name}>{entry.name}</span></span>
                              <span className="font-bold">{entry.value}</span>
                           </div>
                        ))}
                     </div>
                  </div>
               ) : (
                  <div className="h-64 flex items-center justify-center text-sm text-slate-400">No category breakdown data available for this month.</div>
               )}
            </div>
         </div>
      )}

      {/* Ticket Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
         <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <h3 className="font-bold text-slate-800 shrink-0">Filter Board</h3>
            <div className="flex flex-wrap flex-1 gap-2 justify-end w-full">
               <input 
                 type="text" 
                 placeholder="Search student or ID..." 
                 value={search} onChange={e => setSearch(e.target.value)}
                 className="text-sm px-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 flex-[2] min-w-[150px]"
               />
               <select value={filterType} onChange={e => setFilterType(e.target.value)} className="text-sm px-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 flex-1 min-w-[100px]">
                 <option value="">All Types</option>
                 <option value="complaint">Complaint</option>
                 <option value="feedback">Feedback</option>
               </select>
               <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="text-sm px-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 flex-1 min-w-[100px]">
                 <option value="">Any Status</option>
                 <option value="submitted">New/Submitted</option>
                 <option value="acknowledged">Acknowledged</option>
                 <option value="escalatedToAdmin">Escalated</option>
                 <option value="resolvedByStaff">Staff Resolved</option>
                 <option value="closed">Closed</option>
               </select>
            </div>
         </div>

         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-white text-[10px] text-slate-500 uppercase tracking-wider border-b border-slate-200">
                     <th className="p-4 font-bold">Ref ID / Type</th>
                     <th className="p-4 font-bold">Student</th>
                     <th className="p-4 font-bold">Category</th>
                     <th className="p-4 font-bold">Status</th>
                     <th className="p-4 font-bold">Filed On</th>
                     <th className="p-4 text-right font-bold">Action</th>
                  </tr>
               </thead>
               <tbody className="text-sm divide-y divide-slate-100">
                  {filteredComplaints.length === 0 ? (
                     <tr><td colSpan="6" className="p-8 text-center text-slate-500 italic">No submissions matching these filters.</td></tr>
                  ) : (
                     filteredComplaints.map(comp => (
                        <tr key={comp.id} className={`hover:bg-slate-50 transition-colors ${comp.status === 'escalatedToAdmin' ? 'bg-red-50/30' : ''}`}>
                           <td className="p-4">
                              <p className="font-mono font-bold text-slate-800 text-xs mb-1">#{comp.id.substring(0,8).toUpperCase()}</p>
                              <span className={`text-[10px] uppercase font-bold tracking-wider ${comp.type==='complaint'?'text-red-600':'text-teal-600'}`}>{comp.type}</span>
                           </td>
                           <td className="p-4 text-xs">
                              {comp.isAnonymous ? (
                                 <p className="font-bold text-amber-600 italic">Anonymous</p>
                              ) : (
                                 <p className="font-bold text-slate-800">{comp.studentName}</p>
                              )}
                              <p className="text-slate-500">{comp.studentRoom}</p>
                           </td>
                           <td className="p-4">
                              <p className="font-bold text-slate-700 truncate max-w-[180px]">{comp.category}</p>
                              {comp.type === 'feedback' && comp.rating && (
                                <span className="text-xs text-amber-500 font-bold">{comp.rating} ★</span>
                              )}
                           </td>
                           <td className="p-4">
                              {renderBadge(comp)}
                           </td>
                           <td className="p-4 text-xs text-slate-500 font-medium">
                              {comp.createdAt ? format(comp.createdAt.toDate(), 'dd MMM, yy') : ''}
                           </td>
                           <td className="p-4 text-right">
                              <button 
                                onClick={() => setSelectedComplaint(comp)}
                                className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 hover:border-slate-400 font-bold text-xs px-4 py-1.5 rounded transition-all shadow-sm"
                              >
                                View Details
                              </button>
                           </td>
                        </tr>
                     ))
                  )}
               </tbody>
            </table>
         </div>
      </div>

      {selectedComplaint && <AdminComplaintDetail complaint={selectedComplaint} onClose={() => setSelectedComplaint(null)} />}
    </div>
  );
};

export default AdminComplaintsPage;
