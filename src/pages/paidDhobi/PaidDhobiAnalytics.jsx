import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import Loader from '../../components/common/Loader';
import { formatStandardDate } from '../../utils/formatDate';
// Assume recharts is available as per prompt
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const PaidDhobiAnalytics = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const q = query(collection(db, 'paidOrders'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        setOrders(snap.docs.map(d => ({id: d.id, ...d.data()})));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  if (loading) return <Loader fullScreen />;

  // Metrics
  const last7DaysStr = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  }).reverse();

  // "This Week" (last 7 days window for simplicity)
  const thisWeekOrders = orders.filter(o => {
    const d = new Date(o.createdAt?.toDate());
    return d >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  });

  const totalRevenueWeek = thisWeekOrders.filter(o => o.paymentStatus === 'collected').reduce((sum, o) => sum + o.totalAmount, 0);
  const totalOrdersWeek = thisWeekOrders.length;
  const avgOrderValue = totalOrdersWeek > 0 ? Math.round(totalRevenueWeek / totalOrdersWeek) : 0;
  const pendingCollection = orders.filter(o => o.status === 'delivered' && o.paymentStatus === 'pending').reduce((sum, o) => sum + o.totalAmount, 0);

  // Chart Data preparation
  const revenueChartData = last7DaysStr.map(dateStr => {
    const dailyCollected = orders.filter(o => 
      o.paymentStatus === 'collected' && 
      o.paymentCollectedAt && 
      new Date(o.paymentCollectedAt.toDate()).toISOString().split('T')[0] === dateStr
    ).reduce((sum, o) => sum + o.totalAmount, 0);
    return { name: dateStr.substring(5), revenue: dailyCollected }; // MM-DD
  });

  const itemCounts = {};
  orders.forEach(order => {
    order.items?.forEach(req => {
      itemCounts[req.itemName] = (itemCounts[req.itemName] || 0) + req.quantity;
    });
  });
  const popularItems = Object.keys(itemCounts)
    .map(key => ({ name: key, quantity: itemCounts[key] }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 8);

  const paymentStats = [
    { name: 'Collected', value: orders.filter(o => o.paymentStatus === 'collected').length },
    { name: 'Pending', value: orders.filter(o => o.paymentStatus === 'pending').length },
    { name: 'Waived', value: orders.filter(o => o.paymentStatus === 'waived').length }
  ];
  const COLORS = ['#10B981', '#EF4444', '#94A3B8'];

  const recentOrders = orders.slice(0, 20); // Top 20

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto pb-20 animate-fade-in-up">
      <div className="mb-6">
         <h1 className="text-2xl font-bold text-amber-900">Revenue & Analytics</h1>
         <p className="text-sm text-amber-700 mt-1">Operational insights for your premium laundry routes.</p>
      </div>

      {/* Top Row Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-5 border border-amber-200 shadow-sm relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl">💰</div>
           <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Week's Revenue</p>
           <p className="text-3xl font-black text-amber-700">₹{totalRevenueWeek.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-amber-200 shadow-sm">
           <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Orders (Week)</p>
           <p className="text-3xl font-black text-slate-800">{totalOrdersWeek}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-amber-200 shadow-sm">
           <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Avg Order Value</p>
           <p className="text-3xl font-black text-slate-800">₹{avgOrderValue.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-red-200 shadow-sm relative overflow-hidden">
           <div className="absolute top-0 right-0 w-2 h-full bg-red-500"></div>
           <p className="text-xs font-bold text-red-500 uppercase tracking-wider mb-1">Pending Collection</p>
           <p className="text-3xl font-black text-red-600">₹{pendingCollection.toLocaleString('en-IN')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
        {/* Weekly Revenue Chart */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm lg:col-span-1 xl:col-span-2">
           <h3 className="font-bold text-slate-800 mb-6">Revenue Trend (Last 7 Days)</h3>
           <div className="h-64">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={revenueChartData} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
                 <XAxis dataKey="name" tick={{fontSize: 12}} stroke="#94A3B8" />
                 <YAxis tick={{fontSize: 12}} stroke="#94A3B8" tickFormatter={val => `₹${val}`} />
                 <Tooltip cursor={{fill: '#FEF3C7'}} formatter={(value) => [`₹${value}`, 'Revenue']} />
                 <Bar dataKey="revenue" fill="#F59E0B" radius={[4, 4, 0, 0]} maxBarSize={40} />
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Payment Status Pie */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
           <h3 className="font-bold text-slate-800 mb-2">Payment Status Breakdown</h3>
           <div className="h-48">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie data={paymentStats} innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value" stroke="none">
                   {paymentStats.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                 </Pie>
                 <Tooltip />
               </PieChart>
             </ResponsiveContainer>
           </div>
           <div className="flex justify-center gap-4 mt-2">
             {paymentStats.map((stat, i) => (
                <div key={stat.name} className="flex items-center gap-1 text-xs font-medium text-slate-600">
                  <div className="w-3 h-3 rounded-full" style={{backgroundColor: COLORS[i]}}></div>
                  {stat.name}
                </div>
             ))}
           </div>
        </div>
      </div>

      {/* Popular Items & Recent Orders Table side-by-side on very large screens */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm xl:col-span-1">
           <h3 className="font-bold text-slate-800 mb-4">Most Popular Items</h3>
           <div className="space-y-3">
             {popularItems.map((item, i) => (
               <div key={item.name} className="flex items-center justify-between p-2 rounded hover:bg-slate-50">
                 <div className="flex items-center gap-3">
                   <span className="font-black text-amber-300 w-4">{i+1}</span>
                   <span className="font-semibold text-slate-700">{item.name}</span>
                 </div>
                 <span className="font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded text-xs">{item.quantity} pcs</span>
               </div>
             ))}
             {popularItems.length === 0 && <p className="text-slate-500 text-sm py-4">Not enough data.</p>}
           </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm xl:col-span-2 overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50">
            <h3 className="font-bold text-slate-800">Recent Orders (Last 20)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-white border-b border-slate-200 text-[10px] uppercase text-slate-500 font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-3">Token</th>
                  <th className="px-6 py-3">Student</th>
                  <th className="px-6 py-3">Amount</th>
                  <th className="px-6 py-3">Payment</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {recentOrders.map(order => (
                  <tr key={order.id} className="hover:bg-slate-50">
                    <td className="px-6 py-3 font-mono font-bold text-amber-600 text-xs">{order.tokenId}</td>
                    <td className="px-6 py-3">
                      <p className="font-bold text-slate-800 leading-tight">{order.studentName}</p>
                      <p className="text-[10px] text-slate-500">{order.studentRoom}</p>
                    </td>
                    <td className="px-6 py-3 font-bold text-slate-800">₹{order.totalAmount}</td>
                    <td className="px-6 py-3">
                       <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                         order.paymentStatus === 'collected' ? 'bg-green-100 text-green-700' :
                         order.paymentStatus === 'pending' ? 'bg-red-100 text-red-700' :
                         order.paymentStatus === 'waived' ? 'bg-slate-200 text-slate-600' :
                         'bg-amber-100 text-amber-700'
                       }`}>
                         {order.paymentStatus}
                       </span>
                    </td>
                    <td className="px-6 py-3 text-xs font-semibold text-slate-600 capitalize">{order.status}</td>
                    <td className="px-6 py-3 text-right text-xs text-slate-500">
                      {formatStandardDate(order.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaidDhobiAnalytics;
