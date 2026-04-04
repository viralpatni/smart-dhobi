import React, { useState } from 'react';
import { useAllPaidOrders } from '../../hooks/usePaidOrders';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabase';
import { sendNotification } from '../../utils/sendNotification';
import Loader from '../../components/common/Loader';
import QRScanPickupModal from '../../components/paidDhobi/QRScanPickupModal';
import DeliveryModal from '../../components/paidDhobi/DeliveryModal';
import toast from 'react-hot-toast';

const PaidDhobiDashboard = () => {
  const { userData } = useAuth();
  const { orders, loading } = useAllPaidOrders();
  
  const [activeTab, setActiveTab] = useState('queue'); // queue, delivery
  const [scanModalOpen, setScanModalOpen] = useState(false);
  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  const useMock = import.meta.env.VITE_USE_MOCK_NOTIFICATIONS === 'true';

  if (loading) return <Loader fullScreen />;

  // Filter queues
  const today = new Date().toISOString().split('T')[0];
  const pickupQueue = orders.filter(o => o.pickupDate === today && ['scheduled', 'onTheWay'].includes(o.status));
  const washingQueue = orders.filter(o => ['pickedUp', 'washing'].includes(o.status));
  const deliveryQueue = orders.filter(o => o.deliveryDate === today && ['readyForDelivery', 'outForDelivery'].includes(o.status));

  // Top Stats
  const pickupsToday = pickupQueue.length + orders.filter(o => o.pickupDate === today && o.status !== 'scheduled' && o.status !== 'onTheWay').length;
  const outForDeliveryCount = orders.filter(o => o.status === 'outForDelivery').length;
  const deliveredTodayCount = orders.filter(o => o.status === 'delivered' && o.deliveredAt && new Date(o.deliveredAt).toISOString().split('T')[0] === today).length;
  const revenueToday = orders.filter(o => o.status === 'delivered' && o.paymentStatus === 'collected' && o.paymentCollectedAt && new Date(o.paymentCollectedAt).toISOString().split('T')[0] === today).reduce((acc, o) => acc + o.totalAmount, 0);
  const pendingPayments = orders.filter(o => o.status === 'delivered' && o.paymentStatus === 'pending').reduce((acc, o) => acc + o.totalAmount, 0);

  const handleStatusChange = async (order, newStatus, additionalData = {}) => {
    try {
      await supabase.from('paid_orders').update({
        status: newStatus,
        updated_at: new Date(),
        ...additionalData
      }).eq('id', order.id);

      // Send WhatsApp
      let msg = '';
      if (newStatus === 'onTheWay') {
        msg = `Our laundry staff is on the way to pick up your clothes! Token: ${order.tokenId} — SmartDhobi`;
      } else if (newStatus === 'readyForDelivery') {
        msg = `Your laundry is clean and ready! Our staff will deliver to your room by ${order.deliveryTimeSlot}. — SmartDhobi`;
      } else if (newStatus === 'outForDelivery') {
        msg = `Your laundry is on its way to your room right now! Token: ${order.tokenId} — SmartDhobi`;
      }

      if (msg) {
        if (useMock) {
          console.log('[Mock WhatsApp → Student]:', msg);
          toast(msg, { icon: '📱' });
        } else {
          await sendNotification(order.studentId, msg);
        }
      }

      toast.success('Status updated');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update status');
    }
  };

  const handleConfirmPickup = async (scannedUid, actualItems, notes) => {
    if (scannedUid !== selectedOrder.qrCodeData) {
      toast.error("QR Code does not match the expected student for this order.");
      return;
    }
    
    setScanModalOpen(false);
    
    const msg = `We've picked up your ${actualItems} clothing items. Token: ${selectedOrder.tokenId}. Expected delivery: ${selectedOrder.deliveryDate}. — SmartDhobi`;
    await handleStatusChange(selectedOrder, 'pickedUp', {
      pickup_confirmed_at: new Date(),
      actual_items_count: actualItems,
      paid_dhobi_id: userData.uid
    });
    
    if (useMock) {
      console.log('[Mock WhatsApp → Student]:', msg);
      toast(msg, { icon: '📱' });
    } else {
      await sendNotification(selectedOrder.studentId, msg);
    }
  };

  const handleConfirmDelivery = async (paymentOption) => {
    setDeliveryModalOpen(false);
    
    let additionalData = {
      delivered_at: new Date(),
      delivery_signed_off: true,
      payment_status: paymentOption
    };
    
    if (paymentOption === 'collected') {
      additionalData.payment_collected_at = new Date();
      additionalData.payment_collected_by = userData.uid;
    }

    const msg = `Your laundry has been delivered to Room ${selectedOrder.studentRoom}! Amount: ₹${selectedOrder.totalAmount} — [${paymentOption}]. Thank you! — SmartDhobi`;
    await handleStatusChange(selectedOrder, 'delivered', additionalData);



    if (useMock) {
      console.log('[Mock WhatsApp → Student]:', msg);
      toast(msg, { icon: '📱' });
    } else {
      await sendNotification(selectedOrder.studentId, msg);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto pb-20 md:pb-6">
      
      {/* Top Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-xl p-4 border border-amber-200 shadow-sm border-l-4 border-l-amber-500">
           <p className="text-xs font-bold text-slate-500 uppercase">Today's Pickups</p>
           <p className="text-2xl font-black text-slate-800">{pickupsToday}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-amber-200 shadow-sm border-l-4 border-l-amber-500">
           <p className="text-xs font-bold text-slate-500 uppercase">Out for Delivery</p>
           <p className="text-2xl font-black text-slate-800">{outForDeliveryCount}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-amber-200 shadow-sm border-l-4 border-l-green-500">
           <p className="text-xs font-bold text-slate-500 uppercase">Delivered Today</p>
           <p className="text-2xl font-black text-slate-800">{deliveredTodayCount}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-amber-200 shadow-sm border-l-4 border-l-amber-500">
           <p className="text-xs font-bold text-slate-500 uppercase">Revenue Today (₹)</p>
           <p className="text-2xl font-black text-amber-700">₹{revenueToday.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-amber-200 shadow-sm border-l-4 border-l-red-500 col-span-2 md:col-span-1">
           <p className="text-xs font-bold text-slate-500 uppercase">Pending Payments (₹)</p>
           <p className="text-2xl font-black text-red-600">₹{pendingPayments.toLocaleString('en-IN')}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-amber-900/10 rounded-lg max-w-sm mb-6">
        <button onClick={() => setActiveTab('queue')} className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${activeTab === 'queue' ? 'bg-white shadow relative z-10 text-amber-900' : 'text-amber-800/60 hover:text-amber-900'}`}>Pickup Queue</button>
        <button onClick={() => setActiveTab('delivery')} className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${activeTab === 'delivery' ? 'bg-white shadow relative z-10 text-amber-900' : 'text-amber-800/60 hover:text-amber-900'}`}>Delivery Queue</button>
      </div>

      {/* Queue Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-amber-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-amber-100 bg-amber-50 flex justify-between items-center">
          <h2 className="font-bold text-amber-900">
            {activeTab === 'queue' ? "Today's Pickup Queue" : "Ready for Delivery / Out"}
          </h2>
          <span className="text-xs font-bold bg-white px-2 py-1 rounded-lg text-amber-700 border border-amber-200">
            {activeTab === 'queue' ? pickupQueue.length : deliveryQueue.length} Active
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-amber-100 text-xs uppercase text-slate-500 font-bold">
              <tr>
                <th className="px-6 py-3">Token</th>
                <th className="px-6 py-3">Student</th>
                <th className="px-6 py-3">Items</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(activeTab === 'queue' ? pickupQueue : deliveryQueue).map(order => (
                <tr key={order.id} className="hover:bg-amber-50/30 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-amber-600">{order.tokenId}</td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-800">{order.studentName}</p>
                    <p className="text-[10px] text-slate-500">{order.hostelBlock} • Rm {order.studentRoom}</p>
                  </td>
                  <td className="px-6 py-4 font-medium">{order.items?.reduce((a, b) => a + b.quantity, 0)} items</td>
                  <td className="px-6 py-4 font-bold text-slate-800">₹{order.totalAmount}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      order.status === 'scheduled' ? 'bg-slate-100 text-slate-600' :
                      order.status === 'onTheWay' ? 'bg-amber-100 text-amber-700' :
                      order.status === 'readyForDelivery' ? 'bg-teal-100 text-teal-700' :
                      order.status === 'outForDelivery' ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-100'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {order.status === 'scheduled' && (
                      <button onClick={() => handleStatusChange(order, 'onTheWay')} className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold py-1.5 px-3 rounded transition-colors">
                        On My Way
                      </button>
                    )}
                    {order.status === 'onTheWay' && (
                      <button onClick={() => { setSelectedOrder(order); setScanModalOpen(true); }} className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold py-1.5 px-3 rounded transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-1">
                        Scan QR & Pickup
                      </button>
                    )}
                    {order.status === 'readyForDelivery' && (
                      <button onClick={() => handleStatusChange(order, 'outForDelivery')} className="bg-amber-100 hover:bg-amber-200 text-amber-800 text-xs font-bold py-1.5 px-3 rounded transition-colors border border-amber-200">
                        Out for Delivery
                      </button>
                    )}
                    {order.status === 'outForDelivery' && (
                      <button onClick={() => { setSelectedOrder(order); setDeliveryModalOpen(true); }} className="bg-green-500 hover:bg-green-600 text-white text-xs font-bold py-1.5 px-3 rounded transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1">
                        Complete Delivery
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {(activeTab === 'queue' ? pickupQueue : deliveryQueue).length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-slate-500">
                    No orders matching this queue for today.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <QRScanPickupModal 
        isOpen={scanModalOpen} 
        onClose={() => setScanModalOpen(false)} 
        onConfirm={handleConfirmPickup} 
        expectedItems={selectedOrder?.items?.reduce((a, b) => a + b.quantity, 0) || 0}
      />
      
      <DeliveryModal 
        isOpen={deliveryModalOpen} 
        onClose={() => setDeliveryModalOpen(false)} 
        onConfirm={handleConfirmDelivery} 
        order={selectedOrder}
      />

    </div>
  );
};

export default PaidDhobiDashboard;
