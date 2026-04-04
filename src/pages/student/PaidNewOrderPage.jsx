import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { useActivePaidSchedules } from '../../hooks/usePaidSchedules';
import { usePaidPricing } from '../../hooks/usePaidPricing';
import { generatePaidToken } from '../../utils/generatePaidToken';
import { sendNotification } from '../../utils/sendNotification';
import QRCodeCard from '../../components/student/QRCodeCard';
import Loader from '../../components/common/Loader';
import toast from 'react-hot-toast';

const PaidNewOrderPage = () => {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const { schedules, loading: schedLoading } = useActivePaidSchedules(userData?.hostelBlock);
  const { items: pricingItems, loading: priceLoading } = usePaidPricing();

  const [step, setStep] = useState(1);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [selectedItems, setSelectedItems] = useState({}); // { itemId: quantity }
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const useMock = import.meta.env.VITE_USE_MOCK_NOTIFICATIONS === 'true';

  const groupedPricing = useMemo(() => {
    return pricingItems.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {});
  }, [pricingItems]);

  const orderTotals = useMemo(() => {
    let totalItems = 0;
    let totalAmount = 0;
    const itemsList = [];

    Object.entries(selectedItems).forEach(([itemId, qty]) => {
      if (qty > 0) {
        const product = pricingItems.find(p => p.id === itemId);
        if (product) {
          totalItems += qty;
          const subtotal = qty * product.pricePerPiece;
          totalAmount += subtotal;
          itemsList.push({
            itemId: product.id,
            itemName: product.itemName,
            quantity: qty,
            pricePerPiece: product.pricePerPiece,
            subtotal
          });
        }
      }
    });

    return { totalItems, totalAmount, itemsList };
  }, [selectedItems, pricingItems]);

  if (schedLoading || priceLoading) return <Loader fullScreen />;

  const handleQtyChange = (itemId, change) => {
    setSelectedItems(prev => {
      const current = prev[itemId] || 0;
      const next = Math.max(0, Math.min(20, current + change));
      return { ...prev, [itemId]: next };
    });
  };

  const handleSubmit = async () => {
    if (!termsAccepted) {
      toast.error('Please accept the terms to proceed');
      return;
    }
    setIsSubmitting(true);

    try {
      const tokenId = generatePaidToken();
      const orderDocs = {
        tokenId,
        studentId: userData.uid,
        studentName: userData.name,
        studentPhone: userData.phone,
        studentRoom: userData.roomNo,
        hostelBlock: userData.hostelBlock,
        paidDhobiId: null, // Assigned on pickup
        scheduleId: selectedSchedule.id,
        pickupDate: selectedSchedule.pickupDate,
        deliveryDate: selectedSchedule.deliveryDate,
        items: orderTotals.itemsList,
        totalAmount: orderTotals.totalAmount,
        paymentStatus: 'pending',
        paymentCollectedAt: null,
        paymentCollectedBy: null,
        status: 'scheduled',
        qrCodeData: userData.uid,
        pickupConfirmedAt: null,
        actualItemsCount: null,
        deliveredAt: null,
        deliverySignedOff: false,
        notificationLog: {
          orderConfirmed: true,
          pickupReminder: false,
          readyForDelivery: false,
          delivered: false
        },
        auditLog: [{
          action: 'ORDER_PLACED',
          actor: 'Student',
          timestamp: new Date().toISOString()
        }],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, 'paidOrders'), orderDocs);

      // Notification
      const msg = `Your paid laundry order is confirmed! Token: ${tokenId}. Pickup: ${selectedSchedule.pickupDay} ${selectedSchedule.pickupDate} at ${selectedSchedule.pickupTimeSlot}. Estimated delivery: ${selectedSchedule.deliveryDate}. Total: ₹${orderTotals.totalAmount}. — SmartDhobi`;
      
      if (useMock) {
        console.log('[Mock WhatsApp → Student]:', msg);
        toast(msg, { duration: 6000, icon: '📱' });
      } else {
        await sendNotification(userData.uid, msg);
      }

      toast.success('Order placed successfully!');
      navigate('/student/dashboard');

    } catch (err) {
      console.error('Error placing order:', err);
      toast.error('Failed to place order. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#FFFBEB] min-h-screen flex justify-center w-full">
      <div className="w-full max-w-[420px] bg-white min-h-screen shadow-lg relative flex flex-col pt-8">
        
        {/* Header */}
        <div className="px-6 flex items-center justify-between mb-6">
          <button onClick={() => step === 1 ? navigate(-1) : setStep(step - 1)} className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-700 hover:bg-amber-100 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
          </button>
          <h1 className="text-xl font-bold text-slate-800">New Paid Order</h1>
        </div>

        {/* Step Indicator */}
        <div className="px-6 mb-8 flex items-center justify-center gap-2">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${step >= 1 ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30' : 'bg-slate-100 text-slate-400'}`}>1</div>
            <div className={`w-12 h-1 rounded-full ${step >= 2 ? 'bg-amber-500' : 'bg-slate-100'}`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${step >= 2 ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30' : 'bg-slate-100 text-slate-400'}`}>2</div>
            <div className={`w-12 h-1 rounded-full ${step >= 3 ? 'bg-amber-500' : 'bg-slate-100'}`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${step >= 3 ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30' : 'bg-slate-100 text-slate-400'}`}>3</div>
          </div>
        </div>

        {/* Step 1: Select Schedule */}
        {step === 1 && (
          <div className="flex-1 px-6 animate-fade-in-right pb-24">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Choose Pickup Date</h2>
            <p className="text-sm text-slate-500 mb-6">Select a convenient pickup slot from our available schedule.</p>

            {schedules.length === 0 ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-center">
                <span className="text-3xl mb-2 block">🗓️</span>
                <p className="font-semibold text-amber-900">No schedules available right now.</p>
                <p className="text-sm text-amber-700 mt-1">Please check back later.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {schedules.map((sch) => (
                  <div
                    key={sch.id}
                    onClick={() => setSelectedSchedule(sch)}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                      selectedSchedule?.id === sch.id 
                        ? 'border-amber-500 bg-amber-50/50 shadow-md shadow-amber-500/10' 
                        : 'border-slate-200 bg-white hover:border-amber-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                       <span className="font-bold text-slate-800 text-lg">{sch.pickupDay}</span>
                       <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs font-semibold">{sch.pickupDate}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600 mb-4">
                       <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                       {sch.pickupTimeSlot}
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-slate-100">
                      <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Estimated Delivery</p>
                      <p className="text-sm font-semibold text-teal-700">{sch.deliveryDate} • {sch.deliveryTimeSlot}</p>
                    </div>
                  </div>
                ))}
                
                <button
                  onClick={() => setStep(2)}
                  disabled={!selectedSchedule}
                  className="w-full mt-6 bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Continue →
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Build Order */}
        {step === 2 && (
          <div className="flex-1 px-6 animate-fade-in-right pb-32">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Select Items & Quantities</h2>
            <p className="text-sm text-slate-500 mb-6">Tap + to add items. Your total updates live.</p>

            <div className="space-y-6">
              {Object.entries(groupedPricing).map(([category, items]) => (
                <div key={category}>
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="font-bold text-amber-800 uppercase tracking-wider">{category}</h3>
                    <div className="flex-1 h-px bg-amber-200"></div>
                  </div>
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div key={item.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-3">
                           {item.iconEmoji && <span className="text-2xl">{item.iconEmoji}</span>}
                           <div>
                             <p className="font-bold text-slate-800">{item.itemName}</p>
                             <p className="text-[10px] text-slate-500">{item.unit}</p>
                           </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                           <span className="font-bold text-amber-600">₹{item.pricePerPiece}</span>
                           <div className="flex items-center gap-3 bg-slate-50 rounded-lg p-1 border border-slate-200">
                             <button
                               onClick={() => handleQtyChange(item.id, -1)}
                               disabled={!selectedItems[item.id]}
                               className="w-7 h-7 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-500 disabled:opacity-30 disabled:bg-slate-50"
                             >-</button>
                             <span className="font-bold w-4 text-center text-sm">{selectedItems[item.id] || 0}</span>
                             <button
                               onClick={() => handleQtyChange(item.id, 1)}
                               className="w-7 h-7 rounded bg-white border border-amber-300 flex items-center justify-center text-amber-600 font-bold"
                             >+</button>
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Sticky Bottom Bar for Step 2 */}
            <div className="fixed bottom-0 w-full max-w-[420px] left-1/2 -translate-x-1/2 bg-amber-600 border-t border-amber-700 px-6 py-4 z-40 pb-safe">
               {orderTotals.totalItems > 0 ? (
                 <div className="flex items-center justify-between text-white">
                   <div>
                     <p className="text-xs font-medium text-amber-200">{orderTotals.totalItems} items selected</p>
                     <p className="text-xl font-bold">Total: ₹{orderTotals.totalAmount.toLocaleString('en-IN')}</p>
                   </div>
                   <button
                     onClick={() => setStep(3)}
                     className="bg-white text-amber-700 font-bold py-2.5 px-6 rounded-lg hover:bg-amber-50 transition-colors shadow-sm"
                   >
                     Next →
                   </button>
                 </div>
               ) : (
                 <div className="text-center text-amber-200 font-medium py-2">
                   Add items to continue
                 </div>
               )}
            </div>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 3 && (
          <div className="flex-1 px-6 animate-fade-in-right pb-24">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Review Your Order</h2>

            {/* Order Summary Card */}
            <div className="bg-white border top-2 border-amber-200 rounded-2xl p-5 mb-6 shadow-sm relative overflow-hidden">
               <div className="absolute top-0 right-0 w-2 h-full bg-amber-400"></div>
               <div className="flex items-center gap-2 mb-4 text-amber-800">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
                 <span className="font-bold font-sm">Order Summary</span>
               </div>

               <div className="space-y-3 mb-4">
                 {orderTotals.itemsList.map(it => (
                    <div key={it.itemId} className="flex justify-between text-sm">
                      <span className="text-slate-600">{it.quantity}x {it.itemName}</span>
                      <span className="font-semibold text-slate-800">₹{it.subtotal.toLocaleString('en-IN')}</span>
                    </div>
                 ))}
               </div>

               <div className="border-t border-dashed border-amber-200 pt-4 flex justify-between items-end">
                 <div>
                   <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Grand Total</p>
                   <p className="text-xs text-amber-600 font-medium">(Cash on delivery)</p>
                 </div>
                 <span className="text-2xl font-bold text-slate-900">₹{orderTotals.totalAmount.toLocaleString('en-IN')}</span>
               </div>
            </div>

            {/* QR Card - Glow Amber variant */}
            <div className="mb-6">
              <h3 className="font-bold text-slate-800 mb-2">Pickup Verification</h3>
              <p className="text-sm text-slate-500 mb-4">Your QR will be scanned at pickup to link this exact order.</p>
              <div className="pointer-events-none filter drop-shadow-md">
                <QRCodeCard uid={userData.uid} name={userData.name} roomNo={userData.roomNo} isPaidMode={true} />
              </div>
            </div>

            {/* Terms & Submit */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-8">
              <label className="flex items-start gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-1 w-5 h-5 rounded border-gray-300 text-amber-600 focus:ring-amber-500" 
                />
                <span className="text-sm text-slate-600">
                  I confirm the item count is accurate and I agree to pay <strong className="text-slate-800">₹{orderTotals.totalAmount.toLocaleString('en-IN')}</strong> in cash on delivery.
                </span>
              </label>
            </div>

            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !termsAccepted}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold text-lg py-4 px-6 rounded-xl shadow-lg shadow-amber-500/30 transition-transform active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                 <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : 'Confirm Order'}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default PaidNewOrderPage;
