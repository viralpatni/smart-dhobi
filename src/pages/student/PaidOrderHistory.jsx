import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useStudentPaidOrders } from '../../hooks/usePaidOrders';
import Loader from '../../components/common/Loader';
import { formatStandardDate } from '../../utils/formatDate';

const PaidOrderHistory = () => {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const { orders, loading } = useStudentPaidOrders(userData?.uid);
  
  if (loading) return <Loader fullScreen />;

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-amber-100 text-amber-700';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'scheduled': return 'Scheduled';
      case 'onTheWay': return 'Picking Up';
      case 'pickedUp': return 'Picked Up';
      case 'washing': return 'Washing';
      case 'readyForDelivery': return 'Ready';
      case 'outForDelivery': return 'Out for Delivery';
      case 'delivered': return 'Delivered';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  return (
    <div className="bg-[#FFFBEB] min-h-screen pb-24">
      {/* Header */}
      <div className="bg-white px-6 py-4 flex items-center gap-4 shadow-sm fixed top-0 w-full max-w-[420px] z-10 border-b border-amber-100">
        <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-amber-600 transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
        </button>
        <h1 className="text-lg font-bold text-slate-800">Paid Laundry History</h1>
      </div>

      <div className="px-5 pt-20">
        {orders.length === 0 ? (
          <div className="text-center py-10">
            <span className="text-4xl text-slate-300 mb-3 block">📜</span>
            <p className="text-slate-500 font-medium">No paid laundry orders yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => {
              const isDelivered = order.status === 'delivered';
              const isPaymentDue = isDelivered && order.paymentStatus === 'pending';
              const isPaid = order.paymentStatus === 'collected';
              
              return (
                <div key={order.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="bg-amber-50 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-200 uppercase">
                        {order.tokenId}
                      </span>
                      <p className="text-xs text-slate-400 mt-1">{formatStandardDate(order.createdAt)}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 py-3 border-y border-dashed border-slate-100 mb-3">
                    <div className="flex-1">
                      <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Items</p>
                      <p className="text-sm font-semibold text-slate-700">{order.actualItemsCount || order.items.reduce((acc, it) => acc + it.quantity, 0)} Pcs</p>
                    </div>
                    <div className="w-px h-8 bg-slate-100"></div>
                    <div className="flex-1">
                      <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Total</p>
                      <p className="text-sm font-bold text-slate-800">₹{order.totalAmount?.toLocaleString('en-IN')}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                     <span className="text-slate-500">Pickup: {order.pickupDate}</span>
                     {isPaymentDue ? (
                       <span className="bg-red-50 text-red-600 font-bold px-2 py-0.5 rounded border border-red-200">
                         Payment Due: ₹{order.totalAmount}
                       </span>
                     ) : isPaid ? (
                       <span className="text-green-600 font-bold flex items-center gap-1">
                         <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                         Paid
                       </span>
                     ) : (
                       <span className="text-slate-400 font-medium">Pay on delivery</span>
                     )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PaidOrderHistory;
