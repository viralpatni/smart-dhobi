import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import AnalyticsPanel from '../dhobi/AnalyticsPanel';
import Loader from '../common/Loader';
import { formatStandardDate } from '../../utils/formatDate';
import { useTodayAnalytics } from '../../hooks/useAnalytics';
import { useAllActiveOrders } from '../../hooks/useOrders';
import StatusBadge from '../common/StatusBadge';

const AdminAnalyticsTab = () => {
  const { analytics, loading: analyticsLoading } = useTodayAnalytics();
  const { orders: activeOrders, loading: ordersLoadingActive } = useAllActiveOrders();
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentOrdersLoading, setRecentOrdersLoading] = useState(true);

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(10));
        const snap = await getDocs(q);
        setRecentOrders(snap.docs.map(d => ({id: d.id, ...d.data()})));
      } catch (e) {
        console.error(e);
      } finally {
        setRecentOrdersLoading(false);
      }
    };
    fetchRecent();
  }, []);

  if (analyticsLoading || recentOrdersLoading || ordersLoadingActive) return <Loader fullScreen />;

  return (
    <div className="max-w-[1200px] mx-auto space-y-6 animate-fade-in-up">
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
  );
};

export default AdminAnalyticsTab;
