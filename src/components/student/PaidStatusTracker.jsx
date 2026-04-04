import React from 'react';

const statuses = [
  { id: 'scheduled', label: 'Scheduled', icon: '📅' },
  { id: 'pickedUp', label: 'Picked Up', icon: '🤲' },
  { id: 'washing', label: 'Washing', icon: '🫧' },
  { id: 'readyForDelivery', label: 'Ready', icon: '🧺' },
  { id: 'outForDelivery', label: 'On The Way', icon: '🚚' },
  { id: 'delivered', label: 'Delivered', icon: '✅' }
];

const PaidStatusTracker = ({ currentStatus, order }) => {
  const currentIndex = statuses.findIndex(s => s.id === currentStatus);

  if (!order || currentIndex === -1) return null;

  return (
    <div className="bg-white rounded-2xl p-5 mb-6 border border-amber-200 shadow-sm relative overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-800 text-sm">Order Status</h3>
        <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
          {order.tokenId}
        </span>
      </div>

      <div className="relative pl-3 mt-4">
        {/* Vertical line connecting nodes */}
        <div className="absolute left-[1.375rem] top-3 bottom-5 w-0.5 bg-amber-100"></div>

        <div className="space-y-5">
          {statuses.map((status, index) => {
            const isCompleted = index < currentIndex;
            const isActive = index === currentIndex;
            const isPending = index > currentIndex;

            return (
              <div key={status.id} className="relative z-10 flex items-start gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 transition-colors ${
                  isCompleted ? 'bg-amber-500 border-amber-500 text-white' :
                  isActive ? 'bg-white border-amber-500 shadow-sm shadow-amber-500/30' :
                  'bg-white border-slate-200 opacity-50'
                }`}>
                  {isActive ? (
                    <div className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse"></div>
                  ) : isCompleted ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                  ) : null}
                </div>
                <div className={`mt-1 flex-1 ${!isCompleted && !isActive ? 'opacity-50' : ''}`}>
                  <h4 className={`text-sm font-bold ${isActive ? 'text-amber-600' : isCompleted ? 'text-slate-700' : 'text-slate-400'}`}>
                    {status.icon} {status.label}
                  </h4>
                  {isActive && status.id === 'scheduled' && (
                     <p className="text-xs text-slate-500 mt-0.5">Staff pickup: {order.pickupDate}</p>
                  )}
                  {isActive && status.id === 'washing' && (
                     <p className="text-xs text-slate-500 mt-0.5">Your items are being cleaned</p>
                  )}
                  {isActive && status.id === 'outForDelivery' && (
                     <p className="text-xs text-amber-600 font-medium mt-0.5">Will arrive shortly to your room!</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-amber-100 flex justify-between items-center text-sm">
        <span className="font-semibold text-slate-600">Amount Due:</span>
        <span className="font-bold text-amber-600">₹{order.totalAmount?.toLocaleString('en-IN')} (On Delivery)</span>
      </div>
    </div>
  );
};

export default PaidStatusTracker;
