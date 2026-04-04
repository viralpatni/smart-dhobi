import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useActivePaidOrder } from '../../hooks/usePaidOrders';
import { useActivePaidSchedules } from '../../hooks/usePaidSchedules';
import PriceListCard from './PriceListCard';
import PaidStatusTracker from './PaidStatusTracker';
import Loader from '../common/Loader';

const PaidDashboard = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const { schedules, loading: schedulesLoading } = useActivePaidSchedules(userData?.hostelBlock);
  const { order, loading: orderLoading } = useActivePaidOrder(userData?.uid);

  if (schedulesLoading || orderLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader />
      </div>
    );
  }

  const upcomingSchedule = schedules.length > 0 ? schedules[0] : null;

  // Calculate days until pickup if we have a schedule
  const getDaysUntilPickup = (dateStr) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const pickupDate = new Date(dateStr);
    pickupDate.setHours(0, 0, 0, 0);
    const diffTime = pickupDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Pickup is Today!';
    if (diffDays === 1) return 'Pickup Tomorrow';
    return `Pickup in ${diffDays} days`;
  };

  return (
    <div className="animate-fade-in-up pb-6">
      <div className="bg-amber-100/50 rounded-xl p-4 mb-6 text-center border border-amber-200">
        <span className="text-2xl mb-1 block">🏆</span>
        <h2 className="text-amber-900 font-bold">Premium Laundry Service</h2>
        <p className="text-xs text-amber-700 mt-1">Pay per piece. Wash & iron included. Doorstep delivery.</p>
      </div>

      {order ? (
        <PaidStatusTracker currentStatus={order.status} order={order} />
      ) : (
        <>
          {/* Upcoming Schedule Card */}
          <div className="bg-white rounded-2xl border border-amber-200 shadow-sm p-5 mb-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-full -mr-6 -mt-6 blur-lg"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-1 rounded-full border border-amber-200">
                  Next Pickup
                </span>
                {upcomingSchedule && (
                  <span className="text-xs font-bold text-amber-600">
                    {getDaysUntilPickup(upcomingSchedule.pickupDate)}
                  </span>
                )}
              </div>
              
              {upcomingSchedule ? (
                <>
                  <h3 className="font-bold text-lg text-slate-800 mb-1">
                    {upcomingSchedule.pickupDay}, {upcomingSchedule.pickupDate}
                  </h3>
                  <p className="text-slate-500 text-sm mb-4">
                    Time: {upcomingSchedule.pickupTimeSlot}
                  </p>
                  
                  <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
                    <p className="text-[11px] text-amber-800 font-semibold uppercase tracking-wider mb-1">Estimated Delivery</p>
                    <p className="text-sm font-medium text-amber-900">
                      {upcomingSchedule.deliveryDate} • {upcomingSchedule.deliveryTimeSlot}
                    </p>
                  </div>
                </>
              ) : (
                <div className="text-center py-4 text-slate-500 text-sm">
                  No upcoming paid laundry pickup scheduled. Check back soon or contact the laundry office.
                </div>
              )}
            </div>
          </div>

          {/* Place Order Button */}
          {upcomingSchedule && (
            <button
              onClick={() => navigate('/student/paid-laundry/new-order')}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold text-lg py-4 px-6 rounded-xl shadow-lg shadow-amber-500/30 transition-transform active:scale-[0.98] mb-6 flex items-center justify-center gap-2 border border-amber-600"
            >
              <span>Place Paid Laundry Order</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
            </button>
          )}
        </>
      )}

      {/* Price List Collapsible */}
      <PriceListCard />
    </div>
  );
};

export default PaidDashboard;
