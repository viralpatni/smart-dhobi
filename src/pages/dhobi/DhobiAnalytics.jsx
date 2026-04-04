import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { NavLink, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase';
import AnalyticsPanel from '../../components/dhobi/AnalyticsPanel';
import Loader from '../../components/common/Loader';
import { formatStandardDate } from '../../utils/formatDate';
import { useTodayAnalytics } from '../../hooks/useAnalytics';
import { useAllActiveOrders } from '../../hooks/useOrders';
import StatusBadge from '../../components/common/StatusBadge';

const DhobiAnalytics = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const { analytics, loading: analyticsLoading } = useTodayAnalytics();
  const { orders: activeOrders, loading: ordersLoadingActive } = useAllActiveOrders();
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentOrdersLoading, setRecentOrdersLoading] = useState(true);

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);
          
        if (error) throw error;
        setRecentOrders((data || []).map(row => ({
          id: row.id,
          tokenId: row.token_id,
          studentName: row.student_name,
          studentRoom: row.student_room,
          clothesCount: row.clothes_count,
          createdAt: row.created_at,
          status: row.status
        })));
      } catch (e) {
        console.error(e);
      } finally {
        setRecentOrdersLoading(false);
      }
    };
    fetchRecent();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (analyticsLoading || recentOrdersLoading || ordersLoadingActive) return <Loader fullScreen />;

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
          <div className="flex items-center gap-4">
             {/* Mobile menu toggle goes here */}
             <h2 className="text-xl font-bold text-gray-800">Analytics Overview</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
               <p className="font-semibold text-gray-800 text-sm">{userData.name}</p>
            </div>
            <button 
              onClick={handleLogout}
              className="text-xs font-bold text-slate-500 hover:text-red-500 transition-colors px-3 py-1.5 rounded-md border border-slate-200"
            >
              Logout
            </button>
            <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 font-bold flex items-center justify-center border border-teal-200">
              {userData.name.charAt(0)}
            </div>
          </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 overflow-auto p-4 md:p-8 bg-slate-50">
          <div className="max-w-[1200px] mx-auto space-y-6">
            <AnalyticsPanel analytics={analytics} activeOrders={activeOrders} />

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mt-8">
              <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                 <h3 className="font-bold text-gray-800">Recent Transactions</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                      <th className="p-4 font-medium">Token</th>
                      <th className="p-4 font-medium">Student</th>
                      <th className="p-4 font-medium">Room</th>
                      <th className="p-4 font-medium">Items</th>
                      <th className="p-4 font-medium">Drop-off Time</th>
                      <th className="p-4 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm divide-y divide-slate-100">
                    {recentOrders.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="p-8 text-center text-slate-400">No recent orders.</td>
                      </tr>
                    ) : recentOrders.map(order => (
                      <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 font-mono font-medium text-teal-600">{order.tokenId}</td>
                        <td className="p-4 font-medium text-slate-800">{order.studentName}</td>
                        <td className="p-4 text-slate-600">{order.studentRoom}</td>
                        <td className="p-4 text-slate-600">{order.clothesCount || '-'}</td>
                        <td className="p-4 text-slate-500">{formatStandardDate(order.createdAt)}</td>
                        <td className="p-4"><StatusBadge status={order.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DhobiAnalytics;
