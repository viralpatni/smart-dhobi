import React, { useState } from 'react';
import { useAllPaidOrders } from '../../hooks/usePaidOrders';
import Loader from '../../components/common/Loader';
import { formatStandardDate } from '../../utils/formatDate';

const PaidDhobiOrders = () => {
  const { orders, loading } = useAllPaidOrders();
  const [filter, setFilter] = useState('all'); // all, scheduled, active, delivered

  if (loading) return <Loader fullScreen />;

  const filteredOrders = orders.filter(o => {
    if (filter === 'all') return true;
    if (filter === 'scheduled') return o.status === 'scheduled';
    if (filter === 'delivered') return o.status === 'delivered';
    if (filter === 'active') return ['onTheWay', 'pickedUp', 'washing', 'readyForDelivery', 'outForDelivery'].includes(o.status);
    return true;
  });

  return (
    <div className="p-4 sm:p-6 max-w-[1200px] mx-auto animate-fade-in-up">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">All Orders</h1>
          <p className="text-sm text-slate-500">View and track all paid laundry requests</p>
        </div>
        
        <div className="flex bg-white rounded-lg border border-slate-200 p-1 shadow-sm w-full sm:w-auto">
          {['all', 'scheduled', 'active', 'delivered'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold rounded-md capitalize transition-colors ${
                filter === f ? 'bg-amber-100 text-amber-800 shadow-sm' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-bold">
              <tr>
                <th className="px-6 py-4">Token / Date</th>
                <th className="px-6 py-4">Student Info</th>
                <th className="px-6 py-4">Items</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-400 font-medium">
                    No orders found matching this filter.
                  </td>
                </tr>
              ) : filteredOrders.map(order => (
                <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-mono font-bold text-amber-600">{order.tokenId}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{formatStandardDate(order.createdAt)}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-800">{order.studentName}</p>
                    <p className="text-xs text-slate-500">{order.hostelBlock} • Rm {order.studentRoom}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-slate-700">{order.actualItemsCount || order.items?.reduce((a,b)=>a+b.quantity,0)} pcs</p>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-800">
                    ₹{order.totalAmount?.toLocaleString('en-IN')}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      order.status === 'scheduled' ? 'bg-slate-100 text-slate-600' :
                      order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {order.paymentStatus === 'collected' ? (
                      <span className="text-xs font-bold text-green-600 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                        Collected
                      </span>
                    ) : order.paymentStatus === 'pending' && order.status === 'delivered' ? (
                      <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded border border-red-100">
                        Pending
                      </span>
                    ) : order.paymentStatus === 'waived' ? (
                      <span className="text-xs font-bold text-slate-500">Waived</span>
                    ) : (
                      <span className="text-xs font-medium text-slate-400">On Delivery</span>
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
};

export default PaidDhobiOrders;
